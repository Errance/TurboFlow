# MVP 分支上下文（给新 Agent 的交接文档）

> **分支**：`mvp`（从 main a595c1a 切出）  
> **日期**：2026-02-22  
> **目标**：在全量版本基础上做减法，只保留最基本、简单、直接的预测市场功能

---

## 一、当前代码库状态

- 仓库：`/Users/errance/TurboFlow`
- 当前分支：`mvp`
- 全量存档在 `main`（V4.2，含 Strategy Basket + Trench + 所有 V4 功能）
- 技术栈：React + TypeScript + Zustand + Tailwind CSS + Vite
- 构建正常：`tsc --noEmit` 和 `vite build` 均通过

---

## 二、MVP 功能边界（用户已裁决）

### 保留（不动）

| 功能 | 说明 |
|------|------|
| 核心交易主干 | Explore 事件列表 -> EventDetail -> TradePanel (Quick Buy / Limit) |
| Live 即时市场 | 5 分钟价格预测，10 个 instant market |
| Sports 独立 UI | SportsGamePage、Moneyline/Spread/Total 投注线 |
| CLOB 高级交易 | ContractDetailPage、Orderbook、盘口点击填价 |
| 异常处理完整状态机 | StatusBanner + DisputePanel + RefundBanner + RequestSettlePanel + Appeal |
| 走势图 | EventDetail 概率图 + ContractDetail 价格图 |

### 砍掉

| 功能 | 涉及文件 |
|------|----------|
| Forecast 观点卡片 | `src/stores/forecastStore.ts`、TradeConfirmModal 中的 forecast 流程、ShareButton |
| 分享系统 | `src/components/ShareButton.tsx`、TradeConfirmModal 中的分享视图（Copy Text / Save Image / Share to X / QR） |
| Trench 战壕讨论 | strategyStore 中的 trenchMessages 相关、StrategyDetailPage 中的 Trench 区块 |

### 简化

| 功能 | 保留 | 砍掉 |
|------|------|------|
| Portfolio | Positions, Open Orders, Activity, Trade History | My Forecasts tab, Copied Strategies tab |
| Leaderboard | Rankings 排行榜表格 | Top Forecasters tab, Following tab, Follow 系统 |
| 事件摘要 | Summary + Key Points | Hedge Ideas, 对冲建议系统（TradeConfirmModal 中的 hedge suggestions、Portfolio 的 hedge toast、EventDetail 的 Hedge Ideas） |
| TradeConfirmModal | 交易回执（Side/Price/Shares/Profit）+ Done 按钮 | Generate Forecast Card、分享视图、对冲建议 |

### 替换：Strategy Basket -> Parlay 串关

**不是砍掉 Strategy Basket，而是换形态。**

Codex 做的 Strategy Basket 体系（thesis / trench 讨论 / 复制调权 / driver event）过于复杂。MVP 中替换为 **Parlay 串关**：

- **核心功能**：用户勾选多个事件的结果，组合为一个篮子，一次性下注
- **可分享**：下注后可以分享给别人看（但别人不能复制/调权）
- **场景举例**：世界杯 8 强赛，用户一次性预测 8 场比赛的胜负，组合成一个 parlay
- **无 thesis、无 trench、无复制调权**
- **入口**：待讨论（购物车模式 vs 专门页面 vs 两者兼有）

涉及的 Codex 文件（全部需要重写或删除）：
- `src/pages/StrategiesPage.tsx`
- `src/pages/StrategyDetailPage.tsx`
- `src/pages/CreateStrategyPage.tsx`
- `src/stores/strategyStore.ts`
- `src/lib/strategyMath.ts`
- `src/types/index.ts` 中的 Strategy 相关类型
- `src/layouts/AppShell.tsx` 中 Strategies 导航入口
- `src/App.tsx` 中 3 条 Strategy 路由
- `src/pages/EventDetailPage.tsx` 中 RelatedStrategiesSection

Codex 代码中 **可能部分可参考** 的：
- `buildBasketId` 概念（篮子身份签名）
- `strategyMath.ts` 中的估值计算逻辑

---

## 三、已知的前端闭环问题（A 类，需要修复）

这些问题在全量版本中就存在，MVP 中如果保留了对应功能就需要修复。

### 数据链路断裂

| # | 问题 | 文件 | MVP 是否需修 |
|---|------|------|-------------|
| 1 | executeTrade 不写入 portfolioStore | TradePanel.tsx / portfolioStore.ts | 是 |
| 2 | Portfolio "View Contract" 用 marketId 跳到 404 | PortfolioPage.tsx | 是 |
| 3 | Cancel 订单后 CTA 用 marketId 跳到 404 | PortfolioPage.tsx | 是 |
| 4 | handleHedge 跳到 event.contracts[0] | TradePanel.tsx | 砍掉对冲后不适用 |

### 交互行为不一致

| # | 问题 | 文件 | MVP 是否需修 |
|---|------|------|-------------|
| 5 | Live/Sports 桌面端 Yes/No 先 openTradePanel 再 navigate | InstantMarketCard.tsx | 是 |
| 6 | InstantMarketCard 卡片主体不可点击 | InstantMarketCard.tsx | 是 |
| 7 | SportsGamePage "Back to Sports" 跳到 All | SportsGamePage.tsx | 是 |
| 8 | LimitOrderPanel Est. payout 显示 shares 而非 payout | LimitOrderPanel.tsx | 是 |

### 死按钮

| # | 问题 | 文件 | MVP 是否需修 |
|---|------|------|-------------|
| 9 | RulesSummaryCard "View Full Rules" | EventDetailPage.tsx | 是 |
| 10 | RefundBanner "View Refund Details" | RefundBanner.tsx | 是 |
| 11 | SportsGamePage "View Refund" | SportsGamePage.tsx | 是 |
| 12 | DisputePanel "Submit Evidence" | DisputePanel.tsx | 是（demo mock 状态翻转） |
| 13 | StatusBanner `appeal` 按钮 | EventDetailPage.tsx | 是（demo mock 表单） |
| 14 | StatusBanner `view_refund` 按钮 | EventDetailPage.tsx | 是 |
| 15 | StatusBanner `request_settle` / `report_issue` | EventDetailPage.tsx | 是 |

---

## 四、规范文档（需遵守）

- `.cursor/rules/prototype.md` — Gate A/B 交互规则
- `docs/UX-spec.md` — 设计规范（注意：布局决策已改为"交易优先"，UX-spec 待更新）
- `docs/Demo-script.md` — 演示脚本（待更新以匹配 MVP）
- `docs/Capability-Inventory.md` — 能力覆盖矩阵

### UX-spec 待更新项

- 4.1 节：改为"交易优先——Contracts 前置，RulesSummary/Timeline 后置"
- 5 节：导航结构待定（Parlay 是否需要独立 Tab）
- 10 节验收清单：对应更新

---

## 五、MVP 执行要点

1. **先做减法**：删除 Strategy/Forecast/Share 相关代码和路由，确保编译通过
2. **修复 A 类问题**：在保留的功能上修复闭环
3. **EventDetailPage 交易优先布局**：Contracts 前置，Rules/Timeline/Summary 后置
4. **实现 Parlay 串关**：替代 Strategy Basket，核心是"多选 + 组合 + 下注 + 分享"
5. **更新文档**：UX-spec、Demo-script 同步 MVP 范围
6. **回归验证**：按 Demo-script 跑通所有保留功能的链路
