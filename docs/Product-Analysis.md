# TurboFlow 产品分析

---

## 一、完整产品路径

### 1.1 信息架构：Event-Centric（事件中心化）

TurboFlow 采用 **Event → Contracts → Trade** 三层渐进披露架构，而非传统预测市场的单一市场列表模式。

```
PredictionEvent（事件容器）
├── 基本信息：标题、分类、状态、规则摘要
├── Contract[]（多个合约/选项）
│   ├── 概率 % + USDC 价格
│   ├── 24h 变化 + 成交量
│   └── 订单簿（CLOB）
├── Rules & Settlement（结算规则）
├── Timeline & Payout（时间线与赔付）
└── StatusInfo（状态机：6 父状态 × 5 子状态）
```

### 1.2 核心用户路径（主干 3 步完成交易）

```
Explore 首页 → 点击事件卡片 → EventDetailPage → 选合约/方向 → TradePanel → 确认
```

- **Explore 首页**：运营首页（Featured Banner + Live 精选条 + 分类 Tab + Trending/Top Movers 侧栏）
- **EventDetailPage**：事件全景（规则摘要 + 时间线赔付 + 合约表 + 走势图 + 事件摘要 + 对冲建议）
- **TradePanel**：统一交易面板（桌面右侧固定 / 移动端 BottomSheet，同一组件两种容器）

### 1.3 分叉路径（按意图信号展开）

| 分叉 | 触发信号 | 目的地 |
|------|---------|--------|
| CLOB 高级交易 | 点击合约行图表图标 | ContractDetailPage（订单簿 + 限价单 + 走势图） |
| Live 即时预测 | 点击 Live Tab | 5 分钟价格预测市场（Crypto/Stocks/Commodities/Forex） |
| Sports 独立 UI | 点击 Sports Tab | 按日期分组的体育赛事 + Moneyline/Spread/Total 投注线 |
| 策略篮子 | 点击导航 Strategies | 多合约组合策略 + 权重调整 + Trench 讨论区 |
| 异常处理 | StatusBanner 操作按钮 | DisputePanel / RefundBanner / RequestSettlePanel |
| 观点卡片 | 成交后 Modal | 生成预测卡片 + 分享（复制文本/保存图片/分享到 X） |

### 1.4 投资组合与社交

- **Portfolio**：持仓管理 / Open Orders / Activity / Trade History / My Forecasts / Copied Strategies
- **Leaderboard**：交易员排行榜 / Top Forecasters / Follow 系统
- **策略系统**：创建策略 / 复制策略 / 权重调整 / Trench 讨论

---

## 二、与 Kalshi、Polymarket 的差异对比

### 2.1 架构层面

| 维度 | Kalshi | Polymarket | TurboFlow |
|------|--------|------------|-----------|
| **信息架构** | Market-centric（单一市场页面） | Market-centric（单一市场页面） | **Event-centric**（事件容器 → 多合约） |
| **结果模型** | 单一 Binary | 单一 Binary | **双模型**：independent（时间 strike）+ mutually-exclusive（选项互斥） |
| **交易撮合** | CLOB | CLOB + AMM（混合） | CLOB（Marketable Limit = Quick Buy + 标准 Limit Order） |
| **结算货币** | USD（受 CFTC 监管） | USDC（链上） | USDC |
| **合规定位** | 美国 CFTC 受监管交易所 | 去中心化、不受 CFTC 管辖 | 目前为原型阶段 |

### 2.2 用户体验层面

| 维度 | Kalshi | Polymarket | TurboFlow |
|------|--------|------------|-----------|
| **信息前置** | 需点入市场后才见规则 | 需点入市场后才见规则 | **规则摘要（What/When/How）+ 时间线赔付 直接前置到事件详情主干** |
| **交易入口** | 必须进入市场页 | 列表页有快速按钮 | **列表页 Quick Trade（桌面弹窗/移动 BottomSheet） + 详情页 TradePanel** |
| **移动端体验** | 独立 App | 响应式 Web | **TradePanel 桌面/移动完全同构**（一套组件两种容器） |
| **异常场景** | 有限状态展示 | 较简 | **完整状态机（6 父状态 × 5 子状态） + StatusBanner + DisputePanel + RefundBanner + RequestSettlePanel** |
| **体育投注** | 有，但 UI 接近普通市场 | 有，UI 一般 | **独立体育 UI**（Moneyline/Spread/Total 投注线、按日期分组、队伍战绩） |

### 2.3 功能差异

