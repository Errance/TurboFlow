# Demo 演示脚本（V4 — Differentiated Prediction Market）

> **定位说明**：本文档为回归参考和演示备忘，不作为行为准则。实现决策以用户裁决为准，本文档随之同步。

> 每次改动后都能按脚本跑通，确保主干路径没有变长、没有变乱、没有变得不可解释。

## 演示目标（5 分钟）
- 让观众理解：这是一个 **Event-centric 预测市场**，用 USDC 统一结算
- 看到信息架构：Event → Contracts → Trade（渐进披露）
- 看到预测市场核心：Rules Summary（What/When/How）/ Timeline & Payout / 概率 % + USDC
- 看到差异化能力：事件摘要 / 观点卡片 / 分享流程 / 对冲建议
- 看到 Live 即时预测市场（5 分钟价格预测）
- 看到 Sports 独立 UI、CLOB 高级交易作为深层分叉
- 看到异常场景处理：争议/取消/暂停的状态 Banner + Request Settlement
- Quick Buy = marketable limit order（对齐 Polymarket 语义）

---

## 1) 标准预测市场主干（桌面）

1. 打开 Explore 首页（`/`）
2. 看到多区块运营首页：Featured Banner / Live 精选条 / 分类精选
3. 看到分类 Tab（All / Politics / Economics / Crypto / Sports / Tech / Culture / Live）
4. Live Tab 带红色脉冲圆点
5. 看到事件卡片：标题 + 状态 Badge + 内嵌合约行 + Yes/No 概率按钮 + 成交量(USDC)
6. 点击一张事件卡片 → 进入 **EventDetailPage**
7. 看到 **RulesSummaryCard**（What/When/How 结构化 + SVG 图标）
8. 看到 **TimelinePayoutCard**（Open/Close 时间线 + "赢=1 USDC/份, 输=0"）
9. 看到 **事件摘要**（Summary + Key Points）— 帮助用户快速理解事件
10. 看到互斥事件的 **OutcomeModelHint**（"这些合约互斥..."）
11. 看到合约行表格：label / 概率% / 24h变化 / 成交量 / Yes/No 按钮 / 图表图标
12. 点合约行 Yes 按钮 → 右侧 TradePanel 切换到该合约
13. TradePanel 显示：事件名 + 合约名（自解释）+ Yes/No 切换 + Quick Buy/Limit 说明
14. Quick Buy 即 marketable limit order（按当前最优价格撮合）
15. 输入金额 → 看到估算（份数/均价/潜在收益/Payout说明）→ 确认
16. 详情页成交后弹出 Modal：成交回执 + 对冲建议 + 生成观点卡片入口
17. 列表页快速交易后仅展示 Toast 通知（不打断浏览流）

---

## 2) 移动端主干

1. 在 Explore 首页点事件卡片的 Yes 按钮 → BottomSheet 弹出
2. BottomSheet 与桌面 TradePanel 完全一致（同一组件不同容器）
3. 显示"您正在交易：[事件名] — [合约名]"

---

## 3) Live 即时预测（差异化）

1. 点击 Live Tab → 看到即时价格预测市场
2. 左侧栏按 Asset Class（Crypto / Stocks / Commodities / Forex）和 Status 过滤
3. 每张卡片：进度条 + 实时倒计时 + 资产当前价 + Strike 线 + 概率条 + Yes/No 按钮
4. 点击 Yes/No → 进入事件详情交易
5. 市场过期后自动标记 Closed

---

## 4) Sports 独立 UI

1. 从 Explore 点 Sports 分类 Tab → 侧边栏 + 卡片列表布局
2. 看到运动分类过滤（All / Basketball / Tennis 等）
3. 看到比赛卡片：队名(战绩) vs 队名(战绩) + Moneyline/Spread/Total 概率
4. 点击比赛卡片 → 进入 SportsGamePage
5. 看到对阵头部 + 投注线列表 + 右侧 TradePanel（桌面）/ BottomSheet（移动）
6. Rules & Settlement 折叠展开

---

## 5) CLOB 高级交易（分叉 — Advanced Trading）

