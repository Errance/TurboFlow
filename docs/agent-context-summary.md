# TurboFlow 足球 AMM v6.0 交接上下文

用于新 agent 快速接手当前工作。用户要求：始终中文回复；完成代码或文档改动后运行适当验证，验证通过后默认提交并 push 到 GitHub，除非遇到 secrets、验证失败或范围不清。

## 当前主线

- 仓库：`/Users/errance/Documents/Turboflow_soccer`
- 当前分支：`mvp`
- 当前主文档：`Stake足球盘口研究/04_正式产品文档/TurboFlow足球AMM预测市场产品需求文档_v6.0.md`
- 历史基线：
  - `Stake足球盘口研究/04_正式产品文档/TurboFlow足球盘口产品需求文档_v5.0.md`
  - `Stake足球盘口研究/04_正式产品文档/TurboFlow足球盘口产品需求文档_v4.7.md`
  - `Stake足球盘口研究/04_正式产品文档/TurboFlow足球盘口产品需求文档_v4.4.md`
  - `Stake足球盘口研究/04_正式产品文档/TurboFlow足球预测大赛产品需求文档_v4.5.md`

v6.0 是足球 tab 的主线版本：把 `/soccer` 从平台报价型传统盘口升级为 AMM 足球预测市场。v5.0 只作为旧 UI 和产品语义基线，不是当前主流程。

## 当前产品范围

当前只做足球 tab AMM：

- `/soccer`
- `/soccer/match/:matchId`
- `/soccer/futures/:competitionId`
- `/soccer/mybets`
- `/soccer/design-board`

当前不做：

- 平台作为用户交易对手方
- 传统投注单主流程
- 串关 / 多笔单注作为 v6 主流程
- Cash Out / 提前结清
- 用户挂单、限价单、订单簿、撤单、部分成交挂起
- 足球 CLOB
- 球员、角球、罚牌、分钟盘、同场扩展盘口等 P2 扩展
- v4.5 整届赛事预测大赛

`/clob` 相关页面和组件可作为未来大版本或其他产品线存在，但不能混入足球 AMM v6.0 的 `/soccer` 主流程或 Design Board。

## v6.0 产品口径

### 交易模型

- 用户买入 outcome 预测份额，形成 position。
- 用户可以继续买入、部分卖出、全部卖出或等待结算。
- 部分卖出是用户主动输入少于当前持仓的 shares 并即时成交，不是部分成交挂起。
- AMM 交易通过 quote 即时执行，不展示订单等待、挂单、撤单或订单簿。
- quote 过期、流动性不足、价格影响过高、市场暂停时整笔交易失败并要求重新询价。
- 正确 outcome 每份兑付 1 USDT，错误 outcome 兑付 0；void 按规则退款。

### 市场范围

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

市场目录、入口、分组和数量不扩张。所有当前可见市场必须 AMM 化，不能只改胜平负示例。

### 价格和盘口卡

默认价格展示是“概率 + 份额价格”：

- 示例：`55%` + `Buy Yes 55¢`
- 欧洲赔率是展示换算，通过小齿轮弹框切换，不是成交承诺。
- 切换价格格式只影响展示，不改变交易请求、quote 计算和结算字段。

盘口 / outcome 卡片只展示这些辅助指标：

- `24h Vol.`
- 24h 涨跌幅

盘口 / outcome 卡片不展示：

- 流动性
- implied probability
- “可交易”文本
- 做市商状态
- 内部 quote 状态

开放、暂停、关闭、已结算、void 等状态通过卡片可点击 / 禁用、透明度、状态色和暂停提示表达。流动性不足、价格影响和 quote 过期属于交易执行反馈，放在交易面板或异常提示里。

### 交易面板

足球 AMM 主交易面板：`src/components/soccer/AmmTradePanel.tsx`

- 支持买入份额。
- 支持卖出份额。
- 支持部分卖出和全部卖出。
- 买入金额输入框尾部有 `Max`。
- 买入金额输入框下方有固定快捷金额：`50 / 100 / 200 / 500`。
- 卖出侧有 `Max` / 全部卖出能力，填入当前 position 全部可卖份额。
- quote 信息展示当前概率 / 份额价格、预估成交均价、预估获得份额或预计收回金额、价格影响、手续费、最大亏损、本次已实现盈亏和卖出后剩余。

为保持全站下单体验一致，以下非足球 AMM 或历史组件也已同步快捷金额 / Max：

- `src/components/QuickOrderPanel.tsx`
- `src/components/TradePanel.tsx`
- `src/components/LimitOrderPanel.tsx`
- `src/components/ParlaySlip.tsx`
- `src/components/clob/TradingPanel.tsx`
- `src/components/ec/OrderPanel.tsx`
- `src/components/soccer/SoccerBetSlip.tsx`
- `src/components/soccer/AmmMarketComponents.tsx`
- `src/components/ui/Input.tsx`

## 关键页面和文件

- `src/pages/SoccerPage.tsx`
  - 足球首页。
  - 保留“单场预测 / 冠军与晋级”。
  - 比赛列表使用 AMM 价格展示。

- `src/components/soccer/MatchListCard.tsx`
  - 比赛列表卡。
  - 展示概率 + Buy 份额价格或欧洲赔率切换。
  - 展示 `24h Vol.`。
  - 更多市场入口显示 `More`，不要再使用 `AMM +N`。

