# UX 规范 — 唯一权威规则书（V2）

> 本文档是所有设计原则和契约的**单一真相源**。不定义具体功能细节；细节由 Cursor 提案，用户裁决。

---

## 1. 北极星：最短用户路径树（Shortest-Path Tree）

### 1.1 目标
让用户的主要流程操作都能用最简单直接的方式完成：
- 步骤短（少操作）
- 认知负担低（少选择、少解释、少记忆）
- 上下文切换少（尽量不跳来跳去）
- 但不平铺（避免信息爆炸）

### 1.2 结构
- **主干（Trunk）**：Explore → EventDetail → Trade（用户可在 3 步内完成交易）
- **分叉（Branches）**：只在意图信号出现时展开（高级交易/规则详情/争议面板等）
- **叶子（Leaves）**：深层细节（完整规则文本/订单簿深度/结算证据等）

> 渐进披露（Progressive Disclosure）：CLOB 高级交易、完整规则、争议详情等推迟到二级界面。

---

## 2. 信息架构：Event-Centric

V2 的核心转变：从 Market（单个合约）到 Event（事件容器）。

```
PredictionEvent
├── type: standard | multi-option | sports
├── outcomeModel: independent | mutually-exclusive
├── RulesSummary (三要素: 测量对象 / 截止方式 / 结算来源)
├── Timeline & Payout
├── Contract[] (多个合约/strike)
│   ├── probability (%) + USDC price
│   └── Yes/No → TradePanel
└── StatusInfo (状态 + 子状态 + 操作)
```

### 关键语义
- **independent**（时间 strike）：多个合约可以同时为 YES（如"Q1前降息"和"H1前降息"）
- **mutually-exclusive**（多选项）：恰好一个合约为 YES（如"Film A/B/C 谁获奖"）

---

## 3. 意图信号（触发分叉的唯一理由）

除非出现意图信号，不允许把高级内容直接放在主干里。

典型意图信号类别：
- **点击合约行 Yes/No**：表达"我要交易这个合约"→ 唤起 TradePanel
- **点击图表图标**：表达"我要看盘口/深度"→ 进入 ContractDetailPage（CLOB 分叉）
- **点击"查看完整规则"**：表达"我要补充信息"→ 展开 Drawer
- **点击 StatusBanner 操作按钮**：表达"我要处理异常"→ 展开 DisputePanel/RefundBanner
- **点击 Sports 分类/Banner**：表达"我要看体育"→ 跳转 SportsPage

---

## 4. 主干与分叉的"短进短出"规则

### 4.1 主干规则（交易优先）
- 主干 3 步完成交易：Explore → EventDetail → Trade
- EventDetail 布局：**Contracts 前置**（合约表 + TradePanel），RulesSummary / Timeline / EventSummary 后置在"Market Context"区域
- TradePanel 始终显示 Payout 说明："赢 = 1 USDC/份，输 = 0 USDC/份"

### 4.2 分叉规则
- CLOB 高级交易是分叉（从合约行图表图标进入）
- 完整规则文本是分叉（从 RulesSummaryCard "查看完整规则"进入）
- 争议/退款详情是分叉（从 StatusBanner 操作按钮进入）

---

## 5. 导航

三个一级 Tab：`Explore | Portfolio | Leaderboard`

- Sports 是二级入口（Explore 的分类 Tab + Featured 运营位），点击后进入独立 Sports UI。
- Parlay 串关通过全局浮动 Slip 入口使用（购物车模式），无独立 Tab。用户可在 EventDetail/SportsGame 的合约行点击"+"添加到 Parlay Slip。

---

## 6. 价格与结算

- **全站锁定 USDC** 作为唯一结算单位
- 价格展示：概率 % 为主 + USDC 标注费用/PNL/Payout
- 合约定价：yesPrice + noPrice，以 USDC 小数（0.01–0.99）
- Payout：赢 = 1 USDC/份，输 = 0 USDC/份
- Yes% + No% ≈ 100%（差值为 bid-ask spread）

---

## 7. TradePanel 一致性约束

TradePanel 是单一组件，在桌面（固定右侧面板）和移动（BottomSheet）中使用**同一实例**：
1. **自解释**：始终显示 "Trading: [事件名] — [合约名]"
2. **Quick Buy 文案**："立即成交（按当前最优价格）"
3. **Limit Order 文案**："自定价格挂单（CLOB）"
4. **Payout 说明**：始终可见 "赢 = 1 USDC/份 · 输 = 0 USDC/份"
5. Explore 卡片 Yes/No 和 EventDetail 合约行 Yes/No 唤起的 BottomSheet 完全相同

---

## 8. 异常场景处理

### 8.1 事件状态机（父子结构）
- **EventStatus**: OPEN / CLOSED / RESOLVING / SETTLED / CANCELLED / VOIDED
- **EventSubStatus**: normal / paused / disputed / delayed / emergency

### 8.2 操作矩阵

| 状态+子状态 | 可下单 | 可撤单 | 可申诉 | 可请求结算 |
|---|---|---|---|---|
| OPEN normal | 是 | 是 | 否 | 否 |
| OPEN paused | 否 | 否 | 否 | 否 |
| RESOLVING normal | 否 | 否 | 否 | 是 |
| RESOLVING disputed | 否 | 否 | 是(证据) | 否 |
| SETTLED normal | 否 | 否 | 是(申诉) | 否 |
| CANCELLED / VOIDED | 否 | 否 | 否 | 否 |

---

## 9. 四类核心契约

### 9.1 交互契约 `[原型必须展示]`
- **立即反馈**：每个操作有即时反馈
- **最终反馈**：每次操作落到明确结果状态
- **失败可修复**：失败给 reason + CTA 按钮

### 9.2 状态契约 `[原型必须展示]`
- 订单状态机：Pending → Open → Filled/Cancelled/Rejected
- 事件状态机：6 态 + 5 子状态（V2 扩展）
- 状态以 Zustand store 为单一真相源

### 9.3 数据流契约
- 盘口 snapshot/delta 叙事（CLOB 分叉中展示）
- Quick Order = marketable limit（对齐 Polymarket）

### 9.4 自解释契约 `[原型必须展示]`
- RulesSummary 三要素前置
- TradePanel 自解释（事件名+合约名+Payout说明）
- 异常状态 StatusBanner 含操作按钮
- 互斥事件有 OutcomeModelHint

---

## 10. 验收自检清单

每次迭代必须回答：
- [ ] Explore → EventDetail → Trade 主干是否 3 步可达？
- [ ] EventDetail 布局是否"交易优先"（Contracts 前置，Rules/Timeline/Summary 后置）？
- [ ] TradePanel 桌面/移动一致？自解释？Payout 说明可见？
- [ ] CLOB 只在分叉中出现？可发现但不抢主干？
- [ ] 异常状态 Banner 正确显示？操作按钮全部可用（含 appeal/view_refund/request_settle/report_issue）？
- [ ] Parlay Slip 可从 EventDetail/SportsGame 添加 leg，浮动购物车可用？
- [ ] 全站 USDC 无 ¢ 残留？
- [ ] 所有可点击元素触控区 >= 44x44px？
