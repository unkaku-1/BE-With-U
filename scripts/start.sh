#!/bin/bash

# BEwithU 系统启动脚本
# 自动检查环境、配置和启动所有服务

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 未安装，请先安装 $1"
        exit 1
    fi
}

# 检查Docker是否运行
check_docker() {
    if ! docker info &> /dev/null; then
        log_error "Docker 未运行，请启动 Docker"
        exit 1
    fi
}

# 检查端口是否被占用
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        log_warning "端口 $1 已被占用"
        return 1
    fi
    return 0
}

# 主函数
main() {
    echo "🚀 BEwithU 系统启动脚本"
    echo "================================"
    
    # 检查必要的命令
    log_info "检查系统依赖..."
    check_command "docker"
    check_command "docker-compose"
    check_command "curl"
    
    # 检查Docker状态
    log_info "检查 Docker 状态..."
    check_docker
    log_success "Docker 运行正常"
    
    # 检查端口占用
    log_info "检查端口占用情况..."
    ports=(3000 8000 5678 3001 3002 5432 6379 11434)
    occupied_ports=()
    
    for port in "${ports[@]}"; do
        if ! check_port $port; then
            occupied_ports+=($port)
        fi
    done
    
    if [ ${#occupied_ports[@]} -gt 0 ]; then
        log_warning "以下端口被占用: ${occupied_ports[*]}"
        read -p "是否继续启动？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "启动已取消"
            exit 1
        fi
    fi
    
    # 检查环境变量文件
    if [ ! -f ".env" ]; then
        log_warning ".env 文件不存在，正在从模板创建..."
        cp .env.example .env
        log_success ".env 文件已创建，请根据需要修改配置"
    fi
    
    # 创建必要的目录
    log_info "创建必要的目录..."
    mkdir -p logs uploads temp
    
    # 停止现有容器（如果存在）
    log_info "停止现有容器..."
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # 构建和启动服务
    log_info "构建和启动服务..."
    docker-compose up -d --build
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30
    
    # 检查服务状态
    log_info "检查服务状态..."
    
    services=(
        "postgres:5432:数据库"
        "redis:6379:缓存"
        "ollama:11434:LLM服务"
        "n8n:5678:工作流引擎"
        "outline:3001:知识库"
        "zammad-web:3002:工单系统"
        "backend:8000:后端API"
        "frontend:3000:前端应用"
    )
    
    all_healthy=true
    
    for service in "${services[@]}"; do
        IFS=':' read -r container port name <<< "$service"
        
        if docker-compose ps | grep -q "$container.*Up"; then
            if curl -f -s "http://localhost:$port" >/dev/null 2>&1 || \
               curl -f -s "http://localhost:$port/health" >/dev/null 2>&1; then
                log_success "$name 运行正常 (端口: $port)"
            else
                log_warning "$name 容器已启动但服务未就绪 (端口: $port)"
            fi
        else
            log_error "$name 启动失败"
            all_healthy=false
        fi
    done
    
    echo
    echo "================================"
    
    if $all_healthy; then
        log_success "🎉 BEwithU 系统启动完成！"
        echo
        echo "📱 访问地址："
        echo "  前端应用:    http://localhost:3000"
        echo "  后端API:     http://localhost:8000"
        echo "  n8n工作流:   http://localhost:5678"
        echo "  知识库:      http://localhost:3001"
        echo "  工单系统:    http://localhost:3002"
        echo
        echo "🔧 管理命令："
        echo "  查看日志:    docker-compose logs -f"
        echo "  停止服务:    docker-compose down"
        echo "  重启服务:    docker-compose restart"
        echo "  查看状态:    docker-compose ps"
        echo
        echo "📚 更多信息请查看 README.md"
    else
        log_error "部分服务启动失败，请检查日志："
        echo "  docker-compose logs"
    fi
}

# 运行主函数
main "$@"

