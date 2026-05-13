# T-TurboFlow 足球盘口技术方案 v2.0 的 v7.0 RFQ 适配反馈报告

审计对象：`T-TurboFlow 足球盘口技术方案 v2.0 设计与实施概述-120526-014442.pdf`

适配目标：`TurboFlow足球RFQ预测交易市场产品需求文档_v7.0.md`

审计视角：产品架构、后端 / 合约架构、前端 / Design Board

## 1. 总体结论

原技术方案 v2.0 可以保留比赛、盘口、下注、账户、结算和风控的传统工程经验，但不能作为 v7.0 RFQ 的完整技术方案直接执行。v7.0 的核心不是平台静态赔率下注，也不是 v6.0 AMM 池定价，而是：

```text
Provider Feed
  -> Market Mapping
  -> RFQ Gateway
  -> Quote Ledger
  -> Trade Ledger
  -> Position Service
  -> Settlement / Reconciliation
  -> Prediction Contract Adapter
```

技术复杂度从“自建 AMM 定价和流动性管理”转移为“外部做市商接入、quote 生命周期、成交幂等、position 卖出、资金对账和结算一致性”。这会显著降低定价和流动性工程难度，但不会消除交易系统复杂度。

## 2. v7.0 架构定位

### 2.1 不再需要的 AMM 能力

| v6.0 AMM 能力 | v7.0 处理 |
|---------------|-----------|
| AMM pool reserve | 不需要 |
| 曲线定价 | 不需要 |
| liquidity provider | 当前不需要 |
| price impact | 替换为做市商价差、quote 变化和拒单 |
| pool imbalance | 替换为 provider limit / suspension |
| AMM sell | 替换为反向 RFQ sell |

### 2.2 仍然需要的交易能力

| 能力 | 是否需要 | 原因 |
|------|----------|------|
| 账户资金冻结 / 扣款 | 需要 | 买入成交必须锁定或扣减本金 |
| 交易幂等 | 需要 | quote confirm 可能重试 |
| 状态机 | 需要 | quote、trade、position、settlement 必须可追踪 |
| 风控限额 | 需要 | provider、平台和用户层面都需限制 |
| 结算 | 需要 | 按比赛结果兑付 |
| 对账 | 需要 | provider 成交、内部账、链上订单和资金流水要一致 |
| 反向卖出 | 需要 | 用户买入后可退出部分或全部持仓 |

## 3. 推荐系统架构

```mermaid
flowchart TB
  provider["External Market Maker"] --> adapter["Provider Adapter"]
  adapter --> feed["Feed Normalizer"]
  adapter --> rfq["RFQ Gateway"]

  feed --> mapping["Market Mapping"]
  mapping --> catalog["Soccer Catalog API"]
  catalog --> web["Web Frontend"]

  web --> rfq
  rfq --> quoteLedger["Quote Ledger"]
  quoteLedger --> tradeService["Trade Service"]
  tradeService --> position["Position Service"]
  position --> portfolio["Portfolio API"]
  portfolio --> web

  tradeService --> wallet["Wallet / Cashbook"]
  tradeService --> chain["Prediction Contract Adapter"]
  chain --> contract["turbo-contract Prediction"]

  settlement["Settlement Service"] --> position
  settlement --> wallet
  settlement --> chain
  recon["Reconciliation"] --> adapter
  recon --> quoteLedger
  recon --> tradeService
  recon --> wallet
  recon --> chain
```

## 4. 核心服务职责

| 服务 | 职责 | 关键风险 |
|------|------|----------|
| Provider Adapter | 接入 provider 赛事、盘口、赔率、quote、trade、结果 | provider 字段不稳定、超时、拒单 |
| Feed Normalizer | 标准化赛事、盘口、选项和状态 | 映射错误导致交易错位 |
| Market Mapping | 保存 provider ID 到内部 ID 的关系 | ID 变更、合并、取消、重赛 |
| RFQ Gateway | 统一买入和卖出 quote 请求 | quote TTL、重复确认、provider 异常 |
| Quote Ledger | 记录全部 quote 请求和响应 | 缺少审计链路 |
| Trade Service | 确认 quote，生成 trade | 幂等、重复扣款 |
| Position Service | 更新 shares、均价、可卖份额和盈亏 | 部分卖出成本分摊 |
| Settlement Service | 根据结果结算 position | 结果争议和 void |
| Reconciliation | 对账 provider、内部账、链上、资金 | 漏单、错账、重复成交 |
| Contract Adapter | 对接 Prediction 合约或后续扩展指令 | 链上能力与 RFQ 生命周期不完全匹配 |

