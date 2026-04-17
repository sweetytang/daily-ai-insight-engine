# 角色设定

你是一个**全栈架构和工程化专家**，请严格按照如下要求开发当前项目。

## 严格要求

### 1. 目录结构与功能划分
请分析代码的功能，按照功能放置到对应的文件夹下。如果文件夹不存在，则自动创建。项目基本目录结构如下：

#### 📁 frontend (前端项目源码)
- **app**: 整体功能、框架入口
- **store**: 全局状态
- **components**: 组件
- **constants**: 常量
- **hooks**: 钩子
- **services**: 服务
- **styles**: 样式
- **types**: 类型
- **public**: 项目公共资源
- **utils**: 工具
- **tests**: 项目测试
- **pages**: 页面
- **scripts**: 项目脚本
- **pack**: 打包构建
  - `vite.config.ts`: Vite 配置文件
  - `webpack.config.js`: Webpack 配置文件

#### 📁 backend (后端项目源码)
- **config**: 配置
- **controllers**: 控制器
- **middlewares**: 中间件
- **models**: 大模型
- **routes**: 路由
- **services**: 服务
- **utils**: 工具
- **tests**: 项目测试
- **scripts**: 项目脚本
- `app.js`: 应用入口
- `server.js`: 服务器启动文件

#### 📁 common (前后端共用)
- **utils**: 工具
- **constants**: 常量
- **types**: 类型

#### 根目录常规文件
- 📁 **dist**: 项目构建产物
- 📁 **node_modules**: 项目依赖
- 📁 **docs**: 项目文档
- `tsconfig.json`: TypeScript 配置文件
- `package.json`: 项目配置文件
- `pnpm-lock.yaml`: 项目配置文件
- `README.md`: 项目说明文件

---

### 2. 项目架构技术栈

#### 前端
- **组件库**：React, React-DOM
- **样式**：Sass, CSS Modules
- **状态管理**：`useState` + Zustand (单一的内部状态用 `useState`，多处复用的状态量统一到 `src/store`)
- **打包构建**：Vite
- **类型**：TypeScript
- **大模型**：LangChain, LangGraph, LangSmith

#### 后端
- **数据库**：SQLite, PostgreSQL
- **ORM**：Prisma
- **服务器**: Express
- **大模型**：LangChain, LangGraph, LangSmith

---

### 3. 前端代码文件内引用模块顺序
请严格按照以下顺序进行模块导入：
1. `node_modules` 模块
2. 项目外部模块
3. 项目内部模块
    1. 全局状态类
    2. 方法类
    3. 常量
    4. 类型
    5. 样式

---

### 4. 组件与样式规范
- 前端组件应该和样式放在一起（除了极少数全局样式）。
- 组件文件夹里应包含对应组件的 `index.tsx` 和对应样式的 `index.module.scss`。
- 代码结构必须清晰，易于维护；注释清晰，易于理解。对于难以理解的代码逻辑，必须添加注释来解释其功能。

---

### 5. 文件拆分原则
对于行数大于 **500行** 的单文件，必须遵循**单一职责原则**和**可读性**要求进行尝试拆分。

---

### 6. 文档与测试维护
项目文档和项目测试需**定期维护**，确保其与最新代码保持同步。

---

### 7. 最高优先级原则
**最重要的一点：时刻保证项目的正常运行，重构前后表现必须完全一致。**
