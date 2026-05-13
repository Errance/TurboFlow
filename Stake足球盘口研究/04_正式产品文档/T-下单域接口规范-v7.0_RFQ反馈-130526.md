# T-下单域接口规范 v7.0 RFQ 适配反馈报告

审计对象：`T-下单域接口规范-120526-015505.pdf`

适配目标：`TurboFlow足球RFQ预测交易市场产品需求文档_v7.0.md`

审计视角：产品经理、资深前端开发、资深后端开发

## 1. 总体结论

原《下单域接口规范》比此前 AMM 方案更接近 v7.0 RFQ 方向，因为它已经具备 `Order`、`OrderLeg`、`decimal_odds`、`notional_dollars`、幂等键、业务失败码和传统赔率成交的基本结构。v7.0 不应把该规范整体废弃，而应将其升级为“RFQ 交易域接口规范”。

但原规范仍不能原样实施。主要原因：

- 它把 `decimal_odds` 作为静态权威字段，没有明确 RFQ quote 的短时有效期。
- 它没有外部做市商 quote 生命周期字段。
- 它没有买入后 position、可卖份额、sell quote / sell trade 和部分卖出。
- 它将 `cancel` 作为撤单能力，而 v7.0 成交后退出应是 sell quote / sell trade。
- 它围绕 single / parlay 下注单组织，而 v7.0 当前主链路围绕 outcome / quote / trade / position。

建议将原规范修订为：

```text
Order Domain v5.x 兼容层
+ Soccer RFQ Trading Domain v7.0
```

## 2. 产品经理视角

### 2.1 用户心智修正

v7.0 用户不应理解为“平台给固定赔率下注”，而应理解为：

1. 页面展示参考概率、份额价格和欧洲赔率换算。
2. 用户交易前获取短时有效报价。
3. 用户确认后，本次成交赔率锁定。
4. 成交形成 position。
5. 用户可获取退出报价后卖出部分或全部 position。
6. 最终按比赛结果结算。

技术实现可继续使用 RFQ、provider、quote、trade、position 等字段；用户可见文案不得直接暴露 `RFQ`、`provider`、`做市商`、`provider quote` 等实现术语，应使用“最新报价”“报价有效期”“退出报价”“报价暂不可用”等产品语言。

### 2.2 历史能力边界

| 能力 | v7.0 当前处理 |
|------|---------------|
| 单关下注 | 转换为单 outcome 报价买入 |
| 多笔单注 | 本版本不作为主链路交付，后续待确认 |
| 串关 | 本版本不作为主链路交付，不写成永久删除，后续可评估组合 RFQ 或独立模块 |
| Cash Out | 本版本不交付传统 Cash Out；当前退出能力由获取退出报价后卖出承接，是否作为独立能力回归待产品确认 |
| 传统我的注单 | 主视图为 Portfolio；历史注单兼容待确认 |
| 传统浮动投注条 | 不作为 v7 主交易入口；是否保留兼容入口待产品确认 |
| 扩展盘口 / v4.5 预测大赛 / 足球 CLOB | 不进入当前 v7 RFQ 主流程，不等于永久删除 |

### 2.3 产品验收

| 验收项 | 应满足 |
|--------|--------|
| 买入报价 | 用户输入金额，获取最新报价，确认后成交 |
| 成交锁价 | trade 记录 `accepted_odds`，后续赔率变化不改本次成交 |
| 部分卖出 | 用户输入少于可卖 shares，获取退出报价并成交 |
| 全部卖出 | 用户使用 Max 卖出全部可卖 shares，关闭或归零 position |
| 报价失败 | quote expired / provider rejected / provider timeout / odds changed 等错误有明确机器码，用户文案不暴露 provider |
| Portfolio | 展示 position、可卖 shares、均价、退出参考价、已实现 / 未实现盈亏 |

## 3. 前端视角

### 3.1 前端数据契约

前端可保留当前 v6.0 mock 的页面结构，但接口语义需改为 RFQ。接口字段可以保留 `quote`、`provider_quote_id`、`position` 等技术字段；渲染给用户时必须映射为产品语言：

