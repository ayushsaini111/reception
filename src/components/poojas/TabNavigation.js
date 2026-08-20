"use client";

export default function TabNavigation({ tabs, activeTab, onTabChange }) {
  return (
    <div
      className="flex gap-s16 border-b overflow-x-auto"
      style={{ borderColor: "var(--secondary-dark)" }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className="px-s24 py-s16 body-default font-medium whitespace-nowrap transition-colors relative"
          style={{
            color:
              activeTab === tab.id
                ? "var(--primary-main)"
                : "var(--text-secondary)",
          }}
        >
          {tab.icon} {tab.label}
          <span className="ml-s8 text-sm">({tab.count})</span>
          {activeTab === tab.id && (
            <div
              style={{
                position: "absolute",
                bottom: "-12px",
                left: 0,
                right: 0,
                height: "3px",
                background: "var(--primary-main)",
                borderRadius: "var(--R8)",
              }}
            />
          )}
        </button>
      ))}
    </div>
  );
}