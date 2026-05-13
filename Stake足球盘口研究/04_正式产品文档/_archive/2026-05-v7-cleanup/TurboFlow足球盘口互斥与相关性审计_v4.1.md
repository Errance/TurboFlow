# TurboFlow 足球盘口互斥与相关性审计 v4.1

---

### 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| v4.1 | 2026-04-24 | 初版：基于 v4 LEAN 盘口范围，建立同场相关性（Related Contingencies）判定标准；枚举 7 family × 7 family 矩阵与 9 对禁组合；落地 `marketFamily.ts` / `soccerBetSlipStore.ts` / 跨场 BetSlip 分组 |

配套工程产物：

- `src/data/soccer/marketFamily.ts` — family 枚举 + `CONFLICT_REASONS` + `canCombine()`
- `src/stores/soccerBetSlipStore.ts` — 全局跨场投注单 store（Zustand）
- `src/components/soccer/SoccerBetSlip.tsx` — 按 matchId 分组渲染
- `src/components/soccer/SoccerBetSlipFloat.tsx` — 非 match 页的浮动入口

---

## 第 1 章 背景与目标

### 1.1 为什么要做这件事

v4 LEAN Mode 之后 TurboFlow 足球 match 详情页保留 7 个核心盘口：

1. 胜平负（1x2 / outright）
2. 开球权（novelty，新增）
3. 亚洲让分盘（AH / handicap_asian）
4. 让分 0:1、让分 0:2、让分 1:0、让分 2:0（欧洲让球 / handicap_eu）
5. 总进球数 0/1/2/3/4/5+（离散档位 / total_bucket）
6. 合计（Over/Under / overunder）
7. 正确进球（Correct Score / score_exact）

在 v4 初版投注单中，用户可以把"阿森纳胜"和"亚盘 -1.5 主让"同时放入同一投注单并以组合赔率（简单相乘）下注。这是**违反国际通行博彩规则**的：两条 leg 的结果空间高度相关（甚至互为派生），任一主流合规运营商（bet365 / Betway / Stake / Betfair Sportsbook / William Hill / DraftKings）都会在下单阶段直接阻断。

v4.1 的目标：

1. 给出 LEAN 范围内"同场可组合 / 不可组合"的**黑名单矩阵**。
2. 给每一对禁组合提供**推导理据**（结果空间派生关系），而非拍脑袋拍出来的列表。
3. 把规则抽象为**纯函数**（`canCombine`），与 UI 完全解耦，便于后续被 store、批量脚本、审计工具复用。
4. 完成在投注单中的**主动拦截** + toast 提示 + **跨场串单可行**（accumulator）。

### 1.2 边界

本文档**只覆盖同场（single-match）内的相关性**。跨场组合默认独立（不同比赛的结果空间不共享随机源），允许自由相乘赔率。

本文档不讨论：

- 抽水、保证金、赔付上限等财务规则（属 plan 2 Phase 2）
- 赔率锁 / tick 变动 / resolution / dead heat（属 plan 2 Phase 2、Phase 3）
- 系统串（Trixie / Yankee / Patent）自动拆单规则（属 plan 2 Phase 6）

---

## 第 2 章 术语

| 术语 | 说明 |
|------|------|
| **Leg** | 投注单里的一个原子选择 = (matchId, marketTitle, selection, odds) |
| **Single** | 只包含 1 个 leg 的投注 |
| **Accumulator / Parlay** | 包含 ≥ 2 个跨场 leg 的投注，任一 leg 输即全输 |
| **Related Contingencies** | 两个或以上 leg 的结果空间存在派生或强耦合 |
| **Market Family** | 按结果空间把盘口归并到的同类簇；同 family 内的不同 line 由"同盘口互斥"处理 |
| **同盘口互斥** | 同一 matchTitle 下不同选项之间天然互斥（如"胜平负"的主胜/平/客胜），由 store `toggleItem` 的 "sameMarket 替换" 分支处理 |
| **跨盘口冲突** | 两个不同 matchTitle 的选项结果空间相关（本文档焦点），由 `canCombine(a, b)` 判定 |

---

## 第 3 章 行业对标

