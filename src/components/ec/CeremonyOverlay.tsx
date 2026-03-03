import { useEffect, useState } from 'react'

interface CeremonyOverlayProps {
  type: 'streak' | 'comeback'
  streakCount: number
}

export default function CeremonyOverlay({ type, streakCount }: CeremonyOverlayProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const isStreak = type === 'streak'

  return (
    <div
      className={`absolute inset-0 pointer-events-none flex items-center justify-center z-20 transition-opacity duration-600 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Radiating lines — two waves */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 w-[250%] origin-left"
            style={{
              height: i % 2 === 0 ? 2 : 1,
              transform: `rotate(${i * 22.5}deg)`,
              background: isStreak
                ? 'linear-gradient(90deg, rgba(45,212,191,0.5) 0%, rgba(45,212,191,0.15) 40%, transparent 70%)'
                : 'linear-gradient(90deg, rgba(251,191,36,0.5) 0%, rgba(251,191,36,0.15) 40%, transparent 70%)',
              animation: `ceremonyRay 2s ease-out ${i * 0.04}s 2 forwards`,
            }}
          />
        ))}
      </div>

      {/* Outer ring pulse */}
      <div
        className={`absolute rounded-full ${
          isStreak ? 'border-[#2DD4BF]/30' : 'border-[#FBBf24]/30'
        }`}
        style={{
          width: 200,
          height: 200,
          borderWidth: 2,
          animation: 'ringPulse 1.5s ease-out 0.3s 2 forwards',
          opacity: 0,
        }}
      />

      {/* Badge / Stamp */}
      <div
        className={`relative ${visible ? 'ec-ceremony-badge-in' : 'scale-[3] rotate-45 opacity-0'}`}
      >
        <div
          className={`px-8 py-4 rounded-2xl border-2 ${
            isStreak
              ? 'border-[#2DD4BF] bg-[#2DD4BF]/10'
              : 'border-[#FBBf24] bg-[#FBBf24]/10'
          }`}
          style={isStreak
            ? { boxShadow: '0 0 40px rgba(45,212,191,0.3), inset 0 0 20px rgba(45,212,191,0.05)' }
            : { boxShadow: '0 0 40px rgba(251,191,36,0.3), inset 0 0 20px rgba(251,191,36,0.05)' }
          }
        >
          <div
            className={`text-sm font-bold tracking-[0.2em] mb-1 text-center ${
              isStreak ? 'text-[#2DD4BF]' : 'text-[#FBBf24]'
            }`}
            style={isStreak
              ? { textShadow: '0 0 10px rgba(45,212,191,0.4)' }
              : { textShadow: '0 0 10px rgba(251,191,36,0.4)' }
            }
          >
            {isStreak ? 'WIN STREAK' : 'COMEBACK'}
          </div>
          <div
            className={`text-4xl font-black text-center ${
              isStreak ? 'text-[#2DD4BF]' : 'text-[#FBBf24]'
            }`}
            style={isStreak
              ? { textShadow: '0 0 16px rgba(45,212,191,0.5)' }
              : { textShadow: '0 0 16px rgba(251,191,36,0.5)' }
            }
          >
            {isStreak ? `${streakCount}x` : 'CLUTCH'}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ceremonyRay {
          0% { opacity: 0; transform: rotate(var(--r, 0deg)) scaleX(0); }
          30% { opacity: 1; }
          70% { opacity: 0.6; }
          100% { opacity: 0; transform: rotate(var(--r, 0deg)) scaleX(1); }
        }

        @keyframes ringPulse {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(2); opacity: 0; }
        }

        .ec-ceremony-badge-in {
          animation: ceremonyBadgeIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                     badgeFloat 1.5s ease-in-out 0.7s infinite alternate;
        }

        @keyframes ceremonyBadgeIn {
          0% { transform: scale(3) rotate(30deg); opacity: 0; }
          50% { transform: scale(0.9) rotate(-3deg); opacity: 1; }
          70% { transform: scale(1.05) rotate(1deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }

        @keyframes badgeFloat {
          0% { transform: translateY(0); }
          100% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}
