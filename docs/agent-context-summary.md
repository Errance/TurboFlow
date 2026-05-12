# TurboFlow 足球盘口上下文摘要

用于新 agent 快速接手当前工作。用户要求：始终中文回复；改完代码且验证通过后，默认提交并 push 到 GitHub，除非遇到 secrets、验证失败或范围不清。**PRD 和 agent-context-summary 等文档保留本地，不入库 GitHub**（用户 2026-05 明确要求）。

## 项目与主线

- 仓库：`/Users/errance/Documents/Turboflow_soccer`
- 当前主文档：
  - v6.0：`Stake足球盘口研究/04_正式产品文档/TurboFlow足球AMM预测市场产品需求文档_v6.0.md`（足球 tab AMM 预测市场完整 PRD，本地保留，不提交 GitHub）
  - v5.0：`Stake足球盘口研究/04_正式产品文档/TurboFlow足球盘口产品需求文档_v5.0.md`（传统盘口历史基线）
  - v4.7：`Stake足球盘口研究/04_正式产品文档/TurboFlow足球盘口产品需求文档_v4.7.md`（单场预测 / 冠军与晋级信息架构升级增量）
  - v4.4：`Stake足球盘口研究/04_正式产品文档/TurboFlow足球盘口产品需求文档_v4.4.md`（足球传统盘口主线 + 赛事级个体盘基线）
  - v4.5：`Stake足球盘口研究/04_正式产品文档/TurboFlow足球预测大赛产品需求文档_v4.5.md`（已暂缓 / 当前 mock 隐藏）
- 当前主要页面：`/soccer`、`/soccer/match/:matchId`、`/soccer/futures/:competitionId`、`/soccer/mybets`、`/soccer/design-board`
- 当前目标：以 v6.0 AMM PRD 作为主口径，把当前足球 tab 的既有 mock 从平台报价型传统盘口切换为 AMM 足球预测市场；市场目录、数量、入口不扩张。
- 这是 AMM 即时交易预测市场，不是传统平台对赌盘口，也不是 CLOB 订单簿。CLOB 是未来大版本，不进入当前 `/soccer` mock。

## 当前产品范围

当前只做：

**v6.0 主线（足球 tab AMM 预测市场）**

- AMM 即时交易
- 买入 outcome 预测份额
- 部分卖出和全部卖出
- Portfolio / 我的持仓
- 概率价格 / 欧洲赔率显示切换
- 交易前 quote、价格影响、手续费、报价过期和价格保护
- 外部做市商 / 流动性提供方作为抽象待定契约，产品不嵌入具体供应商
- 单场预测
- 冠军与晋级：先选系列赛 / 赛季对象，再看对象内部预测
- 冠军、晋级、赛季名次、两回合系列赛、小组赛和淘汰赛预测
- Design Board 仅新增 v6.0 AMM 变更对比板块，不完全重做旧 board

**已隐藏 / 暂缓：v4.5 整届赛事预测大赛**

- 足球首页不展示「预测大赛」tab。
- App 不注册 `/soccer/predictions/:tournamentId`、`/soccer/predictions/:tournamentId/leaderboard`、`/soccer/predictions/share/:shareId`。
- 我的注单页不展示「我的预测大赛」tab。
- Design Board 不展示 v4.5 预测大赛报名、填表、榜单、分享、结算等设计状态，也不再保留隐藏能力 section。
- 后续如恢复，必须先解决外部报价来源、结算数据源、风险定价、关联性和运营兜底。

当前不做：

- 传统投注单主流程
- 多笔单注 / 串关
- 平台作为用户对手方
- Cash Out / 提前结清
- 用户挂单、限价单、订单簿、撤单、部分成交挂起
- 足球 CLOB
- 球员、角球、罚牌、分钟盘、同场扩展盘口等 P2 扩展能力
- 球员奖项、金靴、助攻王
- 赛事级盘口串关
- 赔率变化自动接受策略
- 二次确认 1 分钟超时
- v4.5 整届赛事预测大赛（包含小组赛、淘汰赛、冠亚季殿军、完整名次表预测等 Battle Pass 式玩法）

