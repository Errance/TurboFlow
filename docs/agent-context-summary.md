# TurboFlow 足球 RFQ v7.0 交接上下文

用于新 agent 快速接手当前工作。用户要求：始终中文回复；完成代码或文档改动后运行适当验证。仓库规则要求通过验证后提交并推送，除非用户明确要求不要提交或不要推送。

## 当前主线

- 仓库：`/Users/errance/Documents/Turboflow_soccer`
- 当前分支：`mvp`
- 当前主文档：`Stake足球盘口研究/04_正式产品文档/TurboFlow足球RFQ预测交易市场产品需求文档_v7.0.md`
- v6.0 基线文档已归档：`Stake足球盘口研究/04_正式产品文档/_archive/2026-05-v7-cleanup/TurboFlow足球AMM预测市场产品需求文档_v6.0.md`
- v7.0 两份反馈：
  - `Stake足球盘口研究/04_正式产品文档/T-下单域接口规范-v7.0_RFQ反馈-130526.md`
  - `Stake足球盘口研究/04_正式产品文档/T-TurboFlow足球盘口技术方案v2.0-v7.0_RFQ反馈-130526.md`
- 历史基线：
  - `Stake足球盘口研究/04_正式产品文档/TurboFlow足球盘口产品需求文档_v5.0.md`
  - `Stake足球盘口研究/04_正式产品文档/_archive/2026-05-v7-cleanup/TurboFlow足球盘口产品需求文档_v4.7.md`
  - `Stake足球盘口研究/04_正式产品文档/_archive/2026-05-v7-cleanup/TurboFlow足球盘口产品需求文档_v4.4.md`
  - `Stake足球盘口研究/04_正式产品文档/_archive/2026-05-v7-cleanup/TurboFlow足球预测大赛产品需求文档_v4.5.md`

v7.0 是当前足球 tab 主线：底层从 v6.0 AMM 探索稿切换为外部做市商 RFQ。v7.0 不是 v5.0 回滚，也不是 v6.0 小修，而是新的交易底层。

## 核心口径

- 外部做市商提供赛事、盘口、赔率、状态、限额和可成交 quote。
- 前端仍展示 outcome、概率、份额价格、欧洲赔率切换、trade、position、Portfolio、sell、settlement。
- 页面价格是参考快照；成交以短时有效 RFQ quote 为准。
- 买入成交后，本次 `accepted_odds` 锁定。
- 用户买入后可以通过反向 RFQ 部分卖出或全部卖出。
- 最终按比赛结果结算，正确 outcome 每份兑付 1 USDT，错误 outcome 兑付 0，void 按规则退款。

## 历史能力处理原则

以下能力本版本不作为 v7.0 RFQ 主交付项，但不得写成永久删除、永久不做或已替代：

- 串关 / 多笔单注
- Cash Out / 提前结清
- 传统投注单
- 传统我的注单 / 历史下注记录
- 传统浮动投注条
- 球员、角球、罚牌、分钟盘、同场扩展盘口等扩展盘口
- v4.5 整届赛事预测大赛

正确写法：

- 当前 v7.0 RFQ 主路径暂不交付该能力。
- 是否保留、迁移、RFQ 化、作为兼容入口或作为后续版本能力，需要产品确认。
- 不允许因为当前 mock、Design Board 或交接文档暂未展示，就删除代码、删除文档、删除入口或下结论。

## 当前产品范围

当前做足球 tab RFQ：

- `/soccer`
- `/soccer/match/:matchId`
- `/soccer/futures/:competitionId`
- `/soccer/mybets`
- `/soccer/design-board`

当前不混入：

- 平台作为用户交易对手方
- AMM pool / 曲线定价 / LP 流动性池
- 用户挂单、限价单、订单簿、撤单、部分成交挂起
- 足球 CLOB

`/clob` 相关页面和组件可作为独立产品线存在，但不能混入足球 RFQ v7.0 的 `/soccer` 主流程或 Design Board。

## 交易模型

- 用户选择 outcome。
- 用户输入买入金额，请求 RFQ quote。
- quote 返回 `quote_id`、`provider_id`、`provider_quote_id`、`accepted_odds`、`share_price`、`implied_probability`、`shares`、`fee`、`quote_expires_at`。
- 用户确认后生成 trade，并创建或更新 position。
- 用户可从 Portfolio 对 position 发起 sell quote。
- sell quote 返回退出报价、预计收回金额、手续费、已实现盈亏和剩余 shares。
- 用户确认 sell trade 后扣减或关闭 position。
- quote 过期、做市商拒单、做市商超时、赔率变化、市场暂停时整笔交易失败并要求重新询价。

## 市场范围

单场市场保持 7/7：

- 胜平负
- 开球权
- 让球
- 让球 0:1
- 总进球数
- 大小球
- 波胆

冠军与晋级保持 11/11：

- 世界杯 A 组第一
- 世界杯 A 组出线
- 进入 8 强
- 进入决赛
- 世界杯冠军
- 欧冠冠军
- 晋级决赛
- 皇家马德里 vs 巴塞罗那两回合系列赛赛果
- 英超冠军
- 获得欧冠资格
- 降级球队

市场目录、入口、分组和数量不扩张。所有当前可见市场必须接入 RFQ outcome，不只改胜平负示例。

## 价格和盘口卡

默认价格展示是“概率 + 份额价格”：

- 示例：`55%` + `Buy Yes 55¢`
- 欧洲赔率是展示换算，通过小齿轮弹框切换。
- 切换价格格式只影响展示，不改变交易请求、quote 确认和结算字段。
- 列表和卡片价格是做市商参考快照；交易面板 RFQ quote 才是本次成交价。

