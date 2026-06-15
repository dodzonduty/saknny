import React, { useState, useEffect, useRef } from "react";

interface Option {
  label: string;
  value: string;
}

interface MultiSelectTagsProps {
  selected: Option[];
  onChange: (selected: Option[]) => void;
  options?: Option[]; // Static options (e.g. buildings, rooms)
  onSearch?: (query: string) => Promise<Option[]>; // Dynamic options (e.g. students)
  placeholder?: string;
  disabled?: boolean;
}

export const MultiSelectTags: React.FC<MultiSelectTagsProps> = ({
  selected,
  onChange,
  options = [],
  onSearch,
  placeholder = "Search...",
  disabled = false,
}) => {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [dynamicOptions, setDynamicOptions] = useState<Option[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle dynamic search
  useEffect(() => {
    if (!onSearch) return;

    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setIsSearching(true);
        const results = await onSearch(query);
        setDynamicOptions(results);
        setIsSearching(false);
      } else {
        setDynamicOptions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  const handleSelect = (option: Option) => {
    if (!selected.find(s => s.value === option.value)) {
      onChange([...selected, option]);
    }
    setQuery("");
    setShowDropdown(false);
  };

  const handleRemove = (value: string) => {
    onChange(selected.filter(s => s.value !== value));
  };

  const currentOptions = onSearch ? dynamicOptions : options.filter(o => 
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className={`relative w-full ${disabled ? "opacity-50 pointer-events-none" : ""}`} ref={wrapperRef}>
      <div 
        className="flex flex-wrap items-center gap-2 px-3 py-2 rounded-lg border border-outline-variant bg-surface min-h-[42px] focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent cursor-text"
        onClick={() => setShowDropdown(true)}
      >
        {selected.map(item => (
          <span 
            key={item.value} 
            className="flex items-center gap-1 bg-primary text-white text-xs font-semibold px-2 py-1 rounded-md"
          >
            {item.label}
            <button 
              type="button"
              className="hover:text-red-300 ml-1 leading-none"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(item.value);
              }}
            >
              &times;
            </button>
          </span>
        ))}
        <input
          type="text"
          className="flex-grow min-w-[80px] bg-transparent text-sm text-on-surface outline-none"
          placeholder={selected.length === 0 ? placeholder : ""}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          disabled={disabled}
        />
      </div>

      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-surface border border-outline-variant rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isSearching ? (
            <div className="p-3 text-sm text-on-surface-variant text-center">Searching...</div>
          ) : currentOptions.length > 0 ? (
            currentOptions.map(option => {
              const isSelected = selected.some(s => s.value === option.value);
              return (
                <div 
                  key={option.value}
                  className={`p-3 text-sm cursor-pointer border-b border-outline-variant last:border-0 ${
                    isSelected ? "bg-primary/10 text-primary font-bold" : "text-on-surface hover:bg-surface-container-high"
                  }`}
                  onClick={() => handleSelect(option)}
                >
                  {option.label}
                </div>
              );
            })
          ) : (
            <div className="p-3 text-sm text-on-surface-variant text-center">
              {query.length > 0 ? "No matches found" : "Type to search..."}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
