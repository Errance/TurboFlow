# Strategy Basket 重做 + 全原型闭环修复

> **规模判定：Large** | Gate A 提案已通过用户裁决  
> **日期**：2026-02-22  
> **分支**：`feature/strategy-and-audit-fix`（从 main 02c1d52 切出）

---

## 关键决策记录

| 决策 | 结论 |
|------|------|
| EventDetailPage 布局 | 交易优先（Contracts 前置，Rules/Timeline/Summary 后置为 Market Context），同步更新 UX-spec |
| 导航结构 | Strategies 作为第 4 个一级 Tab（Explore / Strategies / Portfolio / Leaderboard） |
| Strategy 代码复用 | types + store + math 从 Codex 搬运可用，页面全部重做 |
| Forecast 功能 | 降级为持仓分享，移除独立 forecastStore，更新 Demo-script |
| Git 策略 | stash 冻结 codex 改动，main 上新分支重做 |
| My Forecasts | 移除独立 tab，合并到 Trade History 或替换为持仓分享 |

---

## 前端闭环审计结论

### A 类：纯前端必须完成（18 项）

**数据链路断裂**

| # | 问题 | 文件 |
|---|------|------|
| 1 | executeTrade 不写入 portfolioStore | TradePanel.tsx / portfolioStore.ts |
| 2 | Portfolio "View Contract" 用 marketId 跳到 404 | PortfolioPage.tsx |
| 3 | Cancel 订单后 CTA 用 marketId 跳到 404 | PortfolioPage.tsx |
| 4 | handleHedge 所有 hint 都跳到 event.contracts[0] | TradePanel.tsx |

**交互行为不一致**

| # | 问题 | 文件 |
|---|------|------|
| 5 | Live/Sports 桌面端 Yes/No 先 openTradePanel 再 navigate | InstantMarketCard.tsx / EventsPage.tsx |
| 6 | InstantMarketCard 卡片主体不可点击 | InstantMarketCard.tsx |
| 7 | SportsGamePage "Back to Sports" 跳到 All 视图 | SportsGamePage.tsx |
| 8 | StrategiesPage 复制策略后无引导 | StrategiesPage.tsx |
| 9 | StrategyDetail Basket Leg 行不可点击 | StrategyDetailPage.tsx |
| 10 | LimitOrderPanel Est. payout 显示 shares 而非 payout | LimitOrderPanel.tsx |

**死按钮**

| # | 问题 | 文件 |
|---|------|------|
| 11 | RulesSummaryCard "View Full Rules" | EventDetailPage.tsx |
| 12 | RefundBanner "View Refund Details" | RefundBanner.tsx |
| 13 | SportsGamePage "View Refund" | SportsGamePage.tsx |
| 14 | DisputePanel "Submit Evidence" | DisputePanel.tsx |
| 15 | StatusBanner `appeal` 按钮 | EventDetailPage.tsx |
| 16 | StatusBanner `view_refund` 按钮 | EventDetailPage.tsx |
| 17 | StatusBanner `request_settle` / `report_issue` 按钮 | EventDetailPage.tsx |

**状态闭环**

| # | 问题 | 文件 |
|---|------|------|
| 18 | Trench Votes 只读无交互 | StrategyDetailPage.tsx / strategyStore.ts |

### C 类：做 demo mock 提升展示效果（仅做 3 项）

| # | 功能 | 做法 |
|---|------|------|
| 5 | Appeal 流程 | 简单表单 + 提交后状态翻转 |
| 6 | Submit Evidence | 点击后模拟上传 UI + 状态翻转 |
| 7 | executeTrade -> Portfolio | 已在 A 类第 1 项覆盖 |

### D 类：不做（6 项）

实时价格推送、真实撮合、用户认证、Leaderboard 真实数据、Follow 内容推送、链上结算。

---

## 执行计划

### Phase 0: Git 准备

- `git stash` 保存 codex 分支 working tree
- `git branch codex-backup` 保留引用
- `git checkout main`
- `git checkout -b feature/strategy-and-audit-fix`
- 参考 Codex 代码：`git stash show -p`

### Phase 1: 数据链路断裂修复（A 类最高优先级）