下表总结主流合规博彩运营商对"同场 outright + handicap"、"同场 overunder + correct score" 等组合的处理。

| 运营商 | 同场 1x2 + AH | 同场 1x2 + Correct Score | 同场 Total + Correct Score | 备注 |
|--------|---------------|--------------------------|----------------------------|------|
| **bet365** | 禁止（投注单标红） | 禁止 | 禁止 | 统一以 "These selections cannot be combined" 提示 |
| **Betway** | 禁止 | 禁止 | 禁止 | 服务端兜底二次校验 |
| **Stake.com** | 禁止 | 禁止 | 禁止 | 另外将 AH 和欧让视为同族禁止组合 |
| **Betfair Sportsbook** | 禁止 | 禁止 | 禁止 | 交易所（Exchange）部分场景支持同场对冲，但 Sportsbook 保持禁止 |
| **William Hill** | 禁止 | 禁止 | 禁止 | 不允许 AH line A + AH line B 同时作为 legs（line 替换） |
| **DraftKings Sportsbook** | 多数禁止，少数 SGP（Same Game Parlay）允许 | 部分 SGP 允许 | 部分 SGP 允许 | SGP 另走专用组合赔率引擎，非标 parlay |

**结论**：TurboFlow v4.1 采纳 **bet365 / Betway / Stake / Betfair Sportsbook / William Hill 通行标准** —— 同场相关盘口在标准 parlay 中禁止共存。不实现 SGP 专用引擎（超出 v4.x 范围）。

---

## 第 4 章 Market Family 分类

### 4.1 枚举

| Family | 代表盘口（title） | 结果空间 |
|--------|-------------------|----------|
| `outright` | 胜平负 | { 主胜, 平, 客胜 } |
| `handicap_asian` | 亚洲让分盘 | 在 AH line 上 { 让方赢, 受方赢, push/half-push } |
| `handicap_eu` | 让分 0:1 / 0:2 / 1:0 / 2:0 | 在虚拟让球比分上做 1x2 |
| `total_bucket` | 总进球数 | { 0, 1, 2, 3, 4, 5+ } 6 桶 |
| `overunder` | 合计（Over/Under 2.5 等） | 在 line 上 { over, under } |
| `score_exact` | 正确进球 | 5×5 比分矩阵 + "其他" |
| `novelty` | 开球权 | 与 90 分钟赛果独立 |

### 4.2 title → family 映射

```ts
// 精确匹配优先，"让分"前缀覆盖 0:1 / 0:2 / 1:0 / 2:0 变体
getMarketFamily('胜平负')        // outright
getMarketFamily('开球权')        // novelty
getMarketFamily('亚洲让分盘')    // handicap_asian
getMarketFamily('让分0:1')       // handicap_eu
getMarketFamily('让分1:0')       // handicap_eu
getMarketFamily('总进球数')      // total_bucket
getMarketFamily('合计')          // overunder
getMarketFamily('正确进球')      // score_exact
```

未识别 title 默认为 `novelty`（放行），避免把未分类盘口误伤。

### 4.3 同 family 处理

同 family 两个 leg（如两条不同 line 的亚盘）在投注单中**不走 `canCombine` 路径**。store 的 `toggleItem` 在 "同 matchId + 同 marketTitle" 分支里直接**替换**前一条 leg，用户不会同时看到两条互斥 line。

若未来出现同 family 多 matchTitle 的场景（如同时摆"合计 2.5"与"合计 3.5"），需要在 4.4 节补充新的冲突理由。本文档范围内该情况不存在。

### 4.4 冲突矩阵（7 × 7）

记号：

- `✓` 允许
- `✗` 禁止（同场）
- `=` 同 family，由同盘口互斥/替换逻辑处理
- `N/A` 仅 novelty 横向一致放行

