"use client";

import { Calendar, CalendarDays, BarChart3, TrendingUp, Globe } from "lucide-react";

const FILTERS = [
  { id: "today", label: "Today", icon: Calendar },
  { id: "yesterday", label: "Yesterday", icon: CalendarDays },
  { id: "week", label: "This Week", icon: BarChart3 },
  { id: "year", label: "This Year", icon: TrendingUp },
  { id: "all", label: "All", icon: Globe },
];

export default function DateFilter({ selectedFilter, onFilterChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {FILTERS.map((filter) => {
        const Icon = filter.icon;
        const isActive = selectedFilter === filter.id;
        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              isActive
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Icon size={14} />
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}