# BEwithU 系统管理指南

## 概述

本指南面向BEwithU系统的管理员，提供系统安装、配置、维护和故障排查的详细说明。

## 系统架构

### 服务组件

| 组件 | 作用 | 端口 | 数据存储 |
|------|------|------|----------|
| Frontend | React前端应用 | 3000 | 无 |
| Backend API | Flask后端服务 | 5000 | PostgreSQL |
| PostgreSQL | 主数据库 | 5432 | 持久化卷 |
| Redis | 缓存和会话 | 6379 | 持久化卷 |
| n8n | 工作流引擎 | 5678 | PostgreSQL |
| Ollama | 本地LLM服务 | 11434 | 持久化卷 |
| Nginx | 反向代理 | 80/443 | 配置文件 |

### 网络架构

```
Internet
    │
    ▼
┌─────────────┐
│   Nginx     │ (80/443)
│ 反向代理    │
└─────────────┘
    │
    ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Frontend   │    │ Backend API │    │     n8n     │
│   (3000)    │    │   (5000)    │    │   (5678)    │
└─────────────┘    └─────────────┘    └─────────────┘
                           │                   │
                           ▼                   ▼
                   ┌─────────────┐    ┌─────────────┐
                   │ PostgreSQL  │    │   Ollama    │
                   │   (5432)    │    │  (11434)    │
                   └─────────────┘    └─────────────┘
                           │
                           ▼
                   ┌─────────────┐
                   │    Redis    │
                   │   (6379)    │
                   └─────────────┘
```

## 安装部署

### 系统要求

#### 硬件要求

**最低配置:**
- CPU: 4核心
- 内存: 8GB
- 存储: 50GB SSD
- 网络: 100Mbps

**推荐配置:**
- CPU: 8核心以上
- 内存: 16GB以上
- 存储: 100GB SSD以上
- 网络: 1Gbps

#### 软件要求

- **操作系统**: Ubuntu 20.04+, CentOS 8+, RHEL 8+
- **Docker**: 20.10.0+
- **Docker Compose**: 2.0.0+
- **Git**: 2.30+

### 安装步骤

#### 1. 系统准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要工具
sudo apt install -y curl wget git vim htop

# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 将用户添加到docker组
sudo usermod -aG docker $USER
newgrp docker
```

#### 2. 部署应用

```bash
# 克隆项目
git clone https://github.com/unkaku-1/BE-With-U.git
cd BE-With-U

# 运行部署脚本
./scripts/deploy.sh setup
./scripts/deploy.sh start

# 验证部署
./scripts/deploy.sh status
```

#### 3. 初始配置

```bash
# 查看生成的管理员密码
cat .env | grep N8N_PASSWORD

# 访问n8n管理界面
# http://your-server:5678
# 用户名: admin
# 密码: 查看上面的N8N_PASSWORD
```

## 配置管理

### 环境变量配置

#### 主要配置项

```bash
# 数据库配置
POSTGRES_PASSWORD=your_secure_password
POSTGRES_PORT=5432

# Redis配置
REDIS_PASSWORD=your_redis_password
REDIS_PORT=6379

# API配置
JWT_SECRET=your_jwt_secret
API_PORT=5000

# n8n配置
N8N_USER=admin
N8N_PASSWORD=your_n8n_password
N8N_PORT=5678

# 前端配置
FRONTEND_PORT=3000

# Nginx配置
HTTP_PORT=80
HTTPS_PORT=443
```

#### 修改配置

```bash
# 编辑环境配置
vim .env

# 重启服务使配置生效
./scripts/deploy.sh restart
```

### SSL证书配置

#### 自签名证书（开发环境）

```bash
# 创建SSL目录
mkdir -p docker/nginx/ssl

# 生成自签名证书
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/nginx/ssl/key.pem \
  -out docker/nginx/ssl/cert.pem \
  -subj "/C=JP/ST=Tokyo/L=Tokyo/O=BEwithU/CN=localhost"

# 启用HTTPS配置
# 编辑docker/nginx/nginx.conf，取消注释HTTPS server块
```

#### Let's Encrypt证书（生产环境）

```bash
# 安装certbot
sudo apt install certbot

# 获取证书
sudo certbot certonly --standalone -d your-domain.com

# 复制证书到项目目录
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem docker/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem docker/nginx/ssl/key.pem

# 设置证书自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 数据库配置

#### PostgreSQL优化

