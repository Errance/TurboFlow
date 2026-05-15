# TurboFlow 足球 RFQ 后端 v3.0 方案与前端接口反馈

版本：v1.0
日期：2026-05-15
对象：

- `TurboFlow 足球盘口技术方案 v3.0 设计`
- `T-前端行情接口规范 v1.0`
- `T-前端下单接口规范 v1.0`

## 1. 总体结论

后端 v3.0 技术方案方向基本可用，可以作为 RFQ 后端架构设计和 skeleton 开发依据，但当前三份材料还不能直接冻结为前端联调接口契约。

核心原因：

- 技术方案的交易主线、持仓模型、卖出流程、CAS 并发控制、结算和对账方向与当前 v7.0 RFQ 产品目标一致。
- 行情接口的 `Match -> Market -> Outcome` 分层、`scope / group` 模型、参考价与 WebSocket 推送方向基本可用。
- 下单接口规范文件当前不可读或导出异常，无法作为前端接入依据。
- quote TTL、状态枚举、下单响应字段、链上 sell 支持边界、DB 与链上原子性等关键点仍需统一。

建议：后端方案可以继续推进，但必须补一版“前端可联调接口合同”，明确 request / response / error / 状态 / 幂等 / TTL / 字段精度后再进入前端正式接入。

## 2. 已确认可用的设计

### 2.1 RFQ 主交易模型正确

v3.0 方案中以下判断是正确的：

- 价格由外部报价源主导，不再自建 AMM 池或内部 odds evaluator。
- 页面行情价格只是参考快照，不能直接用于下单。
- 买入必须经过 `quote -> trade -> position`。
- 卖出必须经过 `sell_quote -> sell_trade`。
- 用户资产视图是 position，而不是传统注单。
- RFQ 下不存在挂单、撤单、部分成交挂起。
- `trade` 只有 `filled / failed`，符合当前 RFQ 全成或全拒绝模型。
- position 使用 `version CAS` 防止并发卖出导致 over-sell。
- 市场级批量结算符合足球赛果集中产生的业务特点。

这些点与当前 v7.0 PRD 一致。

### 2.2 行情模型方向正确

行情接口中 `Match -> Market -> Outcome` 分层是正确的：

- `Match` 对应单场比赛或赛事对象。
- `Market` 对应具体玩法，如胜平负、让球、大小球、冠军等。
- `Outcome` 是用户实际买入的结果选项。
- 前端展示价格、份额价格、欧洲赔率和 24h 指标都应基于 Outcome。

`scope` 设计也基本可用：

- `match`：单场比赛级市场。
- `competition`：整届赛事级市场。
- `season`：赛季级市场。
- `tie`：淘汰赛对阵级市场。

这能覆盖当前足球 v7.0 的单场预测、冠军与晋级、赛季结果和两回合系列赛。

### 2.3 行情 WebSocket 方向正确

以下 WS 事件方向可用：

- `rfq.odds_refreshed`
- `rfq.market_suspended`
- `rfq.market_reopened`
- `rfq.market_closed`
- `rfq.market_settled`
- `rfq.trade_filled`

并且行情文档明确写到：

> `display_decimal_odds` 是参考价，不能用于下单。下单必须重新走 `/soccer/rfq/quote` 拿带签名的 `quote_id`。

这个约束非常重要，应保留并放到接口文档的高优先级说明中。

## 3. 当前阻塞项

### 3.1 下单接口规范不可用

`T-前端下单接口规范 v1.0-150526-083945.pdf` 当前只有 1 页，文件大小约 3KB，普通文本抽取为空，PDF 解析也无正文内容。

因此当前无法确认以下关键接口的正式 request / response：

- `POST /api/v1/soccer/rfq/quote`
- `POST /api/v1/soccer/rfq/trade`
- `POST /api/v1/soccer/rfq/sell_quote`
- `POST /api/v1/soccer/rfq/sell_trade`
- `GET /api/v1/soccer/rfq/portfolio`

请重新导出为可复制文本的 PDF、Markdown 或 Word。建议优先给 Markdown，避免 PDF 导出丢失内容。

### 3.2 前端不能只根据技术方案猜接口

技术方案中有流程和表结构，但这不足以替代前端接口规范。

前端联调需要每个接口明确：

- HTTP method 与 path。
- 鉴权要求。
- request body。
- response body。
- 字段类型与精度。
- 错误码。
- 幂等键规则。
- quote TTL。
- quote / trade / position 状态变化。
- 哪些字段仅展示、哪些字段参与计算、哪些字段禁止前端自行计算。