- `src/pages/SoccerMatchPage.tsx`
  - 比赛详情。
  - 使用 `AmmMarketRenderer` 渲染 7/7 单场市场。
  - 右栏顺序包括价格设置、赛事信息、AMM 交易面板、Portfolio 摘要。

- `src/components/soccer/AmmMarketRenderer.tsx`
  - 正式路由中的 AMM outcome 卡片。
  - 卡片指标行只保留 `24h Vol.` 和 24h 涨跌幅。

- `src/components/soccer/AmmTradePanel.tsx`
  - 正式足球 AMM 交易面板。
  - 已有快捷金额 `50 / 100 / 200 / 500` 和 `Max`。

- `src/components/soccer/SoccerPriceFormatToggle.tsx`
  - 小齿轮价格设置入口。
  - 弹框内切换“概率 + 份额价格”和“欧洲赔率”。

- `src/pages/SoccerFuturesPage.tsx`
  - 冠军与晋级详情。
  - 使用 11/11 赛事级 AMM 市场。

- `src/pages/SoccerMyBetsPage.tsx`
  - Portfolio / 我的持仓。
  - 不再是传统我的注单中心。

- `src/components/soccer/AmmPortfolioPanel.tsx`
  - 持仓、可卖份额、均价、现价、市值、盈亏、最近成交和卖出入口。

- `src/pages/SoccerDesignBoardPage.tsx`
  - `/soccer/design-board`
  - 两个页内 tab：
    - `v6.0 完整 Design Board`
    - `v5.0 → v6.0 UI 变更对比`
  - 对比 tab 只展示纯 UI 变化：旧 UI / 新 UI / 可见变化点。
  - 不应展示代码路径、store、PRD 引用、git 命令、scope、技术实现细节或未来 CLOB 边界。
  - 必须覆盖页面 5/5、单场市场 7/7、赛事级市场 11/11、状态、术语和移除项。

- `public/404.html` 和 `src/main.tsx`
  - GitHub Pages SPA deep link fallback。
  - 直接打开 `https://errance.github.io/TurboFlow/soccer/design-board` 应进入应用。

## Design Board 当前要求

Design Board 是产品 / 设计签收页，不是技术审计页。

完整 v6 tab 必须展示：

- `/soccer` 首页
- `/soccer/match/:matchId`
- `/soccer/futures/:competitionId`
- `/soccer/mybets`
- 所有 7 个单场市场
- 所有 11 个赛事级市场
- 状态、异常、结算、void、暂停、关闭
- 价格设置齿轮
- 交易面板快捷金额和 Max

v5→v6 UI 变更 tab 必须只展示变化项：

- 顶部导航和足球 tab 心智变化
- 首页比赛列表价格列变化
- outcome 卡片变化
- 7/7 单场市场 AMM 化
- 比赛详情右栏从投注单变交易面板
- 交易面板状态矩阵
- 我的注单变 Portfolio
- 冠军与晋级 11/11 赛事级市场 AMM 化
- 价格格式切换齿轮
- 异常反馈从赔率变化 / 拒单变 quote / 风险反馈
- 移除传统浮动投注条、Cash Out、串关入口等
- 术语从投注项 / 注单 / 串关切到 outcome / shares / trade / position / sell / settlement

## 最近完成的提交

- `ef0f99f feat: add quick order amount controls`
  - 所有下单面板加入 `50 / 100 / 200 / 500` 快捷金额和 `Max`。
- `8e89138 feat(soccer): sync design board market metrics`
  - Design Board 同步盘口卡指标为 `24h Vol.` + 24h 涨跌幅。
- `625a5d5 feat(soccer): simplify AMM market card metrics`
  - 实际 AMM outcome 卡片移除流动性、implied 和可交易文本。
- `59921e0 fix: preserve GitHub Pages SPA fallback`
  - 保留 GitHub Pages 的 SPA fallback。
- `136a3b6 feat(soccer): complete pure UI design board delta`
  - 完成纯 UI 变更对比页。

## 验证方式

代码改动：

- 目标文件先用 `ReadLints` 检查。
- 运行 `npm run lint && npm run build`。
- 当前本机 Node 已更新到 `v22.22.2`，不应再有 Vite Node 版本警告。

本地验证：

- dev server 通常为 `http://127.0.0.1:5173/TurboFlow/`
- Design Board：`http://127.0.0.1:5173/TurboFlow/soccer/design-board`

线上验证：

- `https://errance.github.io/TurboFlow/soccer/design-board`
- GitHub Pages 自定义 404 fallback 的纯 HTTP 状态可能仍是 404，但浏览器应通过 fallback 脚本回到 SPA 路由。

## Git 和提交规则

- 当前分支：`mvp`
- 默认完成改动并验证通过后提交和 push。
- 不要 revert 用户改动。
- 只提交当前任务相关文件。
- 如果 GitHub push 因网络超时失败，稍后重试；之前多次出现 `github.com:443` 短时不可达，重试后可成功。

## 用户偏好

- 始终中文回复。
- 用户非常重视 Design Board 和文档与实现一致。
- 用户不喜欢“只口头确认”，需要真实检查代码 / 文档后给结论。
- 文案要正式产品化，不要临时、口语或内部代号。
- 用户经常要求“100% 覆盖”，回答前应先审计是否真的覆盖页面、组件、状态、术语和移除项。