## 5. RFQ 状态机

### 5.1 买入 quote

```mermaid
stateDiagram-v2
  [*] --> requested
  requested --> quoted
  requested --> rejected
  requested --> failed
  quoted --> accepted
  quoted --> expired
  accepted --> consumed
  accepted --> failed
```

### 5.2 卖出 quote

```mermaid
stateDiagram-v2
  [*] --> requested
  requested --> quoted
  requested --> unavailable
  requested --> failed
  quoted --> accepted
  quoted --> expired
  accepted --> consumed
  accepted --> failed
```

### 5.3 position

```mermaid
stateDiagram-v2
  [*] --> active
  active --> reduced
  reduced --> active
  active --> closed
  reduced --> closed
  active --> pending_settlement
  reduced --> pending_settlement
  pending_settlement --> settled_won
  pending_settlement --> settled_lost
  pending_settlement --> void_refunded
  pending_settlement --> disputed
```

## 6. 买入流程

```mermaid
sequenceDiagram
  participant U as User
  participant FE as Frontend
  participant BE as RFQ Gateway
  participant MM as Market Maker
  participant TS as Trade Service
  participant PS as Position Service
  participant CA as Contract Adapter

  U->>FE: 输入金额并点击获取报价
  FE->>BE: POST /rfq/quote
  BE->>MM: requestQuote(buy)
  MM-->>BE: provider_quote_id, odds, expires_at
  BE-->>FE: quote_id, accepted_odds, shares, ttl
  U->>FE: 确认买入
  FE->>TS: POST /rfq/trade
  TS->>MM: acceptQuote(provider_quote_id)
  MM-->>TS: provider_trade_id
  TS->>CA: create / sync Prediction order if required
  TS->>PS: upsert position
  TS-->>FE: trade + position
```

关键要求：

- `quote_id` 和 `client_trade_id` 都必须幂等。
- 确认时如果 quote 过期或 provider 返回赔率变化，不得静默成交。
- 成交写入 `accepted_odds`，不可被后续价格刷新覆盖。

## 7. 卖出流程

```mermaid
sequenceDiagram
  participant U as User
  participant FE as Frontend
  participant BE as RFQ Gateway
  participant MM as Market Maker
  participant TS as Trade Service
  participant PS as Position Service

  U->>FE: 输入卖出 shares 或点击 Max
  FE->>BE: POST /rfq/sell_quote
  BE->>PS: 校验 available_shares
  BE->>MM: requestQuote(sell)
  MM-->>BE: exit price, collateral_out, expires_at
  BE-->>FE: sell_quote_id, net_collateral_out, realized_pnl
  U->>FE: 确认卖出
  FE->>TS: POST /rfq/sell_trade
  TS->>MM: acceptSellQuote
  TS->>PS: reduce / close position
  TS-->>FE: sell trade + updated position
```

部分卖出成本分摊建议：

```text
sold_cost = position_avg_price * sold_shares
realized_pnl = net_collateral_out - sold_cost
remaining_cost_basis = old_cost_basis - sold_cost
```

全部卖出时：

```text
if sold_shares == available_shares:
  position.status = closed
  position.available_shares = 0
```

## 8. Settlement

### 8.1 结果来源

建议优先级：

1. 官方赛事结果源。
2. 做市商 settlement feed。
3. 内部运营确认。
4. 争议仲裁流程。

### 8.2 状态

| 状态 | 说明 |
|------|------|
| `pending_result` | 等待结果 |
| `resolving` | 结果确认中 |
| `settled` | 已结算 |
| `voided` | 市场作废 |
| `disputed` | 结果存在争议 |
| `manual_review` | 需要人工处理 |

### 8.3 void 规则

void 时不得简单删除 trade，应保留完整审计链路：

- 原始 trade 保留。
- position 标记 `void_refunded`。
- cashbook 记录退款。
- Portfolio 展示 void 说明。

## 9. 与 turbo-contract Prediction 模块的关系

### 9.1 可复用点

当前 `turbo-contract` 的 Prediction 模块具备以下可复用价值：

| 合约能力 | v7.0 RFQ 对应 |
|----------|---------------|
| `prediction_place_order` | 买入成交后记录订单和锁定金额 |
| `PredictionOrder.trade_id` | 内部 trade / provider trade 映射锚点 |
| `PredictionOrder.amount` | 用户投入金额 |
| `PredictionOrder.odds_e8` | 成交时锁定赔率 |
| `PredictionOrder.status` | 订单是否已结算 |
| `prediction_settle_v3` | 按 outcome 和 odds 结算 |
| `cashbook` | 资金流水审计 |

