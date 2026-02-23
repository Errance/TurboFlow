# Demo 演示脚本（MVP — Prediction Market）

> **定位说明**：本文档为回归参考和演示备忘，不作为行为准则。实现决策以用户裁决为准，本文档随之同步。

> 每次改动后都能按脚本跑通，确保主干路径没有变长、没有变乱、没有变得不可解释。

## 演示目标（5 分钟）
- 让观众理解：这是一个 **Event-centric 预测市场**，用 USDC 统一结算
- 看到信息架构：Event → Contracts → Trade（渐进披露，交易优先布局）
- 看到预测市场核心：Rules Summary（What/When/How）/ Timeline & Payout / 概率 % + USDC
- 看到 **Parlay 串关**：多事件组合下注
- 看到 Live 即时预测市场（5 分钟价格预测）
- 看到 Sports 独立 UI、CLOB 高级交易作为深层分叉
- 看到异常场景处理：争议/取消/暂停的状态 Banner + Request Settlement + Appeal
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
16. 详情页成交后弹出 Modal：成交回执 + Buy More / Done 双按钮
17. 列表页快速交易后仅展示 Toast 通知（不打断浏览流）
18. 合约行右侧有"+"按钮可添加到 Parlay 串关（弹出方向 Popover 选择 YES/NO）
19. 已在串关中的合约行左侧显示绿色竖线标记
20. TradePanel 市场价格旁显示 24h 变化百分比

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

## 7) Parlay 串关（差异化）

1. 在 EventDetail 或 SportsGame 页面，点击合约行右侧"+"按钮 → 弹出方向选择 Popover（YES/NO + 概率 + 价格）
2. 选择方向后 → Toast 反馈 "Added to Parlay: [合约名] YES (N legs)"
3. 已在串关中的合约行左侧显示绿色竖线标记，"+"按钮变为勾号
4. 底部出现 **Persistent Parlay Bar**：显示 leg 数量 + 组合赔率 + "View Slip"
   - 移动端：Bar 固定在 Tab Bar 上方，全宽
   - 桌面端：Bar 固定在右下角，卡片式
5. 点击 Bar → 展开 Parlay Panel → 看到已选 leg 列表（事件名 + 合约名 + YES/NO + 价格）
6. 可删除单个 leg，可清空全部
7. 输入 stake 金额（快捷金额按钮 $10/$25/$50/$100，增大触控区）→ 看到组合赔率 + 潜在收益
8. 点击 "Place Parlay" → 下注成功 Toast + 写入 parlayStore + portfolioStore
9. 至少需要 2 个 leg 才能下注

---

## 8) Portfolio & Leaderboard

1. 切换到 Portfolio tab → 看到持仓（USDC 计价）/ Open Orders / **Parlays** / Activity / Trade History
2. 交易完成后 Portfolio 自动更新（executeTrade 写入 portfolioStore）
3. Parlays Tab 展示已下注的串关列表（状态 Badge + leg 数 + stake + 潜在收益），可展开查看 leg 明细
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
- [ ] TradePanel 市场价格旁显示 24h 变化（正/负色区分）
- [ ] Quick Buy = marketable limit（有文案说明）
- [ ] 详情页成交 → Modal 确认（成交回执 + **Buy More** + Done 双按钮）
- [ ] Buy More 点击后关闭 Modal 回到空白 TradePanel 继续交易
- [ ] 列表页成交 → Toast 通知（不打断浏览）
- [ ] 成交后 portfolioStore 自动写入持仓和交易记录
- [ ] 异常状态 StatusBanner 正确显示 + 所有操作按钮可用（appeal/view_refund/request_settle/report_issue）
- [ ] CLOSED/RESOLVING 状态可见 RequestSettlePanel
- [ ] DisputePanel / RefundBanner 可从 StatusBanner 打开
- [ ] Submit Evidence 按钮有 mock 表单流程
- [ ] Appeal 按钮打开 mock 申诉抽屉

### D) Parlay 串关
- [ ] EventDetail/SportsGame 合约行有"+"按钮 → 弹出方向 Popover（YES/NO）
- [ ] 添加 leg 后 Toast 反馈（显示合约名 + 方向 + 当前 leg 数）
- [ ] 已在串关中的合约行左侧显示绿色竖线标记
- [ ] 底部显示 **Persistent Parlay Bar**（leg 数量 + 组合赔率 + View Slip）
- [ ] 移动端 Bar 在 Tab Bar 上方，桌面端右下角卡片式
- [ ] 点击 Bar → 展开 Parlay Panel，可收起/清空/删除单个 leg
- [ ] 快捷金额按钮触控区 >= 36px
- [ ] 输入 stake 后显示组合赔率和潜在收益
- [ ] Place Parlay 成功后写入 parlayStore + portfolioStore
- [ ] Portfolio Parlays Tab 显示已下注串关列表，可展开查看 leg 明细

### E) 桌面端 + 移动端
- [ ] TradePanel 桌面固定右侧 / 移动 BottomSheet 完全一致
- [ ] 列表页桌面端 Quick Trade 弹窗可用（不跳转）
- [ ] 所有可点击元素触控区 >= 44x44px
- [ ] 移动端分类 Tab 可横向滚动

### F) 走势图
- [ ] EventDetailPage 显示概率走势图（选中合约 or 首个合约）
- [ ] ContractDetailPage (CLOB) 走势图正常

---

## MVP 已移除功能

以下功能在 MVP 中已移除（全量版本存档在 `main` 分支）：
- Forecast 观点卡片（forecastStore + TradeConfirmModal 中的 forecast 流程）
- 分享系统（ShareButton + 分享视图）
- Strategy Basket（已替换为 Parlay 串关）
- Trench 讨论
- Follow 系统（Top Forecasters / Following tabs）
- 对冲建议（Hedge Ideas / Hedge Suggestions）
- Portfolio My Forecasts tab / Copied Strategies tab