## 投注方式逻辑

多笔单注：

- 一次可提交多个投注项。
- 每个投注项独立赔率、独立金额、独立生成单腿注单、独立结算。
- 不受同场强相关限制。
- 同一比赛同一盘口只能保留一个选项；选新选项会替换原选项。

串关：

- 多个投注项组成一张注单。
- 总赔率连乘。
- 全部命中才返还。
- 只有串关才做同场强相关互斥。
- 强相关同场盘口会阻止加入、阻止切换串关或阻止提交。
- 冠军、晋级和系列赛类赛事级盘口第一版不支持串关，可作为多笔单注提交。

## v4.7 冠军与晋级逻辑

- 入口：`/soccer?view=futures` 和 `/soccer/futures/:competitionId`。
- 首页一级 tab 为「单场预测 / 冠军与晋级」。
- 冠军与晋级首页只展示系列赛 / 赛季对象，不全局混排所有预测。
- 进入具体对象后，再按对象内部的分组展示预测，例如世界杯内部是「小组赛 / 淘汰赛 / 冠军」。
- 市场粒度从单场 `match` 扩展为 `competition`、`season`、`tie`。
- 当前 mock 覆盖：
  - 世界杯 A组第一
  - 世界杯 A组出线
  - 世界杯进入8强
  - 世界杯进入决赛
  - 世界杯冠军
  - 欧冠冠军
  - 晋级决赛
  - 皇家马德里 vs 巴塞罗那两回合系列赛赛果
  - 英超冠军
  - 获得欧冠资格
  - 降级球队
- 当前赛事级市场合计 11 个，Design Board 指标和全量矩阵应动态读取 `futuresData`。
- 每个赛事级市场都需要展示关闭时间、预计结算时间、官方结算来源。
- 赛事级盘口按市场关闭时间、阶段开始、数学确定或官方暂停封盘；不是按单场开赛封盘。
- 赛事级注单在投注单、确认弹窗和我的注单中显示“赛事级盘口 / 系列赛预测”和预计结算时间。

## v4.5 预测大赛逻辑（已隐藏）

- 原 v4.5 预测大赛逻辑已暂缓，不再作为当前 mock 的可见能力。
- 相关代码和 mock 数据可保留为历史资产，但不应从首页、我的注单、路由或 Design Board 暴露给用户/设计师。
- 当前 Design Board 不展示 v4.5 隐藏能力 section。

## 报价与确认逻辑

- 所有投注方式都必须进入二次确认弹窗。
- 下单区和二次确认弹窗都能处理报价变化。
- 报价变化或过期时，主按钮变为“接受最新报价”。
- 用户第一次点击“接受最新报价”只更新赔率快照和 30 秒报价有效期，不下单。
- 用户接受后需要再次核对，再次点击才进入确认或提交。
- 设置菜单只保留赔率格式：欧洲盘、分数盘、美式盘。
- 不再有自动接受全部变化、仅自动接受有利变化等策略。

## 开赛封盘逻辑

- 比赛开始后立即封盘。
- 不允许新增下注。
- 不允许提交投注单中关联该比赛的未提交项。
- 不允许撤销已提交注单。
- 开赛瞬间锁定赔率，之后赔率不再变化。
- 不做滚球下注。

## 本期 7 个核心盘口

盘口解释口径：

