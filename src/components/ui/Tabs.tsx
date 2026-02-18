export interface TabItem {
  id: string;
  label: string;
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
      className={["flex gap-1 border-b border-[#252536]", className].filter(Boolean).join(" ")}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const label = tab.count !== undefined ? `${tab.label} (${tab.count})` : tab.label;

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
              "px-4 py-2 text-sm font-medium transition-colors duration-150 min-h-[44px]",
              isActive
                ? "text-[#2DD4BF] border-b-2 border-[#2DD4BF] -mb-px"
                : "text-[#8A8A9A] hover:text-white",
            ].join(" ")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
