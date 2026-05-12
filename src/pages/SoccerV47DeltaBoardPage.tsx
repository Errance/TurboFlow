import { useNavigate } from 'react-router-dom'

export default function SoccerV47DeltaBoardPage() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2DD4BF]">Historical board hidden</p>
      <h1 className="mt-4 text-2xl font-semibold text-[var(--text-primary)]">历史增量展板已从当前评审范围移除</h1>
      <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
        当前足球产品以 v6.0 AMM 预测市场为主口径。请使用完整 AMM Design Board 进行产品、设计、研发和测试评审。
      </p>
      <button
        onClick={() => navigate('/soccer/design-board')}
        className="mt-6 rounded-xl bg-[#2DD4BF] px-5 py-2.5 text-sm font-semibold text-[#06201D] hover:bg-[#5EEAD4]"
      >
        前往 AMM Design Board
      </button>
    </div>
  )
}