- 胜平负：判断全场主胜、平局、客胜。
- 开球权：判断哪方先开球，视为趣味盘，可与本期盘口串关。
- 让球：判断让球后哪方赢盘。负数表示让球，正数表示受让；UI 不再使用“亚洲让分盘”作为用户主名称。
- `.5` 是半球线，避免刚好等于盘口线，通常没有退本。
- 整数线可能退本。
- `.25/.75` 是四分之一球线，拆成两个相邻盘口，可能半赢或半输。
- 让球 0:1：欧洲让球胜平负。先加虚拟比分，再判断调整后的主胜、平局、客胜。不是亚洲让球。
- 总进球数：准确总进球档位，当前为 0、1、2、3、4、5+。其他网站常见英文口径是 `Total Goals` / `Exact Total Goals`，中文保留“总进球数”，不改为“总进球”。
- 大小球：围绕线值判断大或小，例如大 2.5 / 小 2.5；不是“总进球数”。
- 波胆：即 Correct Score，选择精确比分。当前 mock 按主流投注平台方式分为主胜比分、平局比分、客胜比分、其他比分，不再以二维比分矩阵作为用户主展示。波胆会推出胜平负、总进球数、大小球和让球结果，串关限制最多。
- 双重机会：原“双胜彩”用户主名称统一为“双重机会”，当前不进入 lean 核心列表，但扩展盘口数据保留。

## PRD 现状

主 PRD：

- v5.0：`Stake足球盘口研究/04_正式产品文档/TurboFlow足球盘口产品需求文档_v5.0.md`（单场预测 + 冠军与晋级完整 PRD）
- v4.7：`Stake足球盘口研究/04_正式产品文档/TurboFlow足球盘口产品需求文档_v4.7.md`（单场预测 / 冠军与晋级信息架构升级增量）
- v4.4：`Stake足球盘口研究/04_正式产品文档/TurboFlow足球盘口产品需求文档_v4.4.md`（足球传统盘口主线 + 赛事级个体盘）
- v4.5：`Stake足球盘口研究/04_正式产品文档/TurboFlow足球预测大赛产品需求文档_v4.5.md`（已暂缓 / 当前 mock 隐藏）

v5.0 已完成：

- 将 v4.3 单场盘口、v4.4 赛事级盘口和 v4.7 冠军与晋级信息架构合并为完整 PRD。
- 明确 v5.0 不是增量文档，覆盖页面、盘口、下注方式、投注单、二次确认、状态、异常、埋点、Design Board、v4.5 隐藏结论和验收标准。
- 保留文档质量约束：Mermaid 使用可渲染代码块；PRD 和上下文摘要不入库 GitHub；文案正式产品化；不一刀切删除底层通用能力。

v4.7 已完成：

- 在 v4.4 赛事级盘口基础上升级为 v4.7。
- 首页 tab 命名为「单场预测 / 冠军与晋级」。
- 冠军与晋级首页先展示系列赛 / 赛季对象，例如世界杯、欧冠、英超。
- 系列赛详情页内部再按小组赛、淘汰赛、冠军、晋级、赛季结果、系列赛等分组展示预测。
- 新增世界杯 2026 mock，覆盖小组赛、淘汰赛和冠军类预测。
- Design Board 已同步 v4.7 首页、详情页和全量赛事级市场矩阵。

v4.4 已完成：

- 在 v4.3 单场盘口基础上升级为 v4.4。
- 对齐多笔单注、串关、报价确认、开赛封盘、赛事级市场关闭、我的注单和重投。
- 新增冠军与晋级、赛季结果、两回合系列赛预测。
- 已按 v4.3 文档规格补齐 v4.4 赛事级盘口（流程 Mermaid、详情页、市场分类解释、状态机、mock 字段、验收表）。

v4.5 当前状态：

- 原 PRD 保留为历史研究。
- 团队确认整届赛事预测（小组赛、淘汰赛、冠亚季殿军、完整名次表等 Battle Pass 式玩法）无法从外部稳定获得报价与可验证结算口径。
- 当前产品、mock、路由和 Design Board 均隐藏该能力。
- 后续如恢复，必须先解决外部报价来源、结算数据源、风险定价、关联性和运营兜底。

注意：

- PRD 所在目录被 `.gitignore` 忽略，提交文档时需要 `git add -f`。**当前用户要求 PRD 和 agent-context-summary 不入库 GitHub**，仅本地修改。
- `TurboFlow足球盘口产品需求文档_v4.3.md` 保持 v4.3 原范围；v4.4 在 `_v4.4.md`；v4.7 在 `_v4.7.md`；v5.0 在 `_v5.0.md`；v4.5 预测大赛在 `_v4.5.md` 且当前隐藏。
- 用户会把 Markdown 预览里的 Mermaid 图复制到 Notion，所以流程图不要写成 `text` 代码块。

