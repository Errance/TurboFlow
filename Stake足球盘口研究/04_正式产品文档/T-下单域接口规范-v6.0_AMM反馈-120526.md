# T-下单域接口规范 v6.0 AMM 适配审计报告

审计对象：`T-下单域接口规范-120526-015505.pdf`

适配目标：`TurboFlow足球AMM预测市场产品需求文档_v6.0.md`

审计视角：产品经理、资深前端开发、资深后端开发

## 1. 总体结论

原《下单域接口规范》不适合作为足球 v6.0 AMM 主流程接口规范直接实施。它的核心模型是传统下注域：`Order`、`OrderLeg`、`single / parlay`、`decimal_odds`、`notional_dollars`、撤单、赔率 CAS、注单结算和链上派奖。该模型适合 v5.0 平台报价型传统盘口，不能承载 v6.0 的 outcome 份额交易和 position 生命周期。

v6.0 主接口应从 `order / bet` 域切换为 AMM 交易域：

- 交易前：`quote`
- 交易执行：`trade`
- 持仓管理：`positions`
- 成交记录：`trades`
- 资产聚合：`portfolio`
- 市场状态：`markets` / `market_liquidity`
- 结算兑付：`settlement`
- 展示偏好：`price_preference`

旧接口可以保留为 v5 兼容层或非足球历史能力，但不能继续作为 `/soccer` v6 主流程的调用契约。

## 2. 产品经理视角审计

### 2.1 用户心智不一致

原接口的用户心智是“用户提交注单，平台按赔率结算”。v6.0 的用户心智是“用户买入 outcome 份额，形成 position，可继续买入、部分卖出、全部卖出或等待结算”。

必须从产品术语上切换：

| 原接口术语 | v6.0 术语 | 处理建议 |
|------------|-----------|----------|
| Order / 注单 | Trade + Position | 用户成交形成持仓，不再以注单为中心 |
| Leg / 注单腿 | Outcome | 一个市场下的可交易结果 |
| Stake / 押注金额 | Collateral Amount | 买入投入或卖出收回的 USDT |
| Decimal Odds | Display Decimal Odds | 仅展示换算，不能作为权威交易字段 |
| Max Payout | Settlement Payout | 仅结算后产生，不能作为买入时承诺 |
| Cancel | Sell Trade | 成交后退出风险只能通过卖出份额 |
| Parlay | 不进入 v6 主流程 | 不出现在 `/soccer` AMM 主流程 |

### 2.2 页面体验缺口

原接口只支持“创建 / 撤单 / 查询订单”，无法满足 v6.0 页面：

- `/soccer` 首页需要展示概率 + 份额价格、`24h Vol.`、价格格式偏好。
- `/soccer/match/:matchId` 需要点击 outcome 后生成 quote。
- `/soccer/futures/:competitionId` 需要长期市场的关闭时间、官方来源、position 管理。
- `/soccer/mybets` 已变成 Portfolio / 我的持仓，需要 position、盈亏、成交历史。
- `/soccer/design-board` 要证明页面 5/5、单场 7/7、赛事级 11/11、状态和移除项已覆盖。

### 2.3 产品验收口径

接口改造后的验收应围绕以下用户结果：

| 验收项 | 应满足 |
|--------|--------|
| 买入 | 用户选择 outcome，输入金额，看到 quote 后成交并生成 position |
| 部分卖出 | 用户输入少于可卖份额的 shares，成交后剩余 position 更新 |
| 全部卖出 | 用户点击 Max / 全部卖出，position 关闭或归零 |
| quote 失败 | quote 过期、流动性不足、价格影响过高、市场暂停时整笔失败 |
| Portfolio | 展示份额、均价、现价、市值、已实现 / 未实现盈亏和成交历史 |
| 价格展示 | 默认概率 + 份额价格；欧洲赔率仅展示换算 |

## 3. 前端视角审计

