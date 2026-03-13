# TurboFlow MVP — 产品需求文档（PRD）

> **版本**：MVP 1.0
> **分支**：`mvp`
> **日期**：2026-02-28
> **状态**：开发中（前端原型）
> **线上地址**：https://errance.github.io/TurboFlow/

---

## 目录

1. [产品概述](#1-产品概述)
2. [目标用户与使用场景](#2-目标用户与使用场景)
3. [信息架构](#3-信息架构)
4. [页面与路由](#4-页面与路由)
5. [功能模块详述](#5-功能模块详述)
   - 5.1 [Explore 首页（事件浏览）](#51-explore-首页事件浏览)
   - 5.2 [Event Detail（事件详情）](#52-event-detail事件详情)
   - 5.3 [Contract Detail（合约高级交易 / CLOB）](#53-contract-detail合约高级交易--clob)
   - 5.4 [Sports Game（体育赛事详情）](#54-sports-game体育赛事详情)
   - 5.5 [TradePanel（交易面板）](#55-tradepanel交易面板)
   - 5.6 [Parlay / Bundle（组合投注）](#56-parlay--bundle组合投注)
   - 5.7 [Portfolio（投资组合）](#57-portfolio投资组合)
   - 5.8 [Leaderboard（排行榜）](#58-leaderboard排行榜)
   - 5.9 [异常状态处理](#59-异常状态处理)
6. [数据模型与类型定义](#6-数据模型与类型定义)
7. [业务公式](#7-业务公式)
8. [状态管理](#8-状态管理)
9. [UI/UX 规范](#9-uiux-规范)
10. [技术架构](#10-技术架构)
11. [MVP 边界：不包含的功能](#11-mvp-边界不包含的功能)
12. [Demo 路径](#12-demo-路径)

---

## 1. 产品概述

### 1.1 产品定位

TurboFlow 是一个**信息驱动的策略型预测市场平台**，让用户对真实世界事件的未来结果进行交易。用户通过买入 YES（看好事件发生）或 NO（看好事件不发生），以 USDC 稳定币作为结算单位进行交易。

### 1.2 核心价值主张

- **降低认知门槛**：Event-Centric 架构让用户先理解事件全貌，再选择合约交易；规则摘要和赔付说明前置可见
- **3 步完成交易**：Explore → Event Detail → Trade，主干路径极短
- **多品类覆盖**：标准预测市场 + 体育投注 + 即时价格预测 + 多选项市场
- **组合投注**：Parlay（串关）和 Bundle（独立结算组合投注），表达多事件联合判断
- **完整异常覆盖**：6 种主状态 × 5 种子状态，争议/退款/申诉全流程

### 1.3 MVP 定义

MVP 是一个**纯前端原型**，使用模拟数据和本地状态管理演示完整的产品流程。不对接后端 API、不连接真实 CLOB 撮合引擎、不涉及真实资金。所有交易模拟在本地 Zustand store 中完成。

---

## 2. 目标用户与使用场景

### 2.1 核心用户画像

| 用户类型 | 描述 | 核心需求 |
|----------|------|----------|
| **信息交易者** | 关注时事、宏观经济、加密市场的活跃用户 | 快速发现事件 → 理解规则 → 下单 → 管理持仓 |
| **体育投注者** | 有体育博彩经验的体育爱好者 | 接近传统体育博彩的 UI + 预测市场的价格发现 |
| **即时交易者** | 追求快节奏、短周期交易的用户 | 5 分钟窗口的即时价格预测市场 |

### 2.2 核心使用场景

| 场景 | 用户行为 | 对应功能 |
|------|---------|----------|
| 快速发现并交易 | 浏览首页 → 看到感兴趣的事件 → 点 YES/NO 下单 | Explore → TradePanel |
| 了解规则后交易 | 进入事件详情 → 阅读规则摘要/时间线 → 确认理解后交易 | EventDetail → RulesSummary → TradePanel |
| 精确挂单 | 进入合约详情 → 查看订单簿/图表 → 按自定义价格限价单 | ContractDetail → Orderbook → LimitOrder |
| 体育赛事投注 | 浏览体育分类 → 选比赛 → 选投注线 → 下单 | Sports Tab → SportsGamePage → TradePanel |
| 即时预测 | 进入 Live 分类 → 选资产 → 5 分钟价格预测 | Live Tab → InstantMarketCard → TradePanel |
| 组合投注 | 在多个事件中添加 leg → 设置金额 → 串关下注 | ParlayAddPopover → ParlaySlip → Place |
| 管理投资组合 | 查看持仓/订单/历史/盈亏曲线 | Portfolio Page |
| 处理异常 | 事件出现争议/暂停/取消 → 查看状态 → 提交证据/申诉 | StatusBanner → DisputePanel/RefundBanner |

---

## 3. 信息架构

### 3.1 Event-Centric 模型

TurboFlow 以 **Event（事件）** 为顶层实体，而非传统预测市场的单一 Market 模式：

```
PredictionEvent（事件容器）
├── 基本信息：标题、分类、状态、事件类型
├── 结果模型：independent（独立）| mutually-exclusive（互斥）
├── Contract[]（多个合约/选项）
│   ├── 概率 % + USDC 价格（yesPrice / noPrice）
│   ├── 24h 变化 + 成交量
│   ├── 合约子类型（binary / moneyline / spread / total）
│   └── payoutPerShare = 1 USDC
├── RulesSummary（三要素：测量对象 / 截止方式 / 结算来源）
├── Timeline（开放/关闭/结算日期）
├── StatusInfo（主状态 + 子状态 + 可用操作）
├── IncentiveTag[]（激励标签）
└── SportsMetadata（体育特有：联赛/队伍/比分/赛事时间）
```

### 3.2 结果模型

| 模型 | 语义 | 示例 |
|------|------|------|
| **independent** | 多个合约可同时为 YES | "Q1 前降息" 和 "H1 前降息" 可同时成真 |
| **mutually-exclusive** | 只有一个合约为 YES | "Film A / B / C 谁获奖"，只有一个赢 |

### 3.3 事件类型

| 类型 | 说明 | UI 差异 |
|------|------|---------|
| `standard` | 标准预测市场 | EventDetailPage |
| `multi-option` | 多选一市场（互斥） | EventDetailPage + OutcomeModelHint |
| `sports` | 体育赛事 | SportsGamePage（独立 UI） |
| `instant` | 即时预测（5 分钟） | InstantMarketCard（倒计时 + 进度条） |

### 3.4 渐进披露层级

| 层级 | 内容 | 用户何时看到 |
|------|------|-------------|
| **主干** | 事件卡片、合约 YES/NO、概率、TradePanel | 始终可见 |
| **上下文** | RulesSummary、Timeline、EventSummary | EventDetail 下方 Market Context 区域 |
| **分叉** | CLOB 订单簿、完整规则文本、争议详情 | 点击意图信号后展开 |
| **叶子** | 深度图可视化、历史成交明细 | 分叉页面中的详细内容 |

---

## 4. 页面与路由

### 4.1 路由表

| 路由 | 页面组件 | 说明 |
|------|---------|------|
| `/` | `EventsPage` | Explore 首页，事件浏览与发现 |
| `/event/:eventId` | `EventDetailPage` | 事件详情，主干交易页面 |
| `/contract/:contractId` | `ContractDetailPage` | 合约高级交易，CLOB 分叉 |
| `/game/:eventId` | `SportsGamePage` | 体育赛事详情，独立 UI |
| `/portfolio` | `PortfolioPage` | 投资组合管理 |
| `/leaderboard` | `LeaderboardPage` | 交易者排行榜 |

### 4.2 导航结构

**一级导航**：3 个 Tab — `Explore | Portfolio | Leaderboard`

- **桌面端**：顶部水平导航栏（Logo + 导航链接 + 主题切换）
- **移动端**：底部固定标签栏（图标 + 标签文字）

**全局浮动组件**：
- `ParlaySlip`：串关购物车（有 leg 时自动显示，移动端底部栏 / 桌面端右下角卡片）
- `ToastContainer`：全局通知提示

### 4.3 导航流程图

```
AppShell（全局布局）
├── Explore (/) ─────────────────────────────────────────
│   ├── [All] Landing：Featured Banner + Live 条 + 事件网格 + 侧边栏
│   ├── [Politics/Economics/Crypto/...] 分类筛选 + 事件网格
│   ├── [Sports] 按日期分组 + 比赛卡片
│   ├── [Live] 按资产类别分组 + 即时市场卡片
│   │
│   ├── → /event/:eventId（点击事件卡片）
│   │     ├── 合约表 + TradePanel（桌面右固定 / 移动 BottomSheet）
│   │     ├── Market Context（Rules / Timeline / Summary）
│   │     ├── → /contract/:contractId（点击图表图标，CLOB 分叉）
│   │     │     ├── PriceChart + Orderbook + RecentTrades
│   │     │     └── QuickOrderPanel / LimitOrderPanel
│   │     └── DisputePanel / RefundBanner / AppealDrawer（异常分叉）
│   │
│   └── → /game/:eventId（点击体育赛事）
│         ├── 队伍信息 + 比分 + 投注线（Moneyline/Spread/Total）
│         └── TradePanel
│
├── Portfolio (/portfolio) ─────────────────────────────────
│   ├── P&L 图表
│   ├── [Positions] 持仓列表 + 搜索 + 排序 + 持仓详情抽屉
│   ├── [Open Orders] 订单列表 + 取消/模拟成交
│   └── [History] 按日期分组的交易/订单历史
│
└── Leaderboard (/leaderboard) ──────────────────────────────
    ├── 时间筛选（This Month / All Time）
    ├── 排行榜表格（排名/用户/PnL/准确率/交易量/市场数）
    └── 激励机制卡片
```

---

## 5. 功能模块详述

### 5.1 Explore 首页（事件浏览）

**入口**：`/`（默认首页）

**功能描述**：用户发现和浏览预测事件的主要入口。

#### 5.1.1 分类 Tab 系统

| Tab | 内容 |
|-----|------|
| **All** | Landing 布局：Featured Banner → Live 横向滚动条 → 事件网格 + 侧边栏 |
| **Politics** | 政治类事件（选举、政策等） |
| **Economics** | 经济类事件（GDP、利率等） |
| **Crypto** | 加密货币类事件（BTC、ETH 里程碑等） |
| **Finance** | 金融类事件（股票、指数等） |
| **Tech** | 科技类事件（产品发布、AI 进展等） |
| **Culture** | 文化类事件（奥斯卡、娱乐等） |
| **Sports** | 体育赛事（独立 UI，按日期分组） |
| **Live** | 即时预测市场（按资产类别分组） |

#### 5.1.2 All Tab Landing 布局

| 区域 | 内容 | 位置 |
|------|------|------|
| **Featured Banner** | 运营推荐事件轮播，含标题/描述/CTA | 顶部通栏 |
| **Live Predictions** | 即时市场横向滚动条，含倒计时 | Banner 下方 |
| **事件网格** | 2 列 EventCard 卡片 | 左侧主内容区 |
| **Trending** | 热门事件列表 | 右侧边栏（桌面端） |
| **Top Movers** | 概率变动最大的合约 | 右侧边栏（桌面端） |

#### 5.1.3 事件卡片（EventCard）

| 元素 | 说明 |
|------|------|
| 事件标题 | 可点击，跳转 EventDetail |
| 分类标签 | 如 "Crypto"、"Economics" |
| 合约概率 + YES/NO 按钮 | 直接触发 TradePanel |
| 24h 变化 | 价格变动百分比（绿/红） |
| 交易量 | 格式化显示（如 "$1.2M"） |
| 激励标签 | 如 "+20% Volume Reward" |
| Parlay "+" 按钮 | 添加到串关 |

#### 5.1.4 搜索与筛选

- **搜索框**：按事件标题模糊搜索
- **分类筛选**：通过 Tab 切换
- **状态筛选**：侧边栏 Filter（Open/Closed/Settled）
- **标签筛选**：侧边栏 Tags
- **体育筛选**：Sport 类型 + League + 日期 + 状态（Upcoming/Live/Results）
- **Live 筛选**：Asset 类别（Crypto/Stocks/Commodities/Forex）

#### 5.1.5 Sports 分类布局

- 按日期分组显示体育赛事
- 每日分组内显示 `SportsGameCard`
- 卡片包含：联赛、队伍名/Logo/战绩、比赛时间/状态、Moneyline 概率
- 点击卡片跳转 `/game/:eventId`
- 支持状态筛选：Upcoming（默认）/ Live / Results

#### 5.1.6 Live 分类布局

- 按资产类别分组显示即时市场
- `InstantMarketCard` 包含：
  - 资产名称 + 当前价格 + 方向标记
  - 5 分钟倒计时进度条
  - Strike 价格 + YES/NO 概率按钮
  - 交易量
- 倒计时为视觉模拟（MVP）

#### 5.1.7 移动端适配

- 侧边栏（Trending/TopMovers/Filters）变为可滑出的抽屉
- 事件网格变为单列
- Tab 栏水平可滚动

---

### 5.2 Event Detail（事件详情）

**入口**：`/event/:eventId`
**角色**：主干交易页面，用户在此完成大部分交易操作

#### 5.2.1 页面布局

**桌面端**（两栏布局）：

| 区域 | 位置 | 内容 |
|------|------|------|
| 页头 | 顶部 | 返回按钮、事件标题、状态徽章、分类标签、交易量 |
| StatusBanner | 标题下方（条件显示） | 异常状态横幅 |
| RefundBanner | StatusBanner 下方（条件显示） | 退款信息 |
| OutcomeModelHint | 合约表上方（互斥事件） | "Only one can be YES" 提示 |
| 合约表 | 左侧主内容区 | 合约列表 + YES/NO 按钮 + 概率 + 变化 |
| 概率历史图表 | 合约表下方 | PriceChart 组件 |
| RequestSettlePanel | 图表下方（RESOLVING 状态） | 请求结算 / 报告问题面板 |
| Market Context | 底部 | RulesSummary + Timeline & Payout + Event Summary |
| **TradePanel** | **右侧固定** | 交易面板（选中合约后激活） |

**移动端**：TradePanel 以 BottomSheet 弹出。

#### 5.2.2 合约表（Contract Table）

每行合约展示：

| 列 | 说明 |
|----|------|
| 合约标签 | 如 "BTC > $100K" |
| YES 概率 + 按钮 | 绿色，点击选中并激活 TradePanel |
| NO 概率 + 按钮 | 红色，点击选中并激活 TradePanel |
| 24h 变化 | +/- 百分比 |
| 交易量 | 格式化金额 |
| 图表图标 | 点击进入 ContractDetailPage（CLOB 分叉） |
| Parlay "+" 按钮 | 添加到串关 |

**互斥事件特殊行为**：
- 显示 `OutcomeModelHint` 提示："These contracts are mutually exclusive — only one can resolve YES"
- 用户买 NO 时，TradePanel 显示上下文提示："You're betting: NOT \"{contract.label}\" — you win if any other option is the final result."

#### 5.2.3 Market Context 区域

**RulesSummaryCard**（规则摘要三要素）：

| 要素 | 说明 | 示例 |
|------|------|------|
| **What** | 测量什么 | "Whether BTC/USD price exceeds $100,000" |
| **When** | 何时截止 | "Market closes on March 31, 2026 at 23:59 UTC" |
| **How** | 数据来源 | "Resolved based on CoinGecko BTC/USD spot price" |

附 "View Full Rules" 按钮，点击展开 Drawer 显示完整规则文本。

**TimelinePayoutCard**（时间线与赔付）：

| 元素 | 说明 |
|------|------|
| Open 日期 | 市场开放时间 |
| Close 日期 | 交易截止时间 |
| Settle 日期 | 预期结算时间 |
| Payout 说明 | "Win = 1 USDC/share · Lose = 0 USDC/share" |

**EventSummaryCard**（事件摘要）：
- Summary 段落：事件背景描述
- Key Points 列表：3-5 个关键信息点

#### 5.2.4 分叉入口

| 分叉 | 意图信号 | 目标 |
|------|---------|------|
| CLOB 高级交易 | 点击合约行图表图标 | `/contract/:contractId` |
| 完整规则 | 点击 "View Full Rules" | Drawer |
| 争议详情 | 点击 StatusBanner "View Dispute" | SideDrawer (DisputePanel) |
| 申诉 | 点击 "Appeal" 按钮 | AppealDrawer |

---

### 5.3 Contract Detail（合约高级交易 / CLOB）

**入口**：`/contract/:contractId`
**角色**：CLOB 高级交易分叉，面向需要精确定价的用户

#### 5.3.1 页面布局

**桌面端**（两栏布局）：

| 区域 | 位置 | 内容 |
|------|------|------|
| 页头 | 顶部 | 返回事件链接、合约标签、概率、24h 变化、状态 |
| Resolution Source | 页头下方 | 结算来源 + "Rules" 按钮 |
| PriceChart | 左侧上方 | 价格走势图（lightweight-charts） |
| Orderbook | 左侧中间 | 买卖盘口（可点击价格预填限价单） |
| Recent Trades | 左侧下方 | 最近成交列表 |
| **交易面板** | **右侧固定** | Market/Limit Tab 切换 |

**移动端**：底部固定 "Trade" 按钮，点击弹出 BottomSheet。

#### 5.3.2 PriceChart（价格走势图）

- 基于 lightweight-charts 库
- 显示 YES 和 NO 价格双线走势
- 时间轴格式化（HH:MM）
- 价格轴格式化（USDC 小数）
- 暗色/亮色主题适配

#### 5.3.3 Orderbook（订单簿）

| 元素 | 说明 |
|------|------|
| Asks（卖单） | 红色，价格降序排列，显示价格/数量/累积量 |
| Spread | 中间显示 bid-ask 价差 |
| Bids（买单） | 绿色，价格降序排列，显示价格/数量/累积量 |
| 背景进度条 | 按累积量占比显示深度可视化 |
| 价格点击 | 点击某一价格，预填到 LimitOrderPanel |

**实时更新**：
- 初始加载 Orderbook Snapshot
- 每 3-5 秒应用 Delta 增量更新
- 支持模拟断线重连（DevTools）

#### 5.3.4 DepthChart（深度图）

- SVG 绘制的买卖深度可视化
- 买方（绿色区域）和卖方（红色区域）
- Midpoint 标注
- 价格和数量轴

#### 5.3.5 QuickOrderPanel（市价单 — V1 组件）

用于 ContractDetailPage 的市价单面板：

| 步骤 | 说明 |
|------|------|
| 1. 选方向 | YES/NO 切换 |
| 2. 输入金额 | USDC 金额输入 |
| 3. 点击 Buy | 弹出确认 Modal |
| 4. 确认 | 执行快速订单（含场景模拟：filled / partial_then_filled / rejected） |
| 5. 反馈 | Spinner → 状态文字 → Toast 通知 |

**场景模拟**（MVP Demo 特性）：
- `filled`：立即成交
- `partial_then_filled`：先部分成交，再完全成交
- `rejected`：被拒绝（如市场已关闭）

#### 5.3.6 LimitOrderPanel（限价单 — V1 组件）

用于 ContractDetailPage 的限价单面板：

| 字段 | 说明 | 联动规则 |
|------|------|----------|
| Direction | YES/NO 切换 | — |
| Market price | 当前市场参考价 | 只读展示 |
| Price per share | 0.01 – 0.99 USDC | 改变时自动更新 Total |
| Shares | 份数（整数） | 改变时自动更新 Total |
| Total cost | 总成本 = Price × Shares | 改变时自动反算 Shares |
| 快捷百分比 | 25% / 50% / 75% / Max | 按可用余额比例填充 |
| Advanced: TIF | GTC（默认） / IOC | 折叠显示 |
| 预估面板 | Payout / Total Cost / Profit | 输入有效时显示 |

**预填功能**：从 Orderbook 点击价格后，自动填入 Price 和 Side。

**确认流程**：点击下单 → 确认 Modal（Side/Price/Shares/Total/TIF）→ Confirm → Toast 通知。

---

### 5.4 Sports Game（体育赛事详情）

**入口**：`/game/:eventId`
**角色**：体育赛事的独立 UI

#### 5.4.1 页面布局

| 区域 | 内容 |
|------|------|
| Game Header | 联赛标识、状态标签、主队 vs 客队（名称/缩写/战绩/Logo）、比分（进行中/已结束） |
| StatusBanner | 异常状态横幅（暂停/取消等） |
| Betting Lines | 按类型分组的投注线合约 |
| Rules & Settlement | 可折叠的规则区域 |
| TradePanel | 桌面端右固定 / 移动端 BottomSheet |

#### 5.4.2 投注线类型

| 类型 | 说明 | 合约示例 |
|------|------|----------|
| **Moneyline** | 胜负盘 | "Lakers Win" YES 55% / NO 45% |
| **Spread** | 让分盘 | "Lakers -4.5" YES 52% / NO 48% |
| **Total** | 大小分 | "Over 215.5" YES 48% / NO 52% |
| **Other Props** | 其他衍生盘 | 按 binary 类型显示 |

每条投注线显示 YES/NO 按钮 + 概率，点击激活 TradePanel。

#### 5.4.3 队伍信息展示

| 元素 | 说明 |
|------|------|
| 队名 | 全名 + 缩写 |
| 战绩 | 如 "32-18" |
| Logo | 文字圆形头像 |
| 比分 | 进行中实时显示 / 已结束显示最终比分 |

---

### 5.5 TradePanel（交易面板）

**角色**：全站统一的交易组件，单一组件两种容器

#### 5.5.1 容器适配

| 场景 | 容器 |
|------|------|
| EventDetailPage 桌面端 | 右侧固定面板 |
| EventDetailPage 移动端 | BottomSheet |
| SportsGamePage 桌面端 | 右侧固定面板 |
| SportsGamePage 移动端 | BottomSheet |

#### 5.5.2 面板结构

| 区域 | 内容 |
|------|------|
| 头部 | "Trading" + 事件标题 + 合约标签 |
| Side 切换 | YES（绿）/ NO（红），显示概率百分比 |
| 互斥提示 | 互斥事件买 NO 时显示上下文说明 |
| 订单类型切换 | Market / Limit |
| 订单类型说明 | Market: "Instant fill at current best price" / Limit: "Set your own price and wait for a match" |

#### 5.5.3 Market Order（市价单）

| 元素 | 说明 |
|------|------|
| Est. execution price | 当前价格 + 概率 + 24h 变化 |
| Spend (USDC) 输入 | 带 $ 前缀和 USDC 后缀 |
| 快捷金额 | $10 / $25 / $50 / $100 |
| 预估面板 | Price per share / Est. shares / Potential payout / Potential profit |
| Payout 说明 | "Win = 1 USDC/share · Lose = 0 USDC/share"（始终可见） |
| 下单按钮 | "Buy YES — $XX.XX" 或 "Buy NO — $XX.XX" |

#### 5.5.4 Limit Order（限价单）

| 元素 | 说明 |
|------|------|
| Est. execution price | 当前价格 + 24h 变化 |
| Price per share | 0.01 – 0.99 USDC 输入 |
| Shares | 份数输入 |
| 快捷百分比 | 25% / 50% / 75% / Max（基于可用余额） |
| Total cost | 总成本 = Price × Shares（三字段联动） |
| Available | 可用余额显示 |
| Advanced: TIF | GTC / IOC 选择（折叠） |
| 预估面板 | Potential payout / Potential profit |
| Payout 说明 | "Win = 1 USDC/share · Lose = 0 USDC/share" |
| 下单按钮 | "Limit YES — 100 @ 0.65" |

#### 5.5.5 三字段联动逻辑

```
修改 Price → Total = Price × Shares
修改 Shares → Total = Price × Shares
修改 Total → Shares = floor(Total / Price)
```

#### 5.5.6 交易确认流程

**Market Order (EventDetail)**：
1. 点击下单按钮
2. 直接执行（调用 `orderStore.placeMarketOrder`）
3. 弹出 `TradeConfirmModal`（成交详情 + Potential Profit + Buy More / Done 按钮）

**Limit Order (EventDetail)**：
1. 点击下单按钮
2. 直接执行（调用 `orderStore.placeLimitOrder`）
3. Toast 通知 "Limit order placed — view in Portfolio"

#### 5.5.7 禁用状态

当以下条件满足时，交易按钮禁用并显示 "Trading Unavailable"：
- 事件状态不为 `OPEN`
- 子状态为 `paused`

---

### 5.6 Parlay / Bundle（组合投注）

**角色**：多事件联合投注的购物车式体验

#### 5.6.1 添加 Leg

**入口**：EventCard / 合约行上的 "+" 按钮
**组件**：`ParlayAddPopover`

**添加逻辑**：
- 选择 YES 或 NO 方向
- 系统记录 `{ contractId, eventId, side, price, eventTitle, contractLabel }`
- 添加后自动显示 ParlayBar

**校验规则**：

| 规则 | 行为 |
|------|------|
| 同一合约不能同时买 YES 和 NO | Toast 提示冲突 |
| 同一合约同一方向不能重复添加 | Toast 提示已存在 |
| 同一事件下不同合约 | 允许，但提示相关性 |

#### 5.6.2 ParlayBar（折叠态）

**移动端**：固定在底部 Tab 栏上方的紧凑条
**桌面端**：右下角浮动卡片

显示内容：腿数、组合赔率（如 "7.69x"）、"View Slip" 入口

#### 5.6.3 ParlayPanel（展开态）

点击 ParlayBar 展开完整面板。

| 区域 | 内容 |
|------|------|
| 头部 | "Parlay Slip" + 腿数 + Clear All + 关闭按钮 |
| Mode 切换 | Parlay / Bundle |
| Mode 说明 | Parlay: "All legs must win" / Bundle: "Each leg settles independently" |
| Leg 列表 | 每腿：事件标题 + Side + 合约标签 + 价格 + 删除按钮 |
| 最少腿数提示 | < 2 腿时显示 "Add at least 2 legs" |
| Combined Odds | 公式展示：1 ÷ (p1 × p2 × ... × pn) |
| Stake 输入 | USDC 金额 + 快捷金额（$10/$25/$50/$100） |
| 分配明细 | 每腿：分配金额 → 份数 → 实际成本 |
| Residual | 取整误差处理说明 |
| 收益预估 | Parlay: Potential Payout + Profit / Bundle: Max Payout (all win) |
| 下单按钮 | "Place Parlay — $XX" 或 "Place Bundle — $XX" |

#### 5.6.4 两种模式对比

| 维度 | Parlay（串关） | Bundle（组合投注） |
|------|---------------|-------------------|
| 结算规则 | 全中才有收益 | 每腿独立结算 |
| 收益公式 | totalStake × combinedOdds | Σ(正确腿的 shares × 1 USDC) |
| 风险 | 高（全中 or 全输） | 中（部分命中仍有回报） |
| 仓位记录 | 每腿独立仓位，标记 parlayId | 每腿独立仓位，标记 parlayId |

#### 5.6.5 下单执行流程

1. 计算 `stakePerLeg = totalStake / n`
2. 每腿：`shares = round(stakePerLeg / price)`，`legCost = shares × price`
3. 计算 `actualCost = Σ legCost`，`residual = totalStake - actualCost`
4. 为每腿调用 `portfolioStore.executeTrade()`，生成独立的 Trade 和 Position
5. 所有腿的 Position 关联同一个 `parlayId`
6. 记录完整的 Parlay 记录到 `parlayStore.placedParlays`
7. 清空 slip，显示成功 Toast

---

### 5.7 Portfolio（投资组合）

**入口**：`/portfolio`
**角色**：用户管理持仓、订单和交易历史的中心

#### 5.7.1 页面结构

| 区域 | 内容 |
|------|------|
| 页头 | "Portfolio" 标题 |
| P&L 图表 | 盈亏历史曲线（1D / 1W / 1M / ALL） |
| Tab 切换 | Positions / Open Orders / History |

#### 5.7.2 P&L 图表

- 时间范围选择器：1D / 1W / 1M / ALL
- 数据点：1D=24 小时点，1W=7 天点，1M=30 天点，ALL=90 天点
- 展示累计盈亏（正值绿色，负值红色）
- 显示当前 P&L 数值和百分比变化

#### 5.7.3 Positions Tab

**排序选项**（6 种）：

| 排序 | 指标 | 默认方向 |
|------|------|----------|
| Current Value | quantity × currentPrice | 降序 |
| P&L $ | unrealizedPnl | 降序 |
| P&L % | unrealizedPnlPercent | 降序 |
| Shares | quantity | 降序 |
| Alphabetically | marketTitle | 升序 |
| Latest Price | currentPrice | 降序 |

**搜索**：按市场/合约名称模糊搜索

**持仓卡片**（单个持仓）：

| 元素 | 说明 |
|------|------|
| 市场标题 | 可点击查看详情 |
| Side 标签 | YES（绿）/ NO（红） |
| Shares | 持仓份数 |
| Avg Price | 平均成本 |
| Current Price | 当前价格 |
| P&L | 金额 + 百分比 + 颜色编码 |
| Status | OPEN / CLOSED / SETTLED（带结果） |
| Close Position | 平仓按钮（仅 OPEN 仓位） |
| View | 跳转合约详情 |

**Parlay/Bundle 分组**：
- 属于同一 parlayId 的仓位聚合显示
- 组头部显示：模式（Parlay/Bundle）、组合赔率、日期、展开/折叠
- 展开后显示每腿详情
- 汇总值：Group Value / Group PnL / Group PnL%

**持仓详情抽屉**（Position Detail Drawer）：
- 点击持仓卡片打开右侧抽屉
- 详细展示所有持仓字段
- Close Position 操作入口

#### 5.7.4 Open Orders Tab

| 元素 | 说明 |
|------|------|
| 订单卡片 | 市场标题 + Side + 类型 + 状态 + 价格 + 数量 |
| Status 标签 | Open（蓝）/ PartialFill（黄）/ Filled（绿）/ Cancelled（灰）/ Rejected（红） |
| Cancel 按钮 | 取消单个订单 |
| Simulate Fill | MVP Demo 功能，模拟限价单成交 |
| Cancel All | 批量取消所有 Open Orders |

#### 5.7.5 History Tab

**筛选器**：
- Side: All / YES / NO
- Kind: All / Trades / Orders

**展示**：
- 按日期分组
- 每条记录显示：时间 + 市场 + Side + Action + Price + Quantity + 状态
- Trade 记录和 Order 记录混合展示

#### 5.7.6 平仓流程

1. 用户点击 "Close Position"
2. 创建一笔 SELL Market Order（同 outcome side，action = SELL）
3. 系统模拟即时成交（Filled）
4. 按成交价减少/移除仓位
5. 生成 Trade 和 Order 记录
6. Toast 通知成功
7. MVP 仅支持 100% 全仓平仓

---

### 5.8 Leaderboard（排行榜）

**入口**：`/leaderboard`

#### 5.8.1 排行榜表格

| 列 | 说明 |
|----|------|
| Rank | 排名（前 3 名金/银/铜色） |
| Trader | 用户名 |
| PnL | 盈亏金额（带颜色编码） |
| Accuracy | 准确率百分比 |
| Volume | 交易总量 |
| Markets | 参与市场数 |

**时间筛选**：This Month / All Time

#### 5.8.2 Incentives 卡片

| 卡片 | 内容 |
|------|------|
| Volume Incentives | 交易量奖励说明 + 阶梯奖励表 |
| Liquidity Incentives | 流动性提供奖励说明 |

---

### 5.9 异常状态处理

#### 5.9.1 事件状态机

**主状态**（EventStatus）：

| 状态 | 含义 | 可操作 |
|------|------|--------|
| `OPEN` | 正常开放交易 | BUY / SELL / 下单 / 取消订单 |
| `CLOSED` | 交易截止 | 仅查看 |
| `RESOLVING` | 判定结果中 | 申请结算 / 报告问题 |
| `SETTLED` | 已结算 | 查看最终盈亏 / 申诉 |
| `CANCELLED` | 被取消 | 查看退款 |
| `VOIDED` | 作废 | 查看退款 |

**子状态**（EventSubStatus）：

| 子状态 | 含义 |
|--------|------|
| `normal` | 正常运行 |
| `paused` | 暂停交易（如数据源异常） |
| `disputed` | 结果有争议 |
| `delayed` | 结算延迟 |
| `emergency` | 紧急状态 |

#### 5.9.2 操作矩阵

| 状态 + 子状态 | 可下单 | 可撤单 | 可申诉 | 可请求结算 |
|---|---|---|---|---|
| OPEN + normal | ✅ | ✅ | ❌ | ❌ |
| OPEN + paused | ❌ | ❌ | ❌ | ❌ |
| RESOLVING + normal | ❌ | ❌ | ❌ | ✅ |
| RESOLVING + disputed | ❌ | ❌ | ✅（提交证据） | ❌ |
| SETTLED + normal | ❌ | ❌ | ✅（申诉） | ❌ |
| CANCELLED / VOIDED | ❌ | ❌ | ❌ | ❌ |

#### 5.9.3 StatusBanner

异常状态横幅，颜色编码 + 状态描述 + 操作按钮：

| 状态 | 颜色 | 操作按钮 |
|------|------|----------|
| OPEN + paused | 黄色 | — |
| CLOSED | 灰色 | — |
| RESOLVING | 蓝色 | Request Settle / Report Issue |
| RESOLVING + disputed | 橙色 | View Dispute |
| SETTLED | 绿色 | Appeal（如不满结果） |
| CANCELLED | 红色 | View Refund |
| VOIDED | 红色 | View Refund |

#### 5.9.4 DisputePanel（争议面板）

以 SideDrawer 形式打开，包含：
- 争议时间线
- 双方论据
- 提交证据表单（选择立场 + 描述 + 提交按钮）
- 仲裁状态

#### 5.9.5 RefundBanner（退款横幅）

在 CANCELLED/VOIDED 事件中显示：
- 退款原因
- 退款依据
- 退款状态

#### 5.9.6 RequestSettlePanel（请求结算面板）

在 RESOLVING 状态事件中显示：
- Request Settlement 按钮
- Report Issue 按钮
- 结算来源说明

#### 5.9.7 AppealDrawer（申诉抽屉）

在 SETTLED 事件中通过 "Appeal" 按钮打开：
- 申诉理由输入
- 提交申诉

#### 5.9.8 订单处置规则

当市场状态变化时，系统自动处理未完成订单：

| 状态变化 | Open Orders 处理 | 保证金处理 |
|----------|------------------|------------|
| OPEN → PAUSED | 冻结，暂停撮合 | 保持冻结 |
| OPEN → CLOSED | 全部自动取消 | 退还 |
| → VOIDED | 全部自动取消 | 退还 |
| → CANCELLED | 全部自动取消 | 退还 |

---

## 6. 数据模型与类型定义

### 6.1 核心类型

#### PredictionEvent（预测事件）

```typescript
interface PredictionEvent {
  id: string
  title: string
  description: string
  type: 'standard' | 'multi-option' | 'sports' | 'instant'
  category: EventCategory
  outcomeModel: 'independent' | 'mutually-exclusive'
  status: EventStatus
  statusInfo: EventStatusInfo
  contracts: Contract[]
  rules: { summary: string; full: string }
  rulesSummary: { what: string; when: string; how: string }
  timeline: EventTimeline
  summary?: { text: string; keyPoints: string[] }
  volume: number
  featured?: boolean
  incentives?: IncentiveTag[]
  sportsMetadata?: SportsMetadata
  instantMeta?: InstantMarketMeta
  hedgeHints?: HedgeHint[]
}
```

#### Contract（合约）

```typescript
interface Contract {
  id: string
  label: string
  type: 'binary' | 'moneyline' | 'spread' | 'total'
  status: 'active' | 'suspended' | 'settled'
  yesPrice: number        // 0.01 – 0.99 USDC
  noPrice: number         // 0.01 – 0.99 USDC
  probability: number     // 1 – 99 (%)
  change24h: number       // 百分比变化
  volume: number
  payoutPerShare: number  // 固定 1 USDC
  settlementResult?: 'YES' | 'NO'
}
```

#### Order（订单）

```typescript
interface Order {
  id: string
  marketId: string
  contractId?: string
  marketTitle: string
  side: 'YES' | 'NO'
  action: 'BUY' | 'SELL'
  type: 'market' | 'limit'
  price: number
  quantity: number
  filledQty: number
  status: 'Pending' | 'Open' | 'PartialFill' | 'Filled' | 'Cancelled' | 'Rejected'
  timeInForce: 'GTC' | 'GTD' | 'IOC' | 'FOK'
  fee: number
  createdAt: string
  updatedAt: string
  rejectReason?: string
  rejectCta?: { label: string; route: string }
}
```

#### Position（持仓）

```typescript
interface Position {
  id: string
  marketId: string
  contractId: string
  marketTitle: string
  side: 'YES' | 'NO'
  quantity: number
  avgPrice: number
  currentPrice: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  status: 'OPEN' | 'CLOSED' | 'SETTLED'
  settlementResult?: 'YES' | 'NO'
  finalPnl?: number
  parlayId?: string
}
```

#### Trade（成交记录）

```typescript
interface Trade {
  id: string
  orderId: string
  marketId: string
  contractId?: string
  marketTitle: string
  side: 'YES' | 'NO'
  action: 'BUY' | 'SELL'
  price: number
  quantity: number
  fee: number
  timestamp: string
  parlayId?: string
}
```

#### Parlay（组合投注）

```typescript
interface Parlay {
  id: string
  legs: ParlayLeg[]
  stake: number
  mode: 'parlay' | 'bundle'
  combinedOdds: number
  potentialPayout: number
  actualCost: number
  residual: number
  createdAt: string
  status: 'active' | 'settled' | 'cancelled'
}
```

### 6.2 辅助类型

| 类型 | 定义 |
|------|------|
| `EventCategory` | `'All' \| 'Live' \| 'Politics' \| 'Economics' \| 'Crypto' \| 'Finance' \| 'Tech' \| 'Culture' \| 'Sports'` |
| `EventStatus` | `'OPEN' \| 'CLOSED' \| 'RESOLVING' \| 'SETTLED' \| 'CANCELLED' \| 'VOIDED'` |
| `EventSubStatus` | `'normal' \| 'paused' \| 'disputed' \| 'delayed' \| 'emergency'` |
| `EventAction` | `'appeal' \| 'view_dispute' \| 'request_settle' \| 'report_issue' \| 'view_refund' \| 'view_evidence'` |
| `OrderSide` | `'YES' \| 'NO'` |
| `OrderAction` | `'BUY' \| 'SELL'` |
| `OrderType` | `'market' \| 'limit'` |
| `OrderStatus` | `'Pending' \| 'Open' \| 'PartialFill' \| 'Filled' \| 'Cancelled' \| 'Rejected'` |
| `TimeInForce` | `'GTC' \| 'GTD' \| 'IOC' \| 'FOK'`（MVP 仅支持 GTC） |
| `MVP_FEE_RATE` | `0`（零费率，公式保留费用项） |

---

## 7. 业务公式

### 7.1 定价

**YES/NO 互补关系**：

$$p_{yes} + p_{no} = 1.00 \text{ USDC}$$

**概率映射**：

$$\text{probability} \approx \text{displayPrice} \times 100\%$$

### 7.2 交易盈亏

**买入总成本**：

$$\text{entryCost} = \text{avgPrice} \times \text{quantity} + \text{fee}_{entry}$$

**当前市值**：

$$\text{currentValue} = \text{currentPrice} \times \text{quantity}$$

**未实现盈亏**：

$$\text{unrealizedPnl} = \text{currentValue} - \text{entryCost}$$

$$\text{unrealizedPnlPercent} = \frac{\text{unrealizedPnl}}{\text{entryCost}} \times 100\%$$

**结算盈亏**：

$$\text{settlementPnl} = \begin{cases} (\text{payoutPerShare} \times \text{quantity}) - \text{entryCost} & \text{胜出方} \\ 0 - \text{entryCost} & \text{败出方} \end{cases}$$

### 7.3 费用

$$\text{fee} = \text{price} \times \text{quantity} \times \text{feeRate}$$

MVP 阶段 feeRate = 0%，公式保留以便后续启用。

### 7.4 组合投注

**组合赔率**：

$$\text{combinedOdds} = \frac{1}{p_1 \times p_2 \times \cdots \times p_n}$$

**等额分配**：

$$\text{stakePerLeg} = \frac{\text{totalStake}}{n}$$

**每腿份数（取整）**：

$$\text{shares}_i = \text{round}\left(\frac{\text{stakePerLeg}}{p_i}\right)$$

**Residual（取整误差）**：

$$\text{residual} = \text{totalStake} - \sum_{i=1}^{n} (\text{shares}_i \times p_i)$$

**Parlay 收益**：全部正确时 = totalStake × combinedOdds；任一错误 = 0

**Bundle 收益**：

$$\text{totalPayout} = \sum_{i \in \text{correct}} \text{shares}_i \times 1 \text{ USDC}$$

### 7.5 Portfolio 口径

| 口径 | 计算 |
|------|------|
| Cash Balance | 初始入金 - 买入支出 + 卖出/结算收入（MVP 为固定 mock） |
| Reserved for Open Orders | Σ(openOrder.price × openOrder.remainingQty) |
| Available to Trade | cashBalance - reservedForOpenOrders |
| Positions Value | Σ(currentPrice × quantity) |
| Portfolio Value | positionsValue + cashBalance |

### 7.6 仓位合并

**合并条件**（三者同时满足）：相同 contractId + 相同 side + 相同 parlayId

**加权平均价**：

$$\text{newAvgPrice} = \frac{\text{existingAvg} \times \text{existingQty} + \text{newAvg} \times \text{newQty}}{\text{existingQty} + \text{newQty}}$$

**隔离规则**：独立仓位间可合并；Parlay/Bundle 腿不与独立仓位合并；不同 Parlay/Bundle 的腿也不互相合并。

---

## 8. 状态管理

所有状态由 Zustand store 管理，作为单一真相源。

### 8.1 Store 清单

| Store | 职责 | 核心 State |
|-------|------|-----------|
| `eventStore` | 事件数据、分类、搜索、交易面板 | events, selectedCategory, searchQuery, selectedContractId, selectedSide, tradePanelOpen |
| `orderStore` | 订单 CRUD、快速/限价下单、场景模拟 | orders, activeScenario, scenarioStepIndex |
| `portfolioStore` | 持仓、成交记录、统一交易执行 | positions, trades, activeTab |
| `parlayStore` | 串关管理、校验、下单 | slip, slipOpen, placedParlays |
| `orderbookStore` | 订单簿快照 + 增量流 | bids, asks, lastSeq, isRunning |
| `toastStore` | 全局通知 | toasts |
| `themeStore` | 暗色/亮色主题 | theme |
| `marketStore` | V1 市场数据（向后兼容） | markets, selectedMarketId, filterStatus |

### 8.2 核心数据流

```
用户操作（YES/NO 点击）
  → TradePanel.handleQuickBuy() / handleLimitBuy()
    → orderStore.placeMarketOrder() / placeLimitOrder()
      → on Filled → portfolioStore.executeTrade()
        → addTrade() + addPosition()（合并或新建）
          → Portfolio 页面自动更新

Parlay:
  → ParlaySlip.handlePlace() → parlayStore.placeParlay(stake, mode)
    → per-leg → portfolioStore.executeTrade()
      → 每腿创建独立 Trade + Position（标记 parlayId）
```

### 8.3 Orderbook 数据流

```
loadSnapshot(marketId) → 初始化 bids/asks
  → startDeltaStream(marketId) → 每 3-5 秒 applyNextDelta()
    → 更新 bids/asks → UI 实时刷新
```

---

## 9. UI/UX 规范

### 9.1 设计系统

| 维度 | 规范 |
|------|------|
| **框架** | Tailwind CSS + CSS Variables（主题） |
| **主题** | 暗色（默认）+ 亮色，可切换 |
| **颜色** | YES/正值 = `#2DD4BF`（青绿），NO/负值 = `#E85A7E`（红粉），警告 = `#F59E0B`（琥珀） |
| **字体** | 数值使用 `font-mono tabular-nums`（等宽对齐） |
| **结算单位** | 全站 USDC，无 ¢ 残留 |
| **触控区** | 所有可点击元素 >= 44×44px |
| **价格格式** | 概率 % 为主 + USDC 标注 |

### 9.2 组件库

| 组件 | 说明 |
|------|------|
| `Button` | 5 种 variant（primary/secondary/danger/ghost/outline）× 3 种 size（sm/md/lg）+ fullWidth + disabled |
| `Input` | 标准输入框（label/suffix/disabled/error） |
| `Card` | 内容卡片容器 |
| `Badge` | 状态标签（多种颜色 variant） |
| `Modal` | 居中弹窗（标题 + 内容 + 关闭） |
| `Drawer` | 底部抽屉（移动端）/ 侧边抽屉（通用） |
| `SideDrawer` | 右侧滑出抽屉（DisputePanel/PositionDetail） |
| `Tabs` | 标签页切换 |
| `SegmentedControl` | 分段控件（YES/NO 切换、Market/Limit 切换） |
| `Spinner` | 加载指示器 |
| `Toast` | 通知提示（success/error/info + 可选 CTA） |

### 9.3 响应式布局

| 断点 | 布局 |
|------|------|
| < 768px（移动端） | 单列布局，底部 Tab 栏，TradePanel 为 BottomSheet，侧边栏为抽屉 |
| ≥ 768px（桌面端） | 两栏布局，顶部导航栏，TradePanel 右固定，侧边栏内联 |

### 9.4 交互原则

| 原则 | 说明 |
|------|------|
| **立即反馈** | 每个操作有即时视觉反馈（按钮状态/Spinner/Toast） |
| **最终反馈** | 每次操作落到明确结果状态 |
| **失败可修复** | 失败给原因 + CTA 按钮 |
| **自解释** | TradePanel 始终显示事件名 + 合约名 + Payout 说明 |
| **渐进披露** | 高级功能推迟到分叉，不污染主干 |

---

## 10. 技术架构

### 10.1 技术栈

| 层 | 技术 |
|----|------|
| 框架 | React 18 + TypeScript |
| 构建 | Vite |
| 路由 | React Router v6 |
| 状态管理 | Zustand |
| 样式 | Tailwind CSS + CSS Variables |
| 图表 | lightweight-charts（价格图）+ SVG（深度图/P&L 图） |
| 部署 | GitHub Pages（GitHub Actions CI/CD） |

### 10.2 目录结构

```
src/
├── components/           # 可复用组件
│   ├── ui/              # 基础 UI 组件（Button, Input, Card, Modal, Drawer...）
│   ├── TradePanel.tsx   # 统一交易面板（EventDetail + SportsGame）
│   ├── QuickOrderPanel.tsx  # 市价单面板（ContractDetail, V1）
│   ├── LimitOrderPanel.tsx  # 限价单面板（ContractDetail, V1）
│   ├── ParlaySlip.tsx   # 串关购物车（ParlayBar + ParlayPanel）
│   ├── ParlayAddPopover.tsx # 串关添加弹窗
│   ├── Orderbook.tsx    # 订单簿
│   ├── PriceChart.tsx   # 价格走势图
│   ├── DepthChart.tsx   # 深度图
│   ├── PnlChart.tsx     # 盈亏历史图
│   ├── InstantMarketCard.tsx # 即时市场卡片
│   ├── SportsGameCard.tsx   # 体育赛事卡片
│   ├── SportsSidebar.tsx    # 体育筛选侧边栏
│   ├── StatusBanner.tsx     # 异常状态横幅（引用于页面内部）
│   ├── DisputePanel.tsx     # 争议面板
│   ├── RefundBanner.tsx     # 退款横幅
│   └── ShareButton.tsx      # 分享按钮（保留未挂载）
├── pages/               # 页面组件
│   ├── EventsPage.tsx   # Explore 首页
│   ├── EventDetailPage.tsx  # 事件详情
│   ├── ContractDetailPage.tsx # 合约高级交易
│   ├── SportsGamePage.tsx   # 体育赛事
│   ├── PortfolioPage.tsx    # 投资组合
│   └── LeaderboardPage.tsx  # 排行榜
├── stores/              # Zustand 状态管理
│   ├── eventStore.ts
│   ├── orderStore.ts
│   ├── portfolioStore.ts
│   ├── parlayStore.ts
│   ├── orderbookStore.ts
│   ├── toastStore.ts
│   ├── themeStore.ts
│   └── marketStore.ts
├── data/                # 模拟数据
│   ├── events.ts        # 事件目录
│   ├── orders.ts        # 样本订单
│   ├── trades.ts        # 样本成交
│   ├── positions.ts     # 样本持仓
│   ├── scenarios.ts     # 快速订单场景
│   ├── orderbooks.ts    # 订单簿快照 + 增量
│   ├── priceHistory.ts  # 价格历史
│   ├── pnlHistory.ts    # 盈亏历史
│   ├── leaderboard.ts   # 排行榜数据
│   └── markets.ts       # V1 市场数据
├── types/
│   └── index.ts         # 全局类型定义
├── layouts/
│   └── AppShell.tsx     # 全局布局（导航 + 内容 + ParlaySlip + Toast）
└── App.tsx              # 路由配置
```

### 10.3 Mock 数据覆盖

| 数据文件 | 数量 | 覆盖场景 |
|----------|------|----------|
| events.ts | 多种类型 | Standard / Multi-option / Sports / Instant，各种状态 |
| orders.ts | 7 条 | Open / PartialFill / Filled / Cancelled / Rejected |
| trades.ts | 8 条 | 不同市场、方向、价格 |
| positions.ts | 8 条 | 5 独立 + 3 Parlay 腿，OPEN / CLOSED / SETTLED |
| scenarios.ts | 3 个 | filled / partial_then_filled / rejected |
| orderbooks.ts | 2 市场 | 8 层买卖深度 + 18-20 增量更新 |
| priceHistory.ts | 6+动态 | 静态预定义 + 基于 hash 动态生成 |
| pnlHistory.ts | 4 范围 | 1D/1W/1M/ALL |
| leaderboard.ts | 15 用户 | 盈利和亏损用户 |

---

## 11. MVP 边界：不包含的功能

| 功能 | 排除原因 |
|------|----------|
| Strategy Basket（策略篮子 + Trench 讨论区） | 被 Parlay/Bundle 替代 |
| Forecast Opinion Cards（观点卡片） | 范围外 |
| Social Sharing（社交分享 + QR 码） | 范围外（ShareButton 保留未挂载） |
| Follow/Following System | 范围外 |
| Hedge Suggestions（对冲建议） | 范围外 |
| 真实后端 API | MVP 为纯前端原型 |
| 真实 CLOB 撮合引擎 | 使用本地模拟 |
| 真实资金 / 钱包连接 | 使用 mock 余额 |
| 用户认证 / 账户系统 | 无 |
| Grouped Collateral（组合保证金） | 按独立保证金计算 |
| 部分平仓 | 仅支持 100% 全仓平仓 |
| GTD / IOC / FOK 有效期 | 仅支持 GTC |
| 动态费率（maker/taker） | feeRate = 0 |

---

## 12. Demo 路径

以下是 MVP 的推荐演示流程，覆盖所有核心功能：

| 步骤 | 操作 | 演示功能 |
|------|------|----------|
| 1 | **Explore 首页** → 浏览 Featured Banner → 查看分类 Tab | 事件发现、信息架构 |
| 2 | 点击事件卡片 → **Event Detail** → 查看合约表/规则/时间线 | 事件详情、渐进披露 |
| 3 | 选合约 YES → 输入金额 → **Market Order** → 确认 | 快速交易、TradePanel |
| 4 | 切换 Limit Tab → 输入价格/份数 → **Limit Order** | 限价单、三字段联动 |
| 5 | 点击图表图标 → **Contract Detail** → 查看 Orderbook | CLOB 分叉、订单簿 |
| 6 | 点击 Orderbook 价格 → 预填限价单 → 下单 | 价格预填、精确定价 |
| 7 | 切换 Sports Tab → 选比赛 → **Sports Game** → Moneyline 下注 | 体育独立 UI |
| 8 | 切换 Live Tab → 选即时市场 → 查看倒计时 → 交易 | 即时预测市场 |
| 9 | 在多个事件中点击 "+" → **Parlay Slip** → 切换 Parlay/Bundle → 下注 | 组合投注 |
| 10 | 进入 **Portfolio** → 查看持仓 / P&L 图表 → 排序/搜索 | 投资组合管理 |
| 11 | 查看 Parlay 分组仓位 → 展开查看每腿详情 | Parlay 仓位聚合 |
| 12 | Open Orders → Simulate Fill → 查看状态变化 | 订单生命周期 |
| 13 | 平仓一个持仓 → 查看 History | 平仓流程 |
| 14 | 查看异常状态事件 → StatusBanner → Dispute/Refund | 异常处理 |
| 15 | 进入 **Leaderboard** → 切换时间范围 | 排行榜 |
| 16 | 切换暗色/亮色主题 → 验证全站主题一致 | 主题系统 |

---

*文档生成时间：2026 年 2 月 28 日*
*基于 TurboFlow 代码库 mvp 分支分析*
