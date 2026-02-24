import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export default function Card({ children, className = "", onClick, hover }: CardProps) {
  const isClickable = Boolean(onClick);
  const showHover = hover ?? isClickable;

  return (
    <div
      className={[
        showHover ? "glow-card" : "bg-[var(--bg-card)] rounded-xl border border-[var(--border)]",
        "p-4",
        isClickable && "cursor-pointer",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
    >
      {children}
    </div>
  );
}
