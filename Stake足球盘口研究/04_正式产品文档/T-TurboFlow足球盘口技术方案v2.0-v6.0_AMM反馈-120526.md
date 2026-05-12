# T-TurboFlow 足球盘口技术方案 v2.0 v6.0 AMM 反馈

## 反馈结论

当前《TurboFlow 足球盘口技术方案 v2.0 设计与实施概述》不建议作为足球 v6.0 AMM 主线技术方案直接实施。

该技术方案的基础立场是“平台主导赔率、用户向平台下注、注单上链、市场级派奖”。这与当前足球 v6.0 AMM 预测市场的产品主线存在根本差异。v6.0 要求平台不作为用户交易对手方，不承诺赔率，不展示传统注单、串关、Cash Out 或平台买断式提前结清。用户侧主流程应是 AMM quote 即时交易、买入 outcome 份额、形成 position、后续部分卖出 / 全部卖出 / 等待结算。

因此，该方案可以作为 v5.0 传统盘口链上化方案或历史技术参考，但需要重写为“足球 AMM 交易域技术方案”，不能只在原下注域方案上补字段。

## 主要结构性偏差

### 1. 业务约束仍是平台报价型盘口

方案第 1 章明确写到“赔率由平台主导而非市场博弈产生”，并以后台运营维护赔率、WebSocket 推送赔率为核心。

v6.0 当前口径是 AMM 预测市场：

- 用户看到的是概率 + 份额价格。
- 欧洲赔率只是展示换算。
- 成交价格来自 quote。
- quote 包含成交均价、交易后价格、价格影响、手续费和过期时间。
- 平台不承诺赔率，不作为用户交易对手方。

如果继续按“平台赔率 + 赔率 CAS”实施，会把产品重新拉回 v5.0 传统盘口。

### 2. 业务闭环仍是注单生命周期

方案第 2 章描述的用户闭环是：

- 运营维护赔率。
- 用户下注。
- 系统生成注单。
- 链上 `BetCreate`。
- 终场后 `MarketSettle`。
- 中奖派奖、输钱锁定。
- 用户查询注单。

v6.0 的用户闭环应改为：

- 用户选择 outcome。
- 前端请求 AMM quote。
- 用户确认买入或卖出。
- trade 即时成交或整笔失败。
- 成交后更新 position 和 portfolio。
- 用户可继续买入、部分卖出、全部卖出。
- 结算时正确 outcome 每份兑付 1 USDT，错误 outcome 兑付 0，void 按规则退款。

原方案没有 position 生命周期，也没有卖出交易域，因此无法覆盖 v6.0 的核心体验。

### 3. 数据模型围绕 `bet_ticket`，缺少 AMM 市场和持仓模型

方案的数据模型包括 `bet_market_template`、`bet_market`、`bet_selection`、`bet_odds_log`、`bet_ticket`、`bet_settle_task` 等。

这些模型适合表达传统盘口注单，但 v6.0 至少需要补齐或替换为：

- `amm_market`
- `amm_outcome`
- `amm_pool` 或外部报价参数表
- `amm_quote`
- `amm_trade`
- `amm_position`
- `amm_position_snapshot`
- `amm_liquidity_state`
- `amm_settlement`
- `user_price_preference`

其中 `amm_position` 是主模型，不能用 `bet_ticket` 替代。`bet_ticket` 的一笔下注只能表达固定赔率下注结果，不能表达用户持续持有、加仓、减仓、部分卖出、已实现 / 未实现盈亏。

### 4. 合约接口仍是 BetCreate / BetCancel / MarketSettle

方案第 5 章定义链上指令：

- `BetCreate`
- `BetCancel`
- `MarketSettle`
- `MarketVoid`

v6.0 AMM 不应把用户退出风险设计成 `BetCancel`。用户成交后管理风险的方式是 sell trade，而不是撤注。

如果链上仍参与交易，合约接口也应围绕 AMM 资产和持仓重新定义，例如：

- `MarketCreate`
- `PoolCreate`
- `BuyShares`
- `SellShares`
- `PositionUpdate`
- `MarketPause`
- `MarketResume`
- `MarketResolve`
- `RedeemSettlement`
- `MarketVoid`

如果短期 mock 或链下 AMM 优先，也应在技术方案中明确“链上结算 / 链下 quote / 链下 position 镜像”的边界，而不是沿用注单 PDA。

### 5. 撤注流程与 v6 主流程冲突

方案第 6.4 节保留撤注流程，依赖 `bet_cancel_window_sec` 和 `BetCancel`。

