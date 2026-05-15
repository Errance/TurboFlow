# TurboFlow 足球 RFQ 后端接口冲突与修改清单

版本：v1.1
日期：2026-05-15
依据：

- `前端下单接口规范 v1.0.doc`
- `前端行情接口规范 v1.0.doc`
- `TurboFlow 足球盘口技术方案 v3.0 设计`
- 当前 v7.0 RFQ 前端产品口径

## 1. 需要先修正的结论

Word 版 `前端下单接口规范 v1.0.doc` 已可读，因此旧反馈中的“下单接口规范不可用 / PDF 为空”应删除。

但 Word 版下单接口仍不能直接冻结为联调合同。主要原因不是缺文档，而是下单接口、行情接口、技术方案和当前前端产品口径之间仍存在以下冲突。

## 2. P0 阻塞级冲突

### 2.1 用户身份来源冲突

当前下单接口在 request 和 query 中显式传：

```json
{
  "account_id": 1001
}
```

例如：

- `POST /api/v1/soccer/rfq/quote`
- `POST /api/v1/soccer/rfq/sell_quote`
- `POST /api/v1/soccer/rfq/trade`
- `GET /api/v1/soccer/rfq/portfolio?account_id=1001`

需要修改：

- 如果线上有 JWT / session，`account_id` 应以后端鉴权主体为准，不能信任前端传入的 account_id。
- 前端 request 中的 `account_id` 应删除，或明确仅用于 mock / internal debug。
- 幂等键应按鉴权 account 维度隔离，不能只依赖前端传参。

### 2.2 `trade` 成功与链上异步状态冲突

下单文档写：

> 接口返回 200 即视为下单成功；链上确认是异步的。

同时又有错误码：

```text
RFQ_CHAIN_SUBMIT_FAILED
```

这会造成语义冲突：如果 200 已经视为成功，链上提交失败时用户到底看到成功、失败、回滚中，还是持仓已生效？

需要修改：

- 明确 `trade` 返回成功时，资金、持仓、链上交易分别处于什么状态。
- 明确链上失败后的补偿规则：资金回退、position 回滚、trade 状态更新、前端通知方式。
- 如果前端只看到 `filled / failed`，后端内部仍需写清楚 `pending / chain_submitted / filled / failed` 等内部状态如何流转。
- 不要把 DB 事务和链上交易写成一个 ACID 事务。

### 2.3 成交 WS 无法准确匹配当前用户

行情文档的 `rfq.trade_filled` payload 当前只有：

```json
{
  "trade_id": "tr_8826361129472100",
  "market_id": "rfq_mkt_match_winner_20260601_arg_bra",
  "outcome_id": "home_win",
  "side": "buy",
  "shares": "21.500000",
  "accepted_odds": "2.150000",
  "at": "2026-05-15T08:30:01Z"
}
```

文档又写“前端需要自己保存最近发起的 client_trade_id 做匹配”，但 payload 里没有 `client_trade_id`，因此前端无法按 client_trade_id 匹配。

需要修改，二选一：

- v1.0 明确 `rfq.trade_filled` 不做用户匹配，前端收到就刷新 portfolio。
- 或在 payload 中补充 `account_id`、`client_trade_id`，并只允许用户本人通过鉴权频道收到自己的私人成交事件。

建议补充：

```json
{
  "account_id": "1001",
  "client_trade_id": "tr-1001-q_8826361129472001"
}
```

### 2.4 外部报价源 / provider 文案会泄露到用户侧

当前文档在错误码推荐文案中出现：

- “做市商拒绝该单”
- “做市商响应超时”
- “做市商不可达”

行情文档中也出现 `provider_closed`、`provider_id`、`provider_match_id`、`provider_market_id`、`provider_selection_id` 等字段。

需要修改：

- `provider_*` 可以保留为内部字段，但不应要求前端直接展示。
- 用户侧文案不要出现 `provider`、`做市商`、`RFQ`。
- 推荐用户文案改成：
  - “暂无报价，请稍后重试”
  - “报价暂不可用”
  - “报价响应超时，请重试”
  - “市场已暂停”
- `provider_closed` 作为内部 reason 可以保留，但前端展示应映射为“市场已暂停 / 已关盘”。

## 3. P1 接口字段冲突

### 3.1 quote 过期字段命名不统一

当前下单文档使用：

```json
{
  "quote_expires_at": "2026-05-15T08:30:05Z"
}
```

旧反馈和部分接口建议使用：

```json
{
  "expires_at": "2026-05-15T08:30:05Z",
  "ttl_seconds": 5
}
```

需要修改：

- 统一为一种字段名。
- 如果保留 `quote_expires_at`，建议同时返回 `ttl_seconds`，方便前端倒计时和埋点。
- 所有 buy quote、sell quote 必须使用同一命名。

### 3.2 quote TTL 需要产品确认