### 3.1 前端不应再消费 OrderView 作为主数据

原 `OrderView[]` 对前端不够用。v6.0 前端至少需要四类数据：

| 页面 / 组件 | 需要的数据 |
|-------------|------------|
| `MatchListCard` | outcome 概率、份额价格、24h Vol.、价格格式偏好 |
| `AmmMarketRenderer` | market、outcome、状态、24h Vol.、24h 涨跌幅 |
| `AmmTradePanel` | selected outcome、quote、余额、position、错误状态 |
| `AmmPortfolioPanel` | positions、trades、portfolio summary、settlement records |
| `SoccerPriceFormatToggle` | price preference |

### 3.2 前端状态消费建议

前端应以 quote / trade / position 状态驱动 UI：

| 状态 | 前端表现 |
|------|----------|
| `quote.ready` | 展示成交均价、份额、价格影响、手续费、过期时间 |
| `quote.expired` | 主按钮禁用或提示重新询价 |
| `market.paused` | outcome 卡禁用，交易面板提示暂停 |
| `trade.submitting` | 按钮 loading，防重复提交 |
| `trade.filled` | toast 成功，刷新 position 和 portfolio |
| `trade.failed` | toast 错误，保留用户输入，要求重新 quote |
| `position.active` | Portfolio 展示卖出入口 |
| `position.settled` | Portfolio 展示兑付结果 |
| `position.void_refunded` | Portfolio 展示退款结果 |

### 3.3 前端错误提示建议

接口错误码应能直接映射用户文案：

| 错误码 | 前端文案 | 用户动作 |
|--------|----------|----------|
| `QUOTE_EXPIRED` | 报价已过期，请重新询价 | 重新 quote |
| `MARKET_PAUSED` | 市场暂停，恢复后需重新询价 | 等待恢复 |
| `MARKET_CLOSED` | 市场已关闭 | 不可交易 |
| `INSUFFICIENT_LIQUIDITY` | 当前流动性不足，请调整金额或稍后再试 | 降低金额 |
| `PRICE_IMPACT_TOO_HIGH` | 价格影响过高，请降低金额或调整保护设置 | 降低金额 |
| `INSUFFICIENT_BALANCE` | 余额不足 | 充值或降低金额 |
| `INSUFFICIENT_SHARES` | 可卖份额不足 | 降低卖出份额 |
| `DUST_POSITION` | 剩余持仓价值过低，建议全部卖出 | 点击全部卖出 |

## 4. 后端视角审计

### 4.1 API 资源边界

建议不要复用 `/api/v1/portfolio/orders` 作为 v6 主入口。新接口应放在 AMM soccer 域下，避免前后端继续沿用订单语义。

建议路径：

```http
GET  /api/v1/soccer/amm/markets
POST /api/v1/soccer/amm/quote
POST /api/v1/soccer/amm/trade
GET  /api/v1/soccer/amm/positions
GET  /api/v1/soccer/amm/trades
GET  /api/v1/soccer/amm/portfolio
GET  /api/v1/soccer/amm/settlements
GET  /api/v1/soccer/amm/price_preference
PUT  /api/v1/soccer/amm/price_preference
```

### 4.2 幂等与一致性

原 `client_order_id` 可迁移为：

- `client_quote_id`：用于 quote 请求追踪，不保证价格永久有效。
- `client_trade_id`：用于 trade 幂等，防重复成交。

规则建议：

- 同一账户下 `client_trade_id` 唯一。
- 重复提交相同 `client_trade_id`，如果已成交，返回同一 `trade_id` 和 position 结果。
- quote 过期后，即便 `client_quote_id` 相同，也必须重新生成 quote。
- trade 必须校验 `quote_id`、`quote_expires_at`、market status、余额或 shares。

### 4.3 字段映射

