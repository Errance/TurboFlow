# TurboFlow 足球 CLOB 产品需求文档 v1

---

### 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| v1 | 2026-03-02 | 初版：基于 CLOB 订单簿模式的全量产品定义，覆盖 7 Tab、2 种市场类型、交易系统、数据转换管道 |

---

## 第 1 章：文档概述

### 1.1 文档目的

本文档是 TurboFlow 足球 CLOB 预测市场的完整产品需求定义。该产品将传统足球博彩的赔率模型升级为 **中央限价订单簿（Central Limit Order Book）模式**，采用 Polymarket 风格的概率定价和双向交易机制。

本文档覆盖 **7 个 Tab** 的全量市场定义，包括每个市场的类型映射、定价逻辑、交易规范、订单簿结构、页面架构、状态矩阵和数据转换管道。

### 1.2 与传统足球盘口的核心差异

| 维度 | 传统模式（Stake 风格） | CLOB 模式（本产品） |
|------|----------------------|-------------------|
| 定价 | 欧洲赔率（1.50, 2.80...） | ¢ 价格（1-99¢，代表概率） |
| 交易方向 | 单向下注 | Yes/No 双向买卖 |
| 订单类型 | 即时投注 | 市价单 + 限价单 |
| 市场类型 | 6 种 UI 组件 | 2 种（BinaryMarket、NegRiskEvent） |
| 右栏功能 | 投注单 + 我的投注 | 交易面板 + 持仓/挂单/成交 + 钱包 |
| Tab 数量 | 11 个 | 7 个（精简合并） |
| 持仓管理 | 无（下注即锁定） | 持仓可平仓、挂单可撤单 |
| 资产单位 | USDT | USDC |

### 1.3 术语表

| 术语 | 说明 |
|------|------|
| **¢ 价格** | 1-99 的整数，代表市场对某结果发生的概率估计（单位：美分/每份）。50¢ = 50% 概率。买入 Yes 花费 = 份额 × yesPrice / 100 |
| **BinaryMarket（二元市场）** | 只有 Yes/No 两种结果的独立市场。如「合计 高于 2.5」→ Yes（总进球 ≥ 3）或 No（≤ 2）。yesPrice + noPrice = 100 |
| **NegRiskEvent（互斥多选市场）** | 多个互斥选项的市场事件，如「胜平负」→ 主胜/平局/客胜三个 Outcome，每个 Outcome 有独立的 Yes/No 价格和订单簿。所有 Outcome 的 yesPrice 归一化总和约为 100 |
| **Outcome（选项）** | NegRiskEvent 中的单个可交易选项，拥有独立的 yesPrice、noPrice、volume 和 orderBook |
| **OrderBook（订单簿）** | 买卖双方的挂单队列。Bids（买单）按价格降序排列，Asks（卖单）按价格升序排列 |
| **Bid / Ask** | Bid = 买方愿意支付的最高价；Ask = 卖方愿意接受的最低价。Spread = Ask - Bid |
| **市价单（Market Order）** | 以当前最优价格立即成交的订单 |
| **限价单（Limit Order）** | 指定价格挂单，等待对手方匹配成交 |
| **持仓（Position）** | 用户持有的某个市场方向的份额。持仓有浮动盈亏，可通过平仓实现盈亏 |
| **平仓（Close Position）** | 卖出所持份额，将浮动盈亏转为已实现盈亏 |
| **份额（Shares）** | 交易的最小单位。每份在结算时价值 $1（若结果正确）或 $0（若结果错误） |
| **滑点** | 市价单因吃掉多档订单簿深度导致的平均成交价与最优价之间的差异 |
| **groupTitle（分组标题）** | 用于在 UI 中标识同一盘口来源的标签。同 groupTitle 的多个 BinaryMarket 会被合并为一个 NegRiskEvent |
| **suspended（暂停）** | 市场临时关闭交易（通常在赛中关键事件时），待调整后重新开放 |
| **settled（已结算）** | 市场已有明确结果，持仓按结果清算 |
| **voided（作废）** | 市场无效，所有持仓按成本价退还 |

---

## 第 2 章：产品概述

### 2.1 产品定位

TurboFlow 足球 CLOB 是一个面向足球赛事的 **订单簿式预测市场**。用户通过买入 Yes 或 No 份额来表达对比赛结果的判断，价格反映市场对各结果发生概率的共识。

与传统博彩的庄家-玩家模式不同，CLOB 模式下用户之间直接对手交易，平台仅提供撮合引擎和市场基础设施。

### 2.2 覆盖范围

| 维度 | 范围 |
|------|------|
| Tab 数量 | 7 个（热门、进球、上半场/下半场、亚洲盘、角球、罚牌、特殊投注） |
| 市场类型 | 2 种（BinaryMarket、NegRiskEvent） |
| 比赛状态 | scheduled / live / finished + 5 种异常状态 |
| 交易方向 | Yes / No 双向 |
| 订单类型 | 市价单 / 限价单 |
| 资产 | USDC |

### 2.3 被过滤的旧版内容

从传统 11 Tab 精简为 7 Tab 的过程中，以下内容被过滤：

