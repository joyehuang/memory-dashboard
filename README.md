# Memory & Usage Dashboard

Agent 记忆与使用数据仪表盘 —— 每日自动更新，展示 `data.json` 的全量历史。

## 技术栈

React 18 + Vite + TypeScript，图表用 ECharts（按需注册 bar/line/pie）。
纯静态：前端在运行时 `fetch('/data.json')`，没有后端。

## 数据

数据源（本地机器）：

- **pi** — sessions（token / 成本 / 模型）、recaps、memory.md、mem0
- **Claude Code** — sessions（token / 缓存 / 轮次 / 模型）
- **herdr** — activity.db（活动 / 成本 / 错误）、sessions.db、agent-teams.db

生成脚本 `~/bin/memory-dashboard-data.py` 写出 `public/data.json`，本仓库不参与生成逻辑。

`data.json` 结构：`totals` / `daily` / `claudeDaily` / `models` / `claudeModels` /
`recaps` / `mem0Ops` / `herdrDaily` / `herdrBots`。

两点数据源差异，前端按此处理：

- `models` / `claudeModels` / `herdrBots` 只有全历史汇总，不按日拆分，所以不受时间范围切换影响
- **Claude Code 数据不含任何计费字段**，因此 Claude 板块只有 token / 缓存 / 轮次，没有成本图和成本列

**缓存节省**估算 = `cacheRead × (costIn / input) − costCache`，
即把缓存读取的 token 按输入单价计费会多花多少钱。

## 开发

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # 产出 dist/
npm run preview
```

## 部署

Vercel 静态部署（`vercel.json` 指定 vite / `dist`），push 到 `main` 自动构建。
更新流程：本地脚本重新生成 `public/data.json` → commit → push。

仓库：joyehuang/memory-dashboard
