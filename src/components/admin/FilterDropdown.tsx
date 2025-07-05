import React from 'react';
import { Filter, ChevronDown } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  options,
  value,
  onChange,
  label = "Filter"
}) => {
  return (
    <div className="relative">
      <label htmlFor="filter-dropdown" className="sr-only">{label}</label>
      <div className="flex items-center border border-border rounded-lg bg-background overflow-hidden">
        <div className="flex items-center px-3 text-muted-foreground">
          <Filter className="w-4 h-4" />
        </div>
        <select
          id="filter-dropdown"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full py-2.5 pr-8 pl-2 text-sm bg-transparent border-0 appearance-none focus:outline-none focus:ring-0"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
};
