# TurboFlow 足球盘口产品需求文档 v4

---

### 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| v1 | 2025-04-02 | 初版：全量盘口定义 |
| v2 | 2025-04-03 | 补充赛事列表页、投注单规范；修正球员数量、裁判展示条件等 |
| v3 | 2025-04-04 | 重构为独立完整产品文档；重写术语表；清理所有外部引用；补充待实现功能清单 |
| v3.1 ~ v3.3 | 2025-04-04 | PRD-前端全量对齐；状态系统扩展；面包屑联赛跳转；ended 锁定；我的投注面板 |
| **v4** | **2026-04-18** | **精简盘口白名单（Lean Mode）：11 Tab → 1 Tab、100+ 盘口 → 7 盘口；新增「开球权」novelty 盘口；修复列表页「即将开赛」字段配错 bug，拆分为「正在直播 / 即将开赛」两区块；保留完整盘口回退开关** |

---

## 第 1 章：文档概述

### 1.1 文档目的

本文档是 TurboFlow 足球预测市场的 v4 产品需求定义。v4 在 v3 基础上做了 **产品收敛**：仅保留 6 类核心投注 + 1 类 novelty 投注，其他全部默认隐藏（保留一键回退到完整盘口的能力）。

本版本同时修复了 v3.3 遗留的赛事列表左侧「即将开赛」区块实际展示的是 live 比赛的字段 bug（v3 已标记为「已知问题」）。

### 1.2 术语表

沿用 v3。以下术语与 v4 直接相关：

| 术语 | 说明 |
|------|------|
| **1x2（胜平负）** | 最基础的赛果投注，三个选项：主胜(1)、平局(X)、客胜(2) |
| **Asian Handicap（亚洲让分盘）** | 强队虚拟"让"弱队若干球后再比较结果，只有赢/输两种，不存在平局 |
| **European Handicap / 让分0:1（欧洲让球）** | 以固定让球比分（如 0:1、1:0）作为起始，再以常规 1x2 结算 |
| **Total Goals（总进球数 / 合计进球）** | 全场比赛的最终进球数，以 0/1/2/3/4/5+ 离散分档投注 |
| **O/U（Over/Under，大小球）** | 预测总进球数是否超过某个数值线。line 可为 1.5 / 2.5 / 3.5 等 |
| **Correct Score（正确进球 / 比分）** | 预测全场比分矩阵（主队 0~4 × 客队 0~4） |
| **Kick-off Team（开球权）** | v4 新增 novelty 盘口，预测开场第一次开球的球队为主队还是客队，二元 1.92/1.92 |
| **LEAN_MODE** | 工程侧开关，位于 `src/data/soccer/fullMatchTabs.ts`，`true` 时按白名单过滤并合并为单 Tab，`false` 时恢复完整 11 Tab |
| **novelty 盘口** | 非核心、趣味性投注。数据以 mock 固定赔率呈现，v4 仅包含「开球权」 |

其余术语（void / push / settled / suspended / odds / line / runner / 常规时间）沿用 v3 第 1.2 节。

---

## 第 2 章：产品概述

### 2.1 v4 产品定位

v4 采用"**尖峰化**"策略：只为用户保留最主流、最易理解的投注项，降低新用户认知负担。

- **赛前 (scheduled)**：7 个核心盘口 + 开赛倒计时 + 阵容排布图 + H2H 历史交锋
- **赛中 (live)**：7 个核心盘口 + 实时比分 + 事件时间线 + 统计对比（部分可 suspended）
- **赛后 (finished)**：7 个核心盘口 + 结算结果 + 完整事件回顾 + 统计对比

赛事状态矩阵（scheduled / live / finished + 5 种异常状态）与 v3 完全一致，本次 v4 不改变状态模型。

### 2.2 覆盖范围

| 维度 | v3 | **v4** |
|------|----|--------|
| Tab 数量 | 11 | **1（"所有盘口"）** |
| 盘口总数 | ~100+ | **7**（6 核心 + 1 novelty） |
| 市场 UI 类型 | 6 种 | **4 种**（buttonGroup / oddsTable / rangeButtons / scoreGrid）|
| 比赛状态 | 3 基础 + 5 异常 | 3 基础 + 5 异常（不变） |
| 球员数据 | 动态生成 34~36 | 不再展示（球员盘口全隐藏） |

