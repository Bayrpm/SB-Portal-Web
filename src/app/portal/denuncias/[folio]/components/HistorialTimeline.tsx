"use client";

import React from "react";

interface HistorialItem {
  id: string;
  evento: string;
  descripcion: string;
  detallesLeibles: Record<string, unknown>;
  detalle: Record<string, unknown> | null;
  fecha: string;
  autor: string;
  icono: string;
  tipo: string;
}

interface HistorialTimelineProps {
  historial: HistorialItem[];
  loading: boolean;
}

export default function HistorialTimeline({
  historial,
  loading,
}: HistorialTimelineProps) {
  const tipoColores: Record<
    string,
    { bg: string; border: string; icon: string }
  > = {
    creacion: {
      bg: "bg-green-50",
      border: "border-green-300",
      icon: "🟢",
    },
    actualizacion: {
      bg: "bg-blue-50",
      border: "border-blue-300",
      icon: "🔵",
    },
    estado: {
      bg: "bg-purple-50",
      border: "border-purple-300",
      icon: "🟣",
    },
    asignacion: {
      bg: "bg-orange-50",
      border: "border-orange-300",
      icon: "🟠",
    },
    observacion: {
      bg: "bg-pink-50",
      border: "border-pink-300",
      icon: "🔴",
    },
    prioridad: {
      bg: "bg-yellow-50",
      border: "border-yellow-300",
      icon: "🟡",
    },
    evidencia: {
      bg: "bg-indigo-50",
      border: "border-indigo-300",
      icon: "🟦",
    },
    comentario: {
      bg: "bg-cyan-50",
      border: "border-cyan-300",
      icon: "🟦",
    },
    otro: {
      bg: "bg-gray-50",
      border: "border-gray-300",
      icon: "⚫",
    },
  };

  if (loading) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>Cargando historial...</p>
      </div>
    );
  }

  if (historial.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>No hay historial para esta denuncia</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Línea central para timeline */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 to-blue-100"></div>

      {/* Items del historial */}
      <div className="space-y-4">
        {[...historial].reverse().map((item) => {
          const colorConfig = tipoColores[item.tipo] || tipoColores.otro;

          return (
            <div key={item.id} className="relative pl-16 pr-4">
              {/* Punto en la timeline */}
              <div className="absolute left-0 top-0 w-14 h-full flex items-start justify-center pt-1">
                <div className="relative flex items-center justify-center">
                  {/* Círculo grande */}
                  <div
                    className={`w-6 h-6 rounded-full ${colorConfig.bg} border-2 ${colorConfig.border} flex items-center justify-center text-xs font-bold`}
                  >
                    {item.icono}
                  </div>
                </div>
              </div>

              {/* Contenido del item */}
              <div
                className={`border-l-4 ${colorConfig.border} ${colorConfig.bg} rounded-lg p-3 hover:shadow-md transition-shadow`}
              >
                {/* Encabezado: Descripción y Fecha */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-xs leading-snug">
                      {item.descripcion}
                    </h4>
                  </div>
                  <p className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                    {new Date(item.fecha).toLocaleString("es-CL", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Autor */}
                <div className="text-xs text-gray-600 mt-2">
                  <span className="text-gray-700 font-medium">Autor: </span>
                  <span className="inline-block bg-white px-2 py-0.5 rounded border border-gray-200 ml-1">
                    {item.autor}
                  </span>
                </div>

                {/* Detalles adicionales formateados legiblemente */}
                {Object.keys(item.detallesLeibles).length > 0 && (
                  <div className="mt-2 text-xs text-gray-600 space-y-1 bg-white p-2 rounded border border-gray-100">
                    {Object.entries(item.detallesLeibles).map(
                      ([key, value]) => (
                        <div key={key} className="flex justify-between gap-2">
                          <span className="font-medium text-gray-700 flex-shrink-0">
                            {key}:
                          </span>
                          <span className="text-gray-600 text-right break-words text-xs">
                            {typeof value === "string" ||
                            typeof value === "number"
                              ? value
                              : typeof value === "boolean"
                              ? value
                                ? "Sí"
                                : "No"
                              : JSON.stringify(value)}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