```sql
-- 连接到数据库
docker exec -it bewithU-postgres psql -U bewithU_user -d bewithU

-- 查看当前配置
SHOW all;

-- 性能优化配置
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- 重启PostgreSQL使配置生效
SELECT pg_reload_conf();
```

#### 数据库维护

```bash
# 数据库备份
docker exec bewithU-postgres pg_dump -U bewithU_user bewithU > backup_$(date +%Y%m%d_%H%M%S).sql

# 数据库恢复
docker exec -i bewithU-postgres psql -U bewithU_user bewithU < backup_20240114_120000.sql

# 数据库清理
docker exec bewithU-postgres psql -U bewithU_user -d bewithU -c "VACUUM ANALYZE;"

# 查看数据库大小
docker exec bewithU-postgres psql -U bewithU_user -d bewithU -c "
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

## 用户管理

### 用户角色

| 角色 | 权限 | 说明 |
|------|------|------|
| admin | 全部权限 | 系统管理员 |
| support | 工单管理、知识库编辑 | IT支持人员 |
| user | 基本使用权限 | 普通用户 |

### 用户操作

#### 创建管理员用户

```bash
# 进入API容器
docker exec -it bewithU-api bash

# 运行Python脚本
python3 << EOF
from src.main import create_app, db
from src.models.user import User

app = create_app()
with app.app_context():
    # 创建管理员用户
    admin = User(
        username='admin',
        email='admin@bewithU.local',
        display_name='System Administrator',
        role='admin',
        language='ja'
    )
    admin.set_password('admin123')  # 请修改为强密码
    
    db.session.add(admin)
    db.session.commit()
    
    print(f"Admin user created: {admin.username}")
EOF
```

#### 用户管理API

```bash
# 获取用户列表
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:5000/api/users

# 更新用户角色
curl -X PUT \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"role": "support"}' \
     http://localhost:5000/api/users/123

# 禁用用户
curl -X PUT \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"is_active": false}' \
     http://localhost:5000/api/users/123
```

## 监控和日志

### 系统监控

#### 服务状态监控

```bash
# 查看所有服务状态
./scripts/deploy.sh status

# 查看资源使用情况
docker stats

# 查看系统资源
htop
df -h
free -h

# 查看网络连接
netstat -tulpn | grep -E ':(3000|5000|5678|5432|6379|11434)'
```

#### 健康检查

```bash
# API健康检查
curl http://localhost:5000/api/health

# 前端健康检查
curl http://localhost:3000

# n8n健康检查
curl http://localhost:5678/healthz

# 数据库健康检查
docker exec bewithU-postgres pg_isready -U bewithU_user

# Redis健康检查
docker exec bewithU-redis redis-cli ping
```

### 日志管理

#### 查看日志

```bash
# 查看所有服务日志
./scripts/deploy.sh logs

# 查看特定服务日志
./scripts/deploy.sh logs bewithU_api
./scripts/deploy.sh logs frontend
./scripts/deploy.sh logs n8n

# 实时跟踪日志
docker-compose logs -f bewithU_api

# 查看最近的错误日志
docker-compose logs --tail=100 bewithU_api | grep -i error
```

#### 日志轮转配置

```yaml
# docker-compose.yml中添加日志配置
services:
  bewithU_api:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

#### 日志分析

```bash
# 分析API访问日志
docker exec bewithU-nginx cat /var/log/nginx/access.log | \
  awk '{print $1}' | sort | uniq -c | sort -nr | head -10

# 分析错误日志
docker exec bewithU-nginx cat /var/log/nginx/error.log | \
  grep "$(date +%Y/%m/%d)" | tail -20

# 分析应用错误
docker-compose logs bewithU_api | grep -i "error\|exception" | tail -20
```

### 性能监控

#### 数据库性能

```sql
-- 查看慢查询
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- 查看数据库连接
SELECT count(*) as connections, state
FROM pg_stat_activity
GROUP BY state;

-- 查看表大小
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY bytes DESC;
```

#### 应用性能

```bash
# API响应时间测试
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5000/api/health

# 创建curl-format.txt
cat > curl-format.txt << EOF
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
EOF

# 并发测试
ab -n 1000 -c 10 http://localhost:5000/api/health
```

## 备份和恢复

### 数据备份

#### 自动备份脚本

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backup/bewithU"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
echo "Backing up PostgreSQL..."
docker exec bewithU-postgres pg_dump -U bewithU_user bewithU > $BACKUP_DIR/postgres_$DATE.sql