| 被删除的 Tab | 原因 |
|-------------|------|
| bet-builder（同场赛复式投注） | CLOB 模式不支持串关组合，市场独立交易 |
| goalscorer（进球得分手） | 射手数据整合至 specials Tab 的「任何时间进球队员」市场 |
| players（球员） | 球员级多档统计市场暂不纳入 CLOB 模式 |
| minutes（分钟盘） | 时间区间市场暂不纳入 CLOB 模式 |

被删除的具体盘口：

| 被删除的盘口 | 原因 |
|-------------|------|
| 平局返还、双胜彩 | 传统博彩特有的赛果变种，在 CLOB 模式下用户可直接在「胜平负」市场交易 Yes/No 实现相同策略 |
| 多进球、进球范围 | 区间型市场在 CLOB 模式下流动性分散，暂不纳入 |
| 三列 OddsTable（欧洲让球） | 三列赔率表无法直接映射为二元或互斥市场 |

被过滤的 OddsTable 行：只保留半球线（如 2.5）和四分之一球线（如 2.25），整数线行被过滤。

---

## 第 3 章：产品信息架构与页面结构

### 3.1 页面层级

```
足球 CLOB 入口 (/clob)
  └─ 赛事列表（按联赛分组）
       └─ 单场详情 (/clob/match/:matchId)
            ├─ 左栏：盘口市场区（MatchHeader + Tabs + 市场卡片列表）
            └─ 右栏：赛事信息面板 + 交易面板 + 持仓面板
```

### 3.2 赛事列表页

**功能**：展示所有比赛，按联赛分组，每场显示核心市场价格预览。

#### 3.2.1 左侧导航栏

| 区域 | 内容 |
|------|------|
| 页面标题 | 「足球 · CLOB」+ 地球图标 |
| 副标题 | 「订单簿撮合模式」 |
| 「全部赛事」按钮 | 显示总场次 + live 场次计数（红色） |
| 联赛按钮列表 | 每行：联赛名 + 国家（小字） + live 计数（红色，仅 > 0 时显示） + 总场次 |

点击联赛按钮 → 筛选主区域仅显示该联赛比赛（URL 参数 `?league=leagueId`）；点击「全部赛事」→ 恢复全部展示。

#### 3.2.2 比赛列表主区域

**按联赛分组**：每个联赛一组，组头显示联赛名 + 「N 场」。

**列标头行**（sm 以上可见）：

| 列 | 宽度 | 说明 |
|----|------|------|
| 时间 | w-12 | 比赛时间或状态 |
| 比赛 | flex-1 | 主队 vs 客队 |
| 1x2 | w-182px | 胜平负三选项的 ¢ 价格（sm+ 可见） |
| 总进球 | w-118px | O/U 2.5 两选项的 ¢ 价格（md+ 可见） |
| 亚盘 | w-118px | 亚洲让分盘首行 ¢ 价格（lg+ 可见） |
| 市场 | w-16 | 「N」总市场数 |

**渐进式信息披露**：

| 断点 | 显示内容 |
|------|----------|
| 始终显示 | 时间/状态 + 队名 + 市场数 |
| sm+ (640px) | + 1x2 的三个 ¢ 价格 |
| md+ (768px) | + O/U 2.5 的 Over/Under ¢ 价格 |
| lg+ (1024px) | + 亚盘首行的主/客 ¢ 价格 |

**价格展示格式**：所有预览价格以「¢」单位展示（如 `45¢`），不同于传统模式的欧洲赔率。

**状态显示**：

| 状态 | 显示 |
|------|------|
| scheduled | 日期（小字）+ 时间（等宽字体） |
| live | 「LIVE」红色文字 + 比分（粗体等宽） |
| finished | 「FT」灰色文字 + 比分（灰色等宽） |

点击任一行 → 跳转至 `/clob/match/:matchId` 单场详情页。

### 3.3 单场详情页布局

**桌面端双栏布局**：

| 左栏（flex-1, min-w-0） | 右栏（w-380px, shrink-0） |
|-------------------------|--------------------------|
| 面包屑导航 | MatchInfoPanel（阵容/H2H/统计） |
| WalletBar（钱包余额条） | TradingPanel（交易面板，sticky） |
| MatchHeader（比赛头部） | PositionsPanel（持仓面板，sticky） |
| Tab 栏（7 个标签页） | |
| 市场卡片列表 | |

**面包屑导航**：格式为「足球 CLOB › 联赛名 › 主队 vs 客队」。联赛名为可点击链接，点击后跳转至赛事列表页并按该联赛筛选。

**右栏 sticky 行为**：MatchInfoPanel 随页面正常滚动；TradingPanel 和 PositionsPanel 包裹在 `sticky top-20` 容器中，在 MatchInfoPanel 滚出视口后固定于页面顶部。

### 3.4 三种赛事状态下的页面差异

| 状态 | MatchHeader | 右侧面板 | 市场区 |
|------|-------------|----------|--------|
| **scheduled** | 即将开赛 badge + 日期时间 + 场地 | KickoffCountdown + 阵容图 + H2H | 正常可交易 |
| **live** | LIVE badge + 比分 + 当前分钟（脉动） | 事件时间线 + 统计 + 阵容 | 滚球市场（部分 suspended） |
| **finished** | ENDED badge + 最终比分（灰色） | 完整事件 + 统计 + H2H | 全部显示结算结果 |

