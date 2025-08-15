# BEwithU Docker部署指南

## 概述

BEwithU系统采用Docker容器化部署，支持开发和生产两种环境。本指南将详细介绍如何在您的环境中部署和运行BEwithU系统。

## 系统要求

### 硬件要求
- **CPU**: 4核心以上（推荐8核心）
- **内存**: 8GB以上（推荐16GB）
- **存储**: 20GB以上可用空间
- **网络**: 稳定的互联网连接

### 软件要求
- **操作系统**: 
  - Linux (Ubuntu 20.04+, CentOS 8+)
  - Windows 10/11 with WSL2
  - macOS 10.15+
- **Docker**: 20.10.0+
- **Docker Compose**: 2.0.0+

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/unkaku-1/BE-With-U.git
cd BE-With-U
```

### 2. 初始化部署

```bash
# 运行初始化设置
./scripts/deploy.sh setup

# 启动所有服务
./scripts/deploy.sh start
```

### 3. 访问应用

部署完成后，您可以通过以下地址访问各个服务：

- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:5000
- **n8n工作流**: http://localhost:5678
- **Nginx代理**: http://localhost:80

## 详细部署步骤

### 步骤1: 环境准备

#### 安装Docker (Ubuntu示例)

```bash
# 更新包索引
sudo apt update

# 安装必要的包
sudo apt install apt-transport-https ca-certificates curl gnupg lsb-release

# 添加Docker官方GPG密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 添加Docker仓库
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 将用户添加到docker组
sudo usermod -aG docker $USER
```

#### Windows环境准备

1. 安装Docker Desktop for Windows
2. 启用WSL2集成
3. 确保Hyper-V已启用

### 步骤2: 配置环境变量

系统会自动生成`.env`文件，包含以下配置：

```bash
# 查看生成的环境配置
cat .env
```

您可以根据需要修改以下配置：

```bash
# 编辑环境配置
vim .env
```

重要配置项说明：

- `POSTGRES_PASSWORD`: 数据库密码
- `REDIS_PASSWORD`: Redis密码
- `JWT_SECRET`: JWT令牌密钥
- `N8N_PASSWORD`: n8n管理密码
- `API_PORT`: 后端API端口
- `FRONTEND_PORT`: 前端应用端口

### 步骤3: 部署模式选择

#### 生产环境部署

```bash
# 完整部署（包括Nginx代理）
./scripts/deploy.sh start

# 查看服务状态
./scripts/deploy.sh status
```

#### 开发环境部署

```bash
# 开发模式部署
./scripts/deploy.sh start dev

# 查看开发环境状态
./scripts/deploy.sh status dev
```

### 步骤4: 验证部署

#### 检查服务状态

```bash
# 查看所有服务状态
docker-compose ps

# 查看服务日志
./scripts/deploy.sh logs

# 查看特定服务日志
./scripts/deploy.sh logs bewithU_api
```

#### 健康检查

```bash
# 检查API健康状态
curl http://localhost:5000/api/health

# 检查前端应用
curl http://localhost:3000

# 检查n8n服务
curl http://localhost:5678/healthz
```

## 服务架构

### 容器组成

| 服务名称 | 镜像 | 端口 | 说明 |
|---------|------|------|------|
| postgres | postgres:15-alpine | 5432 | PostgreSQL数据库 |
| redis | redis:7-alpine | 6379 | Redis缓存 |
| ollama | ollama/ollama:latest | 11434 | 本地LLM服务 |
| bewithU_api | 自构建 | 5000 | 后端API服务 |
| n8n | n8nio/n8n:latest | 5678 | 工作流引擎 |
| frontend | 自构建 | 3000 | 前端应用 |
| nginx | nginx:alpine | 80/443 | 反向代理 |

### 网络配置

- **网络名称**: bewithU-network
- **网络类型**: bridge
- **子网**: 172.20.0.0/16

### 数据持久化

以下数据将持久化存储：

- `postgres_data`: 数据库数据
- `redis_data`: Redis数据
- `ollama_data`: LLM模型数据
- `n8n_data`: n8n工作流数据
- `api_logs`: API日志
- `nginx_logs`: Nginx日志

## 常用操作

### 服务管理

```bash
# 启动服务
./scripts/deploy.sh start

# 停止服务
./scripts/deploy.sh stop

# 重启服务
./scripts/deploy.sh restart

# 查看状态
./scripts/deploy.sh status
```

### 日志查看

```bash
# 查看所有服务日志
./scripts/deploy.sh logs

# 查看特定服务日志
./scripts/deploy.sh logs bewithU_api
./scripts/deploy.sh logs frontend
./scripts/deploy.sh logs n8n

# 实时跟踪日志
docker-compose logs -f bewithU_api
```

### 数据备份

```bash
# 备份数据库
docker exec bewithU-postgres pg_dump -U bewithU_user bewithU > backup_$(date +%Y%m%d).sql

