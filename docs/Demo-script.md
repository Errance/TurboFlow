# Demo 演示脚本（回归闸门）

> 每次改动后都能按脚本跑通，确保主干路径没有变长、没有变乱、没有变得不可解释。

## 演示目标（3 分钟）
- 让观众理解：这是一个 CLOB 预测市场原型
- 看到"最短路径树"：主干短；需要时才展开分叉；不会信息爆炸
- 看到"丝滑 + 严谨"：动作即时反馈；订单状态清晰；盘口用 snapshot→delta 维护
- 看到"低理解成本"：看见按钮/图标/布局就能猜到功能与结果

---

## 1) 主干演示（Trunk）

1. 打开 Markets 列表页
2. 浏览市场卡片（看到不同状态：OPEN / CLOSED / SETTLED）
3. 进入一个 **OPEN** 市场详情
4. 看到盘口在"活"着（delta 微变）
5. 使用 Quick Order：选 YES/NO → 输入金额 → 点下单
6. 看到确认弹窗（预估均价/吃几档/费用）→ 确认
7. 看到反馈链：Pending → Filled（脚本 1：动画过场）
8. （可选）再下一笔 Quick Order → 触发 PartialFill → Filled（脚本 2），或触发 Rejected（脚本 3）
9. 进入一个 **CLOSED** 市场 → 看到按钮禁用 + reason "市场已截止，等待结算"
10. 切换到 Portfolio 页 → 看到 Positions / Open Orders tabs

---

## 2) 分叉演示（Branches）

1. 触发意图信号：点击盘口某个价位
2. 弹出 Limit Order 分叉（Drawer / BottomSheet）
3. 价格已自动填入 → 输入数量 → 下单
4. 一步回主干，确认主干上下文不丢

---

## 3) 错误/拒绝演示

1. 触发一次 Rejected 场景（如在 CLOSED 市场尝试下单）
2. 看到错误提示：reason + CTA 按钮（如"去查看持仓"）
3. 点击 CTA → 页面确实跳转到对应位置（如 Portfolio 的 Open Orders tab），且跳转后上下文合理

---

## 4) 备注叙事点（口头阐述，不强制演示）

- 盘口采用 snapshot → delta 结构（对齐 Kalshi WS 协议），原型用预设数据模拟
- 可选演示 DevTools "Simulate Reconnect"（重新 loadSnapshot）
- 原型用预设市场覆盖 OPEN/CLOSED/RESOLVING/SETTLED；产品化时市场状态来自 WS market status updates 实时流（Kalshi WS 包含 orderbook / trade executions / market status updates / fill notifications）
- Quick Order = marketable limit（对齐 Polymarket：所有订单本质是 limit）

---

## 回归清单（每次改动必须勾选）

### A) 主干/分叉结构
- [ ] 主干未引入不必要的解释/选择/跳转
- [ ] 分叉只在意图信号出现时展开
- [ ] 分叉短进短出回主干，且上下文保留

### B) 丝滑与严谨
- [ ] 关键动作都有立即反馈（无假死）
- [ ] Pending 最终都收敛到明确结果状态
- [ ] Rejected 有 reason + CTA 按钮（不只是文字）
- [ ] 盘口 snapshot/delta 叙事正常（loadSnapshot → applyDelta 定时推送）

### C) 低理解成本（自解释）
- [ ] 主要动作"看见就懂"：按钮/图标/入口无需讲解也能猜到用途
- [ ] 关键图标若可能误解，已配文字或就地提示
- [ ] 二元盘口有"仅显示 Bids"标签 + tooltip 解释等价关系
- [ ] 用户不需要记住信息再跳去别处使用
- [ ] 错误提示含 CTA 按钮（"去查看持仓""返回市场列表"等）
- [ ] 点击关键动作后，状态变化/反馈能强化理解

### D) 桌面端 + 移动端
- [ ] 主干流程桌面/移动一致
- [ ] 移动端分叉用 BottomSheet，不依赖 hover
- [ ] 所有可点击元素触控区 >= 44x44px
- [ ] 盘口价位整行可点