#### 1.1 executeTrade 写入 portfolioStore

- 文件：`src/components/TradePanel.tsx`、`src/stores/portfolioStore.ts`
- `portfolioStore` 新增 `addPosition` / `addTrade` action
- `executeTrade` 内调用写入（list + detail context 都要写入）
- 如果持仓已存在同合约同方向，合并（更新 avgPrice 和 quantity）

#### 1.2 Portfolio marketId vs contractId 修复

- 文件：`src/pages/PortfolioPage.tsx`、`src/data/events.ts`
- "View Contract"：从 marketId 反查到第一个 contractId
- Cancel 订单 CTA route 同理
- 在 events.ts 中添加 `getFirstContractIdByMarketId()` 辅助函数

#### 1.3 handleHedge 跳转到正确合约

- 文件：`src/components/TradePanel.tsx`
- `handleHedge(hint)` 使用 hint 的 asset/label 信息匹配目标合约
- fallback：如果匹配不到，toast 提示而非跳转到错误合约

### Phase 2: 交互行为一致性修复（A 类）

#### 2.1 Live/Sports 桌面端快速交易

- 文件：`src/components/InstantMarketCard.tsx`、EventsPage 中 SportsGameCard 部分
- 桌面端 Yes/No：只 `openTradePanel`，不 `navigate`
- 移动端保持不变

#### 2.2 InstantMarketCard 卡片主体可点击

- 文件：`src/components/InstantMarketCard.tsx`
- 外层 div 添加 `onClick` 跳转到 `/event/${event.id}` + cursor-pointer
- Yes/No 按钮 `e.stopPropagation()` 防止冒泡

#### 2.3 SportsGamePage "Back to Sports"

- 文件：`src/pages/SportsGamePage.tsx`
- `navigate('/')` + `setSelectedCategory('Sports')`

#### 2.4 LimitOrderPanel Est. payout 语义

- 文件：`src/components/LimitOrderPanel.tsx`
- 改为 `Est. payout: X.XX USDC`（shares x 1 USDC）

### Phase 3: 死按钮修复 + C 类 Demo Mock

#### 3.1 RulesSummaryCard "View Full Rules"

- 文件：`src/pages/EventDetailPage.tsx`
- 点击打开 SideDrawer 展示完整 `event.rules` 文本

#### 3.2 RefundBanner "View Refund Details"

- 文件：`src/components/RefundBanner.tsx`
- 接受 `onViewDetails` prop，打开弹窗展示 statusInfo 退款明细
- SportsGamePage 同样接入

#### 3.3 StatusBanner 按钮联动

- 文件：`src/pages/EventDetailPage.tsx` 的 `handleStatusAction`
- `appeal`：打开 AppealModal（新组件，简单表单 + 提交后状态翻转）
- `view_refund`：联动 RefundBanner 弹窗
- `request_settle` / `report_issue`：`ref.scrollIntoView()` 滚动到 RequestSettlePanel

#### 3.4 DisputePanel "Submit Evidence"（C 类）

- 文件：`src/components/DisputePanel.tsx`
- 添加 onClick：简易上传 UI mock -> 提交后翻转为"证据已提交"

#### 3.5 AppealModal（C 类）

- 新组件：简单表单（原因选择 + 文字描述）
- 提交后本地状态翻转为"已申诉"

### Phase 4: Strategy Basket + Trench 重做

#### 4.1 搬运"大脑"

- 从 stash 提取 Strategy 类型定义 -> `src/types/index.ts`
- 从 stash 提取 strategyStore.ts -> `src/stores/strategyStore.ts`
  - 补充 `voteTrenchMessage` action
  - 验证 mock 数据中所有 contractId/eventId 在 main events.ts 中存在
- 从 stash 提取 strategyMath.ts -> `src/lib/strategyMath.ts`

#### 4.2 路由与导航

- `src/App.tsx`：新增 `/strategies`、`/strategy/new`、`/strategy/:strategyId`
- `src/layouts/AppShell.tsx`：第 4 个一级导航 "Strategies" + SVG icon
- 移动端底部栏适配 4 个 tab

