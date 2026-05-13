# TurboFlow 足球产品线说明

当前仓库同时保留两条足球产品线，修复和验收时需要分开看：

- `/soccer`：传统体育书盘口，使用欧洲小数赔率、投注单、串关/复式、My Bets、Cash Out。审计报告位于 `Stake足球盘口研究/04_正式产品文档/TurboFlow足球盘口交叉审计报告_v4.1.md`。
- `/clob`：足球 CLOB 订单簿，使用 Yes/No、限价/市价、订单簿和 NegRisk 事件模型。对应本文档目录下的 CLOB PRD 与分阶段路线图。

本目录文档默认服务 `/clob` 产品线。若讨论 `/soccer` 传统盘口，应以足球盘口审计报告和 `src/components/soccer`、`src/stores/*soccer*`、`src/data/soccer` 的实现为准。

## 维护约定

- 新增足球需求时，先标明适用范围是 `/soccer`、`/clob`，还是两者都适用。
- `/soccer` 的盘口 family 命名应与代码 `marketFamily.ts` 保持一致；未实现的 family 只能标为待扩展。
- CLOB 路线图里的玩法族用于市场转换和阶段规划，不等同于 `/soccer` 的 `MarketFamily`。
- `/clob` 的迁移细项如果不在仓库中，应在迁移说明里写清来源缺失，而不是链接到不存在的路径。