如果没有这些内容，前端容易自行推断字段，后续联调成本会很高。

## 4. 必须修订的问题

### 4.1 quote TTL 必须统一

当前资料中存在不一致：

- 技术方案写 quote TTL 默认 5 秒。
- 之前产品和前端 mock 中曾使用更长的报价有效期表达。
- 行情缓存又是 10s / 30s / 60s，不应与 quote TTL 混淆。

建议：

- 行情快照 TTL 与交易 quote TTL 分开定义。
- `quote.expires_at` 由后端返回，前端只按该字段倒计时。
- 如果最终采用 5 秒 TTL，需要产品确认，因为用户确认时间会明显更紧。
- 无论 TTL 是 5 秒还是 30 秒，文档中只能保留一个口径。

建议接口字段：

```json
{
  "quote_id": "q_123",
  "expires_at": "2026-05-15T08:30:05Z",
  "ttl_seconds": 5
}
```

### 4.2 状态枚举必须统一

当前文档中存在多套相近状态：

- `paused` / `suspended`
- `void` / `voided`
- `finished` / `closed` / `settled`
- `official_pending`
- `settled_won / settled_lost / void_refunded`

前端会直接依赖状态控制：

- outcome 是否可点击。
- 买入按钮是否可用。
- 卖出按钮是否可用。
- 是否显示等待结算。
- 是否显示 void / refund。
- 是否刷新 Portfolio。

建议明确统一枚举：

Market status：

```text
upcoming | open | paused | closed | official_pending | settled | voided
```

Outcome status：

```text
open | paused | closed | settled | void
```

Quote status：

```text
pending | accepted | expired | rejected
```

Trade status：

```text
filled | failed
```

Position status：

```text
active | reduced | closed | settled_won | settled_lost | void_refunded
```

同时需要说明：前端是否应把 `market.status` 向下覆盖到 `outcome.status`，还是以后端返回的 outcome status 为准。

### 4.3 链上 sell 支持边界必须明确

技术方案写到：

- 买入调用 `chain.SubmitPredictionTrade`。
- 卖出调用 `chain.SubmitPredictionTrade(side=sell)`。
- position 份额 burn，资金入账，position reduced / closed。

但当前 `turbo-contract` 的 Prediction 模块更接近买入和最终结算模型，不确定是否已经支持：

- position 部分卖出。
- sell quote 对应的链上 burn。
- sell trade 资金即时返还。
- position version 链上同步。

请后端明确第一阶段采用哪种方案：

1. **扩展合约支持 sell**：需要给出合约接口、账户结构、事件和失败回滚规则。
2. **第一阶段 sell 只链下记账**：链上只保留买入与最终结算，sell 通过后端 position ledger 对冲。
3. **暂不支持真实 sell**：仅保留前端 mock 或延后。

如果采用方案 2，接口仍可保留 `sell_quote / sell_trade`，但文档必须明确链上真源和链下镜像的对账边界。

### 4.4 DB 与链上不能写成一个 ACID 事务

技术方案中写到：

> 同事务：余额扣减 + 份额 mint + position upsert (CAS) + trade 落库

同时又调用 `chain.SubmitPredictionTrade`。

需要修正这里的表述。数据库事务和链上交易天然不能构成一个 ACID 事务。必须明确：

- DB 先写 pending / submitted，链上确认后再变 filled。
- 或链上先提交，扫块确认后写 DB。
- 或采用 outbox pattern。
- 链上失败时资金、quote、trade、position 如何补偿。
- 用户前端看到的中间态是什么。

建议至少增加：

```text
trade.status:
pending_provider | provider_accepted | chain_submitted | filled | failed
```

如果后端仍希望前端只看到 `filled / failed`，也需要在内部状态机说明如何隐藏中间态。

### 4.5 `accepted_odds == quoted_odds` 需要容忍精度规则

技术方案写 `accepted_odds == quoted_odds`。

建议明确：

- 是字符串严格相等，还是 decimal 归一化后相等。
- 精度是 4 位、6 位还是 provider 原始精度。
- 如果 provider 返回 `2.15`，quote 存 `2.150000`，是否算一致。
- 若出现微小舍入差异，是拒单还是按 quote 价锁定。

建议统一：

```text
quoted_odds / accepted_odds 使用 decimal string，前端不做浮点计算。
后端比较时按 Decimal 归一化到约定精度。
```

### 4.6 行情接口示例应收口到当前 v7 范围

