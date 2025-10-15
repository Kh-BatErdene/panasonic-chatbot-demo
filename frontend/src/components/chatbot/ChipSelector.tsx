"use client";

import { useState, useMemo } from "react";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { useClientI18n } from "@/hooks/useClientI18n";
import { SearchIcon, XIcon } from "lucide-react";

interface ChipSelectorProps {
  options: string[];
  selectedValues: string[];
  onSelectionChange: (selected: string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  multiple?: boolean;
  className?: string;
}

export function ChipSelector({
  options,
  selectedValues,
  onSelectionChange,
  placeholder = "Search options...",
  searchable = true,
  multiple = false,
  className = "",
}: ChipSelectorProps) {
  const { t } = useClientI18n();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchTerm) return options;
    return options.filter((option) =>
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm, searchable]);

  const handleOptionClick = (option: string) => {
    if (multiple) {
      const newSelection = selectedValues.includes(option)
        ? selectedValues.filter((val) => val !== option)
        : [...selectedValues, option];
      onSelectionChange(newSelection);
    } else {
      onSelectionChange([option]);
    }
  };

  const handleRemoveSelection = (option: string) => {
    if (multiple) {
      onSelectionChange(selectedValues.filter((val) => val !== option));
    }
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {searchable && (
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4"
          />
        </div>
      )}

      {/* Selected items */}
      {selectedValues.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {t("chipSelector.selected", { count: selectedValues.length })}
            </span>
            {multiple && selectedValues.length > 1 && (
              <button
                onClick={clearAll}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <XIcon className="h-3 w-3" />
                {t("chipSelector.clearAll")}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedValues.map((value) => (
              <Badge
                key={value}
                variant="selected"
                className="flex items-center gap-1"
              >
                {value}
                {multiple && (
                  <button
                    onClick={() => handleRemoveSelection(value)}
                    className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Available options */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-gray-700">
          {t("chipSelector.availableOptions")}
        </span>
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto mt-2">
          {filteredOptions
            .filter((option) => !selectedValues.includes(option))
            .map((option) => (
              <Badge
                key={option}
                variant="selectable"
                onClick={() => handleOptionClick(option)}
                className="hover:scale-105"
              >
                {option}
              </Badge>
            ))}
        </div>
        {filteredOptions.filter((option) => !selectedValues.includes(option))
          .length === 0 && (
          <p className="text-sm text-gray-500 italic">
            {searchTerm
              ? t("chipSelector.noOptionsMatch")
              : t("chipSelector.allOptionsSelected")}
          </p>
        )}
      </div>
    </div>
  );
}