### 9.2 缺口

| 缺口 | 影响 |
|------|------|
| 无 provider quote 字段 | 无法链上证明 RFQ 生命周期 |
| 无 sell / exit quote | 不能直接链上表达部分卖出 |
| 无 position 聚合账户 | 多次买入 / 卖出需链下汇总 |
| 无足球赛事结构 | 需通过 pool / coin_code / trade_id 映射 |
| 无 provider 对账状态 | 需链下 Reconciliation |

### 9.3 分阶段建议

#### 第一阶段

- RFQ quote、provider 交互、position 和 sell 全部链下管理。
- 买入成交可根据需要同步为 Prediction order。
- 最终 settlement 可复用 `prediction_settle_v3` 或链下清算后写 cashbook。
- 重点保证用户资产、provider 成交和内部账一致。

#### 第二阶段

如业务需要更强链上可验证性，再扩展：

- `soccer_rfq_quote` account。
- `soccer_position` account。
- `soccer_sell_quote` / `soccer_sell_trade` instruction。
- provider 签名校验。
- quote TTL 和 accepted odds 的链上校验。

## 10. 风控与限额

| 风控点 | 说明 |
|--------|------|
| 单笔 quote 限额 | provider 和平台双层限制 |
| outcome 暴露限额 | 控制单 outcome 总敞口 |
| 用户频率 | 防止恶意 quote spam |
| provider timeout | 熔断或降级 |
| odds jump | 大幅赔率变化时暂停确认 |
| market suspended | provider 暂停时前端禁用交易 |
| sell liquidity | 做市商无法提供退出报价时明确提示 |

## 11. Reconciliation

每日和实时对账至少覆盖：

- provider quote 数量、成交数量、拒单数量。
- provider_trade_id 与内部 trade_id。
- 用户 cashbook 与 trade collateral delta。
- position shares 与 trade buy / sell 累计。
- Prediction order 与内部 trade。
- settlement payout 与结果源。
- void / refund / manual adjustment。

建议对账结果状态：

| 状态 | 说明 |
|------|------|
| `matched` | 完全一致 |
| `provider_missing` | 内部有成交，provider 缺失 |
| `internal_missing` | provider 有成交，内部缺失 |
| `amount_mismatch` | 金额不一致 |
| `odds_mismatch` | 成交赔率不一致 |
| `settlement_mismatch` | 结算不一致 |
| `manual_resolved` | 人工已处理 |

## 12. 前端与 Design Board 影响

### 12.1 前端最小改动原则

保留：

- 当前页面结构。
- 概率 / 赔率切换。
- 概率与份额价格展示。
- outcome 卡。
- 交易面板。
- Portfolio。
- 部分卖出和全部卖出入口。

调整：

- AMM 文案改为 RFQ。
- `price impact` 改为做市商价差、报价偏移或报价有效期。
- 买入按钮语义改为获取 / 确认 RFQ 报价。
- 卖出语义改为获取退出报价 / 反向 RFQ。
- 错误提示改为 provider reject / timeout / odds changed / quote expired。

### 12.2 Design Board 对比重点

| v6.0 AMM | v7.0 RFQ |
|----------|----------|
| 内部 pool quote | 外部做市商 RFQ quote |
| price impact | quote TTL / provider spread / odds changed |
| AMM liquidity | provider limit / market suspension |
| AMM sell | reverse RFQ sell |
| pool reserve / liquidity state | Provider Adapter / Quote Ledger / Reconciliation |

## 13. 迁移步骤

### P0

1. 确认 provider 协议：赛事、盘口、赔率、quote、sell quote、trade、settlement。
2. 定义内部 match / market / outcome 映射。
3. 新增 RFQ quote / trade / sell quote / sell trade API。
4. 建立 Quote Ledger、Trade Ledger、Position Service。
5. 前端 mock 切换到 v7.0 RFQ 文案和字段。

### P1

1. 接入真实 provider sandbox。
2. 接入 Prediction 合约买入记录和结算。
3. 建立 provider / internal / chain 对账。
4. 完善 void、dispute、manual review。

### P2

1. 评估链上 sell / position 扩展。
2. 评估组合 RFQ / 串关。
3. 多 provider 路由和兜底。

## 14. 最终建议

建议 v7.0 技术方案从原“下注域 + 结算域”演进为“RFQ 交易域 + Position 域 + Provider 对账域”。原 v2.0 中账户、下注记录、限额、结算和风控可复用，但必须补齐 RFQ quote 生命周期、provider 成交确认、反向卖出、position 成本分摊和链上 Prediction 适配边界。