### 2.3 v4 vs v3 关键差异一览

| 维度 | v3 | v4 | 说明 |
|------|----|----|------|
| Tab 结构 | 多 Tab 顶部切换 | 单 Tab、长列表纵向滚动 | 去除 Tab bar 的认知切换 |
| 盘口卡片数 | 11 个 Tab 合计约 100 张 | 单 Tab 7 张 | 盘口白名单 |
| 开球权盘口 | 无 | 有，novelty（1.92/1.92 mock） | 吸引非传统球迷用户 |
| 即将开赛区块 | 标题/筛选不一致（已知 bug） | 「正在直播」+「即将开赛」双区 | 字段审计修复 |
| LEAN_MODE 开关 | — | `true`（默认） | 设为 `false` 即回 v3 完整形态 |

---

## 第 3 章：产品信息架构与页面结构

### 3.1 页面层级

```
足球入口 (/soccer)
  └─ 赛事列表（按联赛分组）
       └─ 单场详情 (/soccer/match/:matchId)
            ├─ 左栏：盘口市场区（单 Tab、7 张卡片）
            └─ 右栏：比赛信息面板 + 投注单 + 我的投注面板
```

### 3.2 赛事列表页

**功能**：展示所有比赛，按联赛分组，每场显示核心盘口预览。

#### 3.2.1 左侧导航栏（v4 修订）

| 区域 | 内容 |
|------|------|
| 页面标题 | 「足球」+ 地球图标 |
| 「全部赛事」按钮 | 显示总场次 + live 场次计数（红色） |
| 联赛按钮列表 | 联赛名 + 国家（小字） + live 计数 + 总场次 |
| **「正在直播」区块（v4 新增独立区）** | 展示前 3 场 `status === 'live'` 比赛：红色脉动点 + `homeTeam.shortName vs awayTeam.shortName` + **实时比分** `score.home-score.away`（score 为空时不渲染） |
| **「即将开赛」区块（v4 修订）** | 展示前 3 场 `status === 'scheduled'` 比赛：灰色静止点 + `shortName vs shortName` + **开赛时间** `match.time`（不渲染比分） |

**显示规则**：
- 两个区块独立渲染：若无 live 比赛则整个「正在直播」区块不显示；若无 scheduled 比赛则整个「即将开赛」区块不显示。
- 「即将开赛」严格遵循语义：只显示未开赛场次，且永不显示比分字段。

> v3.3 "已知问题"已在 v4 修复：原代码 `matches.filter(m => m.status === 'live')` 在 `<h3>即将开赛</h3>` 下呈现，导致直播场次被标为"即将开赛"并显示比分。v4 拆为两个带独立筛选与字段集合的区块。

#### 3.2.2 比赛列表主区域

沿用 v3 §3.2.2，不做 v4 调整。

渐进式披露（断点显示）与 MatchListCard 状态分支规则同 v3：
- `status === 'live'` → `LIVE` 红字 + `score.home-score.away`
- `status === 'finished'` → `FT` 灰字 + 终场比分
- 其他状态 → `date` + `time`

### 3.3 单场详情页布局（v4 修订）

```
┌─────────────────────────────────────────────────────────────┐
│ 面包屑：足球 › 联赛名（可点击跳转筛选） › 本场比赛            │
├───────────────────────────────┬─────────────────────────────┤
│ MatchHeader                    │ MatchInfoPanel              │
│   ├─ 状态 Badge + 联赛/场地     │   ├─ 赛前: KickoffCountdown │
│   ├─ 队名/队徽                  │   ├─ 赛中: MatchTimeline    │
│   └─ 比分/日期时间（状态分支）   │   └─ Tabs: 阵容 / H2H / 统计 │
├───────────────────────────────┤                             │
│ Tabs: 「所有盘口」（单 Tab）     │                             │
├───────────────────────────────┤                             │
│ 盘口卡片 × 7（垂直排列）        │                             │
│   1. 胜平负                     │                             │
│   2. 开球权                     │                             │
│   3. 亚洲让分盘                 │ SoccerBetSlip（投注单）      │
│   4. 让分0:1（欧洲让球）        │                             │
│   5. 总进球数                   │                             │
│   6. 合计（大小球）             │ MyBetsPanel                 │
│   7. 正确进球（比分矩阵）       │                             │
└───────────────────────────────┴─────────────────────────────┘
```

