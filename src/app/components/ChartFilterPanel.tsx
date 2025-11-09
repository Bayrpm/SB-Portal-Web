"use client";

import { useState, useEffect } from "react";
import { X, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { useUser } from "@/context/UserContext";

export interface ChartFilters {
  resumenGeneral: boolean;
  analisisDenuncias: boolean;
  inspectores: boolean;
  tiemposYSLA: boolean;
  geografico: boolean;
  comparativo: boolean;
  temporal: boolean;
  especiales: boolean;
}

interface ChartFilterPanelProps {
  filters: ChartFilters;
  onFiltersChange: (filters: ChartFilters) => void;
}

export default function ChartFilterPanel({
  filters,
  onFiltersChange,
}: ChartFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { name } = useUser();

  // Cargar filtros del localStorage al montar el componente
  useEffect(() => {
    if (!name) return;

    const savedFilters = localStorage.getItem(`dashboard-filters-${name}`);
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        onFiltersChange(parsed);
      } catch (error) {
        console.error("Error al cargar filtros:", error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const handleFilterChange = (key: keyof ChartFilters, value: boolean) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
    // Guardar en localStorage con el nombre del usuario
    if (name) {
      localStorage.setItem(
        `dashboard-filters-${name}`,
        JSON.stringify(newFilters)
      );
    }
  };

  const toggleAll = (value: boolean) => {
    const newFilters: ChartFilters = {
      resumenGeneral: value,
      analisisDenuncias: value,
      inspectores: value,
      tiemposYSLA: value,
      geografico: value,
      comparativo: value,
      temporal: value,
      especiales: value,
    };
    onFiltersChange(newFilters);
    if (name) {
      localStorage.setItem(
        `dashboard-filters-${name}`,
        JSON.stringify(newFilters)
      );
    }
  };

  const sections: { key: keyof ChartFilters; label: string; icon: string }[] = [
    { key: "resumenGeneral", label: "Resumen General", icon: "📊" },
    { key: "analisisDenuncias", label: "Análisis de Denuncias", icon: "📈" },
    { key: "inspectores", label: "Inspectores", icon: "👥" },
    { key: "tiemposYSLA", label: "Tiempos y SLA", icon: "⏱️" },
    { key: "geografico", label: "Geográfico", icon: "📍" },
    { key: "comparativo", label: "Análisis Comparativo", icon: "🔍" },
    { key: "temporal", label: "Temporal Avanzado", icon: "📅" },
    { key: "especiales", label: "Especiales", icon: "✨" },
  ];

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="mb-6">
      {/* Botón para abrir el panel */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filtrar Gráficos
          {activeCount < 8 && (
            <span className="ml-2 px-2 py-0.5 bg-blue-500 rounded-full text-xs">
              {activeCount}/8 activos
            </span>
          )}
        </button>
      )}

      {/* Panel de filtros */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Filtrar Secciones del Dashboard
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            💡 Tus preferencias se guardarán automáticamente para tu usuario
          </p>

          {/* Botones de acción rápida */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => toggleAll(true)}
              className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
            >
              Mostrar Todos
            </button>
            <button
              onClick={() => toggleAll(false)}
              className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
            >
              Ocultar Todos
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="ml-auto px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Compactar
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Expandir
                </>
              )}
            </button>
          </div>

          {/* Grid de checkboxes */}
          <div
            className={`grid gap-3 ${
              isExpanded ? "grid-cols-1" : "grid-cols-2 md:grid-cols-4"
            }`}
          >
            {sections.map((section) => (
              <label
                key={section.key}
                className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  filters[section.key]
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={filters[section.key]}
                  onChange={(e) =>
                    handleFilterChange(section.key, e.target.checked)
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-lg">{section.icon}</span>
                <span
                  className={`text-sm font-medium ${
                    filters[section.key] ? "text-blue-900" : "text-gray-700"
                  }`}
                >
                  {section.label}
                </span>
              </label>
            ))}
          </div>

          {/* Contador de secciones activas */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              {activeCount === 8
                ? "✅ Todas las secciones están visibles"
                : `📊 ${activeCount} de 8 secciones visibles`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
