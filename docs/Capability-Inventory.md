# 能力地图与覆盖矩阵（Capability Inventory）

> 遍历"二元 + CLOB 第一版"所有需要覆盖的能力域和功能项。Cursor 每轮对照此文档防漏项。

---

## 关键概念锚点

### 二元盘口等价（对齐 Kalshi）
YES bid X ≈ NO ask (100-X)。盘口数据结构遵循"只展示 bids 的等价叙事"。
- Orderbook 区块展示 YES/NO 两侧方向供下单，但底层数据只需维护 bids；NO 侧价格通过 100-X 推导，不必真的计算 ask
- UI 自解释：小标签"仅显示 Bids" + "i" tooltip："YES bid X 等价 NO ask (100-X)"
- tooltip 限 1-2 句，不承载完成任务必需的信息

### Quick Order = Marketable Limit（对齐 Polymarket）
所有订单本质是 limit order。Quick Order 自动将价格设为可成交（marketable），作为 taker 吃 resting orders。

---

## 预设数据场景覆盖验收标准

> 防止"能点但讲不清"。预设数据必须刻意覆盖以下场景：

- [ ] 市场生命周期全覆盖：至少 1 个 OPEN + 1 个 CLOSED + 1 个 RESOLVING + 1 个 SETTLED 的预设市场
- [ ] 订单状态全覆盖：预设订单含 Open / PartialFill / Filled / Cancelled / Rejected 各至少 1 条
- [ ] 错误/拒绝场景：至少 1 个 Rejected 订单带 reason（如"市场已截止"）
- [ ] 持仓盈亏：至少 1 个浮盈 + 1 个浮亏持仓
- [ ] 空状态：至少 1 个可触发空列表的场景（如某市场无 Open Orders）
- [ ] 二元盘口：至少 1 个市场的 orderbook 能展示 YES/NO 等价关系
- [ ] Quick Order 成交脚本：至少覆盖 Filled / PartialFill → Filled / Rejected 三种 outcome

---

## 7 个能力域 + 覆盖矩阵

> T = 主干（Trunk），B = 分叉（Branch），L = 叶子（Leaf）

### 域 1: 市场发现（Discovery）

| 功能项 | 层级 | 说明 |
|--------|------|------|
| 市场列表 + 卡片关键字段（最后价/成交量/到期/状态）| T | 主干入口 |
| 类别筛选（OPEN/CLOSED/SETTLED + 类别标签）| T | 轻量 tab/tag |
| 搜索（关键词）| B | 点击搜索图标展开搜索框 |

### 域 2: 市场详情（Market Detail）

| 功能项 | 层级 | 说明 |
|--------|------|------|
| 一句话规则摘要（resolution source / 截止时间）| T | — |
| 当前价格（top-of-book 或 mid）| T | — |
| 最近成交记录（tape，最近 5-10 条）| T | — |
| 市场状态指示 + 不可交易原因 | T | badge + 文案自解释 |
| 完整规则/结算逻辑 | B | 点击"更多规则"展开抽屉 |

### 域 3: 订单簿与行情（Orderbook / Market Data）

| 功能项 | 层级 | 说明 |
|--------|------|------|
| 订单簿 snapshot 加载（`loadSnapshot()`）| T | 从 fixtures 加载 |
| 订单簿 delta 更新（`applyDelta()` 定时，带 `seq`）| T | 预设序列 + ±5% 扰动 |
| 深度展示 top N 档 | T | 默认 5-10 档 |
| 二元盘口自解释（"仅显示 Bids" + tooltip）| T | — |
| 完整深度 / 更多档位 | B | 点击"更多档位"展开 |
| 点击价位 → 自动填入限价单价格 | B | 意图信号 → 触发限价分叉 |
| 完整深度图（可视化）| L | — |
| 可选 DevTools "Simulate Reconnect" | — | 重新 `loadSnapshot()` |

### 域 4: 下单（Order Entry）

| 功能项 | 层级 | 说明 |
|--------|------|------|
| **Quick Order: YES/NO 方向选择** | T | — |
| **Quick Order: Spend 或 Shares 输入** | T | 默认一种，可切换 |
| **Quick Order: 确认步骤（预估均价/吃几档/费用）** | T | 确认弹窗，预设数字需与脚本一致 |
| **Quick Order: 反馈链（Pending → 结果）** | T | 3 种预设脚本（Filled / Partial / Rejected）|
| Limit Order: 价格 + 数量输入 | B | 点盘口价位 或 点"限价单"触发 |
| Limit Order: 从 orderbook 点价位自动填价 | B | — |
| Limit Order: 下单后进入 Open Orders | B | — |

### 域 5: 订单管理（Order Management）

| 功能项 | 层级 | 说明 |
|--------|------|------|
| Open Orders 列表 | T | 预设数据 + 用户新下的模拟订单 |
| 订单状态视觉更新 | T | 定时将某些 Open 过场到 Filled/PartialFill |
| 单笔撤单 | B | 点击订单行展开 → 状态过场到 Cancelled |
| 单笔改单（改价/改量）| B | 点击订单行展开编辑 → 视觉更新 |
| 批量撤单 | B | 列表顶部"撤销全部" + 确认 |

### 域 6: 持仓与活动（Portfolio / Activity）

| 功能项 | 层级 | 说明 |
|--------|------|------|
| Positions 列表（YES/NO 持仓、均价、估值/浮盈浮亏）| T | — |
| Fills / Trades（成交历史）| B | 点击"成交记录"展开 |
| Activity 事件流（统一时间线）| B + L | Portfolio 页展开 + 持仓详情内嵌 |
| 完整交易历史表 | L | — |

### 域 7: 市场生命周期（Market Lifecycle）

| 功能项 | 层级 | 说明 |
|--------|------|------|
| 状态展示（OPEN/CLOSED/RESOLVING/SETTLED badge）| T | 预设市场覆盖不同状态 |
| 状态驱动操作可用性 + 自解释 reason | T | CLOSED 时禁止下单 + reason + CTA |
| 结算结果展示 + 最终损益 | T | Settled 市场 |
| 结算详情（结算源/依据）| B | 点击"查看结算详情"展开 |

> 注：不模拟市场状态实时变化（状态在预设数据中已确定）。产品化时市场状态来自 WS market status updates 实时流。
