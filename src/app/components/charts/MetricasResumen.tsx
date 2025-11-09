import React from "react";
import { Clock, TrendingUp, Users, CheckCircle } from "lucide-react";

interface MetricasResumenProps {
  totalDenuncias: number;
  denunciasAsignadas: number;
  denunciasSinAsignar: number;
  tiempoPromedioAsignacion: number;
}

export default function MetricasResumen({
  totalDenuncias,
  denunciasAsignadas,
  denunciasSinAsignar,
  tiempoPromedioAsignacion,
}: MetricasResumenProps) {
  const porcentajeAsignadas =
    totalDenuncias > 0
      ? Math.round((denunciasAsignadas / totalDenuncias) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total de Denuncias */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-90 mb-1">
              Total Denuncias
            </p>
            <p className="text-3xl font-bold">{totalDenuncias}</p>
          </div>
          <div className="p-3 bg-white/20 rounded-full">
            <TrendingUp className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Denuncias Asignadas */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-90 mb-1">Asignadas</p>
            <p className="text-3xl font-bold">{denunciasAsignadas}</p>
            <p className="text-xs opacity-90 mt-1">
              {porcentajeAsignadas}% del total
            </p>
          </div>
          <div className="p-3 bg-white/20 rounded-full">
            <CheckCircle className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Denuncias Sin Asignar */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-90 mb-1">Sin Asignar</p>
            <p className="text-3xl font-bold">{denunciasSinAsignar}</p>
            <p className="text-xs opacity-90 mt-1">
              {totalDenuncias > 0
                ? Math.round((denunciasSinAsignar / totalDenuncias) * 100)
                : 0}
              % del total
            </p>
          </div>
          <div className="p-3 bg-white/20 rounded-full">
            <Users className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Tiempo Promedio de Asignación */}
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-90 mb-1">
              Tiempo Prom. Asignación
            </p>
            <p className="text-3xl font-bold">
              {tiempoPromedioAsignacion < 1
                ? `${Math.round(tiempoPromedioAsignacion * 60)}m`
                : `${tiempoPromedioAsignacion.toFixed(1)}h`}
            </p>
            <p className="text-xs opacity-90 mt-1">Horas desde creación</p>
          </div>
          <div className="p-3 bg-white/20 rounded-full">
            <Clock className="w-8 h-8" />
          </div>
        </div>
      </div>
    </div>
  );
}