# 备份Redis
echo "Backing up Redis..."
docker exec bewithU-redis redis-cli BGSAVE
docker cp bewithU-redis:/data/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# 备份n8n工作流
echo "Backing up n8n workflows..."
docker exec bewithU-n8n n8n export:workflow --all --output=/tmp/workflows_$DATE.json
docker cp bewithU-n8n:/tmp/workflows_$DATE.json $BACKUP_DIR/

# 备份Ollama模型
echo "Backing up Ollama models..."
docker exec bewithU-ollama tar -czf /tmp/ollama_models_$DATE.tar.gz -C /root/.ollama .
docker cp bewithU-ollama:/tmp/ollama_models_$DATE.tar.gz $BACKUP_DIR/

# 备份配置文件
echo "Backing up configuration..."
tar -czf $BACKUP_DIR/config_$DATE.tar.gz .env docker/ scripts/

# 清理旧备份（保留7天）
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.rdb" -mtime +7 -delete
find $BACKUP_DIR -name "*.json" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR"
```

#### 设置定时备份

```bash
# 添加到crontab
crontab -e

# 每天凌晨2点备份
0 2 * * * /path/to/BE-With-U/scripts/backup.sh >> /var/log/bewithU_backup.log 2>&1
```

### 数据恢复

#### 恢复数据库

```bash
# 停止服务
./scripts/deploy.sh stop

# 恢复PostgreSQL
docker-compose up -d postgres
sleep 30
docker exec -i bewithU-postgres psql -U bewithU_user bewithU < /backup/bewithU/postgres_20240114_020000.sql

# 恢复Redis
docker cp /backup/bewithU/redis_20240114_020000.rdb bewithU-redis:/data/dump.rdb
docker-compose restart redis

# 恢复n8n工作流
docker cp /backup/bewithU/workflows_20240114_020000.json bewithU-n8n:/tmp/
docker exec bewithU-n8n n8n import:workflow --input=/tmp/workflows_20240114_020000.json

# 恢复Ollama模型
docker cp /backup/bewithU/ollama_models_20240114_020000.tar.gz bewithU-ollama:/tmp/
docker exec bewithU-ollama tar -xzf /tmp/ollama_models_20240114_020000.tar.gz -C /root/.ollama

# 启动所有服务
./scripts/deploy.sh start
```

#### 灾难恢复

```bash
# 完全重新部署
./scripts/deploy.sh clean
git pull origin main
./scripts/deploy.sh setup

# 恢复配置
tar -xzf /backup/bewithU/config_20240114_020000.tar.gz

# 恢复数据
# 按照上面的数据恢复步骤执行
```

## 安全管理

### 网络安全

#### 防火墙配置

```bash
# 安装ufw
sudo apt install ufw

# 默认策略
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 允许SSH
sudo ufw allow ssh

# 允许HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 限制数据库访问（仅本地）
sudo ufw deny 5432/tcp
sudo ufw deny 6379/tcp

# 启用防火墙
sudo ufw enable

# 查看状态
sudo ufw status verbose
```

#### Nginx安全配置

```nginx
# 在nginx.conf中添加安全头
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

# 隐藏Nginx版本
server_tokens off;

# 限制请求大小
client_max_body_size 50M;

# 速率限制
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
```

### 访问控制

#### JWT令牌管理

```python
# 配置JWT过期时间
JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

# 令牌黑名单
BLACKLISTED_TOKENS = set()

def revoke_token(jti):
    BLACKLISTED_TOKENS.add(jti)

@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    return jwt_payload['jti'] in BLACKLISTED_TOKENS
```

#### 密码策略

```python
import re

def validate_password(password):
    """
    密码策略：
    - 至少8个字符
    - 包含大小写字母
    - 包含数字
    - 包含特殊字符
    """
    if len(password) < 8:
        return False, "密码至少需要8个字符"
    
    if not re.search(r'[A-Z]', password):
        return False, "密码必须包含大写字母"
    
    if not re.search(r'[a-z]', password):
        return False, "密码必须包含小写字母"
    
    if not re.search(r'\d', password):
        return False, "密码必须包含数字"
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "密码必须包含特殊字符"
    
    return True, "密码符合要求"
```

### 数据保护

#### 数据加密

```python
from cryptography.fernet import Fernet

# 生成加密密钥
key = Fernet.generate_key()
cipher_suite = Fernet(key)