---

## 第 4 章：市场类型规范

CLOB 模式定义了 2 种市场类型，所有传统 6 种 UI 组件（ButtonGroup、OddsTable、ScoreGrid、ComboGrid、RangeButtons、PlayerList）均映射至这两种类型。

### 4.1 BinaryMarket（二元市场）

**用途**：只有 Yes/No 两种结果的独立命题市场。

**数据结构**：
```
{
  type: 'binary'
  id: string
  question: string           // 命题描述，如「合计 高于 2.5」
  groupTitle: string         // 分组标识，如「合计」
  yesPrice: number           // 1-99 (¢)
  noPrice: number            // 100 - yesPrice
  volume: number             // 总成交量（份额数）
  volume24h: number          // 24h 成交量
  lastTradePrice: number     // 最近成交价
  orderBook: OrderBook       // 订单簿
  status: MarketStatus       // open / suspended / settled / voided
  settlementResult?: 'yes' | 'no' | 'void'
}
```

**UI 卡片行为**：
- 显示 question 作为市场标题
- Yes 按钮（绿色调）显示 yesPrice + hover 时赔率（100/yesPrice）
- No 按钮（红色调）显示 noPrice + hover 时赔率（100/noPrice）
- 默认显示紧凑订单簿
- 点击 Yes 或 No → 该选择进入右栏 TradingPanel
- 选中状态下展开完整深度订单簿

**产生条件**：
- 原 ButtonGroupMarket 仅有 2 个选项时（如「两队都得分：是/否」）
- 原 OddsTableMarket 过滤后仅剩 1 行时
- 同 groupTitle 的多个 BinaryMarket 不重复时

### 4.2 NegRiskEvent（互斥多选市场）

**用途**：多个互斥选项的市场事件，每个选项（Outcome）有独立的订单簿。

**数据结构**：
```
{
  type: 'negRisk'
  id: string
  title: string              // 市场标题，如「胜平负」
  groupTitle: string         // 分组标识
  outcomes: Outcome[]        // 互斥选项列表
  status: MarketStatus
  settlementResult?: { winningOutcomeId: string } | 'void'
}

Outcome {
  id: string
  label: string              // 选项标签，如「主队」「平局」「客队」
  yesPrice: number           // 1-99 (¢)，所有 outcome 的 yesPrice 归一化总和约 100
  noPrice: number            // 100 - yesPrice
  volume: number
  volume24h: number
  lastTradePrice: number
  orderBook: OrderBook       // 每个选项有独立订单簿
}
```

**UI 卡片行为（根据 outcomes 数量自动选择布局）**：

| outcomes 数量 | 布局 | 交互 |
|-------------|------|------|
| ≤ 4 个 | 网格布局，每个 outcome 显示 label + Yes ¢ 价格 | 点击某 outcome → 以 Yes 侧进入交易面板 |
| 5-10 个 | 列表布局，每行：label + Yes¢ + No¢ + 紧凑订单簿 | 点击 Yes 或 No → 进入交易面板；选中行展开深度订单簿 |
| > 10 个 | 比分式多列网格 | 点击某 outcome → 以 Yes 侧进入交易面板 |

**产生条件**：
- 原 ButtonGroupMarket 有 ≥ 3 个选项时（如「胜平负」3 选项）
- 原 OddsTableMarket 过滤后有 ≥ 2 行时（如「合计」多条盘口线）
- 原 ScoreGridMarket（如「正确进球」25 格比分）
- 原 ComboGridMarket（如「1x2 & 两队得分」6 格）
- 原 RangeButtonsMarket（如「总进球数」6 选项）
- 同 groupTitle 的多个 BinaryMarket 被自动合并时

### 4.3 订单簿可视化

**紧凑模式（默认）**：
- 左右双色条形式
- 绿色 = Bid 方（买方深度）
- 红色 = Ask 方（卖方深度）
- 条宽按量比例缩放

**完整深度模式（选中时展开）**：
- 上方 Ask 队列（红色背景，价格升序）
- 下方 Bid 队列（绿色背景，价格降序）
- 每档显示 price + quantity
- 深度最多 5 档（默认），模拟引擎可动态添加最多 8 档

---

## 第 5 章：盘口百科

本章按 7 个 Tab 逐一列出所有市场。每个市场标明其从旧版足球数据的转换来源和最终 CLOB 市场类型。

---

### Tab 1：热门 (home)

#### 5.1.1 胜平负

| 字段 | 内容 |
|------|------|
| **市场标题** | 胜平负 |
| **CLOB 类型** | NegRiskEvent（3 个 Outcome） |
| **转换来源** | ButtonGroup（3 选项：主队/平局/客队） |
| **Outcomes** | 主队名 / 平局 / 客队名 |
| **定价** | 三个 outcome 的 yesPrice 归一化总和约 100（如 45/28/27） |
| **结算** | 常规时间比分领先方对应 outcome 的 Yes 结算为 $1/份，其余为 $0 |

#### 5.1.2 两队都得分 (BTTS)

| 字段 | 内容 |
|------|------|
| **市场标题** | 两队都得分 |
| **CLOB 类型** | BinaryMarket |
| **转换来源** | ButtonGroup（2 选项：是/否），取第一选项「是」生成 binary |
| **命题** | 「两队都得分: 是?」 |
| **定价** | yesPrice = 两队都进球的概率（¢），noPrice = 100 - yesPrice |