**关键变化**：
- Tabs 组件保留但只接收一个 tab（`{ id: 'all', label: '所有盘口' }`），视觉上是单个激活态标签（不提供切换），为未来扩展保留结构。
- 右栏（`w-[380px] sticky top-20`）、投注互斥、void 自动移除、suspended 提示等规范全部沿用 v3。

### 3.4 三种赛事状态下的页面差异

| 状态 | MatchHeader | InfoPanel 内容 | 盘口可点 | 比分字段 |
|------|-------------|--------------------|----------|----------|
| scheduled | Badge「即将开赛」+ date/time | KickoffCountdown + 阵容 + H2H | 可选（除 upcoming/cancelled 外） | 不渲染 |
| live | Badge「LIVE」+ currentMinute + 比分 | MatchTimeline + 阵容 + H2H + 统计 | 可选（suspended 的不可选） | 渲染 |
| finished | Badge「ENDED」+ 比分（灰） | 阵容 + H2H + 统计 + 事件回顾 | **不可选**（endedStatuses 全锁） | 渲染 |
| interrupted / abandoned / postponed / cancelled / corrected | 对应状态 Badge + 异常说明 | 依数据可用性 | 异常视情况锁定 | 依 `match.score` 是否存在 |

`endedStatuses = ['finished', 'abandoned', 'cancelled', 'corrected']`（同 v3）。

### 3.5 投注单 UI/UX 规范

沿用 v3 §3.5 全部规范：空状态、选中项互斥（同一盘口只能选一个）、void 自动移除、suspended 提示、ended 锁定。

### 3.6 我的投注面板

沿用 v3 §3.6。

---

## 第 4 章：UI 组件与市场类型规范

v4 仅使用 v3 六种类型中的 **4 种**：

| 类型 | v4 使用数 | 用于盘口 |
|------|-----------|----------|
| **ButtonGroupMarket** | 2 | 胜平负、开球权 |
| **OddsTableMarket** | 3 | 亚洲让分盘、合计（大小球）、让分0:1（欧洲让球） |
| **RangeButtonsMarket** | 1 | 总进球数 |
| **ScoreGridMarket** | 1 | 正确进球 |
| ComboGridMarket | 0 | — |
| PlayerListMarket | 0 | — |

各组件的字段结构、渲染规范、交互细节沿用 v3 第 4 章。

---

## 第 5 章：盘口百科（v4 精简版）

v4 单 Tab「所有盘口」固定顺序渲染以下 7 个盘口：

### 5.1 胜平负 (1x2)

| 项 | 内容 |
|----|------|
| 市场类型 | ButtonGroupMarket |
| title | `胜平负` |
| 选项 | `[homeTeamName, 2.24]`、`[平局, 3.45]`、`[awayTeamName, 3.20]` |
| 时间口径 | 常规时间（90 min + 补时，不含加时/点球） |
| 胜负判定 | 最终比分决定。主队 > 客队 → 1 赢；相等 → X 赢；主队 < 客队 → 2 赢 |
| 乌龙球处理 | 乌龙球计入进球方（即对方球队）总分 |
| 结算时机 | 终场哨响后立即结算 |

### 5.2 开球权（v4 新增 novelty）

| 项 | 内容 |
|----|------|
| 市场类型 | ButtonGroupMarket |
| title | `开球权` |
| 选项 | `[homeTeamName, 1.92]`、`[awayTeamName, 1.92]` |
| 含义 | 预测开场哨响后第一次开球的球队。足球比赛中由裁判抛硬币决定（而非点球/角球） |
| 时间口径 | 赛前至开球瞬间。比赛开球后即进入 suspended 状态 |
| 胜负判定 | 中线开球的队即为获胜方 |
| 数据来源 | **mock 数据**（v4 前端 demo 阶段固定赔率 1.92/1.92）。上线前需接入赛事数据源的 kick-off team 字段或由运营侧手动录入 |
| 市场定位 | **novelty（趣味盘）**：风险极低（50/50）、规则直观，面向非传统球迷；不推送到赛事列表卡片的预览区（仅在详情页呈现） |
| 竞品对照 | Polymarket / Opinion / Stake.com 等主流预测市场目前未标配此市场，属于 TurboFlow 差异化试点 |

