# BEwithU 开发者指南

## 项目概述

BEwithU是一个基于现代技术栈的智能IT支持系统，采用微服务架构，集成了AI、工作流自动化和知识管理等功能。

### 技术栈

#### 前端
- **React 18**: 用户界面框架
- **TypeScript**: 类型安全的JavaScript
- **Tailwind CSS**: 实用优先的CSS框架
- **Framer Motion**: 动画库
- **React Router**: 路由管理

#### 后端
- **Flask**: Python Web框架
- **SQLAlchemy**: ORM数据库操作
- **PostgreSQL**: 主数据库
- **Redis**: 缓存和会话存储
- **JWT**: 身份认证

#### AI和自动化
- **Ollama**: 本地LLM服务
- **n8n**: 工作流自动化引擎
- **LangChain**: AI应用开发框架

#### 部署和运维
- **Docker**: 容器化部署
- **Docker Compose**: 服务编排
- **Nginx**: 反向代理和负载均衡

## 项目结构

```
BE-With-U/
├── frontend/                 # React前端应用
│   ├── src/
│   │   ├── components/       # React组件
│   │   ├── contexts/         # React上下文
│   │   ├── pages/           # 页面组件
│   │   ├── styles/          # 样式文件
│   │   └── utils/           # 工具函数
│   ├── public/              # 静态资源
│   ├── package.json         # 依赖配置
│   ├── Dockerfile           # 生产环境容器
│   └── Dockerfile.dev       # 开发环境容器
├── bewithU_api/             # Flask后端API
│   ├── src/
│   │   ├── models/          # 数据模型
│   │   ├── routes/          # API路由
│   │   ├── utils/           # 工具函数
│   │   └── main.py          # 应用入口
│   ├── requirements.txt     # Python依赖
│   ├── Dockerfile           # 生产环境容器
│   └── Dockerfile.dev       # 开发环境容器
├── n8n/                     # n8n工作流配置
│   ├── workflows/           # 工作流定义
│   ├── credentials/         # 凭据模板
│   └── deploy-workflows.sh  # 部署脚本
├── docker/                  # Docker配置
│   ├── nginx/               # Nginx配置
│   └── ollama/              # Ollama配置
├── scripts/                 # 部署和管理脚本
├── docs/                    # 项目文档
├── docker-compose.yml       # 生产环境编排
├── docker-compose.dev.yml   # 开发环境编排
└── README.md               # 项目说明
```

## 开发环境搭建

### 前置要求

- **Node.js**: 18.0+
- **Python**: 3.11+
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Git**: 2.30+

### 快速开始

#### 1. 克隆项目

```bash
git clone https://github.com/unkaku-1/BE-With-U.git
cd BE-With-U
```

#### 2. 启动开发环境

```bash
# 使用Docker Compose启动开发环境
./scripts/deploy.sh start dev

# 或者手动启动
docker-compose -f docker-compose.dev.yml up -d
```

#### 3. 访问开发环境

- 前端: http://localhost:3001
- 后端API: http://localhost:5001
- n8n: http://localhost:5679
- 数据库: localhost:5433

### 本地开发

#### 前端开发

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm start

# 构建生产版本
npm run build

# 运行测试
npm test

# 代码检查
npm run lint
```

#### 后端开发

```bash
cd bewithU_api

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt

# 启动开发服务器
python src/main.py

# 运行测试
python -m pytest

# 代码格式化
black src/
flake8 src/
```

## 架构设计

### 系统架构图

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   用户界面      │    │   API网关       │    │   业务服务      │
│                 │    │                 │    │                 │
│ • React前端     │◄──►│ • Nginx代理     │◄──►│ • Flask API     │
│ • 响应式设计    │    │ • 负载均衡      │    │ • 业务逻辑      │
│ • 多语言支持    │    │ • SSL终端       │    │ • 数据验证      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   工作流引擎    │    │   数据存储      │    │   AI服务        │
│                 │    │                 │    │                 │
│ • n8n自动化     │◄──►│ • PostgreSQL    │◄──►│ • Ollama LLM    │
│ • 智能问答      │    │ • Redis缓存     │    │ • 本地推理      │
│ • 工单处理      │    │ • 数据持久化    │    │ • 知识检索      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 数据流设计

#### 智能问答流程

```
用户提问 → 前端界面 → API网关 → n8n工作流 → 知识库搜索 → LLM处理 → 返回答案
```

#### 工单处理流程

```
创建工单 → 自动分类 → 优先级分析 → 自动分配 → 通知相关人员 → 跟踪处理
```

### 数据库设计

#### 核心表结构

```sql
-- 用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    language VARCHAR(10) DEFAULT 'ja',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 知识库文章表
CREATE TABLE knowledge_articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    category_id INTEGER REFERENCES knowledge_categories(id),
    language VARCHAR(10) DEFAULT 'ja',
    tags TEXT[],
    is_featured BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 工单表
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(20) DEFAULT 'open',
    category VARCHAR(50),
    requester_id INTEGER REFERENCES users(id),
    assignee_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 对话表
