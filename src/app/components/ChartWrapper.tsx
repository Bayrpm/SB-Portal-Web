"use client";

import React from "react";
import LoaderInline from "./LoaderInline";

interface ChartWrapperProps {
  title: string;
  children: React.ReactNode;
  loading?: boolean;
  progress?: number;
}

export default function ChartWrapper({
  title,
  children,
  loading = false,
  progress,
}: ChartWrapperProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>

      {/* Content */}
      <div className="p-6 relative" style={{ minHeight: "400px" }}>
        {loading && (
          <LoaderInline text="Cargando gráfico..." progress={progress} />
        )}
        {children}
      </div>
    </div>
  );
}