1. 在 EventDetailPage 的合约行右侧点图表小图标 → 进入 `/contract/:id`
2. 看到事件归属头部（可点击返回事件详情）+ 合约名 + 当前概率
3. 看到 "Advanced Trading" Badge
4. 看到 Orderbook（盘口delta在"活"着）+ PriceChart
5. 可使用 Quick Order / Limit Order
6. 点盘口价位 → 自动填入 Limit Order 价格

---

## 6) 异常场景演示

1. 找到 "US Airstrike on Iran" 事件（RESOLVING + disputed）
   - 看到红色 StatusBanner："Settlement Disputed" + 原因
   - 点 "View Dispute" → SideDrawer 打开 DisputePanel
   - 看到争议时间线 + 双方论据 + "Submit Evidence" 按钮
2. 找到 "Lakers vs Celtics" 事件（CANCELLED）
   - 看到灰色 StatusBanner + RefundBanner（退款信息）
3. 找到 "Ethereum ETF" 事件（OPEN + paused）
   - 看到黄色 StatusBanner："Trading Paused" + 原因
   - Yes/No 按钮显示为 disabled
4. 找到一个 CLOSED 或 RESOLVING 状态事件
   - 看到 **RequestSettlePanel**：可切换"Request Settlement"或"Report Issue"
   - 填写说明并提交 → 看到提交成功确认

---

## 7) 观点卡片与分享（差异化）

1. 在 EventDetailPage 成交后弹出 Modal
2. 点"生成观点卡片" → 输入观点文字 → 生成带预测信息的 Forecast Card
3. 进入分享视图：看到卡片预览 + QR 占位 + 分享按钮（复制文本 / 保存图片 / 分享到 X）
4. "复制文本"按钮使用 navigator.clipboard 真实复制
5. 其余分享按钮为 mock（Toast 提示）
6. 事件详情标题区域有 ShareButton 快捷入口
7. Live 即时市场卡片列表也有 ShareButton 入口

---

## 8) Portfolio & Leaderboard

1. 切换到 Portfolio tab → 看到持仓（USDC 计价）/ Open Orders / Activity / Trade History / My Forecasts
2. My Forecasts tab 展示用户生成的观点卡片列表
3. 持仓卡片内显示对冲建议（Toast 提示入口）
4. 切换到 Leaderboard tab → 看到排行榜 + Volume/Liquidity Incentives 卡片

---

## 回归清单（每次改动必须勾选）

### A) 主干/分叉结构
- [ ] Explore → EventDetail → Trade 主干路径畅通
- [ ] Sports 从 Explore 的分类 Tab 可到达
- [ ] Live Tab 可到达即时预测市场
- [ ] CLOB 高级交易只在合约行图表图标点击后才展开
- [ ] 分叉短进短出回主干，上下文保留

### B) 预测市场信息完整
- [ ] RulesSummaryCard 显示 What/When/How 结构化（SVG 图标）
- [ ] TimelinePayoutCard 显示时间线 + "赢=1 USDC, 输=0"
- [ ] 互斥事件有 OutcomeModelHint
- [ ] 全站价格统一 USDC（无旧计价残留）
- [ ] 全站无 emoji（Live tab 红色脉冲圆点除外）

### C) 交互反馈
- [ ] TradePanel 自解释（显示事件名+合约名）
- [ ] Quick Buy = marketable limit（有文案说明）
- [ ] 详情页成交 → Modal 确认（含对冲建议 + 观点卡片入口）
- [ ] 列表页成交 → Toast 通知（不打断浏览）
- [ ] 异常状态 StatusBanner 正确显示 + 操作按钮可用
- [ ] CLOSED/RESOLVING 状态可见 RequestSettlePanel
- [ ] DisputePanel / RefundBanner 可从 StatusBanner 打开

### D) 差异化功能
- [ ] 事件摘要（Summary + Key Points）在详情页可见
- [ ] 观点卡片生成 + 分享视图完整
- [ ] ShareButton 在事件详情和 Live 卡片可用
- [ ] "复制文本"真实可用（navigator.clipboard）
- [ ] Portfolio My Forecasts tab 可见

### E) 桌面端 + 移动端
- [ ] TradePanel 桌面固定右侧 / 移动 BottomSheet 完全一致
- [ ] 所有可点击元素触控区 >= 44x44px
- [ ] 移动端分类 Tab 可横向滚动