#### 5.1.3 合计（大小球）

| 字段 | 内容 |
|------|------|
| **市场标题** | 合计 |
| **CLOB 类型** | NegRiskEvent（多条半球/四分之一球盘口线） 或 BinaryMarket（仅 1 条线时） |
| **转换来源** | OddsTable（2 列：高于/低于），仅保留半球线和四分之一球线行 |
| **Outcomes** | 各盘口线作为独立 outcome，如「2.5」「1.5/2」等 |
| **过滤规则** | 整数线行被过滤（无法在 binary 中表达 push/退款） |

#### 5.1.4 亚洲让分盘

| 字段 | 内容 |
|------|------|
| **市场标题** | 亚洲让分盘 |
| **CLOB 类型** | NegRiskEvent（多条让球线）或 BinaryMarket（仅 1 条线时） |
| **转换来源** | OddsTable（2 列：主队/客队），仅保留半球/四分之一球线 |
| **Outcomes** | 各让球线作为独立 outcome |

#### 5.1.5 1x2 & 两队得分

| 字段 | 内容 |
|------|------|
| **市场标题** | 1x2 & 两队得分 |
| **CLOB 类型** | NegRiskEvent（6 个 Outcome） |
| **转换来源** | ComboGrid（行: 主队/平局/客队，列: 是/否） |
| **Outcomes** | 主队&是 / 主队&否 / 平局&是 / 平局&否 / 客队&是 / 客队&否 |

#### 5.1.6 正确进球（全场准确比分）

| 字段 | 内容 |
|------|------|
| **市场标题** | 正确进球 |
| **CLOB 类型** | NegRiskEvent（最多 25 个 Outcome） |
| **转换来源** | ScoreGrid（homeRange: 0-4, awayRange: 0-4） |
| **Outcomes** | 每个可能比分（如「2:1」）为一个 outcome，odds > 0 的才纳入 |
| **UI 布局** | > 10 个 outcome → 比分式多列网格 |

#### 5.1.7 上半场 - 正确进球

| 字段 | 内容 |
|------|------|
| **市场标题** | 上半场 - 正确进球 |
| **CLOB 类型** | NegRiskEvent（最多 9 个 Outcome） |
| **转换来源** | ScoreGrid（homeRange: 0-2, awayRange: 0-2） |

#### 5.1.8 半场/全场

| 字段 | 内容 |
|------|------|
| **市场标题** | 半场/全场 |
| **CLOB 类型** | NegRiskEvent（最多 9 个 Outcome） |
| **转换来源** | ComboGrid（行: 主队/平局/客队，列: 主队/平局/客队） |

#### 5.1.9 任何时间进球队员

| 字段 | 内容 |
|------|------|
| **市场标题** | 任何时间进球队员 |
| **CLOB 类型** | NegRiskEvent（由合并机制自动生成，最多 10 个 Outcome） |
| **转换来源** | PlayerList → 取前 10 名球员各生成一个 BinaryMarket → 经 mergeDuplicateBinaries 合并为单个 NegRiskEvent |
| **Outcomes** | 每名球员为一个 outcome，label 为「球员名 进球?」 |
| **注意** | 此数据同时来源于 goalscorer Tab 的预提取，注入到 specials Tab；hot Tab 中也可能出现 |

---

### Tab 2：进球 (goals)

包含全场进球相关的各类市场。具体盘口与热门 Tab 中的进球类市场共享数据源，按原始 goals Tab 的 markets 转换。

典型市场包括：
- **合计（大小球）**：同 5.1.3
- **主队合计 / 客队合计**：OddsTable → NegRiskEvent 或 BinaryMarket
- **两队都得分**：同 5.1.2
- **1x2 & 两队得分**：同 5.1.5
- **1x2 & 合计**：ComboGrid → NegRiskEvent
- **合计 & 两队得分**：ComboGrid → NegRiskEvent
- **总进球数**：RangeButtons → NegRiskEvent
- **总进球数单/双**：ButtonGroup（2 选项） → BinaryMarket
- **谁先进第 1st 球**：ButtonGroup（3 选项） → NegRiskEvent
- **最后一个进球属于**：ButtonGroup（3 选项） → NegRiskEvent

各盘口的结算规则与传统模式 PRD 中的定义一致，不再重复。

---

### Tab 3：上半场/下半场 (halves)

汇集所有半场相关盘口。每个盘口是全场版的半场时间口径翻版。

典型市场包括：
- **上半场 1x2**：ButtonGroup → NegRiskEvent
- **下半场 1x2**：ButtonGroup → NegRiskEvent
- **上半场 - 合计**：OddsTable → NegRiskEvent 或 BinaryMarket
- **下半场 - 合计**：OddsTable → NegRiskEvent 或 BinaryMarket
- **上半场 - 让球**：OddsTable → NegRiskEvent 或 BinaryMarket
- **下半场 - 让球**：OddsTable → NegRiskEvent 或 BinaryMarket
- **上半场 - 正确进球**：ScoreGrid → NegRiskEvent
- **下半场 - 正确比分**：ScoreGrid → NegRiskEvent
- **上半场 - 两队得分**：ButtonGroup（2 选项） → BinaryMarket
- **最高得分半场**：ButtonGroup（3 选项） → NegRiskEvent

