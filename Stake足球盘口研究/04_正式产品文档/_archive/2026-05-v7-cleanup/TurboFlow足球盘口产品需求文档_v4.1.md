# TurboFlow 足球盘口产品需求文档 v4.1

---

## 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| v4 | 2026-04-18 | Lean Mode：核心盘口收敛、赛事列表直播/赛前区块修复、保留完整盘口回退能力 |
| **v4.1** | **2026-04-25** | **落地专业足彩交易规则：盘口互斥、全局投注单、赔率格式/实时变动/锁定、下注校验、MyBets 生命周期、Cash Out、复式投注 Trixie/Yankee/Patent、骨架屏与盘口折叠。不包含键盘无障碍与合规入口。** |

---

## 第 1 章：文档概述

### 1.1 文档目的

v4.1 是 TurboFlow 足球盘口从“盘口展示 Demo”升级到“可闭环下注 Demo”的产品定义。本文档描述已经落地的前端规则、投注单行为、赔率变化处理、MyBets 生命周期和复式投注口径。

### 1.2 本版范围

本版包含：

- 足球盘口同场互斥与相关性校验
- 全局足球投注单与跨页浮动入口
- 赔率格式切换、实时 mock ticker、赔率锁定与变动确认
- 下单校验、拒单提示、二次确认、钱包扣款、注单写入
- MyBets 状态、筛选、Cash Out、push/void 重算、corrected 展示、CSV 导出、重投
- Trixie / Yankee / Patent 复式投注
- LIVE / suspended / settled / corrected 视觉状态、盘口折叠、骨架屏

本版不包含：

- 键盘无障碍专项
- 合规入口、责任博彩页面、年龄声明等合规模块
- 真实后端、真实赔率源、真实钱包链上结算

### 1.3 核心术语

| 术语 | 说明 |
|------|------|
| Bet Slip | 足球投注单，保存待下注选项 |
| Leg | 一条投注腿，一个比赛 + 盘口 + 选项 + 赔率快照 |
| Accumulator | 串关，所有腿命中才赢 |
| System Bet | 复式投注，将多条腿组合成多注子串关 |
| Odds Lock | 加入投注单后 30 秒赔率锁定窗口 |
| Accept Policy | 赔率变化接受策略：接受所有 / 仅接受上涨 / 不自动接受 |
| Push / Void | 退本或作废，串关中按 1.00 重算 |
| Corrected | 赛果修正后更新注单状态和差额 |

---

## 第 2 章：信息架构与页面结构

### 2.1 赛事列表页

赛事列表页保留 v4 Lean Mode 结构：

- 左侧联赛筛选
- 正在直播区块
- 即将开赛区块
- 主列表按联赛分组
- LIVE 比赛展示脉动标识与比分
- 首次渲染展示骨架屏，降低页面空白感

### 2.2 比赛详情页

比赛详情页由三块组成：

- 顶部：面包屑、比赛头部、比分/时间/状态
- 左侧：盘口 Tab、盘口卡片、盘口折叠
- 右侧：比赛信息、足球投注单、MyBets 摘要

盘口超过阈值时默认展示前 6 个，用户点击“查看更多”展开。切换 Tab 后恢复折叠态。

### 2.3 注单中心

`/soccer/mybets` 展示完整注单生命周期：

- 状态筛选：全部 / 待结算 / 已结算 / 兑付 / 修正
- 日期筛选：今天 / 7 天 / 30 天 / 全部
- 20 条分页加载
- Cash Out、重投、复制 betCode、导出 CSV

---

## 第 3 章：盘口规则与互斥

### 3.1 市场族

系统按盘口语义归类为 Market Family，用于同场相关性检查：

- `outright`：胜平负
- `handicap_asian`：亚洲让分盘
- `handicap_european`：欧洲让球
- `total_goals`：总进球 / 大小球
- `score_exact`：正确比分
- `btts`：双方进球
- `novelty`：开球权等趣味盘口

### 3.2 同场互斥原则

同一场比赛内，强相关或同维度盘口不可组合。示例：

- 胜平负 × 亚洲让分盘：同一赛果维度，不可同场组合
- 胜平负 × 欧洲让球：同一赛果维度，不可同场组合
- 大小球 × 正确比分：比分直接决定总进球，强相关
- 双方进球 × 正确比分：比分直接决定 BTTS，强相关
- 同一个盘口标题下不同选项：自动替换，不形成冲突弹窗

跨比赛不做互斥限制。

### 3.3 Void 清理

比赛状态或盘口状态变为 `void` 时，投注单自动移除对应盘口选项。`suspended` 不自动移除，但下单时拒单。

---

## 第 4 章：赔率与投注单

### 4.1 赔率格式

用户可在投注单设置中切换：

- Decimal：`2.25`
- Fractional：`5/4`
- American：`+125`

内部统一存储 decimal，展示层格式化。

### 4.2 实时赔率

系统维护全局 `oddsRegistry`：

- 盘口按钮通过 selectionKey 订阅当前赔率
- live 比赛进入 ticker 白名单
- mock ticker 每 15 秒按 2% 区间抖动
- 赔率上涨/下跌触发视觉闪烁
- 投注单内选项保留加入时赔率与当前赔率

### 4.3 赔率锁定与接受策略