## 关键代码文件

- `src/pages/SoccerDesignBoardPage.tsx`
  - `/soccer/design-board`
  - 已对齐 v4.7。
  - 本期核心盘口为 7 个：胜平负、开球权、让球、让球 0:1、总进球数、大小球、波胆。
  - 波胆应展示为主胜比分 / 平局比分 / 客胜比分 / 其他比分分组卡片。
  - 总进球数应解释为准确总进球档位，不能和大小球混用。
  - 应展示冠军与晋级首页、系列赛详情页、对象内分组和 11 个赛事级市场全量矩阵。
  - 不应展示球员列表、组合网格、角球、罚牌、分钟盘、同场扩展盘口、dead heat、赔率自动接受策略。
  - 可保留比赛分钟、倒计时、半赢、半输等 v4.3 仍需解释的信息。

- `src/components/soccer/SoccerBetSlip.tsx`
  - 投注单 UI。
  - 支持多笔单注和串关。
  - 无 system/复式。
  - 多笔单注不做同场冲突，串关才做。
  - 赛事级盘口可作为多笔单注提交，暂不支持串关。
  - 报价需要接受时主按钮显示“接受最新报价”。

- `src/components/soccer/ConfirmBetDialog.tsx`
  - 二次确认弹窗。
  - 无 1 分钟超时。
  - 报价变化时按钮变“接受最新报价”，接受后继续复核，不直接下单。

- `src/stores/soccerBetSlipStore.ts`
  - 多笔单注提交后拆成多笔独立注单。
  - 串关提交成一张注单。
  - `subject` 支持 match / competition / tie / season。
  - 报价接受由 `acceptOddsChange` / `acceptAllOddsChanges` 处理。

- `src/pages/SoccerFuturesPage.tsx`
  - `/soccer/futures/:competitionId`
  - v4.7 冠军与晋级系列赛详情页。
  - 展示系列赛 / 赛季对象头部、对象内分组、关闭时间、预计结算和官方来源。

- `src/data/soccer/futuresData.ts`
  - v4.7 赛事级盘口 mock 数据。
  - 包含世界杯小组赛 / 淘汰赛 / 冠军、欧冠冠军 / 晋级 / 系列赛、英超冠军 / 欧冠资格 / 降级球队。

- `src/data/soccer/bracketData.ts`（v4.5 新）
  - 对阵树预测大赛 mock 数据。
  - 包含 BracketTournament / BracketSlot / UserBracketEntry / PoolDistributionSnapshot / SettlementReview 类型。
  - 包含 scoreEntry / projectPayout / buildSettlementReview 函数。
  - 当前仅作为历史研究资产保留，不从用户入口暴露。

- `src/pages/SoccerPredictionPage.tsx`（v4.5 新）
  - `/soccer/predictions/:tournamentId`
  - 对阵树详情页：教学卡片 + 树主区 + 用户预测分布 + 投影派奖 + 资金锁定带 + 分享 + 底部全员得分榜前 100。
  - 当前未在 `App.tsx` 注册路由。

- `src/pages/SoccerPredictionLeaderboardPage.tsx`（v4.5 新）
  - `/soccer/predictions/:tournamentId/leaderboard`
  - 完整榜单页：分页 + 搜索 + 排序。
  - 当前未在 `App.tsx` 注册路由。

- `src/pages/SoccerPredictionShareView.tsx`（v4.5 新）
  - `/soccer/predictions/share/:shareId`
  - 只读分享视图，不显示资金，不可编辑。
  - 当前未在 `App.tsx` 注册路由。

- `src/components/soccer/PredictionConfirmDialog.tsx`（v4.5 新）
  - 预测大赛二次确认弹窗，含资金锁定时长醒目提示，不复用 ConfirmBetDialog。

