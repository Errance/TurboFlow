import type { ReactNode } from "react";

type BadgeVariant = "success" | "danger" | "warning" | "neutral" | "info";

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-[#2DD4BF]/15 text-[#2DD4BF]",
  danger: "bg-[#E85A7E]/15 text-[#E85A7E]",
  warning: "bg-[#F59E0B]/15 text-[#F59E0B]",
  neutral: "bg-[#252536] text-[#8A8A9A]",
  info: "bg-[#2DD4BF]/15 text-[#2DD4BF]",
};

export default function Badge({ variant, children, className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center",
        variantStyles[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
