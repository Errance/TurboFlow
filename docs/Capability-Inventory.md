# 能力地图与覆盖矩阵（V2 — Capability Inventory）

> 遍历 "Event-based Prediction Market V2" 所有需要覆盖的能力域和功能项。每轮对照此文档防漏项。

---

## 关键概念锚点

### Event-Centric 架构
- PredictionEvent 是顶层实体，包含 contracts[]、rules、timeline、status
- Contract 是可交易单元，概率 % + USDC 定价

### OutcomeModel 语义
- `independent`：多合约可同时为 YES（时间 strike："before Q1" / "before H1"）
- `mutually-exclusive`：恰好一个合约为 YES（选项："Film A" / "Film B" / "Film C"）

### 全站 USDC
- 价格展示：概率 % 为主 + 费用/PNL/Payout 以 USDC 标注
- 合约：yesPrice / noPrice (USDC 0.01–0.99)
- Payout：赢 = 1 USDC/份，输 = 0 USDC/份

### Quick Order = Marketable Limit（对齐 Polymarket）
所有订单本质是 limit order。Quick Buy 自动以可成交价格吃单。

### CLOB 高级交易（分叉）
盘口 snapshot/delta 叙事保留在 ContractDetailPage（Advanced Trading 入口）。

---

## 预设数据场景覆盖验收标准

- [ ] 事件类型全覆盖：standard + multi-option + sports 各至少 1 个
- [ ] 事件状态全覆盖：OPEN / CLOSED / RESOLVING / SETTLED / CANCELLED / VOIDED 各至少 1 个
- [ ] 异常子状态覆盖：paused / disputed / delayed 各至少 1 个
- [ ] OutcomeModel 覆盖：independent（时间strike） + mutually-exclusive（多选项）各至少 1 个
- [ ] Sports 覆盖：至少 2 个不同运动（Basketball / Tennis 等）
- [ ] 订单状态全覆盖：Open / PartialFill / Filled / Cancelled / Rejected 各至少 1 条
- [ ] 持仓盈亏：至少 1 个浮盈 + 1 个浮亏持仓
- [ ] 激励标签：至少 1 个事件带 IncentiveTag

---

## 10 个能力域 + 覆盖矩阵

> T = 主干（Trunk），B = 分叉（Branch），L = 叶子（Leaf）

### 域 1: 事件发现（Event Discovery）

| 功能项 | 层级 | 说明 |
|--------|------|------|
| Explore 首页事件卡片列表 | T | EventCard：标题 + 状态 + 合约行 + Yes/No + 成交量(USDC) |
| FeaturedBanner（运营位）| T | 热点事件 + Sports Banner + 激励标签 |
| 分类 Tab 过滤（All/Politics/Economics/Crypto/Sports/Tech/Culture）| T | Sports Tab 跳转到 SportsPage |
| 搜索 | B | 关键词搜索事件 |

### 域 2: 事件详情（Event Detail）

| 功能项 | 层级 | 说明 |
|--------|------|------|
| RulesSummaryCard（三要素：测量/截止/来源）| T | 主干级，非折叠 |
| TimelinePayoutCard（开盘/截止/结算时间 + Payout叙事）| T | "赢=1 USDC, 输=0" |
| OutcomeModelHint（互斥事件提示）| T | 仅 mutually-exclusive 事件显示 |
| StatusBanner（事件状态 + 子状态 + 操作按钮）| T | 颜色编码 + 可操作 |
| 合约表（概率/成交量/24h变化/Yes/No + 图表图标）| T | 图表图标 → CLOB 分叉 |
| 完整规则文本 | B | 点击 "查看完整规则" 展开 Drawer |

### 域 3: 交易面板（Trade Panel）

| 功能项 | 层级 | 说明 |
|--------|------|------|
| TradePanel 桌面固定右侧 | T | 点击合约 Yes/No 切换 |
| TradePanel 移动端 BottomSheet | T | Explore 卡片/EventDetail 行均唤起 |
| 自解释头部（事件名+合约名）| T | 始终可见 |
| Quick Buy（即时成交 + 文案说明）| T | 默认模式 |
| Limit Order（自定价格 + 文案说明）| B | 切换到限价模式 |
| Payout 说明 | T | 始终可见："赢=1 USDC/份, 输=0" |
| 估算（份数/均价/潜在收益）| T | 输入金额后计算 |

### 域 4: Sports 独立 UI

| 功能项 | 层级 | 说明 |
|--------|------|------|
| SportsPage 列表 | T | 状态 Tab（Upcoming/Live/Results）+ 运动分类 |
| SportsGameCard | T | 对阵信息 + Moneyline/Spread/Total 投注线 |
| SportsGamePage 详情 | T | 对阵头部 + 投注线列表 + TradePanel |
| 日期分组 | T | 按比赛日期分组展示 |

### 域 5: CLOB 高级交易（Advanced Trading — 分叉）

| 功能项 | 层级 | 说明 |
|--------|------|------|
| ContractDetailPage | B | 从合约行图表图标进入 |
| 订单簿 snapshot/delta | B | 盘口在"活"着 |
| PriceChart | B | 价格走势图 |
| 点击盘口价位 → 填入限价 | B | 意图信号 |
| Quick Order / Limit Order | B | 完整下单功能 |
| 事件归属头部（返回事件详情）| B | 上下文保留 |

### 域 6: 异常场景处理

| 功能项 | 层级 | 说明 |
|--------|------|------|
| StatusBanner 扩展（6态 + 5子状态）| T | 颜色编码 + 操作矩阵 |
| DisputePanel | B | 争议时间线 + 双方论据 + Submit Evidence |
| RefundBanner | T | 取消/无效事件退款信息 |
| 异常 Mock 事件（disputed/cancelled/paused）| — | 预设数据覆盖 |

### 域 7: 订单管理（Order Management — CLOB 分叉中）

| 功能项 | 层级 | 说明 |
|--------|------|------|
| Open Orders 列表 | B | 在 ContractDetailPage 或 Portfolio 中 |
| 订单状态视觉更新 | B | Pending → Open → Filled/Cancelled |
| 撤单 | B | 点击订单行操作 |

### 域 8: 持仓与活动（Portfolio）

| 功能项 | 层级 | 说明 |
|--------|------|------|
| Positions 列表（USDC 计价）| T | 事件名 + 合约名 + 浮盈浮亏 |
| Open Orders | T | 当前挂单 |
| Activity / Trade History | B | 成交历史 |

### 域 9: Leaderboard & Incentives

| 功能项 | 层级 | 说明 |
|--------|------|------|
| 排行榜表格（Mock 数据）| T | 用户名 / PnL / 准确率 / 成交量 |
| Volume Incentives 说明卡片 | T | 激励机制概念展示 |
| Liquidity Incentives 说明卡片 | T | 激励机制概念展示 |
| IncentiveTag 在 EventCard/Banner | T | 运营融入主干 |

### 域 10: 平台机制（占位）

| 功能项 | 层级 | 说明 |
|--------|------|------|
| Request to Settle 按钮 | B | RESOLVING 状态可触发 |
| Report Issue 按钮 | B | 主干可见，触发反馈流程 |
| Responsible Trading Hub | L | 概念展示 |