#### 4.3 重做 StrategiesPage

- 搜索/筛选（按 tag 过滤）
- 卡片信息层级：标题 > 创建者 > 腿数/copies > 腿预览 > thesis 摘要
- 弱化 Basket ID hash（tooltip 而非内联）
- 复制策略后 navigate 到 `/strategy/${template.id}`

#### 4.4 重做 CreateStrategyPage

- Driver Event：可搜索 combo input（替代原始 select）
- 移除 Import My Forecasts
- 合约选择器：搜索 + 排序保留，UI 改善
- 权重输入：number input + 实时归一化预览

#### 4.5 重做 StrategyDetailPage

- 估值看板（Notional/Entry/Mark/PnL）保留 Codex 结构
- Basket Legs 行可点击跳到对应 `/event/${eventId}`
- Trench 讨论区：stance 改为按钮组，投票可交互
- Same Basket Variants 保留

#### 4.6 EventDetailPage 交易优先布局 + Strategy 集成

- 信息重排：Contracts + PriceChart -> RelatedStrategies -> RequestSettle -> Market Context
- RelatedStrategiesSection 参考 Codex + 分组/分页思路

#### 4.7 Portfolio Copied Strategies tab

- portfolioStore activeTab 扩展
- Tab 渲染使用 strategyStore.instances

### Phase 5: Forecast 降级

- 移除独立 `forecastStore.ts`（或保留但不再写入）
- Portfolio "My Forecasts" tab 合并到 Trade History 或移除
- TradeConfirmModal "Generate Forecast Card" -> "Share This Trade"
- EventDetailPage YourForecastsSection：改为显示持仓信息或移除

### Phase 6: 文档更新

#### UX-spec.md

- 4.1 节：改为"交易优先——Contracts 前置，RulesSummary/Timeline 后置为 Market Context"
- 5 节：改为"四个一级 Tab：Explore / Strategies / Portfolio / Leaderboard"
- 10 节验收清单：更新对应条目

#### Demo-script.md

- 移除 "My Forecasts tab 可见" 条目
- 新增 Strategy Basket 演示段落
- 回归清单新增 Strategy 验证项
- "观点卡片" 改为 "持仓分享"

#### Capability-Inventory.md

- 新增"域 11: Strategy Basket & Trench"能力项

### Phase 7: 收尾

- `tsc --noEmit`
- lint 检查
- 所有路由走查
- Demo-script 回归清单全量验证
- 提交代码

---

## 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| EventDetailPage 布局变更与 UX-spec 冲突 | 验收清单自相矛盾 | Phase 6 同步更新 UX-spec |
| Codex stash mock 数据的 contractId/eventId 可能在 main 中不存在 | Strategy 模板渲染空白 | Phase 4.1 搬运时逐条验证 |
| Forecast 降级影响 TradeConfirmModal 流程 | "Generate Forecast Card" 入口变化 | Phase 5 改为 "Share This Trade" |
| Portfolio 写入需定义新 Position/Trade 结构 | 可能与 fixture mock 冲突 | Phase 1.1 评估现有 fixture 后决定 append 还是 replace |
| 4 Tab 导航在移动端底部栏空间紧张 | icon+text 挤不下 | 移动端 4 个 icon-only tab |

## Gate B 回归要点

改动完成后需按更新后 Demo-script 跑通：

- Explore -> 事件卡片 Yes -> 快速交易 -> Toast -> **Portfolio 能看到持仓**
- Explore -> 事件详情 -> **Contracts 在顶部** -> 下单 -> Modal 确认
- Modal 对冲建议 -> **跳转到正确合约**
- Strategies Tab -> 列表 -> 创建策略 -> 发布 -> 详情 -> 复制 -> 调权 -> Trench
- RESOLVING 事件 -> StatusBanner 按钮 -> **全部可操作**
- CANCELLED 事件 -> RefundBanner -> **弹窗展示退款明细**
- disputed 事件 -> DisputePanel -> **Submit Evidence 可点击**
- Live 卡片桌面 Yes/No -> **只弹交易面板不跳转**
- Live 卡片主体点击 -> **跳转到详情页**
