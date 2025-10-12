"use client";

import Loader from "@/app/components/Loader";
import { useEffect, useMemo, useState } from "react";
import { BarChart, LineChart } from "./components/DashboardCharts";
import { DashboardKPI } from "./components/DashboardKPI";
import { PieChart } from "./components/PieChart";
import { DashboardData, MesMetric } from "./types/types";

const PALETA = {
  primaria: "#003C96", // Registradas (azul fuerte)
  secundaria: "#00B894", // Asignadas (verde)
  acento: "#E17055", // Cerradas (rojo/anaranjado)
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/datos_san_bernardo.json")
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const meses: MesMetric[] = useMemo(() => {
    if (data?.metrics_anuales?.meses?.length) return data.metrics_anuales.meses;
    return [
      {
        mes: "Enero",
        denuncias_registradas: 80,
        denuncias_asignadas: 60,
        denuncias_cerradas: 40,
        tiempo_promedio_cierre_dias: 8,
      },
      {
        mes: "Febrero",
        denuncias_registradas: 90,
        denuncias_asignadas: 70,
        denuncias_cerradas: 50,
        tiempo_promedio_cierre_dias: 7,
      },
      {
        mes: "Marzo",
        denuncias_registradas: 100,
        denuncias_asignadas: 80,
        denuncias_cerradas: 60,
        tiempo_promedio_cierre_dias: 7.5,
      },
      {
        mes: "Abril",
        denuncias_registradas: 110,
        denuncias_asignadas: 90,
        denuncias_cerradas: 70,
        tiempo_promedio_cierre_dias: 7,
      },
      {
        mes: "Mayo",
        denuncias_registradas: 120,
        denuncias_asignadas: 100,
        denuncias_cerradas: 80,
        tiempo_promedio_cierre_dias: 6.5,
      },
      {
        mes: "Junio",
        denuncias_registradas: 130,
        denuncias_asignadas: 110,
        denuncias_cerradas: 90,
        tiempo_promedio_cierre_dias: 6,
      },
      {
        mes: "Julio",
        denuncias_registradas: 140,
        denuncias_asignadas: 120,
        denuncias_cerradas: 100,
        tiempo_promedio_cierre_dias: 6.2,
      },
      {
        mes: "Agosto",
        denuncias_registradas: 135,
        denuncias_asignadas: 115,
        denuncias_cerradas: 95,
        tiempo_promedio_cierre_dias: 6.8,
      },
      {
        mes: "Septiembre",
        denuncias_registradas: 125,
        denuncias_asignadas: 105,
        denuncias_cerradas: 85,
        tiempo_promedio_cierre_dias: 7,
      },
      {
        mes: "Octubre",
        denuncias_registradas: 140,
        denuncias_asignadas: 120,
        denuncias_cerradas: 100,
        tiempo_promedio_cierre_dias: 7.1,
      },
      {
        mes: "Noviembre",
        denuncias_registradas: 150,
        denuncias_asignadas: 130,
        denuncias_cerradas: 110,
        tiempo_promedio_cierre_dias: 7.3,
      },
      {
        mes: "Diciembre",
        denuncias_registradas: 160,
        denuncias_asignadas: 140,
        denuncias_cerradas: 120,
        tiempo_promedio_cierre_dias: 7.5,
      },
    ];
  }, [data]);

  const anio = data?.metrics_anuales?.anio ?? new Date().getFullYear();

  if (loading) {
    return <Loader text="Cargando dashboard..." />;
  }

  return (
    <div className="max-w-7xl mx-auto py-8">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Año {anio} - Vista general del sistema
          </p>
        </div>
      </div>

      {/* KPI */}
      <DashboardKPI meses={meses} anio={anio} paleta={PALETA} />

      {/* Gráficos lado a lado */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="flex-1">
          <BarChart meses={meses} paleta={PALETA} />
        </div>
        <div className="flex-1">
          <PieChart meses={meses} paleta={PALETA} />
        </div>
      </div>

      {/* Línea (tendencia) */}
      <LineChart meses={meses} paleta={PALETA} />
    </div>
  );
}