> 上线前待定：实际赔率应贴近 1.90/1.90 还是带轻微主客场偏置，需结合大数据样本评估。

### 5.3 亚洲让分盘 (Asian Handicap)

| 项 | 内容 |
|----|------|
| 市场类型 | OddsTableMarket |
| title | `亚洲让分盘` |
| columns | `[homeTeamName, awayTeamName]` |
| rows（line / 主队赔率 / 客队赔率） | `0.75 / -0.75`（1.26 / 4.10）、`0.5 / -0.5`（1.38 / 3.15）、`0.25 / -0.25`（1.48 / 2.75）、`0 / 0`（1.63 / 2.34）、`-0.25 / 0.25`（1.94 / 1.91）、`-0.5 / 0.5`（2.23 / 1.69）、`-0.75 / 0.75`（2.65 / 1.51）、`-1 / 1`（3.50 / 1.32）、`-1.25 / 1.25`（4.00 / 1.27） |
| 时间口径 | 常规时间 |
| 胜负判定 | 让球后重新计算比分：主胜 → 选主队赢；客胜 → 选客队赢 |
| push（退款）条件 | 仅当 line 为整数（`0 / 0`、`-1 / 1` 等）且让球后平局时 |
| 四分之一球 | `0.25` 类 line 的投注拆分为两半，分别按 `0 / 0` 与 `0.5 / -0.5` 结算 |
| 结算时机 | 终场哨响后 |

### 5.4 让分0:1（欧洲让球 / European Handicap）

| 项 | 内容 |
|----|------|
| 市场类型 | OddsTableMarket |
| title | `让分0:1` |
| columns | `[homeTeamName, 平局, awayTeamName]` |
| rows（line / 主胜 / 平局 / 客胜） | `0:1`（4.30 / 3.95 / 1.64）、`0:2`（10.00 / 6.20 / 1.19）、`0:3`（23.00 / 10.00 / 1.04）、`0:4`（35.00 / 13.00 / 1.01）、`1:0`（1.36 / 4.70 / 7.00）、`2:0`（1.08 / 9.60 / 21.00）、`3:0`（1.01 / 12.00 / 35.00） |
| 与亚盘区别 | 欧洲让球使用 **固定让球比分** 作为起跑线，保留 1x2 三种结果（可能平局）；亚盘使用 **半/四分之一球线**，只有赢/输 |
| 胜负判定 | 将 line 加到终场比分上，按加完后的 1x2 结果判定 |
| 典型场景 | 强队深度让分（`0:2`、`0:3`）或弱队反向让分（`1:0`、`2:0`）时提升赔率吸引力 |
| 结算时机 | 终场哨响后 |

### 5.5 总进球数 (Total Goals 0~5+)

| 项 | 内容 |
|----|------|
| 市场类型 | RangeButtonsMarket |
| title | `总进球数` |
| 选项 | `0`（10.00）、`1`（4.20）、`2`（3.25）、`3`（3.90）、`4`（5.80）、`5+`（7.00） |
| 时间口径 | 常规时间 |
| 胜负判定 | 全场总进球数与所选档位精确匹配则赢；`5+` 命中条件为总进球数 ≥ 5 |
| 乌龙球处理 | 计入总进球数 |
| 结算时机 | 终场哨响后 |

### 5.6 合计（大小球 O/U）

| 项 | 内容 |
|----|------|
| 市场类型 | OddsTableMarket |
| title | `合计` |
| columns | `[高于, 低于]` |
| rows（line / Over / Under） | `1.25`（1.22 / 4.40）、`1.5`（1.34 / 3.30）、`1.75`（1.42 / 2.90）、`2`（1.54 / 2.49）、`2.25`（1.80 / 2.03）、`2.5`（2.05 / 1.78）、`2.75`（2.35 / 1.60）、`3`（2.90 / 1.42）、`3.25`（3.25 / 1.35） |
| 时间口径 | 常规时间 |
| 胜负判定 | 总进球数 > line → Over 赢；< line → Under 赢 |
| push 条件 | 仅在整数 line（如 `2`、`3`）且总进球数恰等于 line 时退款 |
| 四分之一球处理 | `2.25`、`2.75` 等 line 的投注拆分为两半，分别按相邻的整数 line 与 0.5 line 结算 |
| 结算时机 | 终场哨响后 |

