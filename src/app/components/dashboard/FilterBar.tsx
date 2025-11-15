"use client";

import { Calendar } from "lucide-react";
import SelectComponent from "../SelectComponent";

interface FilterBarProps {
  dateRange: string;
  onDateRangeChange: (value: string) => void;
  customDateFrom?: string;
  customDateTo?: string;
  onCustomDateFromChange?: (value: string) => void;
  onCustomDateToChange?: (value: string) => void;
  compareWithPrevious?: boolean;
  onCompareChange?: (value: boolean) => void;
}

const dateRangeOptions = [
  { value: "today", label: "Hoy" },
  { value: "yesterday", label: "Ayer" },
  { value: "last7days", label: "Últimos 7 días" },
  { value: "last30days", label: "Últimos 30 días" },
  { value: "thisMonth", label: "Este mes" },
  { value: "lastMonth", label: "Mes pasado" },
  { value: "thisYear", label: "Este año" },
  { value: "custom", label: "Personalizado" },
];

export default function FilterBar({
  dateRange,
  onDateRangeChange,
  customDateFrom,
  customDateTo,
  onCustomDateFromChange,
  onCustomDateToChange,
  compareWithPrevious,
  onCompareChange,
}: FilterBarProps) {
  const showCustomDates = dateRange === "custom";

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Período:</span>
        </div>

        <SelectComponent
          value={dateRange}
          onChange={(e) => onDateRangeChange(e.target.value)}
          className="w-48"
        >
          {dateRangeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectComponent>

        {showCustomDates && onCustomDateFromChange && onCustomDateToChange && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Desde:</span>
              <input
                type="date"
                value={customDateFrom}
                onChange={(e) => onCustomDateFromChange(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Hasta:</span>
              <input
                type="date"
                value={customDateTo}
                onChange={(e) => onCustomDateToChange(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        {onCompareChange && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={compareWithPrevious}
              onChange={(e) => onCompareChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Comparar con período anterior
            </span>
          </label>
        )}
      </div>
    </div>
  );
}
