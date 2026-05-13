# TurboFlow 足球盘口 v4.1 复核报告

日期：2026-04-25

范围：Phase 0-8、Phase 10-11。Phase 9 合规入口已按用户要求取消；键盘无障碍专项不纳入本轮。

## 1. 自动检查

| 项目 | 结果 |
|------|------|
| TypeScript 构建 | 通过：`npm run build` |
| 相关文件 lint | 通过：ReadLints 无错误 |
| 足球模块合规/键盘关键词扫描 | 通过：无 `responsible` / `termsAccepted` / `Keyboard` 等残留 |
| PRD v4.1 合规/键盘关键词扫描 | 通过：无残留 |

备注：Vite 构建提示 Node.js 22.11.0 低于建议版本 22.12+，但构建成功。

## 2. 24 条端到端验收脚本

1. 打开 `/soccer`，首次渲染出现赛事列表骨架屏。
2. 骨架屏结束后展示联赛筛选、直播区、即将开赛区。
3. LIVE 比赛在列表中展示红色脉动点、LIVE 文案和比分。
4. 点击比赛进入 `/soccer/match/:matchId`，首次渲染出现比赛详情骨架屏。
5. 比赛详情页展示 MatchHeader、盘口列表、右侧投注单和 MyBets 摘要。
6. 当盘口数量超过阈值时，只展示前 6 个并出现“查看更多”按钮。
7. 点击“查看更多”展开全部盘口，再点击可收起。
8. 点击一个赔率选项，该选项加入投注单。
9. 同一盘口点击其他选项，旧选项被替换。
10. 同场互斥盘口组合时，投注单拒绝加入并 toast 提示冲突原因。
11. 跨场添加选项时，投注单显示跨场数量。
12. 离开比赛详情页后，足球浮动投注单仍显示。
13. 点击浮动投注单回到最近添加选项所属比赛页。
14. 投注单设置中切换 Decimal / Fractional / American，赔率展示同步变化。
15. LIVE 赔率发生 mock 变动时，盘口按钮出现上涨/下跌闪烁。
16. 赔率变动后投注单展示旧赔率 → 新赔率 badge。
17. acceptPolicy 为 `none` 时，未接受赔率变化不能成功下单。
18. 输入低于最小金额时，下单被拒并提示最小金额。
19. 余额不足时，下单被拒并提示余额不足。
20. 大额或 3 腿以上下单时弹出二次确认。
21. 确认下单成功后，钱包扣款、投注单清空、MyBets 写入注单。
22. MyBets 页面可按状态与日期筛选，可导出 CSV。
23. MyBets 中 placed/live 注单可 Cash Out，兑付后余额增加。
24. 选择 system 类型后，Trixie / Patent / Yankee 按单注金额生成子注数和总投注额。

## 3. PRD ↔ 代码映射

| PRD 能力 | 代码位置 |
|----------|----------|
| 盘口互斥 | `src/data/soccer/marketFamily.ts`, `src/stores/soccerBetSlipStore.ts` |
| 全局投注单 | `src/stores/soccerBetSlipStore.ts`, `src/components/soccer/SoccerBetSlip.tsx` |
| 浮动投注单 | `src/components/soccer/SoccerBetSlipFloat.tsx`, `src/layouts/AppShell.tsx` |
| 赔率格式 | `src/utils/oddsFormat.ts`, `src/components/soccer/BetSlipSettingsMenu.tsx` |
| 实时赔率 | `src/services/oddsRegistry.ts`, `src/services/oddsTicker.ts`, `src/components/soccer/OddsDisplay.tsx` |
| 赔率锁定 | `src/services/oddsLock.ts`, `src/components/soccer/SoccerBetSlip.tsx` |
| 下单校验 | `src/stores/soccerBetSlipStore.ts`, `src/utils/betRejectMessages.ts` |
| 钱包扣款/入账 | `src/stores/walletStore.ts` |
| MyBets 生命周期 | `src/stores/myBetsStore.ts`, `src/pages/SoccerMyBetsPage.tsx`, `src/components/soccer/MyBetCard.tsx` |
| 复式投注 | `src/utils/systemBets.ts`, `src/components/soccer/SoccerBetSlip.tsx` |
| 骨架屏 | `src/components/soccer/SoccerSkeletons.tsx` |
| PRD v4.1 | `Stake足球盘口研究/04_正式产品文档/TurboFlow足球盘口产品需求文档_v4.1.md` |

## 4. 状态矩阵

| 状态 | 已实现行为 |
|------|------------|
| scheduled + open | 可展示、可加入、可下单 |
| live + open | 可展示、赔率 ticker 抖动、可加入、可下单 |
| suspended | 盘口遮罩；投注单已选项灰化；下单拒绝 |
| settled | 展示结算结果；不可加入 |
| void | 投注单自动清理对应盘口 |
| cancelled | 盘口遮罩；不可下单 |
| corrected | 展示修正提示；MyBets 支持 corrected 卡片 |

## 5. 未实现清单

本轮按用户要求不实现：

- 键盘无障碍专项
- 合规入口、责任博彩页面、年龄声明等合规模块
- Phase 12 commit / push / GA 触发（未获得明确提交和推送指令）

真实生产仍需后端支持：

- 真实赔率源与盘口状态推送
- 服务端幂等下单、风控限额与真实拒单
- 真实钱包结算与 Cash Out 报价
- MyBets 服务端分页与 CSV 导出接口
