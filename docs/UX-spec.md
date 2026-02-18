# UX 规范 — 唯一权威规则书

> 本文档是所有设计原则和契约的**单一真相源**。不定义具体功能细节；细节由 Cursor 提案，用户裁决。

---

## 1. 北极星：最短用户路径树（Shortest-Path Tree）

### 1.1 目标
让用户的主要流程操作都能用最简单直接的方式完成：
- 步骤短（少操作）
- 认知负担低（少选择、少解释、少记忆）
- 上下文切换少（尽量不跳来跳去）
- 但不平铺（避免信息爆炸）

### 1.2 结构
- **主干（Trunk）**：默认视图只放"现在就能行动"的最少信息 + 最少动作
- **分叉（Branches）**：只在意图信号出现时展开；用二级容器承载（Drawer / BottomSheet / Side Panel）
- **叶子（Leaves）**：少用细节永不抢主干注意力，放在二级容器更深层

> 渐进披露（Progressive Disclosure）：把高级/少用功能推迟到二级界面，降低复杂度与出错率。

---

## 2. 意图信号（触发分叉的唯一理由）

除非出现意图信号，不允许把高级内容直接放在主干里。

典型意图信号类别：
- **点击盘口价位**：表达"我要用盘口定价/挂限价"
- **点击"高级/更多"**：表达"我要更多控制"
- **发生错误或拒绝**：表达"我需要修复路径"
- **点击"更多规则/历史/深度"**：表达"我需要补充信息再决策"

---

## 3. 主干与分叉的"短进短出"规则

### 3.1 主干规则
- 主干始终可完成 Top Task（无需先进入分叉）
- 主干动作应当"立即可见、立即可操作"
- 主干必须有明确反馈（Pending → 结果）

### 3.2 分叉规则
- 分叉只解决一个子任务
- 分叉完成后必须能"一步回主干"，并保留主干上下文（用户刚看什么、刚填什么）

---

## 4. 桌面端与移动端

- 主干流程一致（同样的步骤逻辑）
- 移动端：分叉优先用 BottomSheet；操作与信息不依赖 hover
- 桌面端：可额外提供效率增强（如更密集信息），但不得破坏主干一致性
- 导航：2 个顶级入口（Markets + Portfolio），Portfolio 内用 Tabs 区分 Positions / Open Orders / Activity

---

## 5. 四类核心契约

### 5.1 交互契约（Interaction Contract）`[原型必须展示]`

每个关键操作（下单/撤单/改单/切换市场）必须遵守：
- **立即反馈**：用户动作后立刻有"正在处理"的明确反馈（不空白、不假死）
- **最终反馈**：每次操作必须落到明确结果状态（成功/失败/部分成功）
- **失败可修复**：失败必须给 reason + 可行动建议 + **CTA 按钮**（如"去查看持仓""切换到可交易市场""返回市场列表"）

### 5.2 状态契约（State Contract）`[原型必须展示]`

#### 订单状态机
```
[*] → Pending（submitOrder）
Pending → Open（accepted）
Pending → Rejected（validation fail / 市场已截止 / 数量无效 等）
Open → PartialFill（partial match）
PartialFill → PartialFill（more partial）
PartialFill → Filled（fully matched）
Open → Filled（fully matched）
Open → Cancelled（user cancel）
PartialFill → Cancelled（cancel remaining）
Filled → [*]
Cancelled → [*]
Rejected → [*]
```

不变量：
- 同一订单在 UI 中只能处于一个主状态
- 订单簿、订单列表、持仓、成交记录之间必须最终一致（允许短暂 Pending）
- **状态以 Zustand store 为单一真相源**，各 UI 视图只订阅渲染，不各自计算/维护状态副本

#### 市场生命周期状态机（4 态）
```
[*] → OPEN（createMarket）
OPEN → CLOSED（expiry reached）
CLOSED → RESOLVING（submit resolution）
RESOLVING → SETTLED（resolution confirmed）
SETTLED → [*]
```

操作矩阵：

