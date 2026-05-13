# T-下单域接口规范 v7.0 RFQ 适配反馈报告

审计对象：`T-下单域接口规范-120526-015505.pdf`

适配目标：`TurboFlow足球RFQ预测交易市场产品需求文档_v7.0.md`

审计视角：产品经理、资深前端开发、资深后端开发

## 1. 总体结论

原《下单域接口规范》比此前 AMM 方案更接近 v7.0 RFQ 方向，因为它已经具备 `Order`、`OrderLeg`、`decimal_odds`、`notional_dollars`、幂等键、业务失败码和传统赔率成交的基本结构。v7.0 不应把该规范整体废弃，而应将其升级为“RFQ 交易域接口规范”。

但原规范仍不能原样实施。主要原因：

- 它把 `decimal_odds` 作为静态权威字段，没有明确 RFQ quote 的短时有效期。
- 它没有外部做市商 quote 生命周期字段。
- 它没有买入后 position、可卖份额、反向 RFQ 卖出和部分卖出。
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

1. 页面展示做市商参考赔率、概率和份额价格。
2. 用户交易前请求 RFQ。
3. 用户确认后，本次成交赔率锁定。
4. 成交形成 position。
5. 用户可通过反向 RFQ 卖出部分或全部 position。
6. 最终按比赛结果结算。

### 2.2 历史能力边界

| 能力 | v7.0 当前处理 |
|------|---------------|
| 单关下注 | 转换为单 outcome RFQ 买入 |
| 多笔单注 | 本版本不作为主链路交付，后续待确认 |
| 串关 | 本版本不交付，不写成永久删除 |
| Cash Out | 不恢复传统 Cash Out，退出能力由反向 RFQ 卖出承接 |
| 传统我的注单 | 主视图为 Portfolio；历史注单兼容待确认 |

### 2.3 产品验收

| 验收项 | 应满足 |
|--------|--------|
| 买入 RFQ | 用户输入金额，获取做市商报价，确认后成交 |
| 成交锁价 | trade 记录 `accepted_odds`，后续赔率变化不改本次成交 |
| 部分卖出 | 用户输入少于可卖 shares，获取 sell quote 并成交 |
| 全部卖出 | 用户使用 Max 卖出全部可卖 shares，关闭或归零 position |
| quote 失败 | provider reject / timeout / odds changed / quote expired 有明确错误 |
| Portfolio | 展示 position、可卖 shares、均价、退出参考价、已实现 / 未实现盈亏 |

## 3. 前端视角

### 3.1 前端数据契约

前端可保留当前 v6.0 mock 的页面结构，但接口语义需改为 RFQ：

| 组件 | 需要的数据 |
|------|------------|
| 比赛列表 | 做市商参考概率、份额价格、欧洲赔率、24h Vol.、状态 |
| outcome 卡 | outcome、概率、份额价格、参考赔率、暂停/关闭状态 |
| RFQ 交易面板 | quote、provider quote id、过期时间、成交赔率、费用、错误码 |
| Portfolio | position、可卖 shares、买入均价、退出参考价、已实现/未实现盈亏 |
| Design Board | v6 AMM 与 v7 RFQ 的可见差异 |

### 3.2 前端错误映射

