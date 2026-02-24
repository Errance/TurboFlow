export interface SegmentedOption {
  id: string;
  label: string;
}

export interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: "default" | "yes-no";
}

export default function SegmentedControl({
  options,
  value,
  onChange,
  className = "",
  variant = "default",
}: SegmentedControlProps) {
  const getActiveStyles = (option: SegmentedOption, index: number) => {
    const isActive = value === option.id;
    if (!isActive) return "";

    if (variant === "yes-no") {
      if (index === 0) return "bg-[#2DD4BF] text-[#0B0B0F]";
      if (index === 1) return "bg-[#E85A7E] text-white";
    }

    return "bg-[var(--border)] text-[var(--text-primary)]";
  };

  return (
    <div
      className={["flex bg-[var(--bg-control)] rounded-lg p-1", className].filter(Boolean).join(" ")}
      role="tablist"
    >
      {options.map((option, index) => {
        const isActive = value === option.id;

        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.id)}
            className={[
              "flex-1 px-3 py-1.5 text-sm font-medium rounded-md text-center transition-all duration-150 min-h-[36px] flex items-center justify-center",
              isActive ? getActiveStyles(option, index) : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