| 状态 | 可下单 | 可撤单 | 可改单 | 盘口可视 | 特殊行为 |
|------|--------|--------|--------|----------|----------|
| OPEN | 是 | 是 | 是 | 是 | — |
| CLOSED | 否 | 否（冻结） | 否（冻结） | 是（静态） | 已有订单冻结（可见不可操作）；reason: "市场已截止，等待结算" |
| RESOLVING | 否 | 否 | 否 | 否 | 只读，显示"结算中"；可展示市场摘要与历史价格快照（不提供盘口互动）|
| SETTLED | 否 | 否 | 否 | 否 | 只读，显示结算结果 + 最终损益；可展示市场摘要与结算依据（不提供盘口互动）|

CLOSED 态的 reject reason 示例：
- 下单 → "市场已截止，等待结算" + CTA "去查看持仓"
- 撤单 → "市场已截止，订单已冻结" + CTA "查看结算信息"

### 5.3 数据流契约（Dataflow Contract）

**`[原型必须展示]`**：
- 盘口采用 snapshot/delta 叙事结构：进入市场 → `loadSnapshot()` 加载完整盘口；运行中 → `applyDelta()` 定时推送增量变更
- 每条 delta 带递增 `seq` 字段（协议叙事，不做运行时校验）
- Store 维护 `lastSeq`（DevTools 可展示）
- 预设 delta 序列为主 + 可选 ±5% 随机扰动
- 可选 DevTools "Simulate Reconnect" 按钮：重置 `lastSeq` 后重新 `loadSnapshot()`

**`[产品化概念锚点]`**（文档说明，原型不实现）：
- 真实 WebSocket 连接与协议（Kalshi: 先 orderbook_snapshot 再 orderbook_delta）
- 乐观更新（optimistic update）+ reject 时回滚
- 自动断线检测 + 自动重连 + 重新 snapshot
- 实时流包含：orderbook updates / trade executions / market status updates / fill notifications

### 5.4 自解释契约（Self-Describing Contract）`[原型必须展示]`

目标：降低理解成本，让用户通过界面线索而非阅读说明来完成主要任务。

规则：
- **识别优先于回忆**：关键动作/选项尽量可见且可就地理解；需要的信息应当在当前上下文中轻松取用
- **明确 signifier**：按钮文案、图标含义、可点击状态、操作后的状态变化、轻量提示（tooltip / inline hint）
- **就地反馈强化理解**：点击后立即出现可见反馈，形成稳定心智模型
- **图标策略**：若图标无法让大多数人"看见就懂"，必须配文字或就地提示
- **错误状态自解释**：错误提示不仅给 reason，还要让用户一眼知道"怎么修"；错误弹层/Toast 必须包含 CTA 按钮
- **tooltip 准则**：tooltip 限 1-2 句，不承载完成任务必需的信息；主界面本身应能自解释

---

## 6. 关键概念定义

### Quick Order = Marketable Limit（对齐 Polymarket）
所有订单本质是 limit order。Quick Order 自动将价格设为可成交（marketable），作为 taker 吃 resting orders。

原型中用预设成交脚本驱动 3 种 outcome：
- **Filled**：taker 直接吃最优档
- **PartialFill → Filled**：分两步收敛（模拟吃多档）
- **Rejected**：市场已截止等（串起市场状态机叙事）

### 二元盘口等价（对齐 Kalshi）
二元市场只展示 bids：YES bid X 等价 NO ask (100-X)。
UI 上用小标签"仅显示 Bids" + tooltip 补充等价关系。

---

## 7. 验收自检清单

每次迭代必须回答：
- [ ] 主干是否更短/更清晰？是否引入了不必要的分叉？
- [ ] 是否出现"平铺冲动"（把高级功能塞回主干）？
- [ ] 移动端主干可用？分叉短进短出回主干、上下文保留？
- [ ] 关键动作满足：立即反馈 → 最终结果 → 失败可修复（reason + CTA）？
- [ ] 盘口 snapshot/delta 叙事正常？
- [ ] 关键控件"看见就懂"？不自解释处已补足 signifier？
- [ ] 错误提示含 CTA 按钮（不只是文字建议）？