# 加密敏感数据
def encrypt_data(data):
    return cipher_suite.encrypt(data.encode()).decode()

# 解密数据
def decrypt_data(encrypted_data):
    return cipher_suite.decrypt(encrypted_data.encode()).decode()
```

#### 审计日志

```python
from datetime import datetime
from src.models.audit import AuditLog

def log_user_action(user_id, action, resource, details=None):
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        resource=resource,
        details=details,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent'),
        timestamp=datetime.utcnow()
    )
    db.session.add(audit_log)
    db.session.commit()

# 使用示例
@app.route('/api/tickets', methods=['POST'])
@jwt_required()
def create_ticket():
    user_id = get_jwt_identity()
    # ... 创建工单逻辑 ...
    log_user_action(user_id, 'CREATE', 'TICKET', f'Created ticket #{ticket.ticket_number}')
```

## 故障排查

### 常见问题

#### 1. 服务无法启动

**症状**: Docker容器启动失败

**排查步骤**:
```bash
# 查看容器状态
docker-compose ps

# 查看容器日志
docker-compose logs [service-name]

# 检查端口占用
netstat -tulpn | grep -E ':(3000|5000|5678|5432|6379|11434)'

# 检查磁盘空间
df -h

# 检查内存使用
free -h
```

**解决方案**:
```bash
# 清理Docker资源
docker system prune -a

# 重新构建镜像
docker-compose build --no-cache

# 重启服务
./scripts/deploy.sh restart
```

#### 2. 数据库连接问题

**症状**: API无法连接数据库

**排查步骤**:
```bash
# 检查PostgreSQL状态
docker exec bewithU-postgres pg_isready -U bewithU_user

# 查看数据库日志
docker-compose logs postgres

# 测试数据库连接
docker exec bewithU-postgres psql -U bewithU_user -d bewithU -c "SELECT 1;"
```

**解决方案**:
```bash
# 重启数据库
docker-compose restart postgres

# 检查数据库配置
cat .env | grep POSTGRES

# 重置数据库（注意：会丢失数据）
docker-compose down
docker volume rm be-with-u_postgres_data
docker-compose up -d postgres
```

#### 3. Ollama模型加载失败

**症状**: AI功能无法正常工作

**排查步骤**:
```bash
# 检查Ollama服务状态
curl http://localhost:11434/api/tags

# 查看Ollama日志
docker-compose logs ollama

# 检查模型列表
docker exec bewithU-ollama ollama list
```

**解决方案**:
```bash
# 手动拉取模型
docker exec bewithU-ollama ollama pull llama2

# 重启Ollama服务
docker-compose restart ollama

# 检查磁盘空间（模型文件较大）
docker exec bewithU-ollama df -h
```

#### 4. n8n工作流问题

**症状**: 自动化功能不工作

**排查步骤**:
```bash
# 检查n8n服务状态
curl http://localhost:5678/healthz

# 查看n8n日志
docker-compose logs n8n

# 检查工作流状态
# 访问 http://localhost:5678 查看工作流执行历史
```

**解决方案**:
```bash
# 重新部署工作流
./n8n/deploy-workflows.sh

# 重启n8n服务
docker-compose restart n8n

# 检查工作流配置
# 在n8n界面中检查节点配置和连接
```

### 性能问题

#### 1. 响应速度慢

**排查步骤**:
```bash
# 检查系统资源
htop
iostat -x 1

# 检查数据库性能
docker exec bewithU-postgres psql -U bewithU_user -d bewithU -c "
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;"

# 检查API响应时间
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5000/api/health
```

**优化方案**:
```bash
# 数据库优化
docker exec bewithU-postgres psql -U bewithU_user -d bewithU -c "VACUUM ANALYZE;"

# 清理Redis缓存
docker exec bewithU-redis redis-cli FLUSHDB

# 重启服务
./scripts/deploy.sh restart
```

#### 2. 内存使用过高

**排查步骤**:
```bash
# 查看容器内存使用
docker stats --no-stream

# 查看系统内存
free -h

# 查看进程内存使用
ps aux --sort=-%mem | head -10
```

**优化方案**:
```bash
# 限制容器内存使用
# 在docker-compose.yml中添加：
deploy:
  resources:
    limits:
      memory: 2G

# 重启服务
./scripts/deploy.sh restart
```

### 日志分析工具

#### 错误日志分析脚本

```bash
#!/bin/bash
# analyze_logs.sh