行情文档中出现了“首球时间”“MVP”等示例。后端可以保留扩展能力，但当前 v7.0 前端主交付范围是：

单场 7 类：

- 胜平负
- 开球权
- 让球
- 让球 0:1
- 总进球数
- 大小球
- 波胆

冠军与晋级 11 类：

- 小组第一
- 小组出线
- 进入 8 强
- 进入决赛
- 冠军
- 欧冠冠军
- 晋级决赛
- 两回合系列赛赛果
- 英超冠军
- 欧冠资格
- 降级球队

建议 v1.0 接口示例只使用当前范围，扩展市场放到 future / extension 章节，避免前端和测试误认为本期要做。

### 4.7 用户侧文案不要暴露 provider / 做市商 / RFQ

后端字段可以使用 `provider_id`、`provider_quote_id`，但前端用户文案不能直接展示：

- provider
- 做市商
- RFQ
- price impact

建议后端接口字段保持技术语义，但接口说明中明确：

- `provider_*` 字段仅用于日志、对账、排查，不直接展示给用户。
- 用户侧展示“最新报价”“成交报价”“退出报价”“报价已变化”“报价暂不可用”。
- 不要要求前端展示 `price_impact`，如必须展示，建议改为 `quote_delta` 或 `quote_change`。

## 5. 下单接口必须补齐的字段建议

### 5.1 买入 quote response

当前前端最终下单面板建议采用以下展示：

```text
Share Price
57¢

Decimal Odds
1.75

Estimated Avg Price
57.4¢

Estimated Shares Received
87.1080 Shares

Trading Fee
0.30 USDT

Max Loss
50.30 USDT

Potential Payout
87.1080 USDT

Potential Profit
36.8080 USDT
```

因此买入 quote 建议后端直接返回这些可展示字段，避免前端自行计算：

```json
{
  "quote_id": "q_123",
  "client_quote_id": "cq_123",
  "market_id": "rfq_mkt_match_winner_20260601_arg_bra",
  "outcome_id": "home_win",
  "side": "buy",
  "share_price": "0.570000",
  "display_decimal_odds": "1.750000",
  "estimated_avg_price": "0.574000",
  "estimated_avg_decimal_odds": "1.742160",
  "estimated_shares": "87.10801400",
  "collateral_amount": "50.000000",
  "fee": "0.300000",
  "max_loss": "50.300000",
  "potential_payout": "87.108014",
  "potential_profit": "36.808014",
  "expires_at": "2026-05-15T08:30:05Z",
  "ttl_seconds": 5,
  "status": "pending"
}
```

说明：

- `share_price` 是当前参考份额价格。
- `display_decimal_odds` 是参考欧洲赔率。
- `estimated_avg_price` 是本次 quote 的预估成交份额均价。
- `estimated_avg_decimal_odds` 可选，如果不给，前端可以只展示 `estimated_avg_price`。
- `potential_payout = estimated_shares * 1 USDT`。
- `potential_profit = potential_payout - max_loss`。

### 5.2 买入 trade response

```json
{
  "trade_id": "tr_123",
  "client_trade_id": "ct_123",
  "quote_id": "q_123",
  "market_id": "rfq_mkt_match_winner_20260601_arg_bra",
  "outcome_id": "home_win",
  "position_id": "pos_123",
  "side": "buy",
  "shares": "87.10801400",
  "accepted_odds": "1.742160",
  "accepted_share_price": "0.574000",
  "fee": "0.300000",
  "collateral_delta": "-50.300000",
  "status": "filled",
  "created_at": "2026-05-15T08:30:01Z"
}
```

建议 trade response 必须返回 `position_id`，否则前端成交后无法稳定定位新持仓。

### 5.3 卖出 quote response

卖出面板建议展示：

```text
Current Exit Price
57¢

Decimal Odds
1.75

Estimated Exit Price
56.2¢

Shares to Sell
84.0000 Shares

Estimated Proceeds
47.21 USDT

Trading Fee
0.28 USDT

Realized P&L
+4.20 USDT

Remaining Shares
0.0000 Shares
```

建议卖出 quote 返回：

```json
{
  "quote_id": "q_sell_123",
  "client_quote_id": "cq_sell_123",
  "position_id": "pos_123",
  "position_version": 7,
  "market_id": "rfq_mkt_match_winner_20260601_arg_bra",
  "outcome_id": "home_win",
  "side": "sell",
  "current_exit_price": "0.570000",
  "display_decimal_odds": "1.750000",
  "estimated_exit_price": "0.562000",
  "shares_to_sell": "84.00000000",
  "estimated_proceeds": "47.208000",
  "fee": "0.280000",
  "net_proceeds": "46.928000",
  "realized_pnl": "4.200000",
  "remaining_shares": "0.00000000",
  "remaining_value": "0.000000",
  "expires_at": "2026-05-15T08:30:05Z",
  "ttl_seconds": 5,
  "status": "pending"
}
```