下单文档明确 TTL 默认 5s。

需要修改：

- 5s 可以作为后端默认值，但需要产品确认是否适合前端确认流程。
- 行情缓存 TTL 与交易 quote TTL 必须分开，不要混用。
- 前端只按 quote response 返回的过期时间倒计时。

### 3.3 buy quote 缺少当前 UI 所需字段

当前 buy quote 返回：

```json
{
  "quoted_odds": "2.150000",
  "implied_probability": "0.465116",
  "display_decimal_odds": "2.150000",
  "fee": "0.060000",
  "collateral_amount": "10.000000",
  "estimated_shares": "21.500000",
  "max_loss": "10.060000",
  "min_shares_out": "20.855000"
}
```

当前前端下单面板口径是：

```text
Share Price
Decimal Odds
Estimated Avg Price
Estimated Shares Received
Trading Fee
Max Loss
Potential Payout
Potential Profit
```

需要修改：

- quote response 应直接返回 `share_price`，不要让前端把 `implied_probability` 当作份额价格展示。
- 补充 `estimated_avg_price`，或明确它等于 `share_price` / `1 / quoted_odds`。
- 补充 `potential_payout`、`potential_profit`，或明确前端计算公式。
- 不建议让前端同时展示 `implied_probability` 和 `share_price`。

### 3.4 `estimated_shares` 计算公式表述不严谨

文档写：

> estimated_shares = collateral / (1 / odds) - fee 影响

这个表述容易误解为直接从 shares 中扣 fee，但当前示例是：

```text
collateral_amount = 10
quoted_odds = 2.15
estimated_shares = 21.5
fee = 0.06
max_loss = 10.06
```

也就是 fee 没有从 `estimated_shares` 中扣除，而是进入 `max_loss`。

需要修改：

- 明确 `estimated_shares = collateral_amount * quoted_odds`，还是 `net_collateral * quoted_odds`。
- 明确 fee 是额外收取，还是从本金中扣除。
- `max_loss = collateral_amount + fee` 已经写清楚，建议与 `estimated_shares` 公式保持一致。

### 3.5 RFQ 锁价与 `min_shares_out / min_collateral_out` 存在语义冲突

下单文档中 quote 是“短时有效锁定报价”，trade 阶段 `accepted_odds` 与 `quote.quoted_odds` 一致。

但 quote response 又包含：

- `min_shares_out`
- `min_collateral_out`
- “滑点保护下限”

RFQ 模式不是 AMM 撮合，不应出现用户接受更差价格的滑点语义。

需要修改：

- 如果 RFQ 是锁价成交，trade 只能按 quote 价成交或失败，`min_*` 字段可以删除。
- 如果保留 `min_*`，必须明确它只是风控保护字段，不表示前端接受滑点成交。
- 不要让用户误解为 quote 之后仍可能用更差价格成交。

### 3.6 sell quote 字段命名与买入展示口径不一致

当前 sell quote 返回：

```json
{
  "quoted_odds": "2.080000",
  "estimated_collateral_out": "10.400000",
  "net_collateral_out": "10.337600",
  "fee": "0.062400",
  "min_collateral_out": "10.027472",
  "realized_pnl": "0.337600",
  "remaining_shares": "16.500000",
  "remaining_position_value": "34.270000"
}
```

需要修改：

- 明确卖出 UI 展示哪个金额：`estimated_collateral_out` 还是 `net_collateral_out`。
- 建议字段名改成更直观的 `estimated_proceeds`、`net_proceeds`，或至少在文档中明确含义。
- 补充 `current_exit_price` / `estimated_exit_price` 或说明 `quoted_odds` 如何换算成卖出份额价格。
- `min_collateral_out` 如保留，需要同 3.5 一样说明它不是滑点成交承诺。

### 3.7 trade response 缺少状态字段

当前 trade response 示例没有 `status`：

```json
{
  "trade_id": "tr_8826361129472100",
  "position_id": "pos_8826361129488000",
  "side": "buy",
  "accepted_odds": "2.150000",
  "tx_hash": "STUB-pred-buy-8826361129472100"
}
```

需要修改：

- 补充 `status` 字段。
- 如果 200 只代表已受理，status 不应直接叫 `filled`。
- 如果 200 代表交易已成交，需说明链上异步失败不会影响用户持仓，或失败会通过补偿事件回滚。

### 3.8 trade response 建议回传 quote / client id

当前 trade response 没有 `quote_id`、`client_trade_id`。

需要修改：

- 建议回传 `quote_id` 和 `client_trade_id`，便于前端日志、排障、幂等结果复用。
- sell trade 也应返回 `position_version` 或最新 `position_shares` / `position_status`。

### 3.9 Portfolio 字段命名不统一

当前 portfolio 使用：

