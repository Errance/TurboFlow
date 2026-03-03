import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useEventContractStore } from '../../stores/eventContractStore'
import type { ECBet } from '../../types/eventContract'
import { EC_ASSET_DECIMALS } from '../../types/eventContract'
import CeremonyOverlay from './CeremonyOverlay'

type RevealPhase = 'enter' | 'title' | 'pnl' | 'details' | 'hold' | 'exit'

function Particles({ color }: { color: string }) {
  const particles = useMemo(() =>
    Array.from({ length: 12 }).map((_, i) => {
      const angle = (i / 12) * 360
      const distance = 80 + Math.random() * 60
      const size = 2 + Math.random() * 3
      const delay = Math.random() * 0.3
      return { angle, distance, size, delay, id: i }
    }), [])

  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute top-1/2 left-1/2 rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: color,
            boxShadow: `0 0 6px ${color}`,
            animation: `ecParticle 0.8s ease-out ${p.delay}s forwards`,
            '--px': `${Math.cos(p.angle * Math.PI / 180) * p.distance}px`,
            '--py': `${Math.sin(p.angle * Math.PI / 180) * p.distance}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

function FullReveal({ bet, onDone }: { bet: ECBet & { _ceremony?: 'streak' | 'comeback'; _streakCount?: number }; onDone: () => void }) {
  const [phase, setPhase] = useState<RevealPhase>('enter')
  const won = bet.status === 'won'
  const showCeremony = bet._ceremony !== undefined
  const autoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const decimals = EC_ASSET_DECIMALS[bet.asset]
  const teal = '#2DD4BF'
  const red = '#F87171'
  const accent = won ? teal : red

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    timers.push(setTimeout(() => setPhase('title'), 80))
    timers.push(setTimeout(() => setPhase('pnl'), 450))
    timers.push(setTimeout(() => setPhase('details'), 900))

    const holdAt = showCeremony ? 2200 : 1600
    timers.push(setTimeout(() => setPhase('hold'), holdAt))

    const autoCloseAt = holdAt + 5000
    autoCloseRef.current = setTimeout(() => {
      setPhase('exit')
      setTimeout(onDone, 200)
    }, autoCloseAt)
    timers.push(autoCloseRef.current)

    return () => timers.forEach(clearTimeout)
  }, [onDone, showCeremony])

  const handleClose = useCallback(() => {
    if (autoCloseRef.current) clearTimeout(autoCloseRef.current)
    setPhase('exit')
    setTimeout(onDone, 200)
  }, [onDone])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleClose])

  const afterEnter = phase !== 'enter'
  const afterPnl = phase === 'pnl' || phase === 'details' || phase === 'hold' || phase === 'exit'
  const afterDetails = phase === 'details' || phase === 'hold' || phase === 'exit'

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-200 ${
        phase === 'exit' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />

      {/* Radial glow background */}
      {afterEnter && (
        <div
          className="absolute inset-0 pointer-events-none ec-bg-pulse"
          style={{
            background: `radial-gradient(circle at center, ${
              won ? 'rgba(45,212,191,0.12)' : 'rgba(248,113,113,0.06)'
            } 0%, transparent 60%)`,
          }}
        />
      )}

      {/* Main content */}
      <div className="relative flex flex-col items-center z-10 px-6" onClick={handleClose}>

        {/* WIN / LOSS title */}
        <div
          className={`mb-2 transition-all duration-500 ${
            afterEnter
              ? won ? 'ec-title-win' : 'ec-title-loss'
              : 'opacity-0 translate-y-6'
          }`}
        >
          <span
            className="text-5xl md:text-7xl font-black tracking-tight"
            style={{
              color: accent,
              textShadow: `0 0 30px ${accent}80, 0 0 80px ${accent}30`,
            }}
          >
            {won ? 'WIN' : 'LOSS'}
          </span>
        </div>

        {/* PnL burst */}
        <div className={`relative mb-6 ${afterPnl ? 'ec-pnl-burst' : 'scale-50 opacity-0'}`}>
          {/* Light sweep (WIN only) */}
          {won && afterPnl && <div className="ec-light-sweep" style={{ background: `linear-gradient(90deg, transparent, ${teal}40, transparent)` }} />}

          <span
            className="text-5xl md:text-6xl font-black tabular-nums relative z-10"
            style={{
              color: accent,
              textShadow: `0 0 20px ${accent}60, 0 0 50px ${accent}25`,
            }}
          >
            {won ? '+' : ''}{bet.pnl !== undefined ? `$${bet.pnl.toFixed(2)}` : '$0.00'}
          </span>

          {/* Particles (WIN only) */}
          {won && afterPnl && <Particles color={teal} />}
        </div>

        {/* Trade summary */}
        <div className={`flex flex-col items-center gap-1.5 transition-all duration-400 ${
          afterDetails ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--text-secondary)] font-medium">{bet.asset}/USDT</span>
            <span className="text-[10px] text-[var(--text-tertiary)]">&middot;</span>
            <span className={`font-bold ${bet.direction === 'higher' ? `text-[${teal}]` : `text-[${red}]`}`}
              style={{ color: bet.direction === 'higher' ? teal : red }}
            >
              {bet.direction === 'higher' ? 'Higher' : 'Lower'}
            </span>
          </div>

          <div className="text-xs text-[var(--text-tertiary)] tabular-nums">
            Entry ${bet.entryPrice.toFixed(decimals)}
            <span className="mx-1.5 opacity-40">&rarr;</span>
            Settled ${bet.settlementPrice?.toFixed(decimals) ?? '—'}
          </div>

          <div className="text-xs text-[var(--text-tertiary)]">
            Bet ${bet.amount} &middot; {bet.duration < 60 ? `${bet.duration}s` : `${bet.duration / 60}min`}
          </div>
        </div>
      </div>

      {/* Ceremony overlay */}
      {showCeremony && afterPnl && (
        <CeremonyOverlay type={bet._ceremony!} streakCount={bet._streakCount ?? 3} />
      )}

      <style>{`
        .ec-bg-pulse {
          animation: ecBgPulse 2s ease-out forwards;
        }

        @keyframes ecBgPulse {
          0% { transform: scale(0.8); opacity: 0; }
          40% { opacity: 1; }
          100% { transform: scale(1.5); opacity: 0.6; }
        }

        .ec-title-win {
          animation: ecTitleWin 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .ec-title-loss {
          animation: ecTitleLoss 0.4s ease-out forwards;
        }

        @keyframes ecTitleWin {
          0% { transform: scale(0.5) rotate(-4deg); opacity: 0; }
          60% { transform: scale(1.1) rotate(1deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes ecTitleLoss {
          0% { transform: translateY(16px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }

        .ec-pnl-burst {
          animation: ecPnlBurst 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes ecPnlBurst {
          0% { transform: scale(0.2); opacity: 0; }
          40% { transform: scale(1.3); opacity: 1; }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }

        .ec-light-sweep {
          position: absolute;
          top: 50%;
          left: -20%;
          width: 140%;
          height: 2px;
          transform: translateY(-50%);
          animation: ecLightSweep 0.6s ease-out 0.1s forwards;
          opacity: 0;
          z-index: 5;
        }

        @keyframes ecLightSweep {
          0% { left: -40%; opacity: 0; }
          20% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }

        @keyframes ecParticle {
          0% { transform: translate(-50%, -50%) translate(0, 0); opacity: 1; }
          100% { transform: translate(-50%, -50%) translate(var(--px), var(--py)); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

function AutoDismiss({ onDone, delay }: { onDone: () => void; delay: number }) {
  useEffect(() => {
    const t = setTimeout(onDone, delay)
    return () => clearTimeout(t)
  }, [onDone, delay])
  return null
}

export default function SettlementReveal() {
  const pendingReveal = useEventContractStore((s) => s.pendingReveal)
  const dismissReveal = useEventContractStore((s) => s.dismissReveal)
  const effects = useEventContractStore((s) => s.effects)

  const handleDone = useCallback(() => {
    dismissReveal()
  }, [dismissReveal])

  if (!pendingReveal) return null

  if (effects.settlementReveal === 'off') {
    return <AutoDismiss onDone={handleDone} delay={50} />
  }

  if (effects.settlementReveal === 'minimal') {
    return <AutoDismiss onDone={handleDone} delay={800} />
  }

  return <FullReveal bet={pendingReveal as any} onDone={handleDone} />
}
