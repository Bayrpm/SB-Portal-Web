import React, { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  isActive?: boolean;
  onClick?: () => void;
  activeBorderColor?: string;
  hoverBorderColor?: string;
}

export default function StatsCard({
  title,
  value,
  icon,
  iconBgColor = "bg-blue-100",
  iconColor = "text-blue-600",
  isActive = false,
  onClick,
  activeBorderColor = "border-blue-500 ring-2 ring-blue-200",
  hoverBorderColor = "hover:border-blue-300",
}: StatsCardProps) {
  return (
    <div
      className={`bg-white p-4 rounded-lg shadow-sm border-2 transition-all ${
        onClick ? "cursor-pointer" : ""
      } ${
        isActive
          ? activeBorderColor
          : `border-gray-200 ${onClick ? hoverBorderColor : ""}`
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 ${iconBgColor} rounded-full`}>
          <div className={`w-6 h-6 ${iconColor}`}>{icon}</div>
        </div>
      </div>
    </div>
  );
}