### 5.7 正确进球（比分矩阵）

| 项 | 内容 |
|----|------|
| 市场类型 | ScoreGridMarket |
| title | `正确进球` |
| homeRange / awayRange | `[0, 1, 2, 3, 4]` / `[0, 1, 2, 3, 4]` |
| odds | 25 种组合的独立赔率（`'0:0': 10.00` 至 `'4:4': 201.00`，参见 `fullMatchTabs.ts` 中 `m_correctScore`） |
| 时间口径 | 常规时间 |
| 胜负判定 | 终场比分精确匹配所选 key（如 `'2:1'`）则赢；任一超出 4 球的组合均落入 "Any other score"（v4 暂不渲染该兜底项） |
| 乌龙球处理 | 乌龙球计入受益方得分 |
| 结算时机 | 终场哨响后 |

### 5.8 盘口排序

v4 硬编码排序（由 `LEAN_MARKET_ORDER` 控制）：

```
胜平负 → 开球权 → 亚洲让分盘 → 让分0:1 → 总进球数 → 合计 → 正确进球
```

依据：
1. **认知难度升序**：从单选（1x2 / 开球权）→ 矩阵（让分、大小球）→ 纯比分（正确进球）。
2. **热度下降**：胜平负是足球投注"默认入口"，放第一；开球权作为差异化记忆点，紧随其后保证高曝光。
3. **同类就近**：让分类（亚盘 + 欧盘）连续排列；进球类（总进球数 + 合计）连续排列。

### 5.9 隐藏清单（LEAN_MODE=true 时默认不展示）

下列 v3 盘口在 v4 默认隐藏，但代码仍保留。设 `LEAN_MODE=false` 即可恢复：

- Tab 1 热门中：平局返还、双胜彩、两队都得分、1x2 & 两队得分、上半场 - 正确进球、半场/全场、任何时间进球队员
- Tab 2 同场赛复式投注（bet-builder）完整 96 个盘口
- Tab 3 进球（goals）中除总进球数、正确进球、让分0:1 外的 ~36 个盘口
- Tab 4 亚洲盘（asian）中除亚洲让分盘、合计外的上/下半场让球等
- Tab 5 上半场/下半场（halves）全部 ~40 个盘口
- Tab 6 进球得分手（goalscorer）3 个球员盘口
- Tab 7 角球（corners）18 个
- Tab 8 罚牌（cards）4 个
- Tab 9 球员（players）5 个
- Tab 10 特殊投注（specials）7 个
- Tab 11 分钟盘（minutes）3 个

### 5.10 白名单实现规范

位置：`src/data/soccer/fullMatchTabs.ts`

```ts
const LEAN_MODE = true
const LEAN_VISIBLE_TITLES = new Set<string>([
  '胜平负', '总进球数', '亚洲让分盘', '正确进球', '合计', '开球权',
])
const LEAN_VISIBLE_PREFIXES = ['让分']   // 捕获欧洲让球 让分0:1 等变体

function leanMatches(title: string): boolean {
  if (LEAN_VISIBLE_TITLES.has(title)) return true
  return LEAN_VISIBLE_PREFIXES.some(p => title.startsWith(p))
}

function filterLean(tabs: MatchTab[]): MatchTab[] { /* 逐 tab 过滤 + 丢空 tab */ }
function collapseTabs(tabs: MatchTab[]): MatchTab[] { /* 合并+去重+按 LEAN_MARKET_ORDER 排序 + 单 Tab */ }
```

函数在 `createFullMatchTabs` 最末尾调用：

```ts
return LEAN_MODE ? collapseTabs(filterLean(TABS)) : TABS
```

**回滚策略**：
- 一键切回完整盘口：`LEAN_MODE = false`。
- 追加核心盘口：在 `LEAN_VISIBLE_TITLES` 中加 title；若需要包含同家族变体（如 `上半场 - 让分0:1`），在 `LEAN_VISIBLE_PREFIXES` 中加前缀。
- 调整顺序：修改 `LEAN_MARKET_ORDER` 数组即可。

---

## 第 6 章：赛事信息面板规范

