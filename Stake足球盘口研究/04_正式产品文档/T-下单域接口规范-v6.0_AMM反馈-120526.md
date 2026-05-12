# T-下单域接口规范 v6.0 AMM 反馈

## 反馈结论

当前《下单域接口规范》不能作为足球 v6.0 AMM 主流程接口规范直接进入开发。

该文档的核心模型仍是传统体育下注域：`Order`、`OrderLeg`、`single / parlay`、`decimal_odds`、`notional_dollars`、`max_payout_dollars`、撤单窗口、赔率 CAS、注单结算和链上派奖。它适合 v5.0 平台报价型传统盘口，或作为历史兼容接口保留，但与当前足球 v6.0 AMM 预测市场的交易模型不一致。

足球 v6.0 的接口主线应改为 `quote / trade / positions / trades / portfolio / settlement / price_preference`，并以 `outcome / shares / position / avg_price / price_impact / fee / quote_expires_at` 为核心字段。欧洲赔率只能作为展示换算，不能再作为下单权威字段。

## 与当前 v6.0 口径冲突的关键点

### 1. 资源模型仍是注单，不是 AMM position

原规范以 `/api/v1/portfolio/orders` 为主入口，返回 `OrderView[]`，并围绕 `order_id`、`order_group_id`、`legs`、`status`、`outcome` 管理生命周期。

v6.0 中用户不是提交传统注单，而是买入 outcome 预测份额并形成 position。用户后续可以继续买入、部分卖出、全部卖出或等待结算。接口层必须能表达：

- 当前持仓份额。
- 平均成本。
- 当前份额价格。
- 持仓市值。
- 已实现盈亏。
- 未实现盈亏。
- 可卖份额。
- 卖出后剩余份额。

原规范只描述注单的 `won / lost / refunded / cancelled / rejected`，无法表达 position 的连续生命周期。

### 2. `decimal_odds` 被设计为权威字段，违反 v6.0 价格主口径

原规范明确 `decimal_odds` 是权威字段，`yes_price_dollars = 1 / decimal_odds` 只是派生字段，并建议生产环境直接传 `decimal_odds`。

v6.0 的主价格是“概率 + 份额价格”，例如 `55% + Buy Yes 55¢`。欧洲赔率只是展示换算，不是成交承诺，也不能参与 quote、trade、settlement 的权威计算。

需要调整为：

- `probability` 和 `share_price` 是展示口径。
- `avg_price`、`end_price`、`price_impact`、`fee` 来自 AMM quote。
- `decimal_odds` 只允许作为 response 中的展示换算字段。
- request 不应要求客户端提交 `decimal_odds` 做 CAS。

### 3. `single / parlay / legs` 不属于 v6 主流程

原规范支持：

- 单笔单注。
- 多笔单注。
- 串关。
- `OrderLeg[]`。
- `order_type = single / parlay`。
- 串关同场互斥矩阵。

当前足球 v6.0 明确不把传统投注单、串关、多笔单注作为主流程。市场覆盖只保留单场 7/7 和冠军与晋级 11/11，但交易语义全部改为 AMM outcome。接口规范不应再以 `legs` 和 `parlay` 组织用户交易。

建议处理：

- 将 `single / parlay / legs` 从 v6 足球 AMM 主接口移除。
- 如需保留，应放入“v5 传统投注兼容接口”或“非足球历史接口”。
- 不要在 `/soccer` v6 客户端调用链路中暴露 parlay 概念。

### 4. `action=buy` 单向下注不支持 v6 卖出能力

原规范 Phase 1 只支持 `action=buy`，并说明没有二级市场、平台坐庄、没有 SELL 场景。

v6.0 明确要求：

- 买入份额。
- 卖出份额。
- 部分卖出。
- 全部卖出。
- 卖出 quote 展示预计收回金额、本次已实现盈亏、卖出后剩余份额。

因此接口必须支持 `side = buy | sell`，并区分买入输入金额与卖出输入份额。卖出不是撤单，也不是 Cash Out，而是用户通过 AMM 即时报价主动卖出 position。

### 5. 撤单接口不应进入 v6 AMM 主流程

原规范提供 `/api/v1/portfolio/orders/cancel`，支持按订单 ID、客户端幂等键、订单组撤单，并设置 60 秒撤单窗口。

v6.0 是 AMM 即时 quote 交易。交易确认后即成交并更新 position，不展示订单等待、挂单、撤单或部分成交挂起。用户想退出风险，应通过卖出份额实现，而不是撤单。

建议：

- v6 足球 AMM 主接口不提供 cancel。
- quote 过期、市场暂停、价格影响过高、流动性不足时，trade 应整笔失败并要求重新询价。
- 成交后只允许通过 sell trade 管理持仓。

### 6. 状态机仍围绕链上注单回流，不符合当前前端体验

原规范对外状态是 `resting / canceled / executed`，内部状态是 `biz_state + chain_state`。这会把用户体验带回“注单已受理、等待链上确认、派奖回流”的传统下注心智。

v6.0 前端主体验应是：

- quote 生成。
- quote 有效期。
- trade 成交或失败。
- position 更新。
- settlement 兑付。
- void 退款。

如果底层仍有链上交易或异步确认，也应对前端封装为 trade / position 状态，不能要求 `/soccer` 主流程展示注单状态。

## 建议的新接口边界

### 1. 询价接口

建议新增：