| \ | outright | handicap_asian | handicap_eu | total_bucket | overunder | score_exact | novelty |
|---|----------|-----------------|---------------|---------------|------------|--------------|----------|
| **outright** | = | ✗ | ✗ | ✓ | ✓ | ✗ | ✓ |
| **handicap_asian** | ✗ | = | ✗ | ✓ | ✓ | ✗ | ✓ |
| **handicap_eu** | ✗ | ✗ | = | ✓ | ✓ | ✗ | ✓ |
| **total_bucket** | ✓ | ✓ | ✓ | = | ✗ | ✗ | ✓ |
| **overunder** | ✓ | ✓ | ✓ | ✗ | = | ✗ | ✓ |
| **score_exact** | ✗ | ✗ | ✗ | ✗ | ✗ | = | ✓ |
| **novelty** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | = |

**禁组合对数**：9 对（矩阵上三角中 `✗` 的数量）。

---

## 第 5 章 9 对禁组合理据

每一对给出：①结果空间关系；②典型套利/必胜路径；③与行业做法的对齐。

### 5.1 outright × handicap_asian

**关系**：AH 本质是对 1x2 结果空间加上"让球修正"。例如"阿森纳 AH -1.5"等价于"阿森纳领先 ≥ 2 球"，这是 1x2 中"主胜"的**严格子集**。

**套利路径**：选"主胜"@2.24 + "让方赢 AH -1.5"@1.80 = 组合赔率 4.03；但凡主队赢 ≥ 2 球就全中，赔付远高于单注主胜 @2.24。相当于强关联 leg 被按独立 leg 计价，运营商净亏。

**行业对齐**：bet365 / Betway / Stake 全部禁止。

### 5.2 outright × handicap_eu

**关系**：欧洲让球 "让分 0:1 主胜" 定义为"主队在 -1 球初始比分上最终领先"≡"主队净胜 ≥ 2"，严格包含于 1x2 的主胜子集。

**套利路径**：同 5.1，任何 -1 的欧让方向都是 outright 的子事件。

### 5.3 outright × score_exact

**关系**：正确比分矩阵每一格 (h,a) 唯一决定 1x2 结果。选"阿森纳 2-1"+"阿森纳胜" = 2 leg，其中后者被前者完全蕴含。

**套利路径**：组合赔率 = (正确比分赔率) × (1x2 赔率)，但任何一个正确比分结算为赢就一定蕴含 1x2 方向赢，事件概率只有前者的概率，远不值当前组合赔率。

### 5.4 handicap_asian × handicap_eu

**关系**：两者都是"让球维度"的结果表达。AH line -1.5 与 欧让 0:2 主胜描述的是相同事件（主队净胜 ≥ 2）。选"AH -1.5 主胜"+"欧让 0:2 主胜"= 同一事件买两次。

**套利路径**：相同事件买两次按独立赔率相乘计价，对运营商损失风险无限。

### 5.5 handicap_asian × score_exact

**关系**：正确比分完全决定任何 AH line 的结算。选"正确比分 2-0"后，任意 AH line 的赢输都被确定。

### 5.6 handicap_eu × score_exact

**关系**：与 5.5 同构。欧让是在固定虚拟比分上的 1x2，正确比分完全决定结算。

### 5.7 total_bucket × overunder

**关系**：Total 0/1/2/3/4/5+ 离散分档与 O/U 2.5 等连续阈值是**同一随机变量的两种呈现**。

**套利路径**：选"Total = 0"+"Under 2.5" = 买的是同一事件（总进球 ≤ 2 的真子集）；"Total = 3"+"Over 2.5" = 同样重复买。

### 5.8 total_bucket × score_exact

**关系**：正确比分直接决定总进球数。"2-0" ≡ "Total = 2"。

### 5.9 overunder × score_exact

**关系**：正确比分决定大小球。"2-0" ⇒ Under 2.5 赢。

---

## 第 6 章 工程落地

### 6.1 `canCombine(a, b)` 合约

```ts
// src/data/soccer/marketFamily.ts
canCombine('outright', 'novelty')         // { ok: true }
canCombine('outright', 'handicap_asian')  // { ok: false, reason: '...' }
canCombine('handicap_asian', 'outright')  // { ok: false, reason: '...' } — 对称
canCombine('overunder', 'overunder')      // { ok: true } — 同 family 由 store 替换
```

- 纯函数、无副作用
- 无序对（对称）
- 任一方为 `novelty` 立即放行
- 同 family 返回 `ok: true`（由 store 替换兜底）