加入投注单后默认锁定 30 秒。若赔率变化：

- 接受所有变化：自动按当前赔率下单
- 仅接受对用户有利变化：上涨自动接受，下跌需用户确认
- 不接受任何变化：所有变化都需用户确认

### 4.4 投注单结构

投注单支持：

- 单式
- 串关
- 复式
- 快选金额和 MAX
- 总赔率 / 总投注额 / 可能返还 / 可能净盈利
- 折叠态摘要
- 跨页浮动入口

---

## 第 5 章：下单流程

### 5.1 校验链

点击确认投注后执行以下校验：

1. 防重复提交
2. 金额下限
3. 金额上限
4. 腿数下限
5. 腿数上限
6. 复式腿数匹配
7. 余额是否足够
8. 同场盘口互斥
9. 最高可能返还封顶
10. 盘口是否 suspended / closed
11. 比赛是否 ended / cancelled
12. 赔率变化是否满足接受策略
13. mock 网络失败兜底

### 5.2 拒单原因

拒单原因包括：

- `odds_changed`
- `market_closed`
- `match_not_available`
- `balance_insufficient`
- `stake_below_min`
- `stake_above_max`
- `payout_above_cap`
- `legs_too_few`
- `legs_too_many`
- `conflict_detected`
- `network_error`
- `rate_limited`

### 5.3 二次确认

满足任一条件时打开确认弹窗：

- 串单/复式腿数 ≥ 3
- 单注金额 ≥ 1000 USDT

弹窗展示腿明细、赔率、总投注额、可能返还和可能净盈利。

---

## 第 6 章：MyBets 生命周期

### 6.1 状态

MyBets 支持：

- `placed`：已下注
- `live`：进行中
- `settled`：已结算
- `cashed_out`：已兑付
- `corrected`：已修正

### 6.2 Cash Out

`placed` / `live` 且存在兑付价格时展示 Cash Out。确认后：

- 注单状态变为 `cashed_out`
- `payout` 写入兑付金额
- 钱包余额增加兑付金额
- 不可再次结算

### 6.3 Push / Void 重算

串关中若某腿 `push` 或 `void`：

- 该腿有效赔率按 `1.00` 参与重算
- 卡片展示原腿状态与“退本按 1.00 参与计算”
- 注单可能返还按重算后赔率展示

### 6.4 Corrected

赛果修正时：

- 状态显示 `corrected`
- 展示原结果 → 新结果
- 展示差额 payout（正数补发，负数追回）

### 6.5 重投与导出

- 重投：把原注单 legs 按下单时赔率重新加入投注单
- CSV：导出当前全部 MyBets 数据

---

## 第 7 章：复式投注

### 7.1 支持类型

| 类型 | 要求腿数 | 子注组成 | 注数 |
|------|----------|----------|------|
| Trixie | 3 | 3 个 doubles + 1 个 treble | 4 |
| Patent | 3 | 3 个 singles + 3 个 doubles + 1 个 treble | 7 |
| Yankee | 4 | 6 个 doubles + 4 个 trebles + 1 个 fourfold | 11 |

### 7.2 金额口径

复式投注中，用户输入金额为“单注金额”：

- 总投注额 = 单注金额 × 子注数
- 可能返还 = 单注金额 × 所有子注赔率之和
- 可能净盈利 = 可能返还 - 总投注额

示例：Trixie 输入 10 USDT，共 4 注，则总投注额 40 USDT。

### 7.3 下单与展示

下单后 MyBets 保存：

- `betType = system`
- `systemType`
- `systemLineCount`
- `unitStake`
- 全部 legs
- 总投注额和可能返还

MyBets 卡片展示复式类型、注数和腿明细。

---

## 附录 A：状态矩阵

| 场景 | 盘口展示 | 可加入投注单 | 可下单 |
|------|----------|--------------|--------|
| scheduled + open | 正常 | 是 | 是 |
| live + open | LIVE + 赔率抖动 | 是 | 是 |
| suspended | 灰化遮罩 | 否/已选保留 | 否 |
| settled | 展示结算结果 | 否 | 否 |
| void | 作废提示 | 自动移除 | 否 |
| cancelled | 已取消 | 否 | 否 |
| corrected | 修正提示 | 否 | 否 |

---

## 附录 B：工程映射

| 能力 | 文件 |
|------|------|
| 市场族与互斥 | `src/data/soccer/marketFamily.ts` |
| 投注契约与额度 | `src/data/soccer/contracts.ts` |
| 足球投注单 store | `src/stores/soccerBetSlipStore.ts` |
| 钱包 store | `src/stores/walletStore.ts` |
| MyBets store | `src/stores/myBetsStore.ts` |
| 赔率格式 | `src/utils/oddsFormat.ts` |
| 赔率 registry / ticker / lock | `src/services/oddsRegistry.ts`, `src/services/oddsTicker.ts`, `src/services/oddsLock.ts` |
| 复式生成器 | `src/utils/systemBets.ts` |
| 投注单 UI | `src/components/soccer/SoccerBetSlip.tsx` |
| 注单卡片 | `src/components/soccer/MyBetCard.tsx` |
| 注单中心 | `src/pages/SoccerMyBetsPage.tsx` |
| 骨架屏 | `src/components/soccer/SoccerSkeletons.tsx` |
