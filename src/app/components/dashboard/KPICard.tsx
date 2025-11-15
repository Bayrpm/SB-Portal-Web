"use client";

import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  color?: "blue" | "green" | "red" | "purple" | "orange";
}

const colorClasses = {
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-600",
    border: "border-blue-200",
  },
  green: {
    bg: "bg-green-100",
    text: "text-green-600",
    border: "border-green-200",
  },
  red: {
    bg: "bg-red-100",
    text: "text-red-600",
    border: "border-red-200",
  },
  purple: {
    bg: "bg-purple-100",
    text: "text-purple-600",
    border: "border-purple-200",
  },
  orange: {
    bg: "bg-orange-100",
    text: "text-orange-600",
    border: "border-orange-200",
  },
};

export default function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  color = "blue",
}: KPICardProps) {
  const colors = colorClasses[color];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
            {trend && (
              <div
                className={`flex items-center gap-1 text-sm font-semibold ${
                  trend.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </div>
            )}
          </div>
          {description && (
            <p className="text-xs text-gray-500 mt-2">{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colors.bg} ${colors.border} border`}>
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </div>
      </div>
    </div>
  );
}