盘口 / outcome 卡片辅助指标：

- `24h Vol.`：该盘口最近 24 小时交易量。
- 24h 涨跌幅。

开放、暂停、关闭、已结算、void 等状态通过卡片可点击 / 禁用、透明度、状态色和暂停提示表达。provider reject、timeout、odds changed、quote expired 属于交易执行反馈，放在交易面板或异常提示里。

## 关键页面和文件

- `src/pages/SoccerPage.tsx`
  - 足球首页。
  - 保留“单场预测 / 冠军与晋级”。
  - 比赛列表使用 RFQ 参考价格展示。

- `src/components/soccer/MatchListCard.tsx`
  - 比赛列表卡。
  - 展示概率 + Buy 份额价格或欧洲赔率切换。
  - 展示 `24h Vol.`。
  - 更多市场入口显示 `More`。

- `src/pages/SoccerMatchPage.tsx`
  - 比赛详情。
  - 使用 `AmmMarketRenderer` 渲染 7/7 单场市场。
  - 右栏顺序包括价格设置、赛事信息、RFQ 交易面板、Portfolio 摘要。

- `src/components/soccer/AmmMarketRenderer.tsx`
  - 正式路由中的 RFQ outcome 卡片。
  - 卡片指标行保留 `24h Vol.` 和 24h 涨跌幅。

- `src/components/soccer/AmmTradePanel.tsx`
  - 正式足球 RFQ 交易面板。
  - 文件名仍保留 `Amm`，避免一次性重命名带来大范围风险。
  - 已有快捷金额 `50 / 100 / 200 / 500` 和 `Max`。
  - 买入展示 RFQ 买入报价；卖出展示 RFQ 退出报价。

- `src/data/soccer/ammData.ts`
  - 仍是当前 mock 数据和 quote 工具。
  - quote 已补充 `quoteId`、`providerId`、`providerQuoteId`、`providerSpread`。
  - 文件名和类型名仍保留 `Amm`，后续若要重命名需要单独做迁移。

- `src/stores/soccerAmmStore.ts`
  - Zustand store 仍沿用当前结构。
  - mock trade / position id 已切到 `rfq-*`。

- `src/components/soccer/SoccerPriceFormatToggle.tsx`
  - 小齿轮价格设置入口。
  - 弹框内切换“概率 + 份额价格”和“欧洲赔率”。

- `src/pages/SoccerFuturesPage.tsx`
  - 冠军与晋级详情。
  - 使用 11/11 赛事级 RFQ 市场。

- `src/pages/SoccerMyBetsPage.tsx`
  - Portfolio / 我的持仓。
  - 当前主视图不是传统我的注单中心；传统注单兼容形态后续待确认。

- `src/components/soccer/AmmPortfolioPanel.tsx`
  - 持仓、可卖份额、均价、退出参考价、市值、盈亏、最近成交和卖出入口。

- `src/pages/SoccerDesignBoardPage.tsx`
  - `/soccer/design-board`
  - 两个页内 tab：
    - `v6.0 AMM 基线`
    - `v6.0 → v7.0 RFQ 对比`
  - 对比 tab 展示 AMM quote 到 RFQ quote、AMM sell 到反向 RFQ sell、AMM 风险到 provider reject / timeout / odds changed。
  - 必须覆盖页面 5/5、单场市场 7/7、赛事级市场 11/11、状态、术语和历史能力边界。

## turbo-contract 参考

`turbo-contract` 中重点参考 `surf_prep_v2` 的 Prediction 模块：

- `prediction_place_order`
- `PredictionOrder`
- `prediction_settle_v3`
- `cashbook`
- `odds_e8`
- `ORDER_KEEPER_ROLE`

可复用点：

- 下单锁本金。
- 订单 PDA / trade id 幂等。
- 成交时锁定赔率。
- 到期按结果结算。
- cashbook 资金流水审计。

主要缺口：

- 没有 provider quote 生命周期字段。
- 没有 sell quote / exit quote。
- 没有 position 部分卖出。
- 没有足球 match / market / outcome 链上结构。

建议第一阶段链下管理 RFQ、position 和 sell quote，链上只记录买入与最终结算；第二阶段如需要再扩展链上 sell / position 指令。

## 验证方式

文档改动：

- 使用 `ReadLints` 检查相关 Markdown。
- 运行 `git diff --check` 检查空白错误。

代码改动：

- 对目标文件先用 `ReadLints` 检查。
- 运行 `npm run lint && npm run build`。

本地验证：

- dev server 通常为 `http://127.0.0.1:5173/TurboFlow/`
- Design Board：`http://127.0.0.1:5173/TurboFlow/soccer/design-board`

## Git 和提交规则

- 当前分支：`mvp`
- 通过验证后提交并推送，除非用户明确要求不要提交或不要推送。
- 只提交当前任务相关文件。
- 不要 revert 用户改动。
- 注意 `turbo-contract/` 可能以未跟踪目录出现，除非用户明确要求，否则不要纳入提交。

## 用户偏好

- 始终中文回复。
- 用户非常重视 Design Board 和文档与实现一致。
- 用户不喜欢“只口头确认”，需要真实检查代码 / 文档后给结论。
- 文案要正式产品化，不要临时、口语或内部代号。
- 用户尤其反感未经确认就把历史能力写成“移除 / 不做 / 不进入版本”。必须使用“本版本暂不交付 / 后续待确认”口径。
