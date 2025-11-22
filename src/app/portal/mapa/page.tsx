"use client";

import MapaDenuncias from "@/app/components/MapaDenuncias";
import PageAccessValidator from "@/app/components/PageAccessValidator";
import { MapPin } from "lucide-react";
import React, { useState } from "react";
import DateRangePicker, { DateRange } from "@/app/components/DateRangePicker";
import CheckComponente from "@/app/components/CheckComponente";

export default function MapaPage() {
  // Estado global para filtro de estados
  const [selectedEstados, setSelectedEstados] = useState<string[]>([
    "Pendiente",
  ]);
  const [estadosDisponibles, setEstadosDisponibles] = useState<string[]>([]);
  const [conteosPrioridad, setConteosPrioridad] = useState({
    Urgencia: 0,
    Alta: 0,
    Media: 0,
    Baja: 0,
  });
  const [dateRange, setDateRange] = useState<DateRange>({});

  // Callback para recibir estados únicos y conteos desde el mapa
  const handleEstadosYConteos = (
    estados: string[],
    conteos: { Urgencia: number; Alta: number; Media: number; Baja: number }
  ) => {
    setEstadosDisponibles(estados);
    setConteosPrioridad(conteos);
  };

  return (
    <PageAccessValidator pagePath="/portal/mapa">
      <div className="w-full h-screen flex flex-col bg-gray-50 overflow-hidden">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
          <div className="px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Mapa de Denuncias
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Visualiza la ubicación geográfica de las denuncias en San
                  Bernardo
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 flex-shrink-0">
          <div className="px-6 py-4 flex items-center justify-between flex-wrap gap-4">
            {/* Filtros a la izquierda */}
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-700">
                  Filtrar por estado:
                </span>
                {estadosDisponibles.map((estado) => (
                  <CheckComponente
                    key={estado}
                    checked={selectedEstados.includes(estado)}
                    onChange={(checked) => {
                      if (checked) {
                        setSelectedEstados((prev) => [...prev, estado]);
                      } else {
                        setSelectedEstados((prev) =>
                          prev.filter((est) => est !== estado)
                        );
                      }
                    }}
                    label={estado}
                    size="sm"
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <DateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  size="sm"
                  placeholderStart="Fecha inicio"
                  placeholderEnd="Fecha fin"
                />
              </div>
            </div>
            {/* Prioridades a la derecha */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">
                  Urgencia
                </span>
                <span className="text-sm text-gray-500">
                  ({conteosPrioridad.Urgencia})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Alta</span>
                <span className="text-sm text-gray-500">
                  ({conteosPrioridad.Alta})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Media</span>
                <span className="text-sm text-gray-500">
                  ({conteosPrioridad.Media})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Baja</span>
                <span className="text-sm text-gray-500">
                  ({conteosPrioridad.Baja})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Map Container - Usa flex-1 para ocupar todo el espacio restante */}
        <div className="relative flex-1 overflow-hidden">
          <MapaDenuncias
            height="100%"
            selectedEstados={selectedEstados}
            onEstadosYConteos={handleEstadosYConteos}
            dateRange={dateRange}
          />
        </div>
      </div>
    </PageAccessValidator>
  );
}