沿用 v3 第 6 章全部子节，v4 不做任何 InfoPanel 层改动。

唯一关联修订：v3.3 的 MatchInfoPanel 已经按 status 分支渲染比分区（scheduled → date|time；live/finished && score → 分数），v4 字段审计确认该部分**逻辑正确**，无需动。

KickoffCountdown、FormationPitch、HeadToHeadPanel、MatchStatsBar、MatchTimeline 规范同 v3 §6.2.2 ~ §6.2.8。

---

## 第 7 章：字段配置清单（v4 精简版）

### 7.1 赛事列表卡片字段

| 字段 | 来源 | 展示条件 |
|------|------|---------|
| date / time | `match.date` / `match.time` | status ∉ {live, finished} |
| LIVE 标签 + 比分 | `match.status === 'live'` + `match.score` | status === 'live' |
| FT 标签 + 比分 | `match.status === 'finished'` + `match.score` | status === 'finished' |
| 队名 | `homeTeam.name` / `awayTeam.name` | 始终 |
| 1x2 赔率 | `homeTab.markets.find(t='胜平负').options` | sm+ |
| O/U 2.5 | `homeTab.markets.find(t='合计').rows.find(line~'2.5')` | md+ |
| 亚盘首行 | `homeTab.markets.find(t='亚洲让分盘').rows[0]` | lg+ |
| 「+N」盘口数 | `match.tabs.length * 8 or 4`（列表展示用占位） | 始终 |

### 7.2 左栏区块字段（v4 新增 & 修订）

| 区块 | 字段 | 展示条件 |
|------|------|----------|
| 正在直播 | `shortName vs shortName`、`score.home-score.away` | 存在 status === 'live' 场次；score 为空时不渲染比分 |
| 即将开赛（v4 修订） | `shortName vs shortName`、`match.time` | 存在 status === 'scheduled' 场次；**永不渲染比分** |

### 7.3 单场详情页头部字段

沿用 v3 §7.2：Badge / 联赛 / venue / 队名 / 头像 / 比分 或 date+time 二选一 / currentMinute（仅 live）。

### 7.4 盘口市场通用字段

| 字段 | 来源 | 说明 |
|------|------|------|
| title | `market.title` | 作为卡片标题展示 |
| type | `market.type` | 决定使用哪个 MarketRenderer 子组件 |
| status | `market.status`（open / upcoming / suspended / settled / void / cancelled / corrected / hidden） | 影响可点性、视觉、投注单联动 |
| settlementResult | `market.settlementResult`（win / loss / void / push） | 结算后的结果标记 |
| winningSelection | `market.winningSelection` | 中奖选项的 label，用于 settled 状态高亮 |

### 7.5 投注单字段 & 7.6 信息面板字段

沿用 v3 §7.4 & §7.5。

---

## 第 8 章：赛事与市场状态矩阵

### 8.1 赛事状态全集（不变）

scheduled / live / finished / interrupted / abandoned / postponed / cancelled / corrected。详细文案、异常说明行、Badge variant 同 v3 §8.1。

### 8.2 市场状态全集（不变）

open / upcoming / suspended / settled / void / cancelled / corrected / hidden。详细交互同 v3 §8.2。

### 8.3 页面 × 状态展示矩阵（v4 新增字段审计列）

| 场次状态 | MatchListCard 时间/比分列 | 左栏区块归属 | MatchHeader 比分区 | InfoPanel 比分区 | InfoPanel tabs |
|---------|--------------------------|--------------|--------------------|------------------|---------------|
| scheduled | date + time | 即将开赛（无比分） | date + time（无比分） | date \| time | 阵容 + H2H |
| live | LIVE + 实时比分 | 正在直播（带比分） | 实时比分（白色） | 实时比分 | 阵容 + H2H + 统计 + inline events |
| finished | FT + 终场比分（灰） | 不显示 | 终场比分（灰色） | 终场比分 | 阵容 + H2H + 统计 + 事件回顾 |
| interrupted / abandoned / postponed | 对应 Badge 或 date+time | 不显示 | 依 `match.score` 是否存在分支 | 依分支 | 依数据可用性 |
| cancelled / corrected | 对应 Badge 或 date+time | 不显示 | 依分支 | 依分支 | 同上 |

**审计结论（v4 字段展示逻辑全仓审计，对 10 个组件逐项核查）**：

