# Memory & Usage Dashboard

Agent 记忆与使用数据仪表盘 —— 每日自动更新。

数据源（本地机器）：
- pi: sessions (token/成本/模型) / recaps / memory.md / mem0
- herdr: activity.db (活动/成本/错误) / sessions.db / agent-teams.db

更新流程：`~/bin/memory-dashboard.py` 生成 `index.html` → push → Vercel 自动部署。

部署：Vercel (静态) · 仓库：joyehuang/memory-dashboard
