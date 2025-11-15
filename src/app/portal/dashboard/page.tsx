"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import Loader from "@/app/components/Loader";
import KPICard from "@/app/components/dashboard/KPICard";
import FilterBar from "@/app/components/dashboard/FilterBar";
import ChartContainer from "@/app/components/dashboard/ChartContainer";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  MapPin,
  Activity,
  Target,
  Layers,
} from "lucide-react";

// Importar todos los componentes de gráficos
import TendenciaTemporalChart from "@/app/components/charts/TendenciaTemporalChart";
import CategoriaChart from "@/app/components/charts/CategoriaChart";
import EstadoDistribucionChart from "@/app/components/charts/EstadoDistribucionChart";
import PrioridadChart from "@/app/components/charts/PrioridadChart";
import CategoriaPrioridadChart from "@/app/components/charts/CategoriaPrioridadChart";
import CrecimientoMensualChart from "@/app/components/charts/CrecimientoMensualChart";
import HeatMapDiaHoraChart from "@/app/components/charts/HeatMapDiaHoraChart";
import CargaInspectorChart from "@/app/components/charts/CargaInspectorChart";
import EficienciaInspectorChart from "@/app/components/charts/EficienciaInspectorChart";
import InspectoresActivosChart from "@/app/components/charts/InspectoresActivosChart";
import DistribucionTurnoChart from "@/app/components/charts/DistribucionTurnoChart";
import SLAGaugeChart from "@/app/components/charts/SLAGaugeChart";
import TiempoPorEstadoChart from "@/app/components/charts/TiempoPorEstadoChart";
import EmbudoConversionChart from "@/app/components/charts/EmbudoConversionChart";
import TendenciaTiempoRespuestaChart from "@/app/components/charts/TendenciaTiempoRespuestaChart";
import TopUbicacionesChart from "@/app/components/charts/TopUbicacionesChart";
import CategoriasAsignadasChart from "@/app/components/charts/CategoriasAsignadasChart";
import EstadosEvolucionChart from "@/app/components/charts/EstadosEvolucionChart";
import TasaResolucionChart from "@/app/components/charts/TasaResolucionChart";
import ComparativaAnualChart from "@/app/components/charts/ComparativaAnualChart";
import ProyeccionDenunciasChart from "@/app/components/charts/ProyeccionDenunciasChart";
import WordCloudChart from "@/app/components/charts/WordCloudChart";
import SaludSistemaGauge from "@/app/components/charts/SaludSistemaGauge";

// Tipos de tabs
type TabType =
  | "resumen"
  | "categorias"
  | "inspectores"
  | "ubicaciones"
  | "tendencias";

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ElementType;
}

// Interfaces para los datos
interface DashboardData {
  resumen: {
    total_denuncias: number;
    denuncias_asignadas: number;
    denuncias_sin_asignar: number;
    tiempo_promedio_asignacion_horas: number;
  };
  denuncias_por_mes: {
    mes: string;
    total: number;
  }[];
  top_categorias: {
    categoria: string;
    total: number;
  }[];
  por_estado: {
    estado: string;
    cantidad: number;
  }[];
  por_prioridad: {
    prioridad: string;
    cantidad: number;
  }[];
  categorias_prioridad: {
    categoria: string;
    baja: number;
    media: number;
    alta: number;
  }[];
  crecimiento_mensual: {
    mes: string;
    tasa: number;
  }[];
  heat_map_dia_hora: {
    dia: number;
    hora: number;
    cantidad: number;
  }[];
  carga_inspectores: {
    inspector: string;
    asignadas: number;
    en_proceso: number;
    resueltas: number;
  }[];
  eficiencia_inspectores: {
    inspector: string;
    total_gestionadas: number;
    tiempo_promedio_horas: number;
  }[];
  inspectores_activos: {
    inspector: string;
    denuncias_gestionadas: number;
  }[];
  distribucion_turno: {
    turno: string;
    cantidad: number;
  }[];
  sla: {
    cumplimiento: number;
    total: number;
    en_tiempo: number;
    fuera_tiempo: number;
  };
  tiempo_promedio_estado: {
    estado: string;
    horas_promedio: number;
  }[];
  embudo_conversion: {
    etapa: string;
    cantidad: number;
  }[];
  tendencia_tiempo_respuesta: {
    fecha: string;
    horas: number;
  }[];
  top_ubicaciones: {
    ubicacion: string;
    cantidad: number;
  }[];
  categorias_asignacion: {
    categoria: string;
    asignadas: number;
    sin_asignar: number;
  }[];
  estados_evolucion: {
    fecha: string;
    pendiente: number;
    en_atencion: number;
    resuelta: number;
    cerrada: number;
  }[];
  tasa_resolucion_categoria: {
    categoria: string;
    total: number;
    resueltas: number;
    tasa: number;
  }[];
  comparativa_anual: {
    mes: string;
    anio_actual: number;
    anio_anterior: number;
  }[];
  proyeccion_denuncias: {
    mes: string;
    total: number;
    asignadas: number;
    sin_asignar: number;
  }[];
  word_cloud: { palabra: string; frecuencia: number }[];
  salud_sistema: {
    score: number;
    sla: number;
    asignacion: number;
    resolucion: number;
  };
}

