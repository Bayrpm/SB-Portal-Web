"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Star,
  Eye,
  EyeOff,
  RotateCcw,
  Filter,
  X,
} from "lucide-react";
import { useUser } from "@/context/UserContext";

export interface ChartConfig {
  id: string;
  title: string;
  category: string;
}

interface DashboardSidebarProps {
  charts: ChartConfig[];
  visibleCharts: Set<string>;
  favoriteCharts: Set<string>;
  onToggleChart: (chartId: string) => void;
  onToggleFavorite: (chartId: string) => void;
  onResetFilters: () => void;
  onShowAll: () => void;
  onHideAll: () => void;
  onShowOnlyFavorites: () => void;
}

export default function DashboardSidebar({
  charts,
  visibleCharts,
  favoriteCharts,
  onToggleChart,
  onToggleFavorite,
  onResetFilters,
  onShowAll,
  onHideAll,
  onShowOnlyFavorites,
}: DashboardSidebarProps) {
  const { name } = useUser();
  const [isOpen, setIsOpen] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  // Agrupar gráficos por categoría - Memoizar para evitar recalcular
  const categories = Array.from(
    new Set(charts.map((chart) => chart.category))
  ).sort();

  const chartsByCategory = categories.reduce((acc, category) => {
    acc[category] = charts.filter((chart) => chart.category === category);
    return acc;
  }, {} as Record<string, ChartConfig[]>);

  // Cargar categorías expandidas - Solo cuando cambia el usuario
  useEffect(() => {
    if (!name) return;

    const savedExpanded = localStorage.getItem(
      `dashboard-expanded-categories-${name}`
    );
    if (savedExpanded) {
      try {
        setExpandedCategories(new Set(JSON.parse(savedExpanded)));
      } catch (error) {
        console.error("Error al cargar categorías expandidas:", error);
        // Por defecto, expandir todas las categorías
        const allCategories = Array.from(
          new Set(charts.map((chart) => chart.category))
        ).sort();
        setExpandedCategories(new Set(allCategories));
      }
    } else {
      // Por defecto, expandir todas las categorías
      const allCategories = Array.from(
        new Set(charts.map((chart) => chart.category))
      ).sort();
      setExpandedCategories(new Set(allCategories));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]); // Solo depende de name, no de categories

  // Guardar categorías expandidas
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);

    if (name) {
      localStorage.setItem(
        `dashboard-expanded-categories-${name}`,
        JSON.stringify(Array.from(newExpanded))
      );
    }
  };

  const visibleCount = visibleCharts.size;
  const totalCount = charts.length;
  const favoriteCount = favoriteCharts.size;

  return (
    <>
      {/* Toggle button para móvil */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-20 left-4 z-50 bg-blue-600 text-white p-2 rounded-lg shadow-lg"
        title={isOpen ? "Cerrar filtros" : "Abrir filtros"}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed left-0 bg-white border-r border-gray-200 shadow-lg overflow-y-auto z-40 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          width: "320px",
          top: "80px",
          height: "calc(100vh - 80px)",
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#003C96] text-white p-4 z-10 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros de Dashboard
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-white hover:bg-white/20 p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-sm opacity-90">
            {visibleCount} de {totalCount} gráficos visibles
          </div>
        </div>

        {/* Controles rápidos */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="space-y-2">
            <button
              onClick={onShowAll}
              className="w-full px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Mostrar Todos
            </button>
            <button
              onClick={onHideAll}
              className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <EyeOff className="w-4 h-4" />
              Ocultar Todos
            </button>
            {favoriteCount > 0 && (
              <button
                onClick={onShowOnlyFavorites}
                className="w-full px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <Star className="w-4 h-4 fill-yellow-600" />
                Solo Favoritos ({favoriteCount})
              </button>
            )}
            <button
              onClick={onResetFilters}
              className="w-full px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Restaurar
            </button>
          </div>
        </div>

        {/* Lista de categorías y gráficos */}
        <div className="p-4">
          {categories.map((category) => {
            const categoryCharts = chartsByCategory[category];
            const isExpanded = expandedCategories.has(category);
            const visibleInCategory = categoryCharts.filter((chart) =>
              visibleCharts.has(chart.id)
            ).length;

            return (
              <div key={category} className="mb-4">
                {/* Header de categoría */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors mb-2"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    )}
                    <span className="font-semibold text-gray-900">
                      {category}
                    </span>
                  </div>
                  <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded-full">
                    {visibleInCategory}/{categoryCharts.length}
                  </span>
                </button>

                {/* Lista de gráficos */}
                {isExpanded && (
                  <div className="space-y-1 ml-2">
                    {categoryCharts.map((chart) => {
                      const isVisible = visibleCharts.has(chart.id);
                      const isFavorite = favoriteCharts.has(chart.id);

                      return (
                        <div
                          key={chart.id}
                          className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={() => onToggleChart(chart.id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            id={`chart-${chart.id}`}
                          />

                          {/* Título */}
                          <label
                            htmlFor={`chart-${chart.id}`}
                            className="flex-1 text-sm text-gray-700 cursor-pointer truncate"
                            title={chart.title}
                          >
                            {chart.title}
                          </label>

                          {/* Botón favorito */}
                          <button
                            onClick={() => onToggleFavorite(chart.id)}
                            className={`p-1 rounded transition-colors ${
                              isFavorite
                                ? "text-yellow-500 hover:text-yellow-600"
                                : "text-gray-300 hover:text-yellow-400"
                            }`}
                            title={
                              isFavorite
                                ? "Quitar de favoritos"
                                : "Agregar a favoritos"
                            }
                          >
                            <Star
                              className={`w-4 h-4 ${
                                isFavorite ? "fill-yellow-500" : ""
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer con info */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4">
          <div className="text-xs text-gray-600 space-y-1">
            <p>
              💡 <strong>Tip:</strong> Marca como favoritos tus gráficos más
              importantes
            </p>
            <p>💾 Tu configuración se guarda automáticamente por usuario</p>
          </div>
        </div>
      </div>

      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