| 原字段 | v6 字段 | 说明 |
|--------|---------|------|
| `order_id` | `trade_id` / `position_id` | 成交和持仓分离 |
| `client_order_id` | `client_trade_id` | 成交幂等键 |
| `order_group_id` | 不进入 v6 主流程 | 无多笔单注 / 串关组 |
| `order_type` | 不进入 v6 主流程 | 移除 single / parlay |
| `action` | `side` | buy / sell |
| `notional_dollars` | `collateral_amount` | 买入投入或卖出收回金额 |
| `decimal_odds` | `display_decimal_odds` | 只展示换算 |
| `yes_price_dollars` | `share_price` | 份额价格 |
| `max_payout_dollars` | `settlement_payout` | 仅结算后返回 |
| `legs` | `outcome_id` | 一次 trade 针对一个 outcome |
| `status` | `trade_status` / `position_status` | 成交状态和持仓状态分离 |
| `outcome` | `settlement_outcome` | 结算结果，不是交易选项 |

## 5. v6.0 接口示例

### 5.1 买入 quote

请求：

```http
POST /api/v1/soccer/amm/quote
Content-Type: application/json
```

```json
{
  "account_id": "1001",
  "client_quote_id": "quote_cli_20260513_001",
  "market_id": "match_botafogo_mirassol_result_1x2",
  "outcome_id": "home_win",
  "side": "buy",
  "collateral_amount": "100.00",
  "max_slippage": "0.0300"
}
```

响应：

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "quote_id": "q_7283901020001",
    "side": "buy",
    "market_id": "match_botafogo_mirassol_result_1x2",
    "outcome_id": "home_win",
    "probability": "0.5520",
    "share_price": "0.5520",
    "display_decimal_odds": "1.81",
    "collateral_amount": "100.00",
    "estimated_shares": "179.8561",
    "avg_price": "0.5560",
    "end_price": "0.5600",
    "price_impact": "0.0080",
    "fee": "0.60",
    "max_loss": "100.60",
    "min_shares_out": "174.4604",
    "quote_expires_at": "2026-05-13T09:35:30+08:00"
  }
}
```

### 5.2 卖出 quote

请求：

```json
{
  "account_id": "1001",
  "client_quote_id": "quote_cli_20260513_002",
  "market_id": "match_botafogo_mirassol_result_1x2",
  "outcome_id": "home_win",
  "side": "sell",
  "position_id": "pos_9001",
  "shares": "50.0000",
  "max_slippage": "0.0300"
}
```

响应：

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "quote_id": "q_7283901020002",
    "side": "sell",
    "position_id": "pos_9001",
    "outcome_id": "home_win",
    "shares": "50.0000",
    "avg_price": "0.5480",
    "end_price": "0.5440",
    "estimated_collateral_out": "27.40",
    "fee": "0.16",
    "net_collateral_out": "27.24",
    "realized_pnl": "2.05",
    "remaining_shares": "129.8561",
    "remaining_position_value": "70.64",
    "quote_expires_at": "2026-05-13T09:35:45+08:00"
  }
}
```

### 5.3 执行 trade

请求：

```http
POST /api/v1/soccer/amm/trade
Content-Type: application/json
```

```json
{
  "account_id": "1001",
  "quote_id": "q_7283901020001",
  "client_trade_id": "trade_cli_20260513_001"
}
```

