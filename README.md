# Daily AI Insight Engine

一个面向笔试题的 AI 舆情分析日报 MVP。

## 项目完成了什么

- 采集并整理了 15 条 2026 年 2 月到 4 月的 AI 近期新闻样本
- 用 `LangGraph` 把处理流程拆成清洗、结构化抽取、排序聚合、日报生成四步
- 用 `Prisma + SQLite` 存储原始新闻、结构化结果和日报结果
- 用 `Express` 提供日报接口
- 用 `React + Vite + TypeScript + Sass Modules + Zustand` 做了可视化看板
- 补齐了样例输出和书面归档

## 快速开始

```bash
pnpm install
pnpm --store-dir .pnpm-store/v10 rebuild better-sqlite3 --pending
pnpm run setup
pnpm run dev
```

默认地址：

- 前端：`http://localhost:5173`
- 后端：`http://localhost:3001`

## 关键命令

```bash
pnpm run setup   # 生成 Prisma Client、初始化 SQLite、导入样例日报
pnpm run test    # 后端最小测试
pnpm run build   # 前端构建
```

## 结果入口

- 样例日报 JSON：`backend/services/data/generated-report.json`
- 说明归档：`docs/项目归档.md`

## 目录说明

```text
frontend/
backend/
common/
prisma/
docs/
```

## 说明

- Prisma 7 在当前环境里 `db push` 的 schema engine 有异常，所以 `setup` 采用了更稳的做法：
  先 `prisma generate`，再用 Prisma 运行时初始化 SQLite 表结构，最后导入种子数据。
- 这不影响 Prisma 作为 ORM 的使用，后续 CRUD 仍走 Prisma Client。
