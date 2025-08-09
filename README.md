# BEwithU - 智能IT支持系统

> 一个集成本地LLM、知识库和工单管理的智能IT支持系统，旨在减少用户提问到IT人员回答的时间。

## 🎯 项目概述

BEwithU是一个现代化的IT支持解决方案，通过以下方式提升IT支持效率：

1. **智能查询处理**：用户提问时，本地LLM首先在知识库中搜索相关信息并回复
2. **自动工单创建**：当知识库中没有相关信息时，系统询问用户是否需要提交工单到BE（IT部门）
3. **智能内容整理**：用户问题解决后，LLM整理对话内容的关键点，供BE审核后添加到知识库

## 🏗️ 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端界面      │    │   n8n工作流     │    │   后端服务      │
│  (React/Vue)    │◄──►│   编排引擎      │◄──►│   (Node.js)     │
│                 │    │                 │    │                 │
│ - 聊天界面      │    │ - 查询路由      │    │ - 用户管理      │
│ - 中日文切换    │    │ - LLM调用       │    │ - 会话管理      │
│ - 卡片式布局    │    │ - 知识库搜索    │    │ - API网关       │
│ - 工单管理      │    │ - 工单创建      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
    ┌────────────────────────────┼────────────────────────────┐
    │                            │                            │
    ▼                            ▼                            ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   本地LLM       │    │   知识库系统    │    │   工单系统      │
│   (Ollama)      │    │   (Outline)     │    │   (Zammad)      │
│                 │    │                 │    │                 │
│ - Llama 3.1 8B  │    │ - 文档存储      │    │ - 工单管理      │
│ - Mistral 7B    │    │ - 搜索功能      │    │ - 状态跟踪      │
│ - Qwen2 7B      │    │ - 版本控制      │    │ - 通知系统      │
│ - API接口       │    │ - 团队协作      │    │ - 报告分析      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ 技术栈

| 组件 | 技术选择 | 版本 |
|------|----------|------|
| 前端 | React + TypeScript | 18.x |
| 样式 | Tailwind CSS | 3.x |
| 后端 | Node.js + Express | 20.x |
| 工作流 | n8n | Latest |
| LLM | Ollama | Latest |
| 知识库 | Outline | Latest |
| 工单系统 | Zammad | Latest |
| 数据库 | PostgreSQL | 15.x |
| 缓存 | Redis | 7.x |
| 容器化 | Docker Compose | Latest |

## 🚀 快速开始

### 前置要求

- Docker 和 Docker Compose
- Node.js 20.x+
- Git

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/unkaku-1/BE-With-U.git
   cd BE-With-U
   ```

2. **环境配置**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，配置必要的环境变量
   ```

3. **启动服务**
   ```bash
   docker-compose up -d
   ```

4. **初始化数据**
   ```bash
   npm run setup
   ```

5. **访问应用**
   - 前端界面: http://localhost:3000
   - n8n工作流: http://localhost:5678
   - 知识库: http://localhost:3001
   - 工单系统: http://localhost:3002

## 📁 项目结构

```
BE-With-U/
├── frontend/                 # React前端应用
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/                  # Node.js后端API
│   ├── src/
│   ├── config/
│   └── package.json
├── n8n/                     # n8n工作流配置
│   ├── workflows/
│   └── credentials/
├── docker/                  # Docker配置文件
│   ├── ollama/
│   ├── outline/
│   └── zammad/
├── docs/                    # 项目文档
│   ├── deployment/
│   ├── api/
│   └── user-guide/
├── scripts/                 # 部署和维护脚本
├── docker-compose.yml       # Docker Compose配置
├── .env.example            # 环境变量模板
└── README.md               # 项目说明
```

## 🌟 核心功能

### 用户端功能
- 🗣️ 智能对话界面，支持中日文切换
- 📱 响应式设计，支持移动端
- 🎨 现代化卡片式布局
- 🔍 实时搜索和建议

### 管理端功能
- 📊 工单管理和状态跟踪
- 📚 知识库内容管理
- 👥 用户权限管理
- 📈 使用统计和报告

### AI功能
- 🤖 本地LLM处理，保护数据隐私
- 🧠 智能意图识别和内容理解
- 📝 自动内容整理和总结
- 🔄 多语言支持

## 🔧 配置说明

### 环境变量

```bash
# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/bewithU

# Redis配置
REDIS_URL=redis://localhost:6379

# Ollama配置
OLLAMA_BASE_URL=http://localhost:11434

# n8n配置
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=password

# 应用配置
JWT_SECRET=your-jwt-secret
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
```

### LLM模型配置

系统支持多种本地LLM模型：

```bash
# 下载推荐模型
ollama pull llama3.1:8b      # 通用对话
ollama pull qwen2:7b         # 中文优化
ollama pull mistral:7b       # 代码和推理
```

## 📖 使用指南

### 用户使用流程

1. **提交查询**：用户在前端界面输入问题
2. **智能搜索**：系统在知识库中搜索相关信息
3. **获得回复**：如果找到相关信息，LLM生成回复
4. **创建工单**：如果未找到信息，询问是否创建工单
5. **问题解决**：BE团队处理工单并回复用户
6. **知识更新**：问题解决后，内容添加到知识库

### 管理员操作

1. **工单管理**：在Zammad中处理和回复工单
2. **知识库维护**：在Outline中管理文档和知识点
3. **工作流配置**：在n8n中调整业务逻辑
4. **系统监控**：查看使用统计和性能指标

## 🤝 贡献指南

我们欢迎社区贡献！请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详细信息。

### 开发环境设置

1. Fork 本仓库
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 支持

如果您遇到问题或有疑问：

- 📧 邮件: support@bewithU.com
- 🐛 问题报告: [GitHub Issues](https://github.com/unkaku-1/BE-With-U/issues)
- 💬 讨论: [GitHub Discussions](https://github.com/unkaku-1/BE-With-U/discussions)

## 🙏 致谢

感谢以下开源项目的支持：

- [n8n](https://n8n.io/) - 工作流自动化
- [Ollama](https://ollama.ai/) - 本地LLM部署
- [Outline](https://www.getoutline.com/) - 知识库系统
- [Zammad](https://zammad.com/) - 工单管理系统
- [React](https://reactjs.org/) - 前端框架
- [Node.js](https://nodejs.org/) - 后端运行时

---

**BEwithU** - 让IT支持更智能，让工作更高效！ 🚀