---

### Tab 4：亚洲盘 (asian)

所有亚洲盘口线市场，提供多条精细盘口线。

| 市场 | 转换来源 | CLOB 类型 |
|------|---------|----------|
| 亚洲让分盘 | OddsTable（2列, 多行半球线） | NegRiskEvent |
| 合计（全场大小球） | OddsTable（2列, 多行半球线） | NegRiskEvent |
| 上半场 - 让球 | OddsTable（2列） | NegRiskEvent 或 Binary |
| 上半场 - 总计 | OddsTable（2列） | NegRiskEvent 或 Binary |
| 下半场 - 盘口 | OddsTable（2列） | NegRiskEvent 或 Binary |
| 下半场 - 总数 | OddsTable（2列） | NegRiskEvent 或 Binary |

---

### Tab 5：角球 (corners)

角球统计相关市场。

典型市场包括：
- **角球总数**：OddsTable → NegRiskEvent
- **角球 1x2**：ButtonGroup（3 选项） → NegRiskEvent
- **1st 角球**：ButtonGroup（3 选项） → NegRiskEvent
- **角球奇数/偶数**：ButtonGroup（2 选项） → BinaryMarket
- **上半场 - 角球总数**：OddsTable → NegRiskEvent 或 Binary
- **上半场 - 角球 1x2**：ButtonGroup → NegRiskEvent
- **上半场 - 1st 角球**：ButtonGroup → NegRiskEvent
- **最后角球**：ButtonGroup → NegRiskEvent

---

### Tab 6：罚牌 (cards)

罚牌统计相关市场。

| 市场 | 转换来源 | CLOB 类型 |
|------|---------|----------|
| 红黄牌总数 | OddsTable（2列） | NegRiskEvent 或 Binary |
| 1st 红黄牌 | ButtonGroup（3 选项） | NegRiskEvent |
| 上半场 - 红黄牌总数 | ButtonGroup（2 选项） | BinaryMarket |
| 上半场 - 1st 红黄牌 | ButtonGroup（3 选项） | NegRiskEvent |

---

### Tab 7：特殊投注 (specials)

此 Tab 汇集未归入其他 Tab 的市场，同时注入射手数据。

典型市场包括：
- 来自 specials 原始 Tab 的各市场（不失球获胜、赢任何/两半场等）→ ButtonGroup → Binary 或 NegRiskEvent
- **任何时间进球队员**（从 goalscorer Tab 预提取并注入）→ NegRiskEvent（合并后）

---

## 第 6 章：赛事信息面板规范

### 6.1 MatchHeader（比赛头部）

| 字段 | 赛前 | 赛中 | 赛后 |
|------|------|------|------|
| status badge | 「即将开赛」绿色 | 「LIVE」红色 + 脉动分钟数 | 「ENDED」灰色 |
| league | 显示 | 显示 | 显示 |
| venue | 显示（若有） | 显示 | 显示 |
| homeTeam / awayTeam | 圆形简称 + 全名 | 同左 | 同左 |
| score | 不显示，改为日期+时间 | 显示比分 | 显示比分（灰色） |
| currentMinute | 无 | 显示 + 脉动动画 | 无 |
| 时间线刻度 | 均为普通样式 | 已过分钟高亮 + 当前位置红点 | 全部灰色 |

### 6.2 KickoffCountdown（开赛倒计时）

| 字段 | 说明 |
|------|------|
| 四格倒计时 | Days / Hrs / Mins / Secs |
| 更新频率 | 每秒刷新 |
| 格子尺寸 | w-14 h-14，深色背景（#0f1923） |
| 数字颜色 | 白色，2xl 粗体等宽字体 |
| 标题 | 「Kickoff time」，xs 号灰色大写 |

### 6.3 MatchInfoPanel（赛事信息面板）

位于右栏顶部，包含三个 Tab：

| Tab | 赛前 | 赛中 | 赛后 |
|-----|------|------|------|
| 阵容 | 可用 | 可用 | 可用 |
| H2H | 可用 | 可用 | 可用 |
| 统计 | 不可用 | 可用 | 可用 |

**阵容 Tab**：FormationPitch 组件，CSS 绿色球场俯视图 + 球员圆形标记 + 阵型排布 + 替补列表。

**H2H Tab**：历史交锋记录，含胜负统计、平均进球、最近 5 场对阵。

**统计 Tab**：双向进度条对比，含控球率、射门、射正、角球、犯规、越位、黄牌、红牌。

---

## 第 7 章：交易系统规范

### 7.1 WalletBar（钱包余额条）

位于左栏 MatchHeader 上方。

| 字段 | 说明 |
|------|------|
| 可用余额 | `balance.available` USDC |
| 持仓中 | `balance.inPositions` USDC |
| 挂单中 | `balance.inOrders` USDC |
| 总计 | 三者之和 |

初始余额：10,000 USDC。

### 7.2 TradingPanel（交易面板）

位于右栏，sticky 定位。

#### 7.2.1 空状态

无选中市场时显示标题「交易面板」+ 居中提示「点击市场价格开始交易」。