CREATE TABLE chat_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255),
    language VARCHAR(10) DEFAULT 'ja',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API文档

### 认证API

#### POST /api/auth/login
用户登录

**请求体:**
```json
{
  "username": "string",
  "password": "string"
}
```

**响应:**
```json
{
  "success": true,
  "token": "jwt_token",
  "user": {
    "id": 1,
    "username": "user",
    "display_name": "User Name",
    "role": "user",
    "language": "ja"
  }
}
```

#### POST /api/auth/register
用户注册

**请求体:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "display_name": "string",
  "language": "ja"
}
```

### 知识库API

#### GET /api/knowledge/search
搜索知识库

**查询参数:**
- `q`: 搜索关键词
- `language`: 语言代码 (ja/zh/en)
- `category`: 分类ID
- `page`: 页码
- `per_page`: 每页数量

**响应:**
```json
{
  "success": true,
  "articles": [
    {
      "id": 1,
      "title": "文章标题",
      "summary": "文章摘要",
      "category": "分类名称",
      "tags": ["标签1", "标签2"],
      "created_at": "2024-01-14T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 10,
    "total": 100,
    "pages": 10
  }
}
```

#### GET /api/knowledge/articles/{id}
获取文章详情

**响应:**
```json
{
  "success": true,
  "article": {
    "id": 1,
    "title": "文章标题",
    "content": "文章内容",
    "summary": "文章摘要",
    "category": "分类名称",
    "tags": ["标签1", "标签2"],
    "view_count": 100,
    "created_at": "2024-01-14T10:00:00Z",
    "updated_at": "2024-01-14T10:00:00Z"
  }
}
```

### 工单API

#### POST /api/tickets
创建工单

**请求体:**
```json
{
  "title": "工单标题",
  "description": "详细描述",
  "priority": "normal",
  "category": "软件"
}
```

#### GET /api/tickets
获取工单列表

**查询参数:**
- `status`: 状态筛选
- `priority`: 优先级筛选
- `assignee_id`: 负责人筛选
- `page`: 页码
- `per_page`: 每页数量

### 聊天API

#### POST /api/chat/conversations
创建对话

**请求体:**
```json
{
  "title": "对话标题",
  "language": "ja"
}
```

#### POST /api/chat/conversations/{id}/messages
发送消息

**请求体:**
```json
{
  "content": "用户消息内容",
  "role": "user"
}
```

## 前端开发指南

### 组件架构

#### 目录结构

```
src/
├── components/
│   ├── common/              # 通用组件
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── Modal.tsx
│   ├── auth/                # 认证相关组件
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── layout/              # 布局组件
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Layout.tsx
│   └── features/            # 功能组件
│       ├── chat/
│       ├── tickets/
│       └── knowledge/
├── contexts/                # React上下文
│   ├── AuthContext.tsx
│   ├── I18nContext.tsx
│   └── ThemeContext.tsx
├── hooks/                   # 自定义Hook
│   ├── useAuth.ts
│   ├── useApi.ts
│   └── useLocalStorage.ts
├── pages/                   # 页面组件
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── ChatPage.tsx
│   ├── TicketsPage.tsx
│   └── KnowledgeBasePage.tsx
├── services/                # API服务
│   ├── api.ts
│   ├── auth.ts
│   └── websocket.ts
├── utils/                   # 工具函数
│   ├── constants.ts
│   ├── helpers.ts
│   └── validators.ts
└── types/                   # TypeScript类型定义
    ├── api.ts
    ├── user.ts
    └── common.ts
```

#### 组件开发规范

```typescript
// 组件模板
import React from 'react';
import { useTranslation } from 'react-i18next';

interface ComponentProps {
  // 定义props类型
  title: string;
  onAction?: () => void;
}

export const Component: React.FC<ComponentProps> = ({ 
  title, 
  onAction 
}) => {
  const { t } = useTranslation();

  return (
    <div className="component-container">
      <h2 className="text-xl font-semibold">{title}</h2>
      {onAction && (
        <button 
          onClick={onAction}
          className="btn btn-primary"
        >
          {t('common.action')}
        </button>
      )}
    </div>
  );
};
```

### 状态管理

#### Context使用示例

```typescript
// AuthContext.tsx
import React, { createContext, useContext, useReducer } from 'react';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authService.login(credentials);
      dispatch({ type: 'LOGIN_SUCCESS', payload: response });
    } catch (error) {
      dispatch({ type: 'LOGIN_ERROR', payload: error.message });
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 国际化实现

#### 语言配置

```typescript
// i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import ja from './locales/ja.json';
import zh from './locales/zh.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ja: { translation: ja },
      zh: { translation: zh }
    },
    lng: 'ja',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
```

#### 语言文件示例

```json
// locales/ja.json
{
  "common": {
    "save": "保存",
    "cancel": "キャンセル",
    "delete": "削除",
    "edit": "編集",
    "loading": "読み込み中..."
  },
  "auth": {
    "login": "ログイン",
    "logout": "ログアウト",
    "register": "登録",
    "username": "ユーザー名",
    "password": "パスワード"
  },
  "chat": {
    "title": "チャット",
    "placeholder": "メッセージを入力してください...",
    "send": "送信"
  }
}
```

## 后端开发指南

### Flask应用结构

#### 应用工厂模式

```python
# src/main.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import Config

db = SQLAlchemy()
jwt = JWTManager()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # 初始化扩展
    db.init_app(app)
    jwt.init_app(app)
    CORS(app)
    
    # 注册蓝图
    from routes.auth import auth_bp
    from routes.knowledge import knowledge_bp
    from routes.tickets import tickets_bp
    from routes.chat import chat_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(knowledge_bp, url_prefix='/api/knowledge')
    app.register_blueprint(tickets_bp, url_prefix='/api/tickets')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
```

#### 数据模型定义

```python
# src/models/user.py
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from src.main import db

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    display_name = db.Column(db.String(100))
    role = db.Column(db.String(20), default='user')
    language = db.Column(db.String(10), default='ja')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'display_name': self.display_name,
            'role': self.role,
            'language': self.language,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
```

#### API路由实现

```python
# src/routes/auth.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from src.models.user import User
from src.main import db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password required'}), 400
    
    user = User.query.filter_by(username=username).first()
    
    if user and user.check_password(password) and user.is_active:
        access_token = create_access_token(identity=user.id)
        return jsonify({
            'success': True,
            'token': access_token,
            'user': user.to_dict()
        })
    
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # 验证必填字段
    required_fields = ['username', 'email', 'password']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'success': False, 'message': f'{field} is required'}), 400
    
    # 检查用户是否已存在
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'success': False, 'message': 'Username already exists'}), 409
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'success': False, 'message': 'Email already exists'}), 409
    
    # 创建新用户
    user = User(
        username=data['username'],
        email=data['email'],
        display_name=data.get('display_name', data['username']),
        language=data.get('language', 'ja')
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'User created successfully',
        'user': user.to_dict()
    }), 201

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    return jsonify({
        'success': True,
        'user': user.to_dict()
    })
```

### 数据库操作

#### 查询示例

```python
# 基本查询
users = User.query.all()
user = User.query.get(1)
user = User.query.filter_by(username='admin').first()

# 复杂查询
from sqlalchemy import and_, or_

active_users = User.query.filter(
    and_(User.is_active == True, User.role == 'user')
).all()

# 分页查询
page = request.args.get('page', 1, type=int)
per_page = request.args.get('per_page', 10, type=int)

users = User.query.paginate(
    page=page, 
    per_page=per_page, 
    error_out=False
)

# 关联查询
from sqlalchemy.orm import joinedload

tickets = Ticket.query.options(
    joinedload(Ticket.requester),
    joinedload(Ticket.assignee)
).all()
```

#### 事务处理

```python
from src.main import db

def create_ticket_with_notification(ticket_data, user_id):
    try:
        # 创建工单
        ticket = Ticket(**ticket_data)
        db.session.add(ticket)
        db.session.flush()  # 获取ID但不提交
        
        # 创建通知
        notification = Notification(
            user_id=user_id,
            title='New ticket created',
            message=f'Ticket #{ticket.ticket_number} has been created',
            related_id=ticket.id
        )
        db.session.add(notification)
        
        # 提交事务
        db.session.commit()
        return ticket
        
    except Exception as e:
        db.session.rollback()
        raise e
```

## n8n工作流开发

### 工作流结构

#### 基本节点类型

1. **触发节点**: Webhook、定时器、文件监听
2. **数据处理节点**: Function、Set、Merge
3. **HTTP请求节点**: HTTP Request、API调用
4. **条件节点**: IF、Switch、Filter
5. **响应节点**: Respond to Webhook、Email

#### 工作流开发最佳实践

```javascript
// Function节点示例 - 数据处理
const inputData = $input.all();
const processedData = [];

for (const item of inputData) {
  const data = item.json;
  
  // 数据验证
  if (!data.question || !data.user_id) {
    continue;
  }
  
  // 数据处理
  const processedItem = {
    question: data.question.trim(),
    user_id: data.user_id,
    language: data.language || 'ja',
    timestamp: new Date().toISOString(),
    // 添加处理逻辑
    processed: true
  };
  
  processedData.push({ json: processedItem });
}

return processedData;
```

#### 错误处理

```javascript
// 带错误处理的Function节点
try {
  const data = $input.first().json;
  
  // 业务逻辑
  const result = processData(data);
  
  return [{
    json: {
      success: true,
      data: result
    }
  }];
  
} catch (error) {
  return [{
    json: {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }];
}
```

### 自定义节点开发

#### 节点结构

```typescript
// custom-node.node.ts
import { IExecuteFunctions } from 'n8n-core';
import {
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';

export class CustomNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Custom Node',
    name: 'customNode',
    group: ['transform'],
    version: 1,
    description: 'Custom node for BEwithU',
    defaults: {
      name: 'Custom Node',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        options: [
          {
            name: 'Process Data',
            value: 'processData',
          },
        ],
        default: 'processData',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const operation = this.getNodeParameter('operation', 0) as string;
    
    const returnData: INodeExecutionData[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (operation === 'processData') {
        // 处理逻辑
        const processedData = {
          ...item.json,
          processed: true,
          timestamp: new Date().toISOString(),
        };
        
        returnData.push({
          json: processedData,
        });
      }
    }
    
    return [returnData];
  }
}
```

## 测试指南

### 前端测试

#### 单元测试

```typescript
// Component.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Component } from './Component';

describe('Component', () => {
  test('renders component with title', () => {
    render(<Component title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });
  
  test('calls onAction when button is clicked', () => {
    const mockAction = jest.fn();
    render(<Component title="Test" onAction={mockAction} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockAction).toHaveBeenCalledTimes(1);
  });
});
```

#### 集成测试

```typescript
// App.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('App Integration', () => {
  test('renders login page when not authenticated', () => {
    renderWithProviders(<App />);
    expect(screen.getByText('Login')).toBeInTheDocument();
  });
});
```

### 后端测试

#### 单元测试

```python
# test_auth.py
import pytest
from src.main import create_app, db
from src.models.user import User

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def test_user_registration(client):
    response = client.post('/api/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'testpassword'
    })
    
    assert response.status_code == 201
    data = response.get_json()
    assert data['success'] is True
    assert data['user']['username'] == 'testuser'

def test_user_login(client):
    # 先创建用户
    user = User(username='testuser', email='test@example.com')
    user.set_password('testpassword')
    db.session.add(user)
    db.session.commit()
    
    # 测试登录
    response = client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'testpassword'
    })
    
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert 'token' in data
```

#### API测试

```python
# test_api.py
def test_knowledge_search(client, auth_headers):
    response = client.get(
        '/api/knowledge/search?q=test',
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'articles' in data
    assert 'pagination' in data

def test_ticket_creation(client, auth_headers):
    response = client.post('/api/tickets', 
        json={
            'title': 'Test Ticket',
            'description': 'Test Description',
            'priority': 'normal'
        },
        headers=auth_headers
    )
    
    assert response.status_code == 201
    data = response.get_json()
    assert data['success'] is True
    assert data['ticket']['title'] == 'Test Ticket'
```

## 部署指南

### 开发环境部署

```bash
# 克隆项目
git clone https://github.com/unkaku-1/BE-With-U.git
cd BE-With-U

# 启动开发环境
./scripts/deploy.sh start dev

# 查看服务状态
./scripts/deploy.sh status dev
```

### 生产环境部署

```bash
# 生产环境部署
./scripts/deploy.sh start

# 配置SSL证书
mkdir -p docker/nginx/ssl
# 将证书文件放入ssl目录

# 启用HTTPS
# 编辑docker/nginx/nginx.conf，取消注释HTTPS配置
```

### 性能优化

#### 前端优化

```typescript
// 代码分割
import { lazy, Suspense } from 'react';

const ChatPage = lazy(() => import('./pages/ChatPage'));
const TicketsPage = lazy(() => import('./pages/TicketsPage'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
      </Routes>
    </Suspense>
  );
}

// 缓存优化
import { useMemo } from 'react';

const ExpensiveComponent = ({ data }) => {
  const processedData = useMemo(() => {
    return data.map(item => processItem(item));
  }, [data]);
  
  return <div>{/* 渲染处理后的数据 */}</div>;
};
```

#### 后端优化

```python
# 数据库查询优化
from sqlalchemy.orm import joinedload

# 预加载关联数据
tickets = Ticket.query.options(
    joinedload(Ticket.requester),
    joinedload(Ticket.assignee),
    joinedload(Ticket.comments)
).all()

# 缓存优化
from flask_caching import Cache

cache = Cache(app)

@cache.memoize(timeout=300)
def get_popular_articles():
    return Article.query.filter_by(is_featured=True).all()

# 分页优化
def get_paginated_results(query, page, per_page):
    return query.paginate(
        page=page,
        per_page=per_page,
        error_out=False,
        max_per_page=100
    )
```

## 贡献指南

### 代码规范

#### 前端代码规范

- 使用TypeScript进行类型检查
- 遵循ESLint和Prettier配置
- 组件名使用PascalCase
- 文件名使用kebab-case
- 使用函数式组件和Hooks

#### 后端代码规范

- 遵循PEP 8 Python代码规范
- 使用Black进行代码格式化
- 使用Flake8进行代码检查
- 函数和变量名使用snake_case
- 类名使用PascalCase

### Git工作流

```bash
# 创建功能分支
git checkout -b feature/new-feature

# 提交代码
git add .
git commit -m "feat: add new feature"

# 推送分支
git push origin feature/new-feature

# 创建Pull Request
# 在GitHub上创建PR并请求代码审查
```

### 提交信息规范

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建过程或辅助工具的变动
```

## 故障排查

### 常见问题

#### 前端问题

1. **依赖安装失败**
   ```bash
   # 清理缓存
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **构建失败**
   ```bash
   # 检查TypeScript错误
   npm run type-check
   
   # 检查ESLint错误
   npm run lint
   ```

#### 后端问题

1. **数据库连接失败**
   ```bash
   # 检查数据库状态
   docker-compose logs postgres
   
   # 重置数据库
   docker-compose down
   docker volume rm be-with-u_postgres_data
   docker-compose up -d postgres
   ```

2. **依赖安装失败**
   ```bash
   # 重新创建虚拟环境
   rm -rf venv
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

#### Docker问题

1. **容器启动失败**
   ```bash
   # 查看容器日志
   docker-compose logs [service-name]
   
   # 重新构建镜像
   docker-compose build --no-cache
   ```

2. **端口冲突**
   ```bash
   # 检查端口占用
   netstat -tulpn | grep :5000
   
   # 修改端口配置
   vim .env
   ```

## 总结

BEwithU项目采用现代化的技术栈和最佳实践，提供了完整的开发、测试和部署解决方案。通过本开发者指南，您应该能够：

- 理解项目的整体架构和技术选型
- 快速搭建开发环境并开始开发
- 掌握前后端开发的最佳实践
- 了解n8n工作流的开发方法
- 进行有效的测试和调试
- 成功部署到生产环境

如果您在开发过程中遇到问题，请参考故障排查部分或查看项目文档。我们欢迎您的贡献和反馈！

