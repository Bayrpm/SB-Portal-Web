"use client";

import MapaDenuncias from "@/app/components/MapaDenuncias";
import { MapPin, Filter, Download, Info } from "lucide-react";

export default function MapaPage() {
  return (
    <div className="w-full min-h-screen flex flex-col bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
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

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4" />
                Filtros
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
        <div className="px-6 py-4">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">
                Alta Prioridad
              </span>
              <span className="text-sm text-gray-500">(0)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">
                Media Prioridad
              </span>
              <span className="text-sm text-gray-500">(0)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">
                Baja Prioridad
              </span>
              <span className="text-sm text-gray-500">(0)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative" style={{ height: "calc(100vh - 260px)" }}>
        <MapaDenuncias height="100%" />

        {/* Info Card */}
        <div className="absolute bottom-6 left-6 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-xs z-[1000]">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">
                Información del Mapa
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Haz clic en los marcadores para ver detalles de cada denuncia.
                Usa los controles para navegar y hacer zoom.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