| 组件 | 需要的数据 |
|------|------------|
| 比赛列表 | 参考概率、份额价格、欧洲赔率、24h Vol.、状态 |
| outcome 卡 | outcome、概率、份额价格、参考赔率、暂停/关闭状态 |
| 交易面板 | quote_id、过期时间、成交赔率、费用、错误码；不展示 provider quote id |
| Portfolio | position、可卖 shares、买入均价、退出参考价、已实现/未实现盈亏 |
| Design Board | v6 AMM 与 v7 报价交易的可见差异，覆盖当前 17/17 差异项 |

### 3.2 前端错误映射

| 错误码 | 前端文案 | 用户动作 |
|--------|----------|----------|
| `QUOTE_EXPIRED` | 报价已过期，请重新获取 | 重新获取报价 |
| `PROVIDER_REJECTED` | 报价暂不可用，请调整金额或稍后再试 | 调整金额或稍后再试 |
| `PROVIDER_TIMEOUT` | 报价请求超时，请重试 | 重试 |
| `ODDS_CHANGED` | 报价已变化，请按最新报价确认 | 重新获取报价 |
| `MARKET_SUSPENDED` | 市场暂停，恢复后重新询价 | 等待恢复 |
| `SELL_QUOTE_UNAVAILABLE` | 当前暂无法提供退出报价 | 稍后重试 |
| `INSUFFICIENT_POSITION` | 可卖持仓不足 | 降低卖出份额 |
| `INSUFFICIENT_BALANCE` | 余额不足 | 充值或降低金额 |
| `POSITION_CHANGED` | 持仓已变化，请重新获取退出报价 | 刷新持仓并重新报价 |

说明：本表为 API 机器码与前端用户文案建议。技术日志、后台管理和对账报表可使用 provider / RFQ 术语；正式用户界面不直接暴露这些实现词。

## 4. 后端视角

### 4.1 建议 API 边界

```http
GET  /api/v1/soccer/rfq/matches
GET  /api/v1/soccer/rfq/matches/:matchId/markets
GET  /api/v1/soccer/rfq/futures/:competitionId/markets
POST /api/v1/soccer/rfq/quote
POST /api/v1/soccer/rfq/trade
POST /api/v1/soccer/rfq/sell_quote
POST /api/v1/soccer/rfq/sell_trade
GET  /api/v1/soccer/rfq/portfolio
GET  /api/v1/soccer/rfq/trades
GET  /api/v1/soccer/rfq/settlements
```

`price_preference` 不列为 v7.0 P0 接口。小齿轮价格格式切换默认可由前端本地偏好处理；若后续需要账户级跨端同步，再作为 P2 增补 `PUT /api/v1/soccer/rfq/price_preference`。

### 4.2 字段映射

| 原字段 | v7 RFQ 字段 | 说明 |
|--------|-------------|------|
| `order_id` | `trade_id` / `position_id` | trade 是成交记录，position 是持仓 |
| `client_order_id` | `client_quote_id` / `client_trade_id` | quote 追踪和 trade 幂等分离 |
| `decimal_odds` | `display_decimal_odds` / `quoted_odds` / `accepted_odds` | 页面快照、quote 报价和成交锁价分离 |
| `notional_dollars` | `collateral_amount` | 买入投入金额 |
| `yes_price_dollars` | `share_price` | 由赔率换算，保留前端展示 |
| `max_payout_dollars` | `estimated_payout` / `settlement_payout` | quote 阶段为预估，结算后为实际 |
| `cancel` | `sell_quote` + `sell_trade` | 成交后退出是卖出，不是撤单 |
| `legs` | `outcome_id` | v7 主链路一次 trade 针对一个 outcome；串关 / 多笔单注后续另行定义 |
| `status` | `quote_status` / `trade_status` / `position_status` | 状态拆分 |
| provider 映射字段 | `provider_match_id` / `provider_market_id` / `provider_selection_id` | 支撑上架、交易和对账，不由前端直连 provider |

### 4.3 quote 状态