| 组件 | 现状 | 是否合规 | 修复动作 |
|------|------|---------|----------|
| `SoccerPage.tsx` 左栏「即将开赛」 | 筛 `status==='live'` 且显比分 | ❌ 标题与筛选严重不符 | **v4 修复**：拆为「正在直播」(live+比分) + 「即将开赛」(scheduled+时间) 两区块 |
| `MatchListCard.tsx` | 按 status 三分支：live/finished 显比分，其他显 date+time | ✓ | 无 |
| `MatchHeader.tsx` | `{match.score ? 比分 : date+time}`，score 守卫生效；mock 中 scheduled 场次无 score 字段 | ✓ | 无 |
| `MatchInfoPanel.tsx` | 三个状态分支独立渲染比分/时间；stats tab 仅在 `!scheduled && hasStats` 可见；inline events 仅 live；历史 events 仅 finished | ✓ | 无 |
| `KickoffCountdown.tsx` | 被父组件仅在 `status==='scheduled'` 时渲染 | ✓ | 无 |
| `MatchStatsBar.tsx` | 仅处理数据渲染；父组件在非 scheduled 时才挂入 tab | ✓ | 无 |
| `MatchTimeline.tsx` | 父组件按 live/finished 分别挂入；本身不管 status | ✓ | 无 |
| `SoccerMatchPage.tsx` | `endedStatuses` 锁投注；voidMarkets 自动移除 betSlip；suspended 提示 | ✓ | 无 |
| `MyBetsPanel.tsx` | 静态历史投注，不依赖当前 match 状态 | ✓（产品设计） | 无 |
| `FormationPitch.tsx` / `HeadToHeadPanel.tsx` | 纯展示组件，按数据可用性渲染 | ✓ | 无 |

---

## 第 9 章：结算规则汇总

### 9.1 通用规则（不变）

沿用 v3 §9.1。核心摘要：

- **push**：仅在亚洲让分盘整数 line 让球后恰好平局、或大小球整数 line 总进球数恰等于 line 时触发，退还本金。
- **void**：特定条件下（平局返还的"平局"、球员未上场等）盘口作废、退还本金。
- **结算时机**：终场哨响后系统自动结算；异常终止（abandoned/cancelled）的盘口状态迁移规则见 §10.3。
- **乌龙球**：所有进球相关盘口中，乌龙球计入受益方（非射门方）总分。

### 9.2 v4 盘口专属规则

| 盘口 | push | void | 时间口径 |
|------|------|------|---------|
| 胜平负 | 无 | 无 | 常规时间 |
| 开球权 | 无 | 若比赛未开始即取消（abandoned pre-kick-off）→ void | 赛前～开球瞬间 |
| 亚洲让分盘 | 整数 line 让球后平局 | 无 | 常规时间 |
| 让分0:1（欧洲让球） | 无（平局独立为选项） | 无 | 常规时间 |
| 总进球数 | 无（档位为离散值） | 无 | 常规时间 |
| 合计（大小球） | 整数 line 恰等 | 无 | 常规时间 |
| 正确进球 | 无（精确匹配） | 无 | 常规时间 |

### 9.3 异常状态迁移（沿用 v3 §10.3）

- `interrupted` → 恢复后继续结算；若 24h 内未恢复通常转 `abandoned`。
- `abandoned` / `cancelled`：已开出的"大小球"、"让球"等按实际比分结算；未出现的（如正确进球、总进球数）通常 void。
- `postponed`：盘口迁移到新日期，原投注保持有效。
- `corrected`：比赛有效但成绩被官方更正（如红牌追认、申诉改判），按新成绩重新结算；已错发奖金追回。
- **开球权**：若比赛未正式开球即 abandoned/cancelled → 全部 void。

---

## 第 10 章：边界条件与异常处理（v4 附加）

### 10.1 白名单漏过的历史盘口

若 mock 数据引入新市场且 title 不在白名单也不匹配前缀，自动被 `filterLean` 滤掉。建议新增市场时先在 v4 确认是否列入白名单，不列入则零成本。

### 10.2 title 冲突去重

`collapseTabs` 使用 `Set<string>` 去重（按 title）。多个 tab 同时定义 `合计`（如 home tab 的 9-line 合计、asian tab 的 2-line 合计）时，**保留首个出现的实例**。v4 实际保留的是 `homeMarkets` 中的 9-line 版本（优先全面）。