#### 7.2.2 有选中时

| 区域 | 内容 |
|------|------|
| 市场信息 | question 或 outcomeLabel（若为 NegRiskEvent） |
| 方向切换 | Yes / No 两个按钮，当前选中高亮 |
| 订单类型 | Market（市价）/ Limit（限价）切换 |
| 限价输入 | 仅限价单可见，输入 1-99 的 ¢ 价格 |
| 份额输入 | 购买份额数 |
| 金额输入 | 花费 USDC 总额，与份额/价格联动 |
| 快捷金额 | $10 / $25 / $50 / $100 按钮 |
| 最大赔付 | 份额 × $1 |
| 潜在收益 | 最大赔付 - 花费金额 |
| 确认按钮 | 「买入 Yes」或「买入 No」；余额不足或参数无效时禁用 |

#### 7.2.3 联动计算

- 修改金额 → 自动计算份额（份额 = 金额 / 价格 × 100，取整）
- 修改份额 → 自动计算金额（金额 = 份额 × 价格 / 100）
- 修改价格 → 重算金额

#### 7.2.4 下单流程

1. 用户点击「买入」
2. 校验：价格 1-99、份额 > 0、金额 > 0、金额 ≤ 可用余额
3. 提交至撮合引擎
4. 市价单：立即吃对手方订单簿（买 Yes 吃 Asks，买 No 吃 Bids）
5. 限价单：未完全成交的部分挂单
6. 更新余额（available 减少，inPositions / inOrders 增加）
7. 成交后刷新市场 yesPrice / noPrice

### 7.3 PositionsPanel（持仓面板）

位于右栏 TradingPanel 下方，4 个 Tab：

#### 7.3.1 持仓 Tab

| 列 | 说明 |
|----|------|
| 市场 | marketQuestion（截断显示） |
| 方向 | Yes（绿色）/ No（红色） |
| 份额 | 持有数量 |
| 均价 | 平均买入 ¢ 价格 |
| 现价 | 当前 ¢ 价格 |
| 浮盈 | unrealizedPnl（绿色/红色） |
| 操作 | 「平仓」按钮 |

平仓按当前价格一次性卖出全部份额。

#### 7.3.2 挂单 Tab

| 列 | 说明 |
|----|------|
| 市场 | marketQuestion |
| 方向 | Yes/No |
| 类型 | Limit |
| 价格 | 限价 ¢ |
| 份额 | 未成交份额 |
| 操作 | 「取消」按钮 |

取消挂单后冻结金额退回可用余额。

#### 7.3.3 成交 Tab

最近 20 条成交记录，按时间倒序。

| 列 | 说明 |
|----|------|
| 市场 | marketQuestion |
| 方向 | Yes/No |
| 价格 | 成交 ¢ |
| 份额 | 成交份额 |
| 金额 | 成交总额 USDC |
| 时间 | 成交时间戳 |

#### 7.3.4 已结算 Tab

已结算持仓记录。

| 结果 | Badge | 金额显示 |
|------|-------|----------|
| WIN | 绿色 badge | 绿色 `+盈利` |
| LOSS | 红色 badge | 红色 `-亏损` |
| VOID | 灰色 badge | 灰色 `±0.00` |

### 7.4 订单撮合逻辑

**市价单撮合**：
1. 买 Yes → 从 Asks 队列中从低到高依次吃单
2. 买 No → 从 Bids 队列中从高到低依次吃单
3. 每吃一档：成交量 = min(该档 quantity, 剩余 shares)
4. 部分成交后，未成交部分不挂单（市价单特性）

**限价单撮合**：
1. 先尝试与对手方订单簿撮合（同市价单逻辑，但价格限制）
2. 未完全成交的剩余部分作为挂单加入订单簿
3. 挂单冻结金额 = 剩余份额 × 限价 / 100

**成交后更新**：
- 订单簿深度实时扣减
- 成交后按中间价更新 yesPrice / noPrice

---

## 第 8 章：字段配置清单

### 8.1 赛事列表卡片字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| match.id | string | 路由参数 |
| match.league / leagueId | string | 联赛名 / 筛选 ID |
| match.homeTeam / awayTeam | { name, shortName } | 队伍 |
| match.date / time | string | 日期时间 |
| match.status | enum | 8 种状态 |
| match.score | { home, away }? | 比分 |
| match.moneyline | { home, draw, away } | 胜平负 ¢ 价格 |
| match.totalLine | { line, overPrice, underPrice } | 大小球 ¢ 价格 |
| match.asianLine | { line, homePrice, awayPrice } | 亚盘 ¢ 价格 |
| match.marketCount | number | 总市场数（outcome 级计数） |

### 8.2 市场通用字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| market.type | 'binary' \| 'negRisk' | 市场类型 |
| market.id | string | 唯一标识 |
| market.groupTitle | string | 分组标识 |
| market.status | MarketStatus | open / suspended / settled / voided |
| market.orderBook | OrderBook | 订单簿（binary 整体一本，negRisk 每 outcome 一本） |