v6.0 明确不展示撤单、挂单、订单等待或部分成交挂起。成交前的风险控制由 quote 有效期和滑点保护完成；成交后的退出由卖出份额完成。

建议：

- 删除 v6 主流程中的撤注域。
- 将撤注能力标记为 v5 下注域兼容能力。
- 将卖出交易设计为一等能力，包括部分卖出和全部卖出。

### 6. 市场覆盖范围过宽，与当前 v6.0 范围不一致

方案中多次出现 25 条 template、34 或 35 个盘口、半场盘口、角球、罚牌、球员、SGM、Phase 2/3 扩展等内容。

当前足球 v6.0 范围必须保持：

- 单场 7/7：胜平负、开球权、让球、让球 0:1、总进球数、大小球、波胆。
- 冠军与晋级 11/11：世界杯 A 组第一、世界杯 A 组出线、进入 8 强、进入决赛、世界杯冠军、欧冠冠军、晋级决赛、皇马 vs 巴萨两回合系列赛赛果、英超冠军、获得欧冠资格、降级球队。

当前不做球员、角球、罚牌、分钟盘、同场扩展盘口，也不做 v4.5 整届赛事预测大赛。技术方案应围绕这 18 个市场口径设计，不要把 Phase 2/3 扩展混入当前交付主线。

### 7. 结算引擎仍按传统盘口 Outcome 设计

方案中的 Evaluator 输出包括 `Won / Lost / Push / Void / HalfWin / HalfLose`，适配传统盘口和亚洲盘结算。

v6.0 结算需要以 outcome 份额兑付为中心：

- 正确 outcome 每份兑付 1 USDT。
- 错误 outcome 每份兑付 0。
- void 按规则退款。
- position 需要更新 settled 状态。
- portfolio 需要展示已结算记录、已实现盈亏和可兑付金额。

对于让球、大小球等有 push 或半赢半输可能的传统盘口，若 v6.0 继续保留这些市场，技术方案必须明确它们在 AMM outcome 下如何转换为兑付规则，不能沿用“注单赔率派奖”的传统表达。

## 可保留的技术资产

原方案中有一些基础设施思想仍然有价值，可以迁移到 AMM 方案：

- 链上为真源 + 链下镜像 + 扫块回流。
- 业务态与执行态分离。
- 赛事数据源归一化。
- 关键事件触发市场暂停。
- 结算任务队列。
- Redis 锁、限流、Prometheus 指标、日志和补偿机制。
- 账户镜像与实时对账。
- 链上事件漏扫补偿。
- 结算失败重试与告警。

这些内容应作为基础设施层复用，而不是保留下注域业务模型。

## 建议重构后的技术方案目录

建议新技术方案改为以下结构：

### 1. 设计立场

明确 v6.0 是 AMM 足球预测市场：

- 平台不作为交易对手方。
- 不承诺赔率。
- 不展示传统注单、串关、Cash Out。
- 不做 CLOB、订单簿、限价单、挂单、撤单。
- 用户通过 AMM quote 买入 / 卖出 outcome 份额。

### 2. 业务闭环

按 v6.0 用户流程重写：

- 发现市场。
- 选择 outcome。
- 请求 quote。
- 买入份额。
- 查看 position。
- 部分卖出 / 全部卖出。
- 等待结算。
- 兑付或 void 退款。

### 3. 领域划分

建议领域从传统注单域改为：

- Market Domain：市场、outcome、状态、结算规则。
- Pricing Domain：AMM quote、价格影响、手续费、quote TTL。
- Trade Domain：买入、卖出、成交幂等、滑点保护。
- Position Domain：持仓、均价、份额、市值、盈亏。
- Portfolio Domain：聚合持仓、成交、结算记录。
- Settlement Domain：resolve、redeem、void。
- Liquidity Domain：池状态、外部流动性契约、暂停原因。
- Account Domain：余额、冻结、流水、对账。
- Chain Domain：如涉及链上，负责链上交易与事件回流。
- Event Domain：赛事事件、关键事件暂停。

### 4. 核心数据模型

最低需要覆盖：

- `soccer_market`
- `soccer_outcome`
- `soccer_market_resolution_rule`
- `soccer_amm_pool`
- `soccer_amm_quote`
- `soccer_amm_trade`
- `soccer_amm_position`
- `soccer_amm_position_snapshot`
- `soccer_amm_liquidity_state`
- `soccer_settlement`
- `soccer_price_preference`

### 5. AMM 定价与 quote

必须写清楚：

