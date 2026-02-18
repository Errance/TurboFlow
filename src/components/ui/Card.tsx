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
        "bg-[#161622] rounded-xl p-4 border border-[#252536]",
        showHover && "hover:bg-[#252536] cursor-pointer transition-colors duration-150",
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