说明：

- `position_version` 必须返回，供 `sell_trade` CAS 校验。
- `estimated_proceeds` 与 `net_proceeds` 要明确是否含手续费。
- 建议前端展示 `estimated_proceeds` 或 `net_proceeds` 时以接口说明为准，避免误差。

### 5.4 卖出 trade response

```json
{
  "trade_id": "tr_sell_123",
  "client_trade_id": "ct_sell_123",
  "quote_id": "q_sell_123",
  "position_id": "pos_123",
  "market_id": "rfq_mkt_match_winner_20260601_arg_bra",
  "outcome_id": "home_win",
  "side": "sell",
  "shares": "84.00000000",
  "accepted_odds": "1.779359",
  "accepted_share_price": "0.562000",
  "fee": "0.280000",
  "collateral_delta": "46.928000",
  "realized_pnl": "4.200000",
  "remaining_shares": "0.00000000",
  "position_status": "closed",
  "status": "filled",
  "created_at": "2026-05-15T08:30:01Z"
}
```

### 5.5 Portfolio response

`GET /api/v1/soccer/rfq/portfolio` 建议返回：

```json
{
  "summary": {
    "market_value": "1293.010000",
    "unrealized_pnl": "590.330000",
    "realized_pnl": "42.100000",
    "open_positions_count": 3
  },
  "positions": [
    {
      "position_id": "pos_123",
      "market_id": "rfq_mkt_match_total_20260601_arg_bra",
      "outcome_id": "under_2_5",
      "subject_label": "RJ博塔弗戈 vs 米拉索尔",
      "market_title": "大小球",
      "outcome_label": "小 2.5",
      "shares": "2198.17000000",
      "available_shares": "2198.17000000",
      "avg_price": "0.296000",
      "current_price": "0.562000",
      "display_decimal_odds": "1.780000",
      "market_value": "1234.930000",
      "unrealized_pnl": "584.930000",
      "realized_pnl": "0.000000",
      "status": "active",
      "version": 7,
      "updated_at": "2026-05-15T08:30:01Z"
    }
  ],
  "recent_trades": []
}
```

说明：

- `current_price` 是当前退出参考价或最新参考份额价格，需定义清楚。
- `display_decimal_odds` 是当前参考欧赔。
- `available_shares` 是卖出上限。
- `version` 必须返回，支撑卖出 CAS。

## 6. 错误码建议

下单接口至少需要以下错误码，并给出前端处理建议。

```text
RFQ_MARKET_NOT_FOUND
RFQ_OUTCOME_NOT_FOUND
RFQ_MARKET_NOT_OPEN
RFQ_MARKET_PAUSED
RFQ_MARKET_CLOSED
RFQ_QUOTE_EXPIRED
RFQ_QUOTE_NOT_FOUND
RFQ_QUOTE_ALREADY_ACCEPTED
RFQ_QUOTE_REJECTED
RFQ_ODDS_CHANGED
RFQ_PROVIDER_TIMEOUT
RFQ_PROVIDER_REJECTED
RFQ_INSUFFICIENT_BALANCE
RFQ_POSITION_NOT_FOUND
RFQ_INSUFFICIENT_SHARES
RFQ_POSITION_VERSION_STALE
RFQ_DUST_POSITION
RFQ_TRADE_DUPLICATED
RFQ_CLIENT_QUOTE_DUPLICATED
RFQ_SETTLEMENT_PENDING
RFQ_INTERNAL_ERROR
```

前端处理原则：

- quote 过期、赔率变化、provider 超时：提示重新获取报价。
- 市场暂停 / 关闭：禁用交易，提示等待恢复或等待结算。
- 余额不足：提示充值或调低金额。
- 份额不足 / position version stale：刷新持仓后重新询价。
- dust position：引导全部卖出。
- duplicated：返回原 quote / trade，不应创建新交易。

## 7. 行情接口修订建议

### 7.1 `GET /matches/upcoming` 与 RFQ 市场可用性

行情文档写 Phase 1 中该接口不区分是否有 RFQ 市场，前端再调 markets 判断。

这可以接受，但建议增加轻量字段，减少首屏请求：