echo "=== BEwithU 日志分析报告 ==="
echo "生成时间: $(date)"
echo

echo "=== 服务状态 ==="
docker-compose ps
echo

echo "=== 最近的错误日志 ==="
echo "API错误:"
docker-compose logs --tail=50 bewithU_api | grep -i "error\|exception" | tail -10
echo

echo "数据库错误:"
docker-compose logs --tail=50 postgres | grep -i "error\|fatal" | tail -10
echo

echo "n8n错误:"
docker-compose logs --tail=50 n8n | grep -i "error\|failed" | tail -10
echo

echo "=== 系统资源使用 ==="
echo "内存使用:"
free -h
echo

echo "磁盘使用:"
df -h
echo

echo "容器资源使用:"
docker stats --no-stream
echo

echo "=== 网络连接 ==="
netstat -tulpn | grep -E ':(3000|5000|5678|5432|6379|11434)'
```

## 维护计划

### 日常维护

#### 每日检查清单

- [ ] 检查所有服务状态
- [ ] 查看错误日志
- [ ] 检查磁盘空间使用
- [ ] 验证备份是否正常
- [ ] 检查系统资源使用

```bash
#!/bin/bash
# daily_check.sh

echo "=== 每日系统检查 $(date) ==="

# 检查服务状态
echo "1. 服务状态检查:"
./scripts/deploy.sh status

# 检查磁盘空间
echo "2. 磁盘空间检查:"
df -h | grep -E '(/$|/var|/tmp)' | awk '$5 > 80 {print "警告: " $0}'

# 检查内存使用
echo "3. 内存使用检查:"
free -h

# 检查错误日志
echo "4. 错误日志检查:"
docker-compose logs --since=24h | grep -i "error\|exception\|fatal" | wc -l

# 检查备份
echo "5. 备份检查:"
ls -la /backup/bewithU/ | tail -5

echo "检查完成"
```

#### 每周维护

- [ ] 数据库性能分析
- [ ] 清理旧日志文件
- [ ] 更新系统补丁
- [ ] 检查SSL证书有效期
- [ ] 性能基准测试

```bash
#!/bin/bash
# weekly_maintenance.sh

echo "=== 每周维护 $(date) ==="

# 数据库维护
echo "1. 数据库维护:"
docker exec bewithU-postgres psql -U bewithU_user -d bewithU -c "VACUUM ANALYZE;"

# 清理Docker资源
echo "2. 清理Docker资源:"
docker system prune -f

# 清理旧日志
echo "3. 清理旧日志:"
find /var/log -name "*.log" -mtime +7 -delete

# 更新系统
echo "4. 系统更新:"
sudo apt update && sudo apt upgrade -y

echo "维护完成"
```

### 升级计划

#### 应用升级

```bash
#!/bin/bash
# upgrade.sh

echo "=== BEwithU 系统升级 ==="

# 备份当前版本
echo "1. 创建备份..."
./scripts/backup.sh

# 拉取最新代码
echo "2. 拉取最新代码..."
git fetch origin
git checkout main
git pull origin main

# 停止服务
echo "3. 停止服务..."
./scripts/deploy.sh stop

# 重新构建镜像
echo "4. 重新构建镜像..."
docker-compose build --no-cache

# 启动服务
echo "5. 启动服务..."
./scripts/deploy.sh start

# 验证升级
echo "6. 验证升级..."
sleep 30
./scripts/deploy.sh status

echo "升级完成"
```

#### 数据库迁移

```python
# migration.py
from src.main import create_app, db
from flask_migrate import Migrate, upgrade

app = create_app()
migrate = Migrate(app, db)

def run_migration():
    with app.app_context():
        upgrade()
        print("数据库迁移完成")

if __name__ == '__main__':
    run_migration()
```

## 总结

BEwithU系统管理涵盖了安装部署、配置管理、监控维护、安全管理和故障排查等各个方面。通过本指南，系统管理员应该能够：

1. **成功部署系统**: 从零开始部署完整的BEwithU系统
2. **有效监控系统**: 实时监控系统状态和性能
3. **及时处理故障**: 快速诊断和解决常见问题
4. **保障系统安全**: 实施必要的安全措施和访问控制
5. **维护系统稳定**: 执行定期维护和升级计划

建议管理员定期查看本指南，并根据实际环境调整配置和维护策略。如有问题，请参考故障排查部分或联系技术支持。

