export interface TabItem {
  id: string;
  label: string;
  shortLabel?: string;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export default function Tabs({ tabs, activeTab, onChange, className = "" }: TabsProps) {
  return (
    <div
      className={["flex gap-1 border-b border-[var(--border)] overflow-x-auto scrollbar-hide", className].filter(Boolean).join(" ")}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const suffix = tab.count !== undefined ? ` (${tab.count})` : '';

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={[
              "px-3 md:px-4 py-2 text-sm font-medium transition-colors duration-150 min-h-[44px] whitespace-nowrap shrink-0",
              isActive
                ? "text-[#2DD4BF] border-b-2 border-[#2DD4BF] -mb-px"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
            ].join(" ")}
          >
            {tab.shortLabel ? (
              <>
                <span className="md:hidden">{tab.shortLabel}{suffix}</span>
                <span className="hidden md:inline">{tab.label}{suffix}</span>
              </>
            ) : (
              `${tab.label}${suffix}`
            )}
          </button>
        );
      })}
    </div>
  );
}
