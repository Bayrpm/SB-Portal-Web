"use client";

import { ReactNode } from "react";
import { Loader } from "lucide-react";

interface ChartContainerProps {
  title: string;
  children: ReactNode;
  loading?: boolean;
  error?: string;
  description?: string;
  actions?: ReactNode;
}

export default function ChartContainer({
  title,
  children,
  loading,
  error,
  description,
  actions,
}: ChartContainerProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-80">
          <div className="text-center">
            <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">Cargando datos...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-80">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">
              Error al cargar datos
            </p>
            <p className="text-xs text-gray-600">{error}</p>
          </div>
        </div>
      ) : (
        <div>{children}</div>
      )}
    </div>
  );
}
