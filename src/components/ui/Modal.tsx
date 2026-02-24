import type { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = "",
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[var(--overlay-bg)] transition-opacity duration-200"
        onClick={onClose}
        aria-hidden
      />
      {/* Content */}
      <div
        className={[
          "relative z-10 bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-6 max-w-md w-full mx-4",
          "transition-all duration-200 ease-out",
          "opacity-0 scale-95 animate-[fadeScaleIn_0.2s_ease-out_forwards]",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center -m-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
        {title && (
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 pr-10">{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
}
