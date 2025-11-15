"use client";

import { useState } from "react";
import { ArrowUpDown } from "lucide-react";

interface WordData {
  palabra: string;
  frecuencia: number;
}

interface WordCloudChartProps {
  data: WordData[];
}

export default function WordCloudChart({ data }: WordCloudChartProps) {
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sortBy, setSortBy] = useState<"palabra" | "frecuencia">("frecuencia");

  // Ordenar datos
  const sortedData = [...data].sort((a, b) => {
    if (sortBy === "palabra") {
      return sortOrder === "asc"
        ? a.palabra.localeCompare(b.palabra)
        : b.palabra.localeCompare(a.palabra);
    } else {
      return sortOrder === "asc"
        ? a.frecuencia - b.frecuencia
        : b.frecuencia - a.frecuencia;
    }
  });

  // Calcular total de menciones
  const totalMenciones = data.reduce((sum, item) => sum + item.frecuencia, 0);

  // Obtener frecuencia máxima para la barra de progreso
  const maxFrecuencia = Math.max(...data.map((d) => d.frecuencia));

  const handleSort = (column: "palabra" | "frecuencia") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-16">
                #
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-blue-800 transition-colors"
                onClick={() => handleSort("palabra")}
              >
                <div className="flex items-center gap-2">
                  Palabra
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-blue-800 transition-colors"
                onClick={() => handleSort("frecuencia")}
              >
                <div className="flex items-center gap-2">
                  Frecuencia
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                % del Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Visualización
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((item, index) => {
              const percentage = (
                (item.frecuencia / totalMenciones) *
                100
              ).toFixed(1);
              const barWidth = (item.frecuencia / maxFrecuencia) * 100;

              return (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {item.palabra}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-semibold">
                      {item.frecuencia.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{percentage}%</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-6 rounded-full flex items-center justify-end px-2 transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      >
                        {barWidth > 15 && (
                          <span className="text-xs text-white font-medium">
                            {item.frecuencia}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td
                colSpan={2}
                className="px-6 py-4 text-sm font-semibold text-gray-900"
              >
                Total
              </td>
              <td className="px-6 py-4 text-sm font-bold text-blue-600">
                {totalMenciones.toLocaleString()}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">100%</td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-500">
                  {sortedData.length} palabras únicas
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
