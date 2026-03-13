# 最短路径树（Shortest-Path Tree）V2

> 以 Event-centric 架构重写。主干路径为 Explore → EventDetail → Trade。

---

## 最新路径树（V2 Current）

### Top Tasks（用户目标型定义）
- Task A: 快速发现感兴趣的事件并下第一笔预测单
- Task B: 了解事件规则/结算依据后再交易
- Task C: 管理持仓和订单、追踪投资组合
- Task D: 在体育赛事上投注
- Task E: 处理异常情况（争议/暂停/取消）

---

### Task A: 快速发现并交易
#### 主干（Trunk）
- Step 1: Explore 首页 → 浏览事件卡片或 FeaturedBanner
- Step 2: 点击事件卡片或直接点 Yes/No 按钮
- Step 3a (桌面): 进入 EventDetailPage → 右侧 TradePanel → 输入金额 → 确认
- Step 3b (移动): BottomSheet 弹出 → 输入金额 → 确认
- Step 3c (快捷): 在 Explore 卡片上直接点 Yes/No → BottomSheet(移动) / 跳转EventDetail(桌面)

#### 分叉（Branches）
- Branch A1: CLOB 高级交易
  - 意图信号: 点击合约行图表图标
  - 容器: 全页面 ContractDetailPage
  - 子任务: 查看盘口深度、用限价单精确下单
  - 回主干方式: 点击头部事件名返回 EventDetailPage
  - 自解释线索: "Advanced Trading" badge

#### 叶子（Leaves）
- 完整深度图（盘口可视化）
- 历史成交明细
- DevTools Simulate Reconnect

---

### Task B: 了解规则后交易
#### 主干（Trunk）
- Step 1: Explore → 进入 EventDetailPage
- Step 2: 看到 RulesSummaryCard 三要素（测量对象/截止方式/结算来源）
- Step 3: 看到 TimelinePayoutCard（Open/Close 时间 + "赢=1 USDC/份"）
- Step 4: 看到 OutcomeModelHint（互斥事件）
- Step 5: 选合约 → TradePanel 交易

#### 分叉（Branches）
- Branch B1: 完整规则文本
  - 意图信号: 点击"查看完整规则"
  - 容器: Drawer
  - 回主干方式: 关闭 Drawer

---

### Task C: 管理持仓
#### 主干（Trunk）
- Step 1: 点底部 Portfolio Tab
- Step 2: 查看 Positions（USDC 计价浮盈浮亏）
- Step 3: 查看 Open Orders / Activity / Trade History

#### 分叉（Branches）
- Branch C1: 跳转到具体合约
  - 意图信号: 点击持仓行的"View"按钮
  - 容器: ContractDetailPage
  - 回主干方式: 浏览器返回

---

### Task D: 体育投注
#### 主干（Trunk）
- Step 1: Explore → 点 Sports 分类 Tab 或 Sports Banner
- Step 2: SportsPage → 选运动+状态(Upcoming/Live/Results)
- Step 3: 点比赛卡片 → SportsGamePage
- Step 4: 选投注线(Moneyline/Spread/Total) → TradePanel 交易

#### 分叉（Branches）
- Branch D1: CLOB 高级交易（同 Task A Branch A1）
- Branch D2: Rules & Settlement 展开

---

### Task E: 处理异常
#### 主干（Trunk）
- Step 1: 进入异常事件 → 看到 StatusBanner（颜色编码 + 状态描述）
- Step 2: StatusBanner 显示可用操作按钮

#### 分叉（Branches）
- Branch E1: 争议详情
  - 意图信号: 点击 StatusBanner "View Dispute" 按钮
  - 容器: SideDrawer (DisputePanel)
  - 子任务: 查看争议时间线、提交证据
  - 回主干方式: 关闭 Drawer
- Branch E2: 退款信息
  - 触发: CANCELLED/VOIDED 事件自动显示 RefundBanner
  - 内容: 退款原因 + 依据 + 状态

---

## 历史决策归档

### Round 0 — 范围与契约冻结
**状态**：V1 原型完成，文档体系建立。
**已确认**：Vite + React + TS + Tailwind + Zustand + React Router

### Round 1 — V2 Event-Centric 改版
**状态**：全部 P0-P2 完成，P3 文档更新中。

**已确认的重大决策**：
- 从 Market-centric 转为 Event-centric 信息架构
- 导航精简为 3 Tab（Explore | Portfolio | Leaderboard）
- Sports 降为 Explore 二级入口，但保留独立 UI（SportsPage + SportsGamePage）
- CLOB 高级交易作为深层分叉，从合约行图表图标进入
- 全站锁定 USDC 为唯一结算单位
- 概率 % 为主要展示，USDC 标注费用/PNL
- RulesSummary + TimelinePayout 前置到 EventDetail 主干
- OutcomeModel 语义区分（independent / mutually-exclusive）
- 异常场景扩展至 6 父状态 + 5 子状态
- TradePanel 单一组件两种容器（桌面/移动完全一致）
- IncentiveTag 融入 EventCard 和 FeaturedBanner