| 功能 | Kalshi | Polymarket | TurboFlow |
|------|--------|------------|-----------|
| 即时价格预测（Live） | 无 | 无 | **有**（5 分钟倒计时、多资产类别） |
| 策略篮子（Strategy Basket） | 无 | 无 | **有**（多合约组合、权重调整、Basket ID 签名、复制） |
| Trench 讨论区 | 无 | 有评论区 | **有**（按 Basket ID 聚合、support/oppose/adjust 立场标签） |
| 观点卡片 + 社交分享 | 无 | 无 | **有**（成交后生成预测卡片、分享到社交媒体） |
| 对冲建议（Hedge Hints） | 无 | 无 | **有**（成交后 Modal + 持仓卡片内提示） |
| 事件摘要（AI Summary） | 无 | 简短描述 | **有**（Summary + Key Points 结构化） |
| Follow / Top Forecasters | 无 | 有 | **有**（Follow 系统 + 排行榜 + 准确率统计） |
| 流动性激励展示 | 有，但不突出 | 有 Rewards | **有**（Volume/Liquidity Incentives 卡片 + 事件级 IncentiveTag） |

---

## 三、TurboFlow 独特功能与特点

### 3.1 Event-Centric 架构（vs Market-Centric）

这是 TurboFlow 最根本的架构差异。传统预测市场（Kalshi/Polymarket）以单个 Market（市场/合约）为页面单元，用户需要在不同市场间跳转才能获取完整事件图景。

TurboFlow 以 **Event（事件）为顶层实体**：
- 一个事件可以包含多个合约（如"美联储 2025 年降息几次" → 0次/1次/2次/3次+）
- 支持 `independent`（独立，每个合约可独立成真）和 `mutually-exclusive`（互斥，只有一个合约为 YES）两种结果模型
- 用户在一个页面内即可看到完整事件全景、所有合约选项和概率对比

### 3.2 即时预测市场（Live Instant Markets）

独创的短周期价格预测市场：
- **5 分钟时间窗口**：BTC/ETH 等资产在 5 分钟内是否突破某价格
- **多资产类别**：Crypto、Stocks、Commodities、Forex
- **实时倒计时 + 进度条**：直观展示剩余时间
- **快节奏交易体验**：吸引活跃交易者和追求即时满足感的用户

这是 Kalshi 和 Polymarket 都没有的品类，填补了"超短期事件预测"的市场空白。

### 3.3 策略篮子系统（Strategy Basket + Trench）

这是当前开发分支的核心新功能：
- **多合约组合**：用户可将多个合约（跨事件）组合成一个策略篮子
- **Basket ID 签名**：基于 `contractId:side` 排序生成确定性签名，相同组合 = 相同篮子
- **权重调整**：复制策略后可自定义每个 leg 的权重，自动归一化
- **策略估值**：实时计算 Entry Cost / Mark Value / PnL
- **Trench 讨论区**：按 Basket ID 聚合讨论，支持 support/oppose/adjust 三种立场，相同篮子的不同策略共享同一 Trench
- **一键复制**：看到好的策略可以一键复制并调整

这将预测市场从"单合约交易"升级为"组合策略投资"，类似于从买单只股票到构建投资组合。

### 3.4 观点卡片与社交分享（Forecast Cards + Sharing）

- 成交后自动弹出 Modal，引导用户生成带预测信息的观点卡片
- 卡片包含：用户观点 + 预测方向 + 合约信息 + QR 码
- 分享渠道：复制文本（真实可用）/ 保存图片 / 分享到 X
- Portfolio 的 My Forecasts Tab 聚合所有历史预测
- 创建策略时可一键导入自己的预测记录

这将交易行为转化为社交内容，形成"交易 → 分享 → 引流 → 交易"的增长飞轮。

### 3.5 对冲建议（Hedge Hints）

- 成交确认 Modal 中给出相关对冲建议
- 持仓卡片内显示对冲入口
- 帮助用户理解风险管理，降低交易决策门槛

### 3.6 完整异常状态处理

TurboFlow 拥有预测市场中最完整的异常场景覆盖：
- **6 种父状态**：OPEN / CLOSED / RESOLVING / SETTLED / CANCELLED / VOIDED
- **5 种子状态**：normal / paused / disputed / delayed / emergency
- **StatusBanner**：颜色编码 + 状态描述 + 操作按钮（一目了然）
- **DisputePanel**：争议时间线 + 双方论据 + 提交证据
- **RefundBanner**：退款信息展示
- **RequestSettlePanel**：请求结算 / 报告问题