### 8.3 交易字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| order.side | 'yes' \| 'no' | 交易方向 |
| order.type | 'market' \| 'limit' | 订单类型 |
| order.price | number | 限价（¢），市价单为 0 |
| order.shares | number | 份额 |
| order.filledShares | number | 已成交份额 |
| order.avgFillPrice | number | 平均成交价 |
| order.status | 'open' \| 'filled' \| 'partial' \| 'cancelled' | 订单状态 |
| position.unrealizedPnl | number | 浮动盈亏 |
| position.status | 'open' \| 'closed' \| 'settled' | 持仓状态 |

### 8.4 余额字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| balance.available | number | 可用 USDC |
| balance.inPositions | number | 持仓占用 |
| balance.inOrders | number | 挂单冻结 |

---

## 第 9 章：赛事与市场状态矩阵

### 9.1 赛事状态全集

| 状态 | 说明 | 前台表达 |
|------|------|----------|
| scheduled | 未开赛 | 「即将开赛」 |
| live | 比赛进行中 | 「LIVE」+ 分钟数 |
| finished | 常规时间结束 | 「ENDED」 |
| interrupted | 比赛中断 | 「中断」 |
| abandoned | 比赛放弃 | 「腰斩」 |
| postponed | 比赛延期 | 「延期」 |
| cancelled | 比赛取消 | 「取消」 |
| corrected | 结果修正 | 「已更正」 |

### 9.2 市场状态全集

| 状态 | 说明 | UI 表现 |
|------|------|---------|
| open | 可交易 | 正常显示价格和订单簿，可点击 |
| suspended | 暂停交易 | 半透明遮罩 + 「暂停中」标签 |
| settled | 已结算 | 半透明 + 琥珀色提示「已结算」 |
| voided | 作废 | 半透明 + 琥珀色提示「已作废」 |

### 9.3 页面 × 状态展示矩阵

| 页面 | scheduled + open | live + suspended | finished + settled | abnormal + voided |
|------|-----------------|-----------------|-------------------|------------------|
| **赛事列表** | 日期+时间，可点击 | LIVE+比分，可点击 | FT+比分(灰)，可点击 | 异常标记，可点击 |
| **MatchHeader** | 即将开赛 badge | LIVE + 脉动分钟 | ENDED badge | 异常状态 badge |
| **市场区** | 正常可交易 | 部分 suspended 遮罩 | 全部显示结算结果 | 全部 voided |
| **信息面板** | 倒计时+阵容+H2H | 时间线+统计+阵容 | 事件+统计+H2H | 显示异常说明 |
| **交易面板** | 正常交易 | suspended 市场不可交易 | 隐藏交易控件 | 隐藏交易控件 |
| **持仓面板** | 正常显示 | 正常显示 | 显示结算结果 | 显示 void 退款 |

---

## 第 10 章：数据转换管道

### 10.1 转换总览

足球 CLOB 的市场数据并非独立生成，而是从现有传统足球盘口数据（6 种 Market 类型、11 个 Tab）经转换管道映射而来。

```
传统足球数据 (11 Tab, 6 种 Market, ~100+ 盘口)
  ↓ Tab 过滤（删除 bet-builder, goalscorer, players, minutes）
  ↓ 盘口过滤（删除平局返还、双胜彩、多进球等）
  ↓ 类型转换（6 种 Market → 2 种 ClobMarket）
  ↓ OddsTable 行过滤（仅保留半球/四分之一球线）
  ↓ 射手数据注入（goalscorer → specials）
  ↓ 重复合并（同 groupTitle 的多个 BinaryMarket → NegRiskEvent）
  ↓ ¢ 价格生成 + 订单簿生成
CLOB 市场数据 (7 Tab, 2 种 ClobMarket)
```

### 10.2 类型映射规则

| 原始类型 | 条件 | CLOB 类型 |
|---------|------|----------|
| ButtonGroup | 2 选项 | BinaryMarket |
| ButtonGroup | ≥ 3 选项 | NegRiskEvent |
| OddsTable | 2 列，过滤后 1 行 | BinaryMarket |
| OddsTable | 2 列，过滤后 ≥ 2 行 | NegRiskEvent |
| OddsTable | 3 列 | 不转换（过滤） |
| ScoreGrid | 全部 | NegRiskEvent |
| ComboGrid | 全部 | NegRiskEvent |
| RangeButtons | 全部 | NegRiskEvent |
| PlayerList | title = 任何时间进球队员 | BinaryMarket[]（后经合并为 NegRiskEvent） |
| PlayerList | 其他 | 不转换（过滤） |

### 10.3 赔率到 ¢ 价格的转换

公式：`yesPrice = round(100 / odds)`，结果夹在 1-99 范围内。

NegRiskEvent 的所有 outcome 价格经归一化处理，使总和约为 100：
1. 各选项独立计算 rawPrice
2. sum = 所有 rawPrice 之和
3. normalizedPrice = round(rawPrice × 100 / sum)，最小为 1

### 10.4 重复合并机制

在每个 Tab 的市场收集完毕后，执行 `mergeDuplicateBinaries` 后处理：

1. 扫描所有 BinaryMarket，按 `groupTitle` 分组
2. 仅 1 个 binary 的组 → 保持原样
3. ≥ 2 个 binary 的组 → 合并为单个 NegRiskEvent，每个原 binary 成为一个 outcome
4. 保持首次出现的位置