| 错误码 | 前端文案 | 用户动作 |
|--------|----------|----------|
| `QUOTE_EXPIRED` | 报价已过期，请重新询价 | 重新 quote |
| `PROVIDER_REJECTED` | 做市商暂不接受该交易 | 调整金额或稍后再试 |
| `PROVIDER_TIMEOUT` | 做市商报价超时 | 重试 |
| `ODDS_CHANGED` | 赔率已变化，请按最新报价确认 | 重新 quote |
| `MARKET_SUSPENDED` | 市场暂停，恢复后重新询价 | 等待恢复 |
| `SELL_QUOTE_UNAVAILABLE` | 当前暂无法提供退出报价 | 稍后重试 |
| `INSUFFICIENT_POSITION` | 可卖持仓不足 | 降低卖出份额 |
| `INSUFFICIENT_BALANCE` | 余额不足 | 充值或降低金额 |

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
PUT  /api/v1/soccer/rfq/price_preference
```

### 4.2 字段映射

| 原字段 | v7 RFQ 字段 | 说明 |
|--------|-------------|------|
| `order_id` | `trade_id` / `position_id` | trade 是成交记录，position 是持仓 |
| `client_order_id` | `client_quote_id` / `client_trade_id` | quote 追踪和 trade 幂等分离 |
| `decimal_odds` | `display_decimal_odds` / `accepted_odds` | 页面展示与成交锁价分离 |
| `notional_dollars` | `collateral_amount` | 买入投入金额 |
| `yes_price_dollars` | `share_price` | 由赔率换算，保留前端展示 |
| `max_payout_dollars` | `estimated_payout` / `settlement_payout` | quote 阶段为预估，结算后为实际 |
| `cancel` | `sell_quote` + `sell_trade` | 成交后退出是卖出，不是撤单 |
| `legs` | `outcome_id` | v7 主链路一次 trade 针对一个 outcome |
| `status` | `quote_status` / `trade_status` / `position_status` | 状态拆分 |

### 4.3 quote 状态

| 状态 | 说明 |
|------|------|
| `requested` | 已向 RFQ Gateway 发起询价 |
| `quoted` | 已返回可成交报价 |
| `expired` | 超过有效期 |
| `rejected` | 做市商拒绝 |
| `accepted` | 用户已确认并进入成交 |
| `consumed` | 已生成 trade |
| `failed` | 系统或 provider 失败 |

### 4.4 trade / position 状态

| 对象 | 状态 |
|------|------|
| Trade | `pending_provider_confirm / filled / failed / reversed` |
| Position | `active / reduced / closed / pending_settlement / settled_won / settled_lost / void_refunded` |

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
    "market_id": "match_botafogo_mirassol_result_1x2",
    "outcome_id": "home_win",
    "side": "buy",
    "display_decimal_odds": "1.81",
    "accepted_odds": "1.81",
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
    "accepted_odds": "1.81",
    "shares": "181.00",
    "collateral_delta": "-100.60",
    "position_shares": "181.00",
    "position_avg_price": "0.5525",
    "status": "filled"
  }
}
```

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

## 6. 数据模型建议

### 6.1 `soccer_rfq_quote`

```sql
soccer_rfq_quote (
  id,
  account_id,
  provider_id,
  provider_quote_id,
  market_id,
  outcome_id,
  side,
  collateral_amount,
  shares,
  display_decimal_odds,
  accepted_odds,
  implied_probability,
  share_price,
  fee,
  status,
  expires_at,
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
  client_trade_id,
  position_id,
  side,
  shares,
  accepted_odds,
  collateral_delta,
  fee,
  realized_pnl,
  status,
  created_at
)
```

### 6.3 `soccer_rfq_position`

```sql
soccer_rfq_position (
  id,
  account_id,
  market_id,
  outcome_id,
  shares,
  available_shares,
  avg_price,
  current_reference_price,
  realized_pnl,
  status,
  updated_at
)
```

## 7. 与原规范的修订优先级

### P0

- 新增 RFQ quote / trade / sell quote / sell trade。
- 拆分 quote、trade、position 状态。
- 增加 provider quote 字段。
- `cancel` 不再作为成交后主退出路径，成交后退出由 sell quote / sell trade 承接。
- 增加 Portfolio 聚合接口。

### P1

- provider reject / timeout / odds changed 错误码。
- quote TTL 和幂等规则。
- 成交锁价和 provider_trade_id。
- 结算、void、争议状态。
- provider reconciliation 字段。

### P2

- 串关 / 组合 RFQ。
- 历史传统注单兼容展示。
- provider 多源切换和兜底。

## 8. 最终建议

建议原《下单域接口规范》保留为 v5.x 传统下注域基线，并新增《足球 RFQ 交易域接口规范 v7.0》。v7.0 不需要否定原 order 模型，而是将 order 的赔率、金额、幂等、状态能力升级为 RFQ quote、trade、position 和 sell quote。