### 3.7 渐进披露式信息架构

- **RulesSummaryCard**：What（测量什么）/ When（何时截止）/ How（数据来源）— 三要素结构化前置
- **TimelinePayoutCard**：时间线可视化 + "赢=1 USDC/份，输=0" 赔付说明
- **OutcomeModelHint**：互斥事件提示（"这些合约互斥，最终只有一个为 YES"）
- **EventSummaryCard**：事件摘要 + Key Points（帮助用户快速理解背景）

---

## 四、产品宗旨与目标群体

### 4.1 产品宗旨

**"让预测市场成为信息发现和观点表达的工具，而非纯粹的赌博平台"**

TurboFlow 的设计理念体现在：

1. **降低认知门槛**：Event-Centric 架构让用户先理解事件，再选择合约交易；规则摘要 + 时间线赔付前置，用户无需深入研究即可理解"在赌什么"
2. **鼓励深度思考**：策略篮子系统引导用户构建多合约组合观点，而非冲动下单；Trench 讨论区让不同立场的人理性辩论
3. **社交化交易**：观点卡片将交易转化为可分享的预测内容，让交易者表达观点而非隐藏仓位
4. **完整的风险意识**：对冲建议、异常状态完整处理、Payout 说明始终可见，时刻提醒风险

### 4.2 目标群体

#### 第一层：核心用户 — 信息交易者（Information Traders）

- **画像**：关注时事新闻、宏观经济、加密市场的活跃交易者
- **行为**：有自己的观点和判断，愿意用真金白银表达预测
- **需求**：快速发现事件 → 理解规则 → 下单 → 管理持仓
- **TurboFlow 吸引力**：Event-Centric 信息架构、3 步完成交易、策略篮子组合表达

#### 第二层：体育投注者（Sports Bettors）

- **画像**：体育爱好者，有体育博彩经验
- **行为**：关注赛事、理解让分/总分等投注线
- **需求**：接近传统体育博彩的 UI 体验 + 预测市场的价格发现优势
- **TurboFlow 吸引力**：独立体育 UI、Moneyline/Spread/Total 投注线、CLOB 提供更好定价

#### 第三层：即时交易者（Instant Traders）

- **画像**：追求快节奏交易、短期刺激的用户（类似 meme coin 交易者）
- **行为**：频繁交易、追求即时结果
- **需求**：短周期、高频次、快速结算的交易品种
- **TurboFlow 吸引力**：Live 即时预测市场（5 分钟窗口）、多资产类别

#### 第四层：策略构建者（Strategy Builders）

- **画像**：有投资组合思维的高阶用户
- **行为**：构建多合约组合策略、分享观点、讨论逻辑
- **需求**：组合表达、权重管理、策略估值、社区讨论
- **TurboFlow 吸引力**：策略篮子系统、Basket ID 签名、Trench 讨论区、一键复制

#### 第五层：社交围观者（Social Spectators）

- **画像**：通过社交媒体看到预测卡片而进入的新用户
- **行为**：先围观 → 感兴趣 → 尝试小额交易 → 生成自己的预测卡片
- **需求**：低门槛了解事件、简单的交易体验、可分享的内容
- **TurboFlow 吸引力**：观点卡片分享引流、事件摘要降低理解门槛、Quick Buy 一步交易

### 4.3 增长飞轮

```
事件发现 → 交易下单 → 生成观点卡片 → 社交分享 → 新用户进入 → 事件发现
     ↑                                                           ↓
     └──────── 策略篮子 → Trench 讨论 → 复制策略 ← 排行榜发现 ←──┘
```

### 4.4 竞争定位总结

| 平台 | 定位 | 核心优势 |
|------|------|---------|
| **Kalshi** | 合规优先的美国受监管预测交易所 | CFTC 牌照、美元结算、合规信任 |
| **Polymarket** | 去中心化的链上预测市场 | 链上透明、高流动性、大事件覆盖 |
| **TurboFlow** | **信息驱动的策略型预测市场** | Event-Centric 架构、策略篮子、即时预测、社交分享、完整异常处理 |

TurboFlow 不是简单复制 Kalshi/Polymarket，而是在预测市场的基础上叠加了"**策略组合 + 社交表达 + 即时交易**"三个差异化维度，将预测市场从"猜对猜错"升级为"构建观点、表达判断、组合策略"的深度投资工具。

---

*文档生成时间：2026 年 2 月 22 日*
*基于 TurboFlow 代码库 main 分支（V4.1）+ codex/strategy-basket-trench 分支分析*