```json
{
  "portfolio_value": "53.310000",
  "open_positions": 2,
  "position_version": 13
}
```

旧反馈和部分前端口径使用：

```json
{
  "market_value": "53.310000",
  "open_positions_count": 2,
  "version": 13
}
```

需要修改：

- 统一 summary 字段名：建议使用 `portfolio_value` 或 `market_value` 二选一。
- 统一持仓版本字段名：建议使用 `position_version`，不要一处叫 `version` 一处叫 `position_version`。
- 统一 open position 数量字段：`open_positions` 或 `open_positions_count` 二选一。

## 4. P1 状态与错误码冲突

### 4.1 错误码命名不统一

当前下单文档包含：

```text
RFQ_QUOTE_UNAVAILABLE
RFQ_DUPLICATE_CLIENT_TRADE_ID
RFQ_PROVIDER_UNREACHABLE
RFQ_SELL_QUOTE_UNAVAILABLE
RFQ_CHAIN_SUBMIT_FAILED
```

旧反馈中曾建议：

```text
RFQ_TRADE_DUPLICATED
RFQ_CLIENT_QUOTE_DUPLICATED
RFQ_PROVIDER_REJECTED
RFQ_INTERNAL_ERROR
```

需要修改：

- 以后端 Word 版为准也可以，但必须把所有文档统一到同一套错误码。
- 幂等错误建议区分：
  - `RFQ_DUPLICATE_CLIENT_QUOTE_ID`
  - `RFQ_DUPLICATE_CLIENT_TRADE_ID`
- `RFQ_PROVIDER_*` 错误码可以保留为技术 key，但用户文案不要出现 provider / 做市商。

### 4.2 market / match / position 状态需要统一

行情文档中 match status：

```text
scheduled / live / paused / finished
```

market status：

```text
open / paused / closed / settled / voided
```

position status：

```text
active / reduced / closed / settled_won / settled_lost / void_refunded
```

需要修改：

- 明确 match status 与 market status 是两套状态，不能混用。
- 明确 `finished` 的 match 是否一定触发 market `closed`，以及何时进入 `settled`。
- 明确 void 场景中 market 用 `voided`，position 用 `void_refunded`。

### 4.3 `RFQ_MARKET_NOT_OPEN` 与 `RFQ_MARKET_PAUSED / CLOSED` 边界需说明

当前错误码中同时有：

- `RFQ_MARKET_NOT_OPEN`
- `RFQ_MARKET_PAUSED`
- `RFQ_MARKET_CLOSED`

需要修改：

- `not_open` 用于赛前未开盘。
- `paused` 用于临时暂停。
- `closed` 用于关盘等待结算。
- 前端按钮状态、文案、是否自动重试需要分别说明。

## 5. P1 行情接口冲突

### 5.1 行情示例包含当前 v7 不交付的盘口

行情文档示例出现：

- 首球时间
- MVP
- 金靴
- 净胜球

当前 v7.0 前端主范围是单场预测、冠军与晋级、赛季结果、两回合系列赛，不应让测试或前端误以为这些扩展盘口本期交付。

需要修改：

- v1.0 示例收口到当前 v7 范围。
- 首球时间、MVP、金靴、净胜球等放到 future / extension 章节。

### 5.2 `/soccer/rfq/matches` 命名与实际含义冲突

行情文档已注明：

> 实际返回的是 `scope=match` 的全部 RFQ 市场，不是比赛列表。

需要修改，二选一：

- 改为 `GET /api/v1/soccer/rfq/markets?scope=match`。
- 或保留现有 path，但文档标题和字段说明都明确它返回 `RfqMarketView[]`，不是 Match[]。

### 5.3 `matches/:matchId/markets` 的 matchId 来源不清楚

行情文档写：

- path 是 `/soccer/rfq/matches/:matchId/markets`
- 参数说明却出现 `provider_match_id`

需要修改：

- path 参数必须明确是内部 `match.id`，还是 `provider_match_id`。
- 建议前端统一使用内部 `match.id`。
- `provider_match_id` 只作为内部映射字段，不作为前端路由参数。

### 5.4 `share_price` 与 `implied_probability` 同时返回容易影响 UI 口径

行情文档同时返回：

```json
{
  "implied_probability": "0.465116",
  "share_price": "0.465116"
}
```

当前前端产品口径是不同时展示“概率”和“概率价格”。

需要修改：

- API 可以保留两个字段，但文档需说明前端默认展示 `share_price`，不要同时展示 `implied_probability`。
- 如果两者短期永远相等，建议只把 `implied_probability` 作为辅助字段，不作为主 UI 字段。

### 5.5 WS 去重规则不足

行情文档写：

> 同时订阅 market + subject 会收到 2 条相同消息，前端可按 market_id 去重。

按 `market_id` 去重不够，因为同一 market 会持续产生多条 odds refresh。

需要修改：