```json
{
  "id": 100001,
  "status": "scheduled",
  "has_rfq_markets": true,
  "rfq_market_count": 7
}
```

如果后端暂时不给，前端也可以缓存 `/soccer/rfq/matches` 做交叉判断，但体验和性能会弱一些。

### 7.2 `GET /soccer/rfq/matches` 命名容易误解

文档中也写到该接口实际返回 `scope=match` 的全部 RFQ 市场，不是比赛列表。

建议改名或增加别名：

```text
GET /api/v1/soccer/rfq/markets?scope=match
```

保留旧 path 也可以，但文档要明确其语义。

### 7.3 `trade_filled` 当前不含 account_id

行情文档写当前 payload 不含 `account_id`，建议前端收到就刷新 portfolio。

这在 v1.0 可以接受，但会导致所有订阅者都触发额外请求。建议 v1.1 补：

```json
{
  "account_id": "123",
  "client_trade_id": "ct_123"
}
```

前端可以只对当前用户的成交刷新 Portfolio。

### 7.4 WS 事件命名要统一

技术方案中出现 `rfq.odds.refreshed`，行情文档中是 `rfq.odds_refreshed`。

建议统一为一种。前端更建议使用下划线版本：

```text
rfq.odds_refreshed
rfq.trade_filled
rfq.market_suspended
rfq.market_reopened
rfq.market_closed
rfq.market_settled
```

## 8. 前端 UI 字段口径

当前下单面板最终建议不要同时展示概率和概率价格，也不要一行塞三个价格。

推荐英文显示：

```text
Share Price                         57¢
Decimal Odds                        1.75

Estimated Avg Price                 57.4¢
Estimated Shares Received           87.1080 Shares
Trading Fee                         0.30 USDT
Max Loss                            50.30 USDT
Potential Payout                    87.1080 USDT
Potential Profit                    36.8080 USDT
```

接口需要支持这些字段，或者明确哪些由前端从 quote response 计算。

不建议前端展示：

- `Price Impact`
- `provider`
- `RFQ`
- `做市商`

建议展示：

- `Share Price`
- `Decimal Odds`
- `Estimated Avg Price`
- `Estimated Shares Received`
- `Trading Fee`
- `Max Loss`
- `Potential Payout`
- `Potential Profit`
- 卖出时展示 `Estimated Proceeds`、`Realized P&L`、`Remaining Shares`

## 9. 后端需要补充的文档清单

请后端补充或修订以下内容：

1. 重新导出可读的 `T-前端下单接口规范 v1.0`。
2. 明确 quote TTL，统一所有文档和接口字段。
3. 明确 sell 的链上支持边界，是扩合约、链下记账，还是后续版本。
4. 统一 market / outcome / quote / trade / position 状态枚举。
5. 给出买入 quote、买入 trade、卖出 quote、卖出 trade、portfolio 五个接口完整 JSON 示例。
6. 补齐错误码和前端处理建议。
7. 明确 `accepted_odds` 与 `quoted_odds` 的精度比较规则。
8. 明确 `estimated_proceeds`、`net_proceeds`、`fee` 是否含手续费。
9. 明确 DB 与链上交易之间的异步状态、补偿和扫块回流规则。
10. 把 v1.0 示例市场收口到当前足球 v7.0 范围，扩展盘口放后续章节。

## 10. 最终验收标准

后端文档修订后，应满足以下验收标准：

- 前端无需读技术方案，也能仅凭接口规范完成联调。
- 所有金额、份额、赔率、份额价格字段都是 decimal string，避免 JS 浮点误差。
- 所有 quote 都有 `quote_id`、`expires_at`、`ttl_seconds`。
- 所有 trade 都有 `client_trade_id` 幂等规则。
- 所有 sell quote 都有 `position_version`。
- 所有 position 都有 `available_shares`、`version`、`status`。
- 行情参考价与成交 quote 价格边界清晰。
- 用户侧不展示 provider / RFQ / 做市商 / price impact。
- 市场暂停、关盘、结算、void 能通过状态和 WS 事件完整驱动前端。
- 买入、卖出、结算、void 都能刷新 Portfolio。

## 11. 反馈结论

后端 v3.0 技术方案可以继续推进，但当前接口文档还需要补齐后才能进入前端正式接入。

优先级最高的是重新提供可读的下单接口规范，并统一 quote TTL、状态枚举、sell 链上边界和 quote response 字段。行情接口和技术方案整体方向正确，建议按本文问题修订后进入联调。
