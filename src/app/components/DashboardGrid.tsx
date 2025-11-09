"use client";

import { ReactNode } from "react";
import { Star } from "lucide-react";

export interface ChartItem {
  id: string;
  title: string;
  category: string;
  component: ReactNode;
  size?: "small" | "medium" | "large" | "full";
}

interface DashboardGridProps {
  charts: ChartItem[];
  visibleCharts: Set<string>;
  favoriteCharts: Set<string>;
}

export default function DashboardGrid({
  charts,
  visibleCharts,
  favoriteCharts,
}: DashboardGridProps) {
  // Filtrar solo gráficos visibles
  const visibleChartItems = charts.filter((chart) =>
    visibleCharts.has(chart.id)
  );

  if (visibleChartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            No hay gráficos visibles
          </h3>
          <p className="text-gray-600 mb-6">
            Usa el panel de filtros en la izquierda para seleccionar los
            gráficos que deseas visualizar.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            💡 <strong>Tip:</strong> Haz clic en &quot;Mostrar Todos&quot; en el
            sidebar para ver todos los gráficos disponibles.
          </div>
        </div>
      </div>
    );
  }

  // Función para determinar las clases de tamaño del gráfico
  const getSizeClasses = (size?: string) => {
    switch (size) {
      case "small":
        return "col-span-12 md:col-span-6 lg:col-span-4";
      case "medium":
        return "col-span-12 md:col-span-6";
      case "large":
        return "col-span-12 lg:col-span-8";
      case "full":
        return "col-span-12";
      default:
        return "col-span-12 md:col-span-6"; // Por defecto medium
    }
  };

  // Agrupar por categoría para mostrar con headers
  const categories = Array.from(
    new Set(visibleChartItems.map((chart) => chart.category))
  ).sort();

  return (
    <div className="space-y-8">
      {categories.map((category) => {
        const categoryCharts = visibleChartItems.filter(
          (chart) => chart.category === category
        );

        if (categoryCharts.length === 0) return null;

        return (
          <div key={category}>
            {/* Header de categoría */}
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1 h-8 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></span>
                {category}
              </h2>
              <p className="text-sm text-gray-600 mt-1 ml-4">
                {categoryCharts.length} gráfico
                {categoryCharts.length !== 1 ? "s" : ""} en esta categoría
              </p>
            </div>

            {/* Grid de gráficos */}
            <div className="grid grid-cols-12 gap-6">
              {categoryCharts.map((chart) => {
                const isFavorite = favoriteCharts.has(chart.id);

                return (
                  <div key={chart.id} className={getSizeClasses(chart.size)}>
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden h-full flex flex-col">
                      {/* Header del gráfico */}
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                          {isFavorite && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          )}
                          {chart.title}
                        </h3>
                      </div>

                      {/* Contenido del gráfico */}
                      <div className="p-4 flex-1 overflow-auto">
                        {chart.component}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Footer informativo */}
      {visibleChartItems.length > 0 && (
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-semibold text-blue-900 mb-1 flex items-center gap-2">
                📊 Gráficos Visibles
              </p>
              <p className="text-blue-700">
                Mostrando {visibleChartItems.length} de {charts.length} gráficos
                disponibles
              </p>
            </div>
            <div>
              <p className="font-semibold text-purple-900 mb-1 flex items-center gap-2">
                ⭐ Favoritos
              </p>
              <p className="text-purple-700">
                {favoriteCharts.size} gráfico
                {favoriteCharts.size !== 1 ? "s" : ""} marcado
                {favoriteCharts.size !== 1 ? "s" : ""} como favorito
                {favoriteCharts.size !== 1 ? "s" : ""}
              </p>
            </div>
            <div>
              <p className="font-semibold text-green-900 mb-1 flex items-center gap-2">
                💾 Configuración
              </p>
              <p className="text-green-700">
                Tus preferencias se guardan automáticamente
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