- 采用纯 AMM 曲线、外部做市商报价驱动，还是外部报价作为 AMM 参数输入。
- quote 输入。
- quote 输出。
- quote 过期。
- 滑点保护。
- 价格影响阈值。
- 流动性不足处理。
- 市场暂停处理。
- 费用计算。

### 6. 交易流程

分别定义：

- 买入流程。
- 卖出流程。
- 部分卖出流程。
- 全部卖出流程。
- quote 过期失败。
- 价格影响过高失败。
- 流动性不足失败。
- 市场暂停失败。

重点：这些失败都是整笔失败，不生成等待订单。

### 7. Position 与 Portfolio

明确：

- 加仓如何更新平均成本。
- 部分卖出如何计算已实现盈亏。
- 卖出后剩余份额如何展示。
- dust threshold 如何处理。
- Portfolio 如何聚合未实现盈亏、已实现盈亏和历史成交。

### 8. 结算与 void

以 outcome 份额兑付为核心：

- 正确 outcome 兑付 1 USDT / share。
- 错误 outcome 兑付 0。
- void 按规则退款。
- 延期、腰斩、VAR、官方改判、小组排名和资格递补的处理。
- 结算来源和争议期。

### 9. 市场范围

只覆盖当前 v6.0 范围：

- 单场 7/7。
- 冠军与晋级 11/11。

其他市场只能放入“未来范围”，不得进入当前里程碑验收。

### 10. 验收标准

验收应围绕 v6.0 前端和交易体验：

- 用户可以在单场预测和冠军与晋级中选择 outcome 并买入预测份额。
- outcome 卡片默认展示概率 + 份额价格，只显示 `24h Vol.` 和 24h 涨跌幅。
- 交易面板支持 Max、50 / 100 / 200 / 500 快捷金额。
- 卖出侧支持 Max / 全部卖出。
- Portfolio 展示持仓、可卖份额、均价、现价、市值、未实现盈亏、已实现盈亏和历史成交。
- 欧洲赔率只作为展示换算。
- 不出现传统投注单、串关、Cash Out、平台赔率承诺、订单簿、撤单或挂单。

## 对原方案各章节的处理建议

### 建议重写

- 第 1 章设计立场。
- 第 2 章业务闭环。
- 第 3.2 业务领域划分。
- 第 4 章核心数据模型。
- 第 5 章链上合约接口。
- 第 6.3 下注流程。
- 第 6.4 撤注流程。
- 第 6.5 结算流程。
- 第 7 章结算引擎。
- 第 11 章实施里程碑。

### 可以保留并改名迁移

- 赛事域中的 FeedClient、EventNormalizer、EventStore。
- 关键事件暂停机制。
- 链上域的 TxSubmitter、TxTracker、ChainScanner、SlotCheckpoint。
- 账户域的 AccountMirror、Ledger、Reconciler。
- 补偿矩阵。
- 高可用和部署策略。
- Prometheus、Redis、PGSQL、日志和任务队列基础设施。

### 建议移入历史兼容或未来文档

- 平台主导赔率。
- bet_ticket 注单模型。
- BetCreate / BetCancel 注单指令。
- 下注 / 撤注链路。
- 赔率 CAS。
- 串关、单注、多笔单注。
- 34 / 35 盘口全量模板。
- 角球、罚牌、球员、SGM、半场扩展。

## 修订优先级

### P0 必须先定

- AMM 定价来源：纯 AMM 曲线、外部做市商报价驱动，或外部报价作为 AMM 参数输入。
- quote / trade / position / settlement 的边界。
- 买入、部分卖出、全部卖出的状态机。
- 正确 outcome 兑付 1 USDT、错误兑付 0、void 退款的链上或链下实现方式。

### P1 必须补齐

- `market_liquidity` 和暂停原因。
- quote TTL、滑点保护、价格影响阈值。
- dust threshold。
- 多 outcome 市场的总概率、归一化、库存风险和单 outcome 最大负债。
- 11 个长期市场的关闭时间、结算来源和争议流程。

### P2 后续展开

- 外部流动性方 SLA。
- 链上 AMM 合约细节。
- 长期市场资金占用和资金效率。
- 成交历史导出。
- 未来 CLOB 大版本。

## 最终建议

建议不要在《足球盘口技术方案 v2.0》上直接小修小补，而是将它归档为“传统盘口链上化技术方案”或“v5 技术方案参考”。

当前足球 v6.0 应新增一份《TurboFlow 足球 AMM 预测市场技术方案 v1.0》，以 AMM 交易域为主线重写。这样才能保证产品文档、Design Board、接口规范和实际实现一致，避免开发继续按传统下注域推进。
