# Demo 演示脚本（V2 — Event-based Prediction Market）

> 每次改动后都能按脚本跑通，确保主干路径没有变长、没有变乱、没有变得不可解释。

## 演示目标（5 分钟）
- 让观众理解：这是一个 **Event-centric 预测市场**，用 USDC 统一结算
- 看到信息架构：Event → Contracts → Trade（渐进披露）
- 看到预测市场核心：Rules Summary / Timeline & Payout / 概率 % + USDC
- 看到独立 Sports UI、CLOB 高级交易作为深层分叉
- 看到异常场景处理：争议/取消/暂停的状态Banner和用户操作

---

## 1) 标准预测市场主干（桌面）

1. 打开 Explore 首页（`/`）
2. 看到 Featured Banner（热点事件 + 激励标签）
3. 看到 Sports 运营位 Banner（点击可进入 Sports 页）
4. 看到分类 Tab（All / Politics / Economics / Crypto / Sports → / Tech / Culture）
5. 看到事件卡片：标题 + 状态 Badge + 内嵌合约行 + Yes/No 概率按钮 + 成交量(USDC)
6. 点击一张事件卡片 → 进入 **EventDetailPage**
7. 看到 **RulesSummaryCard**（三要素：测量对象 / 截止方式 / 结算来源）
8. 看到 **TimelinePayoutCard**（Open/Close 时间线 + "赢=1 USDC/份, 输=0"）
9. 看到互斥事件的 **OutcomeModelHint**（"这些合约互斥..."）
10. 看到合约行表格：label / 概率% / 24h变化 / 成交量 / Yes/No 按钮 / 图表图标
11. 点合约行 Yes 按钮 → 右侧 TradePanel 切换到该合约
12. TradePanel 显示：事件名 + 合约名（自解释）+ Yes/No 切换 + Quick Buy/Limit 说明
13. 输入金额 → 看到估算（份数/均价/潜在收益/Payout说明）→ 确认

---

## 2) 移动端主干

1. 在 Explore 首页点事件卡片的 Yes 按钮 → BottomSheet 弹出
2. BottomSheet 与桌面 TradePanel 完全一致（同一组件不同容器）
3. 显示"您正在交易：[事件名] — [合约名]"

---

## 3) Sports 独立 UI

1. 从 Explore 点 Sports 分类 Tab 或 Sports 运营位 Banner → 进入 `/sports`
2. 看到 Upcoming / Live / Results tabs
3. 看到运动分类过滤（All / Basketball / Tennis 等）
4. 看到比赛卡片：队名(战绩) vs 队名(战绩) + Moneyline/Spread/Total 概率
5. 点击比赛卡片 → 进入 SportsGamePage
6. 看到对阵头部 + 投注线列表 + 右侧 TradePanel（桌面）/ BottomSheet（移动）
7. Rules & Settlement 折叠展开

---

## 4) CLOB 高级交易（分叉 — Advanced Trading）

1. 在 EventDetailPage 的合约行右侧点图表小图标 → 进入 `/contract/:id`
2. 看到事件归属头部（可点击返回事件详情）+ 合约名 + 当前概率
3. 看到 "Advanced Trading" Badge
4. 看到 Orderbook（盘口delta在"活"着）+ PriceChart
5. 可使用 Quick Order / Limit Order
6. 点盘口价位 → 自动填入 Limit Order 价格

---

## 5) 异常场景演示

1. 找到 "US Airstrike on Iran" 事件（RESOLVING + disputed）
   - 看到红色 StatusBanner："Settlement Disputed" + 原因
   - 点 "View Dispute" → SideDrawer 打开 DisputePanel
   - 看到争议时间线 + 双方论据 + "Submit Evidence" 按钮
2. 找到 "Lakers vs Celtics" 事件（CANCELLED）
   - 看到灰色 StatusBanner + RefundBanner（退款信息）
3. 找到 "Ethereum ETF" 事件（OPEN + paused）
   - 看到黄色 StatusBanner："Trading Paused" + 原因
   - Yes/No 按钮显示为 disabled

---

## 6) Portfolio & Leaderboard

1. 切换到 Portfolio tab → 看到持仓（USDC 计价）/ Open Orders / Activity / Trade History
2. 切换到 Leaderboard tab → 看到排行榜 + Volume/Liquidity Incentives 卡片

---

## 回归清单（每次改动必须勾选）

### A) 主干/分叉结构
- [ ] Explore → EventDetail → Trade 主干路径畅通
- [ ] Sports 从 Explore 的分类 Tab 或 Banner 可到达
- [ ] CLOB 高级交易只在合约行图表图标点击后才展开
- [ ] 分叉短进短出回主干，上下文保留

### B) 预测市场信息完整
- [ ] RulesSummaryCard 显示三要素（测量/截止/来源）
- [ ] TimelinePayoutCard 显示时间线 + "赢=1 USDC, 输=0"
- [ ] 互斥事件有 OutcomeModelHint
- [ ] 全站价格统一 USDC（无 ¢ 残留）

### C) 交互反馈
- [ ] TradePanel 自解释（显示事件名+合约名）
- [ ] Quick Buy / Limit Order 有文案解释
- [ ] 异常状态 StatusBanner 正确显示 + 操作按钮可用
- [ ] DisputePanel / RefundBanner 可从 StatusBanner 打开

### D) 桌面端 + 移动端
- [ ] TradePanel 桌面固定右侧 / 移动 BottomSheet 完全一致
- [ ] 所有可点击元素触控区 >= 44x44px
- [ ] 移动端分类 Tab 可横向滚动
