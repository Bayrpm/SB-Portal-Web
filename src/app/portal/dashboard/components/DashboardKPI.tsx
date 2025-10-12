"use client";

import { MesMetric } from "../types/types";

type KPIProps = {
  meses: MesMetric[];
  anio: number;
  paleta: {
    primaria: string;
    secundaria: string;
    acento: string;
  };
};

export const DashboardKPI = ({ meses, anio, paleta }: KPIProps) => {
  // Cálculos de KPI
  const totalRegistradas = meses.reduce(
    (a, m) => a + m.denuncias_registradas,
    0
  );
  const totalAsignadas = meses.reduce((a, m) => a + m.denuncias_asignadas, 0);
  const totalCerradas = meses.reduce((a, m) => a + m.denuncias_cerradas, 0);
  const tiempoPromedio = (
    meses.reduce((a, m) => a + m.tiempo_promedio_cierre_dias, 0) / meses.length
  ).toFixed(1);

  return (
    <div className="grid grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="text-xs text-gray-500 mb-1">Total Registradas</div>
        <div className="text-3xl font-bold" style={{ color: paleta.primaria }}>
          {totalRegistradas}
        </div>
        <div className="text-xs text-gray-400">Año {anio}</div>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="text-xs text-gray-500 mb-1">Total Asignadas</div>
        <div
          className="text-3xl font-bold"
          style={{ color: paleta.secundaria }}
        >
          {totalAsignadas}
        </div>
        <div className="text-xs text-gray-400">
          {((totalAsignadas / totalRegistradas) * 100).toFixed(1)}% del total
        </div>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="text-xs text-gray-500 mb-1">Total Cerradas</div>
        <div className="text-3xl font-bold text-green-600">{totalCerradas}</div>
        <div className="text-xs text-gray-400">
          {((totalCerradas / totalRegistradas) * 100).toFixed(1)}% de resolución
        </div>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="text-xs text-gray-500 mb-1">Tiempo Promedio</div>
        <div className="text-3xl font-bold" style={{ color: paleta.primaria }}>
          {tiempoPromedio}
        </div>
        <div className="text-xs text-gray-400">días hasta el cierre</div>
      </div>
    </div>
  );
};