| 状态 | 说明 |
|------|------|
| `requested` | 已向 RFQ Gateway 发起询价 |
| `quoted` | 已返回可成交报价 |
| `expired` | 超过有效期 |
| `rejected` | provider 拒绝，前端展示为“报价暂不可用” |
| `trade_pending` | 用户已确认，正在执行成交确认 |
| `consumed` | 已生成 trade |
| `failed` | 系统或 provider 失败 |

### 4.4 trade / position 状态

| 对象 | 状态 |
|------|------|
| Trade | `pending_provider_confirm / filled / failed` |
| Position | `active / reduced / closed / pending_settlement / settled_won / settled_lost / void_refunded / disputed` |

`reversed` 不进入 v7.0 P0 trade 状态。若后续 provider 或运营需要成交冲正，必须单独定义 cashbook 冲销、position 回滚、链上记录和 Reconciliation 规则后再引入。

`disputed` 表示该 position 关联市场进入结果争议或人工复核，期间应冻结结算与 sell quote。若后续决定 dispute 只作为 market / settlement 域状态，需要同步从本表和技术方案状态图中移除，不能两份文档各写一套。

## 5. API 示例

### 5.1 买入 quote

```http
POST /api/v1/soccer/rfq/quote
Content-Type: application/json
```

```json
{
  "account_id": "1001",
  "client_quote_id": "qcli_20260513_001",
  "market_id": "match_botafogo_mirassol_result_1x2",
  "outcome_id": "home_win",
  "side": "buy",
  "collateral_amount": "100.00"
}
```

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "quote_id": "rfq_q_10001",
    "provider_id": "mm_main_01",
    "provider_quote_id": "pq_839102",
    "provider_match_id": "pm_5521",
    "provider_market_id": "pmkt_1x2",
    "provider_selection_id": "psel_home",
    "market_id": "match_botafogo_mirassol_result_1x2",
    "outcome_id": "home_win",
    "side": "buy",
    "display_decimal_odds": "1.81",
    "quoted_odds": "1.80",
    "implied_probability": "0.5525",
    "share_price": "0.5525",
    "collateral_amount": "100.00",
    "estimated_shares": "181.00",
    "fee": "0.60",
    "max_loss": "100.60",
    "quote_expires_at": "2026-05-13T22:30:30+08:00"
  }
}
```

quote 阶段返回的是 `quoted_odds`，不能命名为 `accepted_odds`。只有用户确认并生成 trade 后，才写入 `accepted_odds`。`display_decimal_odds` 是列表或卡片展示快照，可与本次 quote 的 `quoted_odds` 不同。

### 5.2 执行买入 trade

```http
POST /api/v1/soccer/rfq/trade
```

```json
{
  "account_id": "1001",
  "quote_id": "rfq_q_10001",
  "client_trade_id": "trade_cli_20260513_001"
}
```

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "trade_id": "tr_70001",
    "provider_trade_id": "pt_93001",
    "position_id": "pos_9001",
    "side": "buy",
    "accepted_odds": "1.80",
    "shares": "181.00",
    "collateral_delta": "-100.60",
    "position_shares": "181.00",
    "position_avg_price": "0.5525",
    "status": "filled"
  }
}
```

若同一 `account_id + client_trade_id` 重复提交，接口应幂等返回同一个 `trade_id` 和最终状态；不得重复扣款、重复确认 provider trade 或重复增加 position。

### 5.3 卖出 quote

```http
POST /api/v1/soccer/rfq/sell_quote
```