- `src/components/soccer/PredictionShareDialog.tsx`（v4.5 新）
  - 截图导出弹窗。

- `src/components/soccer/PredictionEntryCard.tsx`（v4.5 新）
  - 我的预测大赛单卡组件，已结算时可展开 PredictionReviewView。

- `src/components/soccer/PredictionReviewView.tsx`（v4.5 新）
  - 赛后回顾视图：逐 slot 对错 + 各轮汇总 + highlight。

- `src/pages/SoccerMatchPage.tsx`
  - 比赛状态不是 `scheduled` 时封盘。
  - live 比赛不再触发赔率抖动。

- `src/components/soccer/MarketRenderer.tsx`
  - `bettingClosed` 时显示“比赛已开始，盘口已封盘”。
  - 串关冲突文案要明确“不可串关”。

- `src/components/soccer/MyBetCard.tsx`
  - 通用注单卡。
  - 仍支持 half_win、half_loss、dead_heat 等类型能力。
  - 不要因为 v4.3 展板不展示 dead_heat 就删除底层通用能力。

- `src/data/soccer/fullMatchTabs.ts`
  - 数据源仍包含全量/P2 市场。
  - 当前足球页面通过 lean/collapse 只展示本期 7 个核心盘口。
  - 不要一刀切清理这个数据源，除非用户明确要求。

## 最近 design-board 改动

最新调整：

- 页头和范围说明升级为 v4.7。
- 增加「冠军与晋级首页」预览：先展示世界杯、欧冠、英超等系列赛 / 赛季对象。
- 增加「冠军与晋级详情页」预览：进入对象后按小组赛、淘汰赛、冠军等分组展示预测。
- 赛事级市场指标和「全量覆盖」矩阵动态读取 `futuresData`，当前为 11 个市场。
- Design Board 已移除 v4.5 预测大赛报名、详情、弹窗、资产、榜单、分享展示和隐藏能力 section。
- 当前仍保留 v4.3/v4.4 的投注单、报价、开赛封盘、我的注单、异常与合规降级状态覆盖。

## 用户偏好

- 用户非常反感“一刀切”。
- 删除展示内容前必须判断是不是：
  - 当前范围外的展示样例
  - 底层通用能力
  - 仍然需要的比赛信息
- 示例：
  - “分钟盘”不做，但“比赛分钟”“几分钟前”“倒计时分钟”要保留。
  - `dead_heat` 不在 v4.3 展板展示，但不代表一定要删类型或通用组件。
  - `fullMatchTabs.ts` 有全量数据源，不代表当前页面实际展示，先看过滤逻辑。
- 文案要正式产品化，不要临时、口语、内部代号。
- 如果用户问“确认吗/完备吗”，先全局只读检查，再给结论。

## 验证方式

文档改动：

- 检查 diff。
- 搜索旧口径，如：`1 分钟`、`确认超时`、`接受当前赔率`、`接受策略`、`复式`、`赛果修正`。

前端改动：

- `ReadLints` 检查目标文件。
- `npm run build`。
- 当前 build 会通过，但有已知非阻塞警告：
  - Node 22.11.0 低于 Vite 推荐 22.12+。
  - chunk size > 500k。

本地验证：

- 启动：`npm run dev -- --host 127.0.0.1`
- URL：`http://127.0.0.1:5173/TurboFlow/soccer/design-board`
- 验证后关闭 dev server。

## Git

当前分支：`mvp`

近期提交：

- `765c4a7 fix(soccer): align design board with v4.3 scope`
- `343c15b fix(soccer): render funnel as Mermaid`
- `39d88c8 fix(soccer): render shortest path as Mermaid`
- `c143b24 fix(soccer): expand market explanations in PRD`
- `cab3862 fix(soccer): align v4.3 PRD with mock behavior`

规则：

- 不要 revert 用户改动。
- 只提交当前任务相关文件。
- PRD 文件如被 ignore，用 `git add -f`。
- 验证通过后默认提交并 push。
