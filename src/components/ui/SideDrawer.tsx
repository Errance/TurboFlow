import type { ReactNode } from 'react'

interface SideDrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}

export default function SideDrawer({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}: SideDrawerProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40">
      <div
        className="fixed inset-0 bg-black/60 transition-opacity duration-200"
        onClick={onClose}
        aria-hidden
      />

      {/* Mobile: bottom sheet */}
      <div
        className={[
          'md:hidden fixed bottom-0 left-0 right-0 z-50',
          'bg-[#161622] rounded-t-xl border-t border-[#252536]',
          'max-h-[85vh] overflow-y-auto',
          'transition-transform duration-200 ease-out',
          'animate-[slide-in-from-bottom_0.25s_ease-out]',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="w-10 h-1 bg-[#252536] rounded-full mx-auto mt-2 mb-4" />
        {title && (
          <h2 className="text-lg font-semibold text-white px-4 mb-4">{title}</h2>
        )}
        <div className="px-4 pb-6">{children}</div>
      </div>

      {/* Desktop: right-side panel */}
      <div
        className={[
          'hidden md:flex md:flex-col fixed top-0 right-0 bottom-0 z-50',
          'w-[360px] bg-[#161622] border-l border-[#252536]',
          'overflow-y-auto',
          'transition-transform duration-200 ease-out',
          'animate-[slide-in-from-right_0.2s_ease-out]',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#252536]">
          {title && (
            <h2 className="text-lg font-semibold text-white">{title}</h2>
          )}
          <button
            onClick={onClose}
            className="ml-auto text-[#8A8A9A] hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 px-4 py-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