# 备份n8n工作流
docker exec bewithU-n8n n8n export:workflow --all --output=/tmp/workflows_backup.json
docker cp bewithU-n8n:/tmp/workflows_backup.json ./workflows_backup_$(date +%Y%m%d).json
```

### 数据恢复

```bash
# 恢复数据库
docker exec -i bewithU-postgres psql -U bewithU_user bewithU < backup_20240114.sql

# 恢复n8n工作流
docker cp ./workflows_backup_20240114.json bewithU-n8n:/tmp/
docker exec bewithU-n8n n8n import:workflow --input=/tmp/workflows_backup_20240114.json
```

## 故障排查

### 常见问题

#### 1. 容器启动失败

```bash
# 查看容器状态
docker-compose ps

# 查看失败容器的日志
docker-compose logs [service-name]

# 检查系统资源
docker system df
docker system prune  # 清理未使用的资源
```

#### 2. 端口冲突

```bash
# 检查端口占用
netstat -tulpn | grep :5000

# 修改端口配置
vim .env
# 修改对应的端口配置，如 API_PORT=5001
```

#### 3. 数据库连接问题

```bash
# 检查数据库容器状态
docker exec bewithU-postgres pg_isready -U bewithU_user

# 查看数据库日志
docker-compose logs postgres

# 重置数据库
docker-compose down
docker volume rm be-with-u_postgres_data
docker-compose up -d postgres
```

#### 4. Ollama模型加载失败

```bash
# 检查Ollama服务状态
curl http://localhost:11434/api/tags

# 手动拉取模型
docker exec bewithU-ollama ollama pull llama2

# 查看可用模型
docker exec bewithU-ollama ollama list
```

#### 5. n8n工作流问题

```bash
# 检查n8n服务状态
curl http://localhost:5678/healthz

# 重新部署工作流
./n8n/deploy-workflows.sh

# 查看n8n日志
docker-compose logs n8n
```

### 性能优化

#### 1. 内存优化

```bash
# 限制容器内存使用
# 在docker-compose.yml中添加：
deploy:
  resources:
    limits:
      memory: 2G
    reservations:
      memory: 1G
```

#### 2. 存储优化

```bash
# 清理未使用的镜像和容器
docker system prune -a

# 清理未使用的卷
docker volume prune

# 监控磁盘使用
docker system df
```

#### 3. 网络优化

```bash
# 使用自定义网络
# 已在docker-compose.yml中配置

# 监控网络流量
docker stats
```

## 安全配置

### 1. 密码安全

- 定期更换数据库密码
- 使用强密码策略
- 启用双因素认证（如果支持）

### 2. 网络安全

```bash
# 配置防火墙规则
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 5432/tcp  # 禁止外部访问数据库
```

### 3. SSL/TLS配置

```bash
# 生成自签名证书（开发环境）
mkdir -p docker/nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/nginx/ssl/key.pem \
  -out docker/nginx/ssl/cert.pem

# 启用HTTPS配置
# 取消注释nginx.conf中的HTTPS server块
```

## 监控和维护

### 1. 系统监控

```bash
# 查看容器资源使用
docker stats

# 查看系统资源
htop
df -h
free -h
```

### 2. 日志管理

```bash
# 配置日志轮转
# 在docker-compose.yml中添加：
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 3. 定期维护

```bash
# 每周执行的维护任务
#!/bin/bash
# 清理旧日志
docker system prune -f

# 备份数据
./scripts/backup.sh

# 更新镜像
docker-compose pull
docker-compose up -d
```

## 升级指南

### 1. 应用升级

```bash
# 拉取最新代码
git pull origin main

# 重新构建镜像
docker-compose build

# 滚动更新
docker-compose up -d
```

### 2. 数据库迁移

```bash
# 备份现有数据
./scripts/backup.sh

# 运行迁移脚本
docker exec bewithU-api python manage.py migrate
```

## 开发环境特殊说明

### 开发模式特点

- 启用热重载
- 详细的调试日志
- 开发工具集成
- 简化的认证配置

### 开发环境端口

| 服务 | 生产端口 | 开发端口 |
|------|----------|----------|
| 前端 | 3000 | 3001 |
| API | 5000 | 5001 |
| n8n | 5678 | 5679 |
| 数据库 | 5432 | 5433 |
| Redis | 6379 | 6380 |
| Ollama | 11434 | 11435 |

### 开发环境操作

```bash
# 启动开发环境
./scripts/deploy.sh start dev

# 查看开发环境状态
./scripts/deploy.sh status dev

# 停止开发环境
./scripts/deploy.sh stop dev
```

## 总结

BEwithU的Docker部署方案提供了完整的容器化解决方案，支持：

- **一键部署**: 通过脚本自动化部署流程
- **环境隔离**: 开发和生产环境完全分离
- **服务编排**: 使用Docker Compose管理多服务
- **数据持久化**: 重要数据的持久化存储
- **健康监控**: 内置健康检查和监控
- **安全配置**: 网络隔离和访问控制
- **易于维护**: 标准化的运维操作

通过本指南，您应该能够在自己的环境中成功部署和运行BEwithU系统。如果遇到问题，请参考故障排查部分或查看项目文档。