此机制确保无论转换器产生多少同 groupTitle 的 binary，UI 上只会显示一张合并后的多选卡片。

### 10.5 Tab 构建顺序

固定顺序：home → goals → halves → asian → corners → cards → specials

特殊处理：
- specials Tab 即使在原始数据中不存在，也会被创建（用于注入射手数据）
- goalscorer Tab 的「任何时间进球队员」数据被预提取并注入 specials

---

## 第 11 章：边界条件与异常处理

### 11.1 订单簿深度耗尽

市价单若吃完所有对手方深度仍未完全成交，未成交部分丢弃（不挂单）。

### 11.2 余额不足

下单前校验：total ≤ balance.available。不满足时确认按钮禁用。

### 11.3 市场状态变更对交易的影响

- open → suspended：交易面板中若选中了该市场，显示暂停提示，禁止提交
- open → settled：持仓按结算结果清算（Yes 赢 → 每份 $1，No 赢 → 每份 $0，Void → 退还成本）
- open → voided：持仓按成本价退还

### 11.4 NegRiskEvent 结算

Binary 市场按 yes/no 结算；NegRiskEvent 按 winningOutcomeId 结算——获胜 outcome 的 Yes 持仓每份 $1，其余 outcome 的 Yes 持仓每份 $0。

当前实现状态：store 中仅覆盖 BinaryMarket 结算逻辑，NegRiskEvent 整事件结算为待实现。

### 11.5 模拟引擎

详情页挂载时启动订单簿模拟，每 3-5 秒随机选取最多 3 个开放市场，在订单簿上随机添加 bid/ask 档位（深度最多 8 档）。详情页卸载时停止模拟。

### 11.6 列表页与详情页数据一致性

赛事列表页直接从 mock 数据读取静态快照（不订阅 store），详情页通过 store 管理交易状态。列表中的价格预览（moneyline、totalLine、asianLine）在构建时一次性提取，不随 store 中的交易变动更新。

---

## 附录 A：Tab 与市场数量汇总

| Tab | id | 说明 | 市场来源 |
|-----|----|------|---------|
| 热门 | home | 核心市场集合 | 从 home Tab 转换 |
| 进球 | goals | 进球相关市场 | 从 goals Tab 转换 |
| 上半场/下半场 | halves | 半场变种市场 | 从 halves Tab 转换 |
| 亚洲盘 | asian | 亚洲盘口线市场 | 从 asian Tab 转换 |
| 角球 | corners | 角球统计市场 | 从 corners Tab 转换 |
| 罚牌 | cards | 罚牌统计市场 | 从 cards Tab 转换 |
| 特殊投注 | specials | 复合市场 + 射手 | 从 specials Tab 转换 + goalscorer 注入 |

市场总数按 outcome 级计数（每个 BinaryMarket 计 1，每个 NegRiskEvent 按 outcomes.length 计）。

## 附录 B：产品页面路由

| 页面 | 路由 |
|------|------|
| 赛事列表 | `/clob` |
| 单场详情 | `/clob/match/:matchId` |

## 附录 C：待实现功能清单

### C.1 前端层

| # | 功能 | 说明 | 状态 |
|---|------|------|------|
| 1 | 订单簿深度可视化 | 紧凑模式 + 完整深度模式 | ✅ 已实现 |
| 2 | 市价/限价切换 | TradingPanel 中的订单类型切换 | ✅ 已实现 |
| 3 | Yes/No 双向交易 | 方向切换 + 联动计算 | ✅ 已实现 |
| 4 | 持仓/挂单/成交/结算面板 | PositionsPanel 四 Tab | ✅ 已实现 |
| 5 | 钱包余额展示 | WalletBar 三项余额 | ✅ 已实现 |
| 6 | 市场状态视觉（suspended/settled/voided） | ClobMarketRenderer 遮罩 | ✅ 已实现 |
| 7 | NegRiskEvent 自适应布局 | ≤4 网格 / 5-10 列表 / >10 多列网格 | ✅ 已实现 |
| 8 | 重复卡片合并 | mergeDuplicateBinaries 后处理 | ✅ 已实现 |
| 9 | 交易面板 sticky 定位 | overflow-x: clip 解除 scroll container 干扰 | ✅ 已实现 |
| 10 | NegRiskEvent 整事件结算 UI | 结算结果在 NegRisk 卡片上展示 | 待实现 |

### C.2 需要后端支撑的功能

| # | 功能 | 说明 |
|---|------|------|
| 11 | 真实订单撮合引擎 | 替换前端模拟撮合 |
| 12 | 订单簿深度实时推送 | WebSocket 推送订单簿变动 |
| 13 | 市场价格实时推送 | 价格变动实时推送 |
| 14 | 持久化订单/持仓/成交 | 后端存储 + API |
| 15 | 用户认证 + 钱包 | 登录、充值、提现 |
| 16 | 自动结算引擎 | 比赛结束后按规则自动结算所有市场 |
| 17 | NegRiskEvent 结算逻辑 | 确定 winningOutcomeId 并清算 |
| 18 | 赔率/价格 feed 接入 | 第三方数据源驱动价格 |
| 19 | 手续费/佣金系统 | 交易手续费和提款费 |
| 20 | 风控限额 | 单笔/单市场/单用户限额 |
