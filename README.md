# BEwithU - 智能IT支持系统

<div align="center">

![BEwithU Logo](https://img.shields.io/badge/BEwithU-智能IT支持-blue?style=for-the-badge)

[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](docker-compose.yml)
[![React](https://img.shields.io/badge/react-18.x-61dafb.svg)](frontend/package.json)
[![Flask](https://img.shields.io/badge/flask-2.x-000000.svg)](bewithU_api/requirements.txt)
[![n8n](https://img.shields.io/badge/n8n-workflow-ff6d5a.svg)](n8n/)

**一个基于AI和自动化工作流的现代化IT支持系统**

[快速开始](#快速开始) • [功能特色](#功能特色) • [技术架构](#技术架构) • [部署指南](#部署指南) • [文档](#文档)

</div>

## 🎯 项目概述

BEwithU是一个智能化的IT支持系统，旨在通过AI技术和自动化工作流，显著减少用户提问到IT人员回答的响应时间。系统集成了本地LLM、知识库管理、工单系统和智能工作流等核心功能。

### 🚀 核心价值

- **⚡ 快速响应**: 基于知识库和AI的秒级问题回答
- **🤖 智能自动化**: n8n工作流实现业务流程自动化
- **🔒 隐私保护**: 本地LLM部署，保护数据安全
- **🌐 多语言支持**: 支持中文、日文、英文三语言
- **📱 现代化界面**: 响应式设计，支持桌面和移动端

## 🏗️ 技术架构

### 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        BEwithU 智能IT支持系统                    │
├─────────────────────────────────────────────────────────────────┤
│  前端层: React + TypeScript + Tailwind CSS                     │
├─────────────────────────────────────────────────────────────────┤
│  API网关层: Nginx 反向代理 + 负载均衡                          │
├─────────────────────────────────────────────────────────────────┤
│  业务逻辑层: Flask RESTful API                                 │
├─────────────────────────────────────────────────────────────────┤
│  工作流层: n8n 自动化引擎                                      │
├─────────────────────────────────────────────────────────────────┤
│  AI服务层: Ollama 本地LLM                                      │
├─────────────────────────────────────────────────────────────────┤
│  数据存储层: PostgreSQL + Redis                               │
└─────────────────────────────────────────────────────────────────┘
```

### 技术栈

#### 前端技术
- **React 18**: 现代化UI框架
- **TypeScript**: 类型安全
- **Tailwind CSS**: 实用优先的CSS框架
- **Framer Motion**: 流畅动画效果
- **React Router**: 单页应用路由

#### 后端技术
- **Flask**: 轻量级Python Web框架
- **SQLAlchemy**: 强大的ORM
- **PostgreSQL**: 企业级数据库
- **Redis**: 高性能缓存
- **JWT**: 无状态身份认证

#### AI和自动化
- **Ollama**: 本地LLM部署
- **n8n**: 可视化工作流自动化
- **LangChain**: AI应用开发框架

#### 部署和运维
- **Docker**: 容器化部署
- **Docker Compose**: 服务编排
- **Nginx**: 高性能Web服务器

## 🚀 快速开始

### 系统要求

- **硬件**: 4核CPU, 8GB内存, 50GB存储
- **软件**: Docker 20.10+, Docker Compose 2.0+
- **网络**: 稳定的互联网连接

### 一键部署

```bash
# 1. 克隆项目
git clone https://github.com/unkaku-1/BE-With-U.git
cd BE-With-U

# 2. 一键部署
./scripts/deploy.sh start

# 3. 等待服务启动（约2-3分钟）
./scripts/deploy.sh status
```

### 访问应用

部署完成后，您可以通过以下地址访问：

- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:5000
- **n8n工作流**: http://localhost:5678 (admin/[查看.env文件中的密码])
- **系统监控**: http://localhost:80 (通过Nginx代理)

### 开发环境

如果您想进行开发，可以使用开发环境配置：

```bash
# 启动开发环境（端口不冲突）
./scripts/deploy.sh start dev

# 访问开发环境
# 前端: http://localhost:3001
# API: http://localhost:5001
# n8n: http://localhost:5679
```

## 📁 项目结构

```
BE-With-U/
├── frontend/                 # React前端应用
├── bewithU_api/             # Flask后端API
├── n8n/                     # n8n工作流配置
├── docker/                  # Docker配置文件
├── scripts/                 # 部署和管理脚本
├── docs/                    # 项目文档
├── docker-compose.yml       # 生产环境配置
├── docker-compose.dev.yml   # 开发环境配置
└── README.md               # 项目说明
```

## ✨ 功能特色

### 🧠 智能问答系统
- 基于本地LLM的智能问答
- 知识库语义搜索
- 多语言问题理解和回答
- 上下文感知的对话体验

### 🎫 工单管理系统
- 智能工单分类和优先级分析
- 自动分配给合适的支持人员
- 实时状态跟踪和通知
- 工单对话历史记录

### 📚 知识库管理
- 多语言知识文章管理
- 智能标签和分类系统
- 从工单自动提取知识
- 协作编辑和版本控制

### 🔄 自动化工作流
- 可视化工作流设计（n8n）
- 智能问答自动化
- 工单处理自动化
- 知识库维护自动化

### 🎨 现代化界面
- React + TypeScript + Tailwind CSS
- 卡片式布局设计
- 深色/浅色主题切换
- 完全响应式设计

## 📖 部署指南

### Docker Compose服务

| 服务 | 端口 | 说明 |
|------|------|------|
| frontend | 3000 | React前端应用 |
| bewithU_api | 5000 | Flask后端API |
| postgres | 5432 | PostgreSQL数据库 |
| redis | 6379 | Redis缓存 |
| n8n | 5678 | n8n工作流引擎 |
| ollama | 11434 | Ollama LLM服务 |
| nginx | 80/443 | Nginx反向代理 |

### 常用管理命令

```bash
# 查看服务状态
./scripts/deploy.sh status

# 查看日志
./scripts/deploy.sh logs [service-name]

# 重启服务
./scripts/deploy.sh restart

# 停止服务
./scripts/deploy.sh stop

# 清理环境
./scripts/deploy.sh clean
```

## 📚 文档

### 完整文档列表

- **[用户使用手册](docs/user-manual.md)**: 详细的用户操作指南
- **[开发者指南](docs/developer-guide.md)**: 技术开发和API文档
- **[系统管理指南](docs/admin-guide.md)**: 部署、配置和维护指南
- **[Docker部署指南](docs/docker-deployment.md)**: 容器化部署详细说明
- **[n8n工作流文档](docs/n8n-workflows.md)**: 工作流配置和使用
- **[数据库设计文档](docs/database-design.md)**: 数据库结构和设计
- **[项目总结报告](docs/project-summary.md)**: 完整的项目成果总结

## 🔧 开发指南

### 本地开发环境

```bash
# 前端开发
cd frontend
npm install
npm start

# 后端开发
cd bewithU_api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python src/main.py
```

### 贡献指南

我们欢迎社区贡献！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 🔍 故障排查

### 常见问题

#### 服务启动失败
```bash
# 检查端口占用
netstat -tulpn | grep -E ':(3000|5000|5678|5432|6379|11434)'

# 查看服务日志
./scripts/deploy.sh logs

# 清理并重新启动
./scripts/deploy.sh clean
./scripts/deploy.sh start
```

更多故障排查信息请参考 [系统管理指南](docs/admin-guide.md#故障排查)

## 🌟 项目亮点

### 技术创新
- **本地AI**: 完全本地化的AI处理，保护数据隐私
- **智能工作流**: 可视化的业务流程自动化
- **微服务架构**: 现代化的系统架构设计
- **容器化部署**: 一键部署，环境一致性

### 用户体验
- **多语言支持**: 真正的国际化用户体验
- **响应式设计**: 完美的移动端适配
- **直观界面**: 现代化的卡片式布局
- **快速响应**: 秒级的问题回答

### 业务价值
- **效率提升**: 显著减少问题解决时间
- **成本降低**: 减少人工干预需求
- **知识积累**: 持续改进的知识库
- **用户满意**: 24/7不间断服务

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🤝 支持和社区

### 获取帮助

- **文档**: 查看 [docs/](docs/) 目录下的详细文档
- **Issues**: 在 GitHub 上提交问题和建议
- **讨论**: 参与 GitHub Discussions

### 联系我们

- **项目主页**: https://github.com/unkaku-1/BE-With-U
- **问题反馈**: 通过 GitHub Issues
- **功能建议**: 通过 GitHub Discussions

## 🙏 致谢

感谢所有为BEwithU项目做出贡献的开发者和开源社区：

- [React](https://reactjs.org/) - 前端UI框架
- [Flask](https://flask.palletsprojects.com/) - 后端Web框架
- [Ollama](https://ollama.ai/) - 本地LLM部署
- [n8n](https://n8n.io/) - 工作流自动化
- [Docker](https://www.docker.com/) - 容器化平台
- [PostgreSQL](https://www.postgresql.org/) - 数据库系统
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架

---

<div align="center">

**⭐ 如果这个项目对您有帮助，请给我们一个星标！**

Made with ❤️ by BEwithU Team

</div>

