/**
 * 足球盘口相关性（Related Contingencies）分类与冲突规则。
 *
 * 依据国际博彩通行标准（bet365 / Betway / Stake / Betfair 等）对"同场内多个盘口"
 * 做相关性判定：若两盘口结果空间存在派生或强耦合，则不允许同场串入一单
 * （cross-match 不受此约束，因为不同比赛天然独立）。
 *
 * 本模块仅定义规则与纯函数，不依赖任何 store / UI，可被 betSlip store 和审计脚本复用。
 */

export type MarketFamily =
  | 'outright' // 胜平负 (1x2)
  | 'handicap_asian' // 亚洲让分盘（半球/四分之一球）
  | 'handicap_eu' // 欧洲让球 让分0:1 / 0:2 / 1:0 / 2:0 等
  | 'total_bucket' // 总进球数离散档位 0/1/2/3/4/5+
  | 'overunder' // 大小球（合计） 2.5 / 3.0 等
  | 'score_exact' // 正确比分矩阵
  | 'future_winner' // 冠军 / 赛事优胜者
  | 'qualification' // 晋级 / 出线 / 获得资格
  | 'stage_result' // 系列赛 / 淘汰赛阶段结果
  | 'season_position' // 联赛名次 / 升降级
  | 'novelty' // 开球权等趣味盘，与赛果独立
  | 'unknown' // 未分类盘口，默认按保守相关性处理

/**
 * 由盘口 title 推断 family。
 *
 * 规则：
 * - 精确匹配优先，其次按前缀匹配（仅 handicap_eu 使用前缀"让分"以覆盖 0:1/0:2 等变体）
 * - 未识别的 title 返回 'unknown'，不能静默当作趣味盘放行
 */
export function getMarketFamily(title: string): MarketFamily {
  if (title === '胜平负') return 'outright'
  if (title === '开球权') return 'novelty'
  if (title === '亚洲让分盘') return 'handicap_asian'
  if (title === '总进球数') return 'total_bucket'
  if (title === '合计') return 'overunder'
  if (title === '正确进球') return 'score_exact'
  if (title.includes('冠军')) return 'future_winner'
  if (title.includes('晋级') || title.includes('资格')) return 'qualification'
  if (title.includes('系列赛') || title.includes('两回合')) return 'stage_result'
  if (title.includes('降级') || title.includes('升级') || title.includes('前四') || title.includes('前六')) return 'season_position'
  if (title.startsWith('让分')) return 'handicap_eu'
  return 'unknown'
}

/**
 * 冲突判定表：无序对（a<b 按字典序）→ 理由。
 *
 * 9 对禁组合（v4.1 LEAN 盘口范围内）：
 * - outright × handicap_asian：1x2 与亚盘是同维度的让球版本
 * - outright × handicap_eu：1x2 与欧洲让球高度相关
 * - outright × score_exact：正确比分完全包含 1x2 结果
 * - handicap_asian × handicap_eu：亚盘与欧盘是同一让球维度的两种表达
 * - handicap_asian × score_exact：正确比分完全决定让球结果
 * - handicap_eu × score_exact：同上
 * - total_bucket × overunder：大小球由总进球数完全决定
 * - total_bucket × score_exact：正确比分决定总进球数
 * - overunder × score_exact：正确比分决定大小球结果
 *
 * novelty（开球权）与任何 family 都视为 INDEPENDENT，放行。
 * unknown 表示未分类盘口，默认不可与同场其他非 novelty 盘口组合。
 */
const CONFLICT_REASONS: ReadonlyMap<string, string> = new Map([
  ['handicap_asian|outright', '胜平负与亚洲让分盘为同维度的让球变体，不可同场组合'],
  ['handicap_eu|outright', '胜平负与欧洲让球高度相关，不可同场组合'],
  ['outright|score_exact', '正确比分已完全包含胜平负结果，不可同场组合'],
  ['handicap_asian|handicap_eu', '亚盘与欧盘是同一让球维度的两种表达，不可同场组合'],
  ['handicap_asian|score_exact', '正确比分完全决定让球结果，不可同场组合'],
  ['handicap_eu|score_exact', '正确比分完全决定让球结果，不可同场组合'],
  ['overunder|total_bucket', '大小球由总进球数完全决定，不可同场组合'],
  ['score_exact|total_bucket', '正确比分完全决定总进球数，不可同场组合'],
  ['overunder|score_exact', '正确比分完全决定大小球结果，不可同场组合'],
])

function keyOf(a: MarketFamily, b: MarketFamily): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

export type CombineResult =
  | { ok: true }
  | { ok: false; reason: string }

/**
 * 判断两个 family 是否允许在同场串单内共存。
 *
 * 语义：
 * - 同 family 不同盘口默认视为相关
 * - 不同 family：查表
 * - 任一为 novelty：放行
 */
export function canCombine(a: MarketFamily, b: MarketFamily): CombineResult {
  if (a.startsWith('future_') || b.startsWith('future_') || a === 'qualification' || b === 'qualification' || a === 'stage_result' || b === 'stage_result' || a === 'season_position' || b === 'season_position') {
    return { ok: false, reason: '冠军、晋级和系列赛类盘口暂不支持串关，可作为多笔单注提交' }
  }
  if (a === 'novelty' || b === 'novelty') return { ok: true }
  if (a === 'unknown' || b === 'unknown') {
    return { ok: false, reason: '该盘口暂不可与本场其他玩法组合' }
  }
  if (a === b) return { ok: false, reason: '同一类玩法不可同时选入同一张串关注单' }
  const reason = CONFLICT_REASONS.get(keyOf(a, b))
  if (reason) return { ok: false, reason }
  return { ok: true }
}

/** 调试/审计使用：枚举所有冲突对。 */
export function listConflicts(): Array<{ a: MarketFamily; b: MarketFamily; reason: string }> {
  const out: Array<{ a: MarketFamily; b: MarketFamily; reason: string }> = []
  for (const [key, reason] of CONFLICT_REASONS) {
    const [a, b] = key.split('|') as [MarketFamily, MarketFamily]
    out.push({ a, b, reason })
  }
  return out
}