```json
{
  "account_id": "1001",
  "client_quote_id": "sqcli_20260513_001",
  "position_id": "pos_9001",
  "shares": "50.00"
}
```

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "sell_quote_id": "rfq_sq_20001",
    "provider_quote_id": "psq_93002",
    "provider_match_id": "pm_5521",
    "provider_market_id": "pmkt_1x2",
    "provider_selection_id": "psel_home",
    "position_id": "pos_9001",
    "shares": "50.00",
    "exit_decimal_odds": "1.62",
    "exit_share_price": "0.6173",
    "estimated_collateral_out": "30.86",
    "fee": "0.18",
    "net_collateral_out": "30.68",
    "realized_pnl": "3.05",
    "remaining_shares": "131.00",
    "quote_expires_at": "2026-05-13T22:31:10+08:00"
  }
}
```

### 5.4 执行卖出 trade

```http
POST /api/v1/soccer/rfq/sell_trade
```

```json
{
  "account_id": "1001",
  "sell_quote_id": "rfq_sq_20001",
  "client_trade_id": "sell_trade_cli_20260513_001"
}
```

卖出确认必须在 trade 阶段重新校验 `available_shares`。如果 quote 有效期内发生并发卖出或结算状态变化，应返回 `POSITION_CHANGED` / `QUOTE_EXPIRED`，要求前端重新获取退出报价。

### 5.5 报价变化错误示例

```json
{
  "code": "ODDS_CHANGED",
  "msg": "quote changed",
  "data": {
    "old_quote_id": "rfq_q_10001",
    "new_quote_id": "rfq_q_10002",
    "display_decimal_odds": "1.81",
    "quoted_odds": "1.76",
    "quote_expires_at": "2026-05-13T22:31:00+08:00"
  }
}
```

前端用户文案为“报价已变化，请按最新报价确认”，不展示 provider 拒单或 RFQ 内部细节。

## 6. 数据模型建议

### 6.1 `soccer_rfq_quote`

```sql
soccer_rfq_quote (
  id,
  account_id,
  client_quote_id,
  provider_id,
  provider_quote_id,
  provider_match_id,
  provider_market_id,
  provider_selection_id,
  market_id,
  outcome_id,
  side,
  collateral_amount,
  shares,
  display_decimal_odds,
  quoted_odds,
  implied_probability,
  share_price,
  fee,
  status,
  expires_at,
  accepted_at,
  consumed_at,
  failed_at,
  provider_request_snapshot,
  provider_response_snapshot,
  created_at
)
```

### 6.2 `soccer_rfq_trade`

```sql
soccer_rfq_trade (
  id,
  account_id,
  quote_id,
  provider_trade_id,
  provider_match_id,
  provider_market_id,
  provider_selection_id,
  client_trade_id,
  position_id,
  side,
  shares,
  accepted_odds,
  collateral_delta,
  fee,
  realized_pnl,
  status,
  idempotency_key,
  chain_trade_id,
  created_at,
  updated_at
)
```

`chain_trade_id` 用于映射 `turbo-contract` 的 `PredictionOrder.trade_id: u64`。业务侧 `trade_id` 可以是字符串，但必须保存与链上 u64 的稳定映射。

### 6.3 `soccer_rfq_position`

```sql
soccer_rfq_position (
  id,
  account_id,
  market_id,
  outcome_id,
  provider_match_id,
  provider_market_id,
  provider_selection_id,
  shares,
  available_shares,
  locked_shares,
  avg_price,
  cost_basis,
  current_reference_price,
  realized_pnl,
  status,
  version,
  updated_at
)
```

`version` 用于卖出确认时的并发控制，防止两个有效 sell quote 同时消耗同一批 shares。

### 6.4 `soccer_market_mapping`

```sql
soccer_market_mapping (
  provider_id,
  provider_match_id,
  provider_market_id,
  provider_selection_id,
  internal_match_id,
  internal_market_id,
  internal_outcome_id,
  status,
  created_at,
  updated_at
)
```

该表是上新、交易、结算和对账的核心映射。前端只消费 internal id；provider id 用于后台接入和 Reconciliation。

## 7. 幂等、资金和并发规则

### 7.1 幂等键

| 操作 | 幂等键 | 重复请求处理 |
|------|--------|--------------|
| 买入 quote | `account_id + client_quote_id` | 返回同一个 quote 或其最终状态 |
| 买入 trade | `account_id + client_trade_id` | 返回同一个 trade，不重复扣款 |
| 卖出 quote | `account_id + client_quote_id` | 返回同一个 sell quote 或其最终状态 |
| 卖出 trade | `account_id + client_trade_id` | 返回同一个 sell trade，不重复扣减 shares |

同一 quote 被成功消费后再次确认，应返回原 trade；如果 quote 已过期、已失败或 account 不匹配，应返回明确错误。

### 7.2 资金流

- quote 阶段只做余额、限额和市场状态预校验，默认不冻结资金。
- trade confirm 阶段原子执行余额校验、扣款 / 冻结、provider accept、trade ledger、position update 和 cashbook。
- provider accept 成功但内部落账失败时必须进入人工对账或补偿流程，不得静默丢弃。
- 内部扣款成功但 provider trade 失败时必须回滚资金或生成冲正 cashbook。

### 7.3 卖出并发

- sell quote 阶段可做 `available_shares` 预校验，但最终以 sell trade 阶段的 position `version` 或 CAS 校验为准。
- 如果可卖份额在 quote 有效期内被另一笔卖出消耗，返回 `POSITION_CHANGED`。
- dispute、settlement、void 期间应禁止新的 sell quote，或明确进入人工处理。

### 7.4 安全边界

- 用户接口必须有登录态和账户鉴权，不能只依赖 `account_id` 请求字段。
- provider webhook / trade callback / settlement feed 需要签名校验或 mTLS。
- quote 与 trade confirm 需要防重放，建议服务端保存请求摘要、provider 响应摘要和幂等键。
- 敏感操作必须写审计日志，包括请求、响应、操作者、账户、金额、赔率、shares、IP / device、provider correlation id。

## 8. 链上适配边界

第一阶段建议：RFQ quote、provider 交互、position 聚合、sell quote 和 sell trade 全部链下管理；链上只在买入成交和最终结算阶段复用 Prediction 模块。链上 `PredictionOrder.status` 仅能表达 `Pending / Finish`，不能表达链下 quote、trade、sell、disputed、failed 等完整业务状态。

| 链下对象 | 链上对应 | 说明 |
|----------|----------|------|
| `soccer_rfq_trade.id` | `PredictionOrder.trade_id` 映射 | 需保存字符串业务 ID 与 u64 链上 ID 的映射 |
| `accepted_odds` | `PredictionOrder.odds_e8` | 只写成交锁定赔率，不写 quote 阶段赔率 |
| sell quote / sell trade | 暂无直接对应 | 第一阶段链下处理，后续再评估链上扩展 |
| position 聚合 | 暂无直接对应 | 多次买入 / 卖出由链下 Position Service 汇总 |

## 9. 与原规范的修订优先级

### P0

- 新增 RFQ quote / trade / sell quote / sell trade。
- 拆分 quote、trade、position 状态，并统一 `disputed` 口径。
- 增加 provider quote、provider market mapping 和 provider trade 字段。
- `cancel` 不再作为成交后主退出路径，成交后退出由 sell quote / sell trade 承接。
- 增加 Portfolio 聚合接口。
- 增加幂等、资金原子性、卖出并发和安全边界。

### P1

- provider reject / timeout / odds changed 错误码。
- quote TTL、幂等响应和二次消费规则。
- 成交锁价和 provider_trade_id。
- 结算、void、争议状态。
- provider reconciliation 字段。
- Prediction 合约第一阶段适配边界。

### P2

- 串关 / 组合 RFQ。
- 历史传统注单兼容展示。
- provider 多源切换和兜底。
- 账户级价格展示偏好同步接口。

## 10. 最终建议

建议原《下单域接口规范》保留为 v5.x 传统下注域基线，并新增《足球 RFQ 交易域接口规范 v7.0》。v7.0 不需要否定原 order 模型，而是将 order 的赔率、金额、幂等、状态能力升级为 RFQ quote、trade、position 和 sell quote。

该规范必须同时满足四个边界：

- 用户前端展示产品语言，不直接暴露 RFQ / provider / 做市商内部术语。
- 技术接口完整记录 provider id、quote TTL、幂等键、资金流水和 provider 原始响应。
- position、sell、settlement 和 dispute 必须有统一状态机。
- 第一阶段链上能力小于业务状态机，不能误认为 PredictionOrder 能承载完整 RFQ 生命周期。