### 6.2 store 拦截流程（`toggleItem`）

```
toggleItem(input)
  ├─ 若 items 中存在同 id ──► 删除该 leg，return { ok, action: 'removed' }
  ├─ 否则计算 family = getMarketFamily(input.marketTitle)
  ├─ 寻找同 matchId + 同 marketTitle 的既有 leg ──►
  │     找到 ── 直接替换（action: 'replaced'），跳过冲突校验
  │     未找到 ──► 遍历同 matchId 其他 family
  │                     调 canCombine(family, existing.marketFamily)
  │                     任一返回 ok:false ──► toast error + return { ok: false }
  └─ 通过 ──► push 新 leg（action: 'added'）
```

### 6.3 UI 行为

- **冲突发生**：目标按钮不变高亮，投注单不新增，右下角 toast 弹红色错误并自带解释文字
- **同盘口替换**：前一条 leg 悄声删除，新 leg 入单，无 toast（符合用户预期）
- **跨场新增**：投注单顶部标题更新为 `投注单 N · 跨 M 场`，当前场置顶分组，其他场折叠在下方

### 6.4 跨场串单

- 不同 matchId 之间天然独立，**不触发 `canCombine` 检查**
- 组合赔率 = Π(leg.odds)
- 浮动入口 `SoccerBetSlipFloat` 在非 SoccerMatchPage 页显示，点击跳到最近添加 leg 所属比赛详情页

### 6.5 void 被动清理

- SoccerMatchPage 监听当前比赛 `voidMarkets` 集合，通过 store 的 `purgeVoid(matchId, voidTitles)` 被动清理已作废盘口的 leg
- 不影响其他 match 的 leg（按 matchId 隔离）

---

## 第 7 章 验证用例

### 7.1 禁路径（必须 toast + 拒绝）

| # | 步骤 | 预期 |
|---|------|------|
| D1 | 在 ARS vs CHE 加「胜平负-阿森纳」→ 再加「亚洲让分盘 1.26」 | 第二次点击弹 toast；投注单仍是 1 项 |
| D2 | 在 ARS vs CHE 加「胜平负-阿森纳」→ 再加「让分0:1-主胜」 | toast；1 项 |
| D3 | 在 ARS vs CHE 加「胜平负-阿森纳」→ 再加「正确进球 2-1」 | toast；1 项 |
| D4 | 在 ARS vs CHE 加「亚洲让分盘 1.26」→ 再加「让分0:1-主胜」 | toast；1 项（且 1.26 被当前留存） |
| D5 | 在 ARS vs CHE 加「亚洲让分盘 1.26」→ 再加「正确进球 2-1」 | toast；1 项 |
| D6 | 在 ARS vs CHE 加「让分0:1-主胜」→ 再加「正确进球 2-1」 | toast；1 项 |
| D7 | 在 ARS vs CHE 加「总进球数=2」→ 再加「合计 Over 2.5」 | toast；1 项 |
| D8 | 在 ARS vs CHE 加「总进球数=2」→ 再加「正确进球 2-1」 | toast；1 项 |
| D9 | 在 ARS vs CHE 加「合计 Over 2.5」→ 再加「正确进球 2-1」 | toast；1 项 |

### 7.2 允许路径

| # | 步骤 | 预期 |
|---|------|------|
| A1 | 加「胜平负-阿森纳」+「开球权-阿森纳」 | 2 项同场，novelty 放行 |
| A2 | 加「胜平负-阿森纳」+「总进球数=2」 | 2 项同场 |
| A3 | 加「亚洲让分盘 1.26」+「合计 Over 2.5」 | 2 项同场（让球维度 vs 进球总数维度独立） |
| A4 | 加「让分0:1-主胜」+「总进球数=2」 | 2 项同场 |

### 7.3 跨场（必须全部放行）