export default function DashboardPage() {
  const { name } = useUser();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("resumen");
  const [dateRange, setDateRange] = useState("last30days");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showComparison, setShowComparison] = useState(false);

  // Configuración de tabs
  const tabs: TabConfig[] = [
    { id: "resumen", label: "Resumen General", icon: Activity },
    { id: "categorias", label: "Categorías", icon: Layers },
    { id: "inspectores", label: "Inspectores", icon: Users },
    { id: "ubicaciones", label: "Ubicaciones", icon: MapPin },
    { id: "tendencias", label: "Tendencias", icon: TrendingUp },
  ];

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then(setData)
      .catch((error) => {
        console.error("Error al cargar dashboard:", error);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Loader text="Cargando dashboard completo..." />;
  }

  if (!data) {
    return (
      <div className="w-full py-8 px-4">
        <div className="text-center text-red-600">
          Error al cargar los datos del dashboard
        </div>
      </div>
    );
  }

  // Calcular tendencias para KPIs
  const totalTrend =
    data.denuncias_por_mes.length >= 2
      ? ((data.denuncias_por_mes[data.denuncias_por_mes.length - 1].total -
          data.denuncias_por_mes[data.denuncias_por_mes.length - 2].total) /
          data.denuncias_por_mes[data.denuncias_por_mes.length - 2].total) *
        100
      : 0;

  const tasaAsignacion =
    (data.resumen.denuncias_asignadas / data.resumen.total_denuncias) * 100;

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="w-full py-6 px-4 lg:px-8 max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard Analítico
          </h1>
          <p className="text-gray-600">
            Visualización completa de métricas y análisis del sistema
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 bg-white rounded-t-lg">
          <nav className="flex space-x-4 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-3 border-b-2 font-medium text-sm transition-colors
                    ${
                      isActive
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* KPIs - Siempre visibles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <KPICard
            title="Total de Denuncias"
            value={data.resumen.total_denuncias.toLocaleString()}
            icon={BarChart3}
            trend={totalTrend}
            description="Últimos 30 días"
            color="blue"
          />
          <KPICard
            title="Denuncias Asignadas"
            value={data.resumen.denuncias_asignadas.toLocaleString()}
            icon={CheckCircle2}
            trend={tasaAsignacion}
            description={`${tasaAsignacion.toFixed(1)}% del total`}
            color="green"
          />
          <KPICard
            title="Sin Asignar"
            value={data.resumen.denuncias_sin_asignar.toLocaleString()}
            icon={Target}
            description="Requieren atención"
            color="orange"
          />
          <KPICard
            title="Tiempo Promedio"
            value={`${data.resumen.tiempo_promedio_asignacion_horas.toFixed(
              1
            )}h`}
            icon={Clock}
            description="Tiempo de asignación"
            color="purple"
          />
        </div>

        {/* FilterBar */}
        <div className="mb-6">
          <FilterBar
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onCustomStartDateChange={setCustomStartDate}
            onCustomEndDateChange={setCustomEndDate}
            showComparison={showComparison}
            onShowComparisonChange={setShowComparison}
          />
        </div>

        {/* Contenido por Tab */}
        <div className="space-y-6">
          {/* Tab: Resumen General */}
          {activeTab === "resumen" && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartContainer title="Tendencia Temporal (6 meses)">
                  <TendenciaTemporalChart data={data.denuncias_por_mes} />
                </ChartContainer>

                <ChartContainer title="Top 5 Categorías">
                  <CategoriaChart
                    data={data.top_categorias}
                    title="Top 5 Categorías Más Reportadas"
                  />
                </ChartContainer>

                <ChartContainer title="Distribución por Estado">
                  <EstadoDistribucionChart data={data.por_estado} />
                </ChartContainer>

                <ChartContainer title="Patrón Día/Hora">
                  <HeatMapDiaHoraChart data={data.heat_map_dia_hora} />
                </ChartContainer>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ChartContainer title="Salud del Sistema">
                  <SaludSistemaGauge data={data.salud_sistema} />
                </ChartContainer>

                <ChartContainer title="Cumplimiento SLA">
                  <SLAGaugeChart data={data.sla} />
                </ChartContainer>

                <ChartContainer title="Embudo de Conversión">
                  <EmbudoConversionChart data={data.embudo_conversion} />
                </ChartContainer>
              </div>
            </>
          )}

          {/* Tab: Categorías */}
          {activeTab === "categorias" && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartContainer title="Top 5 Categorías">
                  <CategoriaChart
                    data={data.top_categorias}
                    title="Top 5 Categorías Más Reportadas"
                  />
                </ChartContainer>

                <ChartContainer title="Denuncias por Prioridad">
                  <PrioridadChart data={data.por_prioridad} />
                </ChartContainer>

                <ChartContainer title="Categorías vs Prioridad">
                  <CategoriaPrioridadChart data={data.categorias_prioridad} />
                </ChartContainer>

                <ChartContainer title="Tasa de Crecimiento">
                  <CrecimientoMensualChart data={data.crecimiento_mensual} />
                </ChartContainer>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartContainer title="Asignadas vs Sin Asignar">
                  <CategoriasAsignadasChart data={data.categorias_asignacion} />
                </ChartContainer>

                <ChartContainer title="Tasa de Resolución por Categoría">
                  <TasaResolucionChart data={data.tasa_resolucion_categoria} />
                </ChartContainer>
              </div>

              <ChartContainer title="Palabras Más Frecuentes">
                <WordCloudChart data={data.word_cloud} />
              </ChartContainer>
            </>
          )}

          {/* Tab: Inspectores */}
          {activeTab === "inspectores" && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartContainer title="Carga de Trabajo">
                  <CargaInspectorChart data={data.carga_inspectores} />
                </ChartContainer>

                <ChartContainer title="Eficiencia de Inspectores">
                  <EficienciaInspectorChart
                    data={data.eficiencia_inspectores}
                  />
                </ChartContainer>

                <ChartContainer title="Top 10 Más Activos">
                  <InspectoresActivosChart data={data.inspectores_activos} />
                </ChartContainer>

                <ChartContainer title="Distribución por Turno">
                  <DistribucionTurnoChart data={data.distribucion_turno} />
                </ChartContainer>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartContainer title="Tiempo por Estado">
                  <TiempoPorEstadoChart data={data.tiempo_promedio_estado} />
                </ChartContainer>

                <ChartContainer title="Tendencia Tiempo Respuesta">
                  <TendenciaTiempoRespuestaChart
                    data={data.tendencia_tiempo_respuesta}
                  />
                </ChartContainer>
              </div>
            </>
          )}

          {/* Tab: Ubicaciones */}
          {activeTab === "ubicaciones" && (
            <>
              <ChartContainer title="Top 10 Ubicaciones con Más Denuncias">
                <TopUbicacionesChart data={data.top_ubicaciones} />
              </ChartContainer>

              <ChartContainer title="Patrón de Reporte por Día y Hora">
                <HeatMapDiaHoraChart data={data.heat_map_dia_hora} />
              </ChartContainer>
            </>
          )}

          {/* Tab: Tendencias */}
          {activeTab === "tendencias" && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartContainer title="Tendencia Temporal (6 meses)">
                  <TendenciaTemporalChart data={data.denuncias_por_mes} />
                </ChartContainer>

                <ChartContainer title="Comparativa Año Actual vs Anterior">
                  <ComparativaAnualChart data={data.comparativa_anual} />
                </ChartContainer>

                <ChartContainer title="Proyección de Denuncias">
                  <ProyeccionDenunciasChart
                    data={data.proyeccion_denuncias}
                    historicCount={6}
                  />
                </ChartContainer>

                <ChartContainer title="Evolución de Estados">
                  <EstadosEvolucionChart data={data.estados_evolucion} />
                </ChartContainer>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartContainer title="Tasa de Crecimiento Mensual">
                  <CrecimientoMensualChart data={data.crecimiento_mensual} />
                </ChartContainer>

                <ChartContainer title="Tendencia Tiempo Respuesta">
                  <TendenciaTiempoRespuestaChart
                    data={data.tendencia_tiempo_respuesta}
                  />
                </ChartContainer>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
