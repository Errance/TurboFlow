# TurboFlow足球预测市场路线图 v2

## 1. 路线图目标
- 本路线图用于说明为什么 TurboFlow 足球预测市场采用 `P0 / P1 / P2` 分阶段推进。
- 路线图重点回答三件事：
- 当前先做什么
- 后续扩什么
- 每一阶段的解锁条件是什么

## 2. P0

### P0 范围
- `1x2`
- `主队不败 / 客队不败 / 两队不会打平`
- `全场总进球高于/低于`
- `上半场结果市场`
- `上半场总进球高于/低于`

### P0 成功标准
- 单场比赛形成一组清晰、直接的核心预测问题
- 每个问题都能说明时间范围、规则边界与结果反馈
- 前台按预测问题组织，不依赖传统盘口树
- `Double Chance` 完成去术语化表达

## 3. P1
- `下半场结果市场`
- `有限 live 主盘口兼容`
- `亚洲总进球高于/低于`
- `To Qualify / Who Will Advance`
- `Outright Winner`
- `分钟区间市场`
- `Corner Interval Markets`

### P1 解锁逻辑
- P0 主市场闭环稳定
- 半场 / 赛事级 / 时间窗型问题的解释框架更完整
- `live` 兼容仍限定在少量主盘口，不扩写成完整 `live sportsbook`

## 4. P2 / 暂缓
- `亚洲让球`
- `Winner / Moneyline`
- `Correct Score`
- `Goalscorer` 系列
- `Rest of the Match`
- `Who Will Win the Final`
- `Booking / Offside / Penalty`
- `Bet Builder / Same Game Multi`

### P2 / 暂缓原因
- 规则边界仍不足
- 事件流或球员数据依赖更强
- 前台解释成本过高
- 更适合在主骨架稳定后单独评估

## 5. 里程碑建议

### 里程碑一：完成 P0 主市场闭环
- 完成 5 个核心节点的统一表达、规则摘要、状态提示与结果反馈

### 里程碑二：完成阶段型与赛事级扩展
- 优先评估：
- `下半场结果市场`
- `To Qualify`
- `Who Will Advance`
- `Outright Winner`

### 里程碑三：完成有限 live 主盘口兼容
- 仅优先评估：
- `1x2`
- `全场总进球高于/低于`

### 里程碑四：评估事件型与深市场扩展
- 分钟区间
- 角球时间区间
- 球员进球类
- 牌 / 越位 / 点球类
- 亚洲盘类

### 里程碑五：最后评估组合能力
- `Bet Builder / Same Game Multi`
- 前提是主市场体系、规则摘要、状态骨架与前台表达足够稳定
