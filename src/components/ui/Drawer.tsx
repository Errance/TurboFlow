import type { ReactNode } from "react";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function Drawer({
  isOpen,
  onClose,
  title,
  children,
  className = "",
}: DrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[var(--overlay-bg)] transition-opacity duration-200"
        onClick={onClose}
        aria-hidden
      />
      {/* Drawer panel */}
      <div
        className={[
          "fixed bottom-0 left-0 right-0 z-50",
          "bg-[var(--bg-card)] rounded-t-xl border-t border-[var(--border)]",
          "max-h-[85vh] overflow-y-auto",
          "transition-transform duration-200 ease-out",
          "animate-[slide-in-from-bottom_0.25s_ease-out]",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 bg-[var(--border)] rounded-full mx-auto mt-2 mb-4" />
        {title && (
          <h2 className="text-lg font-semibold text-[var(--text-primary)] px-4 mb-4">
            {title}
          </h2>
        )}
        <div className="px-4 pb-6">{children}</div>
      </div>
    </div>
  );
}