### 10.3 赛事 mock 数据完整性校验

mock 中 scheduled 场次必须不带 `score` 字段（mockData 已满足）。若后端接入真实赛事数据，需在数据层过滤或在 UI 层加 `status !== 'scheduled'` 守卫，避免 score=0-0 被误显示。

### 10.4 开球权市场与实时数据

v4 前端阶段 mock 固定 1.92/1.92。上线前需补：
- 数据源支持（足球赛事 API 中 kick-off team 字段通常来自抛硬币结果）
- 赛中 status 迁移：开球后立即 suspended 或 settled
- 结算触发：需要裁判抛硬币后的实时事件流，或赛后人工录入

### 10.5 其他（沿用 v3）

- 赔率为 0 的处理（§10.1）
- 比赛中断后的盘口状态迁移（§10.3）
- 投注单中的盘口被关闭（§10.4）
- 同一盘口跨 Tab 重复（v4 已由 collapseTabs 去重）
- 半场与全场结算时序（§10.6）
- 加时赛对「含加时」盘口的影响（v4 不涉及，已全部移除含加时盘口）
- 投注单的组合赔率计算（§10.8）
- 乌龙球结算差异汇总（§10.9）

---

## 附录 A：v4 盘口数量汇总

| Tab | 盘口数 |
|-----|--------|
| 所有盘口（单 Tab） | 7 |

Total：**7 盘口** = 6 核心（胜平负 / 亚洲让分盘 / 让分0:1 / 总进球数 / 合计 / 正确进球）+ 1 novelty（开球权）。

对比 v3：11 Tabs / 约 232 个独立盘口定义（含同类不同 line 的单独计入）。

## 附录 B：产品页面路由（不变）

```
/soccer                    -> SoccerPage
/soccer/match/:matchId     -> SoccerMatchPage
/clob                      -> ClobPage（独立产品线，不受 LEAN_MODE 影响）
/clob/match/:matchId       -> ClobMatchPage（独立产品线）
```

## 附录 C：v4 变更影响范围清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `src/data/soccer/fullMatchTabs.ts` | **修改** | 新增 LEAN_MODE 开关、白名单常量、`leanMatches/filterLean/collapseTabs` 函数、`m_kickoff` 定义，将 m_kickoff 加入 homeMarkets，return 改为 LEAN 分支 |
| `src/pages/SoccerPage.tsx` | **修改** | 左栏区块拆分：`正在直播`（live+比分） + `即将开赛`（scheduled+时间） |
| `src/components/soccer/*` | 未动 | 所有子组件的字段逻辑经 v4 审计均为正确 |
| `src/data/soccer/mockData.ts` | 未动 | scheduled 场次已正确不含 score 字段 |
| `src/data/soccer/types.ts` | 未动 | 市场类型枚举已覆盖所有 v4 使用的类型 |
| `src/data/clob/*` | 未动 | CLOB 独立数据路径，不受 LEAN_MODE 影响 |

## 附录 D：待实现功能清单（在 v3 基础上的 v4 新增）

### D.1 前端 UI 层（无需后端即可实现）

- Novelty 标签视觉：给"开球权"卡片加 novelty badge（如 🎲 或 "NEW"）以区别常规盘口（可选）
- 盘口数量展示：列表卡片的「+N」在 LEAN_MODE=true 时应按实际精简数量展示（当前仍用占位估算）

### D.2 需要后端支撑的功能

- 开球权数据源接入（kick-off team 事件流 / 抛硬币结果录入 UI）
- 开球权赔率从 mock 切换到动态计算（历史主场开球率 + 裁判特征）
- 运营后台开关：将 LEAN_MODE 提升为可配置（例如按租户、按联赛切换）
- 盘口白名单的后台可视化管理（title 维度增删、排序）

---

**文档结束**

本 v4 PRD 与代码实现（`fullMatchTabs.ts` LEAN_MODE + `SoccerPage.tsx` 双区块）一一对应，已通过浏览器验证（scheduled 场次与 live 场次均正确显示 7 类盘口 + 对应字段）。设 `LEAN_MODE=false` 可一键回退到 v3 完整形态。