- WS payload 增加 `event_id`，前端按 `event_id` 去重。
- 如果暂不加 `event_id`，至少建议按 `type + market_id + at` 去重。

### 5.6 `rfq.market_suspended` 的弹窗处理需更精确

行情文档建议：

> 收到 rfq.market_suspended 立即 close 弹窗 + 提示

需要修改：

- 如果用户已经拿到 quote，暂停时应明确 quote 是否立即失效。
- 如果 quote 仍在 TTL 内但 market 暂停，trade 是否会被拒绝需要写清楚。
- 前端应按后端结论决定是关闭弹窗、禁用确认按钮，还是提示重新询价。

## 6. P2 可读性与联调补充项

### 6.1 路径前缀要统一

文档前面流程写：

```text
POST /soccer/rfq/quote
POST /soccer/rfq/trade
GET /soccer/rfq/portfolio
```

接口详情写：

```text
POST /api/v1/soccer/rfq/quote
POST /api/v1/soccer/rfq/trade
GET /api/v1/soccer/rfq/portfolio
```

需要修改：

- 全文统一使用 `/api/v1/...`。
- 伪代码也应统一，避免前端封装时出现双前缀或漏前缀。

### 6.2 `sell_trade` 是否保留需要定稿

下单文档写：

```text
POST /api/v1/soccer/rfq/trade        # 通用入口（buy / sell 都用此）
POST /api/v1/soccer/rfq/sell_trade   # 与上等价
```

需要修改，二选一：

- 只保留通用 `/trade`，由 quote.side 决定 buy / sell。
- 或保留 `/sell_trade`，但明确它是否只是 alias，以及幂等、权限、错误码是否完全一致。

### 6.3 `position_id` 在 sell_quote 中不应写得过于可选

下单文档写 `position_id` 可选，不传则按 `(account, market, outcome)` 自动定位。

需要修改：

- 如果系统保证同一 account + market + outcome 永远聚合成一个 position，可以保留可选。
- 如果未来会出现分批 position、不同成本批次、跨账户子钱包，建议 `position_id` 必填。
- 至少要明确前端 Portfolio 卖出入口应优先传 `position_id`。

### 6.4 金额与份额精度需要覆盖所有字段

行情文档写 6 位小数，下单文档也写 decimal string，但部分字段如 `shares`、`position_shares` 可能需要 8 位小数。

需要修改：

- 明确金额、赔率、份额分别的精度。
- 建议金额 6 位，赔率 6 位，shares 8 位。
- 前端不使用 JS float 做核心计算。

### 6.5 下单确认页字段需要一次性补齐

下单文档最后建议展示：

```text
quoted_odds / estimated_shares / max_loss / fee
accepted_odds / max_loss / fee
```

当前前端口径还需要：

- `Share Price`
- `Decimal Odds`
- `Estimated Avg Price`
- `Potential Payout`
- `Potential Profit`
- 卖出时的 `Estimated Proceeds`
- 卖出时的 `Realized P&L`
- 卖出后的 `Remaining Shares`

需要修改：

- 后端要么直接返回这些字段。
- 要么在接口规范中明确每个字段由前端如何计算。
- 推荐后端直接返回，减少前端口径分歧。

## 7. 建议后端本轮直接修改的清单

1. 删除“下单接口不可读”的历史问题，改为“Word 版已可读，但仍有字段冲突”。
2. 删除或降级前端 request 中的 `account_id`，以后端鉴权主体为准。
3. 统一 quote 过期字段：`quote_expires_at` 与 `ttl_seconds`。
4. 补充 buy quote 的 `share_price`、`estimated_avg_price`、`potential_payout`、`potential_profit`。
5. 明确 fee 是否从本金扣除，修正 `estimated_shares` 公式表述。
6. 明确 RFQ 锁价下 `min_shares_out / min_collateral_out` 的意义，避免滑点误解。
7. 统一 sell quote 的到账字段命名和展示口径。
8. trade response 补充 `status`、`quote_id`、`client_trade_id`。
9. 明确 trade 200、链上异步、链上失败补偿之间的关系。
10. WS `trade_filled` 补充 `account_id / client_trade_id`，或明确 v1.0 收到即刷新。
11. 用户侧文案移除 provider / 做市商 / RFQ。
12. 统一错误码命名，尤其是幂等、provider、chain 相关错误。
13. 统一 portfolio 字段名：`portfolio_value / open_positions / position_version` 或另一套，不要混用。
14. 行情接口示例收口到当前 v7.0 范围，扩展盘口放 future。
15. `/soccer/rfq/matches` 命名或说明需要修正。
16. 明确 `matches/:matchId/markets` 使用内部 match id，不直接用 provider id。
17. WS payload 增加 `event_id`，或明确去重规则为 `type + market_id + at`。
18. 全文统一 `/api/v1/...` 路径前缀。