响应：

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "trade_id": "tr_7283901021001",
    "position_id": "pos_9001",
    "side": "buy",
    "market_id": "match_botafogo_mirassol_result_1x2",
    "outcome_id": "home_win",
    "shares": "179.8561",
    "avg_price": "0.5560",
    "fee": "0.60",
    "collateral_delta": "-100.60",
    "position_shares": "179.8561",
    "position_avg_price": "0.5560",
    "created_at": "2026-05-13T09:35:02+08:00"
  }
}
```

### 5.4 Portfolio 查询

```http
GET /api/v1/soccer/amm/portfolio?account_id=1001
```

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "summary": {
      "portfolio_value": "318.42",
      "realized_pnl": "12.35",
      "unrealized_pnl": "8.74",
      "open_positions": 3
    },
    "positions": [
      {
        "position_id": "pos_9001",
        "subject_label": "RJ博塔弗戈 vs 米拉索尔",
        "market_title": "胜平负",
        "outcome_label": "RJ博塔弗戈",
        "shares": "179.8561",
        "available_shares": "179.8561",
        "avg_price": "0.5560",
        "current_price": "0.5720",
        "display_decimal_odds": "1.75",
        "market_value": "102.88",
        "realized_pnl": "0.00",
        "unrealized_pnl": "2.88",
        "status": "active"
      }
    ],
    "recent_trades": [
      {
        "trade_id": "tr_7283901021001",
        "side": "buy",
        "outcome_label": "RJ博塔弗戈",
        "shares": "179.8561",
        "avg_price": "0.5560",
        "fee": "0.60",
        "created_at": "2026-05-13T09:35:02+08:00"
      }
    ]
  }
}
```

## 6. 错误码建议

建议保留统一响应封装，但错误语义从下注域改为 AMM trade 域。

| Code | Key | 触发场景 | 前端处理 |
|------|-----|----------|----------|
| 0 | OK | 成功 | 正常渲染 |
| 42001 | MARKET_NOT_OPEN | market 非 open | 禁用交易 |
| 42002 | OUTCOME_NOT_FOUND | outcome 不存在 | 刷新市场 |
| 42003 | QUOTE_EXPIRED | quote 过期 | 重新询价 |
| 42004 | MARKET_PAUSED | 市场暂停 | 展示暂停提示 |
| 42005 | INSUFFICIENT_BALANCE | 余额不足 | 降低金额或充值 |
| 42006 | INSUFFICIENT_SHARES | 可卖份额不足 | 降低卖出份额 |
| 42007 | INSUFFICIENT_LIQUIDITY | 流动性不足 | 降低金额或稍后再试 |
| 42008 | PRICE_IMPACT_TOO_HIGH | 价格影响超阈值 | 降低金额 |
| 42009 | SLIPPAGE_EXCEEDED | 成交滑点超保护 | 重新 quote |
| 42010 | DUST_POSITION | 卖出后剩余价值过低 | 提示全部卖出 |
| 42011 | DUPLICATE_CLIENT_TRADE_ID | 幂等键重复 | 返回原 trade 或提示重复 |
| 50001 | INTERNAL_ERROR | 系统错误 | 稍后重试 |

## 7. 兼容层建议

原 `/api/v1/portfolio/orders` 可以保留，但必须隔离：

- 标记为 v5 传统下注域兼容接口。
- 不被 `/soccer` v6 页面调用。
- 不向 v6 Design Board 证明主流程能力。
- 不在 v6 接口规范中作为主路径。
- 如历史数据需要展示，应转换为历史记录，不混入 AMM position。

## 8. 修订优先级

### P0 必须修改

- 主接口从 order 改为 quote / trade / position。
- 移除 v6 主流程中的 parlay、legs、撤单。
- 将 `decimal_odds` 从权威字段降级为 `display_decimal_odds`。
- 增加 buy / sell / partial sell / sell all。
- 增加 Portfolio 聚合接口。

### P1 必须补齐

- quote TTL、滑点保护、价格影响阈值。
- market pause / resume 和暂停原因。
- position 状态机。
- settlement / void 字段。
- price preference 接口。

### P2 后续细化

- 外部流动性 SLA。
- 链上 / 链下边界。
- 长期市场资金效率。
- 成交历史导出。

## 9. 最终建议

建议将原《下单域接口规范》标注为“传统下注域 / v5 兼容接口规范”，并新增《足球 AMM 交易域接口规范 v1.0》。新规范应围绕 v6.0 的五个用户动作组织：发现市场、询价、成交、管理持仓、等待结算。