```http
POST /api/v1/soccer/amm/quote
```

请求字段建议：

```json
{
  "account_id": "1001",
  "market_id": "match_100123_result_1x2",
  "outcome_id": "home",
  "side": "buy",
  "collateral_amount": "100",
  "shares": null,
  "max_slippage": "0.03",
  "client_quote_id": "quote_..."
}
```

买入时使用 `collateral_amount`，卖出时使用 `shares`。接口应返回：

- `quote_id`
- `side`
- `outcome_id`
- `probability`
- `share_price`
- `avg_price`
- `end_price`
- `price_impact`
- `fee`
- `shares`
- `collateral_amount`
- `min_shares_out`
- `min_collateral_out`
- `quote_expires_at`
- `risk_warnings`

### 2. 成交接口

建议新增：

```http
POST /api/v1/soccer/amm/trade
```

请求字段建议：

```json
{
  "account_id": "1001",
  "quote_id": "quote_...",
  "client_trade_id": "trade_...",
  "max_slippage": "0.03"
}
```

返回字段建议：

- `trade_id`
- `position_id`
- `side`
- `outcome_id`
- `shares`
- `avg_price`
- `fee`
- `collateral_delta`
- `realized_pnl`
- `remaining_shares`
- `position_market_value`
- `created_at`

失败场景必须明确区分：

- `QUOTE_EXPIRED`
- `MARKET_PAUSED`
- `MARKET_CLOSED`
- `INSUFFICIENT_LIQUIDITY`
- `PRICE_IMPACT_TOO_HIGH`
- `INSUFFICIENT_BALANCE`
- `INSUFFICIENT_SHARES`

### 3. 持仓与成交查询

建议新增：

```http
GET /api/v1/soccer/amm/positions
GET /api/v1/soccer/amm/trades
GET /api/v1/soccer/amm/portfolio
```

position 必须返回：

- `position_id`
- `market_id`
- `outcome_id`
- `outcome_label`
- `shares`
- `available_shares`
- `avg_price`
- `current_price`
- `market_value`
- `realized_pnl`
- `unrealized_pnl`
- `settlement_status`

### 4. 市场与结算接口

建议新增或补齐：

```http
GET /api/v1/soccer/amm/markets
GET /api/v1/soccer/amm/market_liquidity
GET /api/v1/soccer/amm/settlements
```

每个 market 需要具备 v6.0 PRD 要求的解释字段：

- `question_title`
- `outcomes`
- `resolution_rule`
- `resolution_source`
- `expected_resolution_time`
- `void_rule`
- `delay_or_dispute_policy`
- `status`
- `status_reason`

## 与原规范的保留建议

原规范中仍有可复用内容，但应降级为基础设施或兼容层：

- `client_order_id` 的幂等思想可迁移为 `client_quote_id`、`client_trade_id`。
- 认证分阶段方案可保留，但应适配 AMM trade 域。
- 统一业务错误码可保留，但错误语义要从 bet/order 改为 quote/trade/position。
- 账户镜像、链上回流、对账能力可作为底层资金基础设施。
- ticker 的三段式定位可参考，但 v6 主字段应优先使用 `market_id + outcome_id`。

## 需要从 v6 主规范移除或隔离的内容

以下内容不应出现在足球 v6 AMM 主接口中：

- `/api/v1/portfolio/orders` 作为主入口。
- `/api/v1/portfolio/orders_bulk` 作为主交易能力。
- `/api/v1/portfolio/orders/cancel` 作为退出风险能力。
- `order_type = single / parlay`。
- `legs`。
- `decimal_odds` 作为权威请求字段。
- `max_payout_dollars`。
- `payout_dollars`。
- `accepted_at` 表达“接受最新赔率”。
- 赔率 CAS。
- 串关同场互斥矩阵。
- `action=buy` 单向下单限制。
- “平台坐庄、没有 SELL 场景”的差异说明。

## 修订优先级

### P0 必须修改

- 将主接口从 order 改为 quote / trade / position。
- 移除 v6 主流程中的 parlay、legs、撤单。
- 将 `decimal_odds` 从权威字段降级为展示换算字段。
- 增加 sell、部分卖出、全部卖出的接口能力。
- 增加 position 查询与 portfolio 聚合接口。

### P1 必须补齐

- quote 过期、流动性不足、价格影响过高、市场暂停的错误码和可恢复建议。
- market 状态字段与暂停原因。
- outcome 的结算规则、void 规则和争议处理字段。
- dust threshold 处理。
- 价格偏好接口，支持概率 + 份额价格 / 欧洲赔率展示切换。

### P2 可后续细化

- 外部流动性方契约。
- AMM 曲线或外部报价驱动方案。
- 链上结算与链下镜像的一致性细节。
- 成交历史导出。
- 长期市场的结算争议流程。

## 建议文档处理方式

建议将原《下单域接口规范》改名或标注为“传统下注域 / v5 兼容接口规范”，不要继续作为 v6.0 足球 AMM 的主接口设计。

建议新增一份《足球 AMM 交易域接口规范 v1.0》，专门覆盖：

- 单场 7/7 AMM 市场。
- 冠军与晋级 11/11 AMM 市场。
- quote。
- trade。
- position。
- portfolio。
- settlement。
- market liquidity。
- price preference。

这样可以保留原下单域资产，同时避免 v6.0 开发继续沿用传统投注单语义。