| # | 步骤 | 预期 |
|---|------|------|
| X1 | ARS vs CHE 加「胜平负」→ BOT vs MIR 加「胜平负」 | 投注单 2 项 · 跨 2 场，当前场置顶 |
| X2 | ARS vs CHE 加「正确进球 2-1」→ LIV vs MCI 加「胜平负」（需 liverpool 为 scheduled 场景） | 2 项 · 跨 2 场 |
| X3 | 继续在 ARS vs CHE 加「亚盘 1.26」 | 第三次动作被拒（与本场胜平负冲突），原 2 项保持 |

### 7.4 同盘口替换

| # | 步骤 | 预期 |
|---|------|------|
| R1 | 加「胜平负-阿森纳」→ 再点「胜平负-切尔西」 | 投注单仍 1 项，selection 从"阿森纳"变"切尔西"，无 toast |
| R2 | 加「亚盘 1.26」→ 再点「亚盘 4.10」 | 投注单仍 1 项，odds 更新 |

### 7.5 void 被动清理

| # | 步骤 | 预期 |
|---|------|------|
| V1 | 加 3 项 → 后端把「胜平负」置 void → 刷新详情页 | 「胜平负」leg 自动被移除，保留另外 2 项；toast 可选 |

### 7.6 浮动入口

| # | 步骤 | 预期 |
|---|------|------|
| F1 | ARS vs CHE 加 1 项 → 导航回 `/soccer` | 屏幕底部/右下出现浮动条，显示 1 项 + 组合赔率 |
| F2 | 浮动条显示时点击 | 跳回最近添加 leg 的 match 详情页 |
| F3 | 在 SoccerMatchPage 内 | 浮动条不显示（详情页右栏已展开完整面板） |

---

## 第 8 章 后续（v4.x / Plan 2 衔接）

本文档只解决"能不能放进投注单"。Plan 2 会在此基础上继续处理：

- **下单落地**：stake 校验、余额校验、suspended 拒绝、幂等 betCode
- **赔率锁与 tick 变动策略**：accept any / higher only / none
- **MyBets 生命周期**：pending → placed → live → settled / cashed_out / corrected
- **结算规则**：dead heat、half-win / half-loss（AH 1/4 球）、push（退款）、abandoned/cancelled 全额退款
- **系统串**：Trixie (3 选 3 / 4 组)、Yankee (4 选 11 组)、Patent (3 选 7 组) 自动拆单
- **合规入口**：18+ 声明、责任博彩链接
- **UX**：快选金额 chips、确认对话框、骨架屏、odds flashing 动效

以上均以 Zustand store（`settingsStore` / `walletStore` / `myBetsStore` / `toastStore` / `soccerBetSlipStore`）为底座扩展，不再新建互斥校验通路。

---

## 附录 A：冲突表的 JSON 快照

```json
{
  "outright|handicap_asian": "胜平负与亚洲让分盘为同维度的让球变体，不可同场组合",
  "outright|handicap_eu":    "胜平负与欧洲让球高度相关，不可同场组合",
  "outright|score_exact":    "正确比分已完全包含胜平负结果，不可同场组合",
  "handicap_asian|handicap_eu": "亚盘与欧盘是同一让球维度的两种表达，不可同场组合",
  "handicap_asian|score_exact": "正确比分完全决定让球结果，不可同场组合",
  "handicap_eu|score_exact":    "正确比分完全决定让球结果，不可同场组合",
  "total_bucket|overunder":     "大小球由总进球数完全决定，不可同场组合",
  "total_bucket|score_exact":   "正确比分完全决定总进球数，不可同场组合",
  "overunder|score_exact":      "正确比分完全决定大小球结果，不可同场组合"
}
```

## 附录 B：浏览器端实测记录

v4.1 交付日在 `http://localhost:5175/TurboFlow` 运行以下最小验证（详见 CI 或本地自测）：

- D1（outright × handicap_asian）→ toast 出现，投注单保持 1 项 ✓
- A1（outright × novelty）→ 投注单 2 项 · 当前场 · 阿森纳 vs 切尔西 ✓
- X1（跨场）→ 投注单 2 项 · 跨 2 场，RJ博塔弗戈 当前场置顶，阿森纳 vs 切尔西 作为"其他比赛"分组 ✓
- F1（浮动入口）→ 移动端底部出现 `⏰ 足球投注单 [1] 2.24x 查看` ✓
