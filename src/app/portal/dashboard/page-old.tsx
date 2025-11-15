"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import Loader from "@/app/components/Loader";
import KPICard from "@/app/components/dashboard/KPICard";
import FilterBar from "@/app/components/dashboard/FilterBar";
import ChartContainer from "@/app/components/dashboard/ChartContainer";
import {
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  MapPin,
  Calendar as CalendarIcon,
  Activity,
  Target,
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

interface DashboardData {
  resumen: {
    total_denuncias: number;
    denuncias_asignadas: number;
    denuncias_sin_asignar: number;
    tiempo_promedio_asignacion_horas: number;
  };
  por_categoria: Record<string, number>;
  por_prioridad: Record<string, number>;
  por_estado: Record<string, number>;
  denuncias_por_mes: {
    mes: string;
    total: number;
    asignadas: number;
    sin_asignar: number;
  }[];
  top_categorias: { nombre: string; cantidad: number }[];
  categorias_prioridad: Record<string, Record<string, number>>;
  crecimiento_mensual: { mes: string; crecimiento: number }[];
  heat_map_dia_hora: Record<string, Record<number, number>>;
  carga_inspectores: { nombre: string; cantidad: number; turno: string }[];
  eficiencia_inspectores: {
    nombre: string;
    cantidad: number;
    tiempoPromedio: number;
  }[];
  inspectores_activos: {
    nombre: string;
    cantidad: number;
    tiempoPromedio: number;
  }[];
  distribucion_turno: Record<string, number>;
  tiempo_promedio_estado: { estado: string; horas: number }[];
  embudo_conversion: { estado: string; cantidad: number }[];
  sla: {
    cumplidas: number;
    vencidas: number;
    porcentaje_cumplimiento: number;
  };
  tendencia_tiempo_respuesta: { mes: string; horas: number }[];
  top_ubicaciones: { ubicacion: string; cantidad: number }[];
  categorias_asignacion: Record<
    string,
    { asignadas: number; sin_asignar: number }
  >;
  estados_evolucion: { mes: string; estados: Record<string, number> }[];
  tasa_resolucion_categoria: {
    categoria: string;
    total: number;
    resueltas: number;
    tasa: number;
  }[];
  comparativa_anual: { mes: string; actual: number; anterior: number }[];
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
  const [visibleCharts, setVisibleCharts] = useState<Set<string>>(new Set());
  const [favoriteCharts, setFavoriteCharts] = useState<Set<string>>(new Set());

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

  // Cargar configuración guardada
  useEffect(() => {
    if (!name) return;

    const savedVisible = localStorage.getItem(`dashboard-visible-${name}`);
    const savedFavorites = localStorage.getItem(`dashboard-favorites-${name}`);

    if (savedVisible) {
      try {
        setVisibleCharts(new Set(JSON.parse(savedVisible)));
      } catch (error) {
        console.error("Error al cargar gráficos visibles:", error);
        // Por defecto, mostrar todos
        const allChartIds = chartConfigs.map((c) => c.id);
        setVisibleCharts(new Set(allChartIds));
      }
    } else {
      // Por defecto, mostrar todos
      const allChartIds = [
        "metricas-resumen",
        "salud-sistema",
        "tendencia-temporal",
        "top-categorias",
        "estado-distribucion",
        "prioridad-dona",
        "categoria-prioridad",
        "crecimiento-mensual",
        "heatmap-dia-hora",
        "carga-inspector",
        "eficiencia-inspector",
        "inspectores-activos",
        "distribucion-turno",
        "sla-gauge",
        "tiempo-estado",
        "embudo-conversion",
        "tendencia-respuesta",
        "top-ubicaciones",
        "categorias-asignadas",
        "estados-evolucion",
        "tasa-resolucion",
        "comparativa-anual",
        "proyeccion",
        "word-cloud",
      ];
      setVisibleCharts(new Set(allChartIds));
    }

    if (savedFavorites) {
      try {
        setFavoriteCharts(new Set(JSON.parse(savedFavorites)));
      } catch (error) {
        console.error("Error al cargar favoritos:", error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

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

  // Configuración de todos los gráficos
  const chartConfigs: ChartConfig[] = [
    {
      id: "metricas-resumen",
      title: "Métricas Generales",
      category: "Resumen",
    },
    { id: "salud-sistema", title: "Salud del Sistema", category: "Resumen" },
    {
      id: "tendencia-temporal",
      title: "Tendencia Temporal (6 meses)",
      category: "Resumen",
    },
    { id: "top-categorias", title: "Top 5 Categorías", category: "Denuncias" },
    {
      id: "estado-distribucion",
      title: "Distribución por Estado",
      category: "Denuncias",
    },
    {
      id: "prioridad-dona",
      title: "Denuncias por Prioridad",
      category: "Denuncias",
    },
    {
      id: "categoria-prioridad",
      title: "Categorías vs Prioridad",
      category: "Denuncias",
    },
    {
      id: "crecimiento-mensual",
      title: "Tasa de Crecimiento",
      category: "Denuncias",
    },
    { id: "heatmap-dia-hora", title: "Patrón Día/Hora", category: "Denuncias" },
    {
      id: "carga-inspector",
      title: "Carga de Trabajo",
      category: "Inspectores",
    },
    {
      id: "eficiencia-inspector",
      title: "Eficiencia de Inspectores",
      category: "Inspectores",
    },
    {
      id: "inspectores-activos",
      title: "Top 10 Más Activos",
      category: "Inspectores",
    },
    {
      id: "distribucion-turno",
      title: "Distribución por Turno",
      category: "Inspectores",
    },
    { id: "sla-gauge", title: "Cumplimiento SLA", category: "SLA" },
    { id: "tiempo-estado", title: "Tiempo por Estado", category: "SLA" },
    { id: "embudo-conversion", title: "Embudo de Conversión", category: "SLA" },
    {
      id: "tendencia-respuesta",
      title: "Tendencia Tiempo Respuesta",
      category: "SLA",
    },
    {
      id: "top-ubicaciones",
      title: "Top 10 Ubicaciones",
      category: "Geográfico",
    },
    {
      id: "categorias-asignadas",
      title: "Asignadas vs Sin Asignar",
      category: "Comparativo",
    },
    {
      id: "estados-evolucion",
      title: "Evolución de Estados",
      category: "Comparativo",
    },
    {
      id: "tasa-resolucion",
      title: "Tasa de Resolución",
      category: "Comparativo",
    },
    {
      id: "comparativa-anual",
      title: "Comparativa Año Actual vs Anterior",
      category: "Temporal",
    },
    {
      id: "proyeccion",
      title: "Proyección de Denuncias",
      category: "Temporal",
    },
    {
      id: "word-cloud",
      title: "Palabras Más Frecuentes",
      category: "Especial",
    },
  ];

  const chartItems: ChartItem[] = [
    {
      id: "metricas-resumen",
      title: "Métricas Generales",
      category: "Resumen",
      size: "full",
      component: (
        <MetricasResumen
          totalDenuncias={data.resumen.total_denuncias}
          denunciasAsignadas={data.resumen.denuncias_asignadas}
          denunciasSinAsignar={data.resumen.denuncias_sin_asignar}
          tiempoPromedioAsignacion={
            data.resumen.tiempo_promedio_asignacion_horas
          }
        />
      ),
    },
    {
      id: "salud-sistema",
      title: "Salud del Sistema",
      category: "Resumen",
      size: "medium",
      component: <SaludSistemaGauge data={data.salud_sistema} />,
    },
    {
      id: "tendencia-temporal",
      title: "Tendencia Temporal (6 meses)",
      category: "Resumen",
      size: "medium",
      component: <TendenciaTemporalChart data={data.denuncias_por_mes} />,
    },
    {
      id: "top-categorias",
      title: "Top 5 Categorías",
      category: "Denuncias",
      size: "medium",
      component: (
        <CategoriaChart
          data={data.top_categorias}
          title="Top 5 Categorías Más Reportadas"
        />
      ),
    },
    {
      id: "estado-distribucion",
      title: "Distribución por Estado",
      category: "Denuncias",
      size: "medium",
      component: <EstadoDistribucionChart data={data.por_estado} />,
    },
    {
      id: "prioridad-dona",
      title: "Denuncias por Prioridad",
      category: "Denuncias",
      size: "medium",
      component: <PrioridadChart data={data.por_prioridad} />,
    },
    {
      id: "categoria-prioridad",
      title: "Categorías vs Prioridad",
      category: "Denuncias",
      size: "medium",
      component: <CategoriaPrioridadChart data={data.categorias_prioridad} />,
    },
    {
      id: "crecimiento-mensual",
      title: "Tasa de Crecimiento",
      category: "Denuncias",
      size: "medium",
      component: <CrecimientoMensualChart data={data.crecimiento_mensual} />,
    },
    {
      id: "heatmap-dia-hora",
      title: "Patrón Día/Hora",
      category: "Denuncias",
      size: "medium",
      component: <HeatMapDiaHoraChart data={data.heat_map_dia_hora} />,
    },
    {
      id: "carga-inspector",
      title: "Carga de Trabajo",
      category: "Inspectores",
      size: "medium",
      component: <CargaInspectorChart data={data.carga_inspectores} />,
    },
    {
      id: "eficiencia-inspector",
      title: "Eficiencia de Inspectores",
      category: "Inspectores",
      size: "medium",
      component: (
        <EficienciaInspectorChart data={data.eficiencia_inspectores} />
      ),
    },
    {
      id: "inspectores-activos",
      title: "Top 10 Más Activos",
      category: "Inspectores",
      size: "medium",
      component: <InspectoresActivosChart data={data.inspectores_activos} />,
    },
    {
      id: "distribucion-turno",
      title: "Distribución por Turno",
      category: "Inspectores",
      size: "medium",
      component: <DistribucionTurnoChart data={data.distribucion_turno} />,
    },
    {
      id: "sla-gauge",
      title: "Cumplimiento SLA",
      category: "SLA",
      size: "medium",
      component: <SLAGaugeChart data={data.sla} />,
    },
    {
      id: "tiempo-estado",
      title: "Tiempo por Estado",
      category: "SLA",
      size: "medium",
      component: <TiempoPorEstadoChart data={data.tiempo_promedio_estado} />,
    },
    {
      id: "embudo-conversion",
      title: "Embudo de Conversión",
      category: "SLA",
      size: "medium",
      component: <EmbudoConversionChart data={data.embudo_conversion} />,
    },
    {
      id: "tendencia-respuesta",
      title: "Tendencia Tiempo Respuesta",
      category: "SLA",
      size: "medium",
      component: (
        <TendenciaTiempoRespuestaChart data={data.tendencia_tiempo_respuesta} />
      ),
    },
    {
      id: "top-ubicaciones",
      title: "Top 10 Ubicaciones",
      category: "Geográfico",
      size: "full",
      component: <TopUbicacionesChart data={data.top_ubicaciones} />,
    },
    {
      id: "categorias-asignadas",
      title: "Asignadas vs Sin Asignar",
      category: "Comparativo",
      size: "medium",
      component: <CategoriasAsignadasChart data={data.categorias_asignacion} />,
    },
    {
      id: "estados-evolucion",
      title: "Evolución de Estados",
      category: "Comparativo",
      size: "medium",
      component: <EstadosEvolucionChart data={data.estados_evolucion} />,
    },
    {
      id: "tasa-resolucion",
      title: "Tasa de Resolución",
      category: "Comparativo",
      size: "full",
      component: <TasaResolucionChart data={data.tasa_resolucion_categoria} />,
    },
    {
      id: "comparativa-anual",
      title: "Comparativa Año Actual vs Anterior",
      category: "Temporal",
      size: "medium",
      component: <ComparativaAnualChart data={data.comparativa_anual} />,
    },
    {
      id: "proyeccion",
      title: "Proyección de Denuncias",
      category: "Temporal",
      size: "medium",
      component: (
        <ProyeccionDenunciasChart
          data={data.proyeccion_denuncias}
          historicCount={6}
        />
      ),
    },
    {
      id: "word-cloud",
      title: "Palabras Más Frecuentes",
      category: "Especial",
      size: "full",
      component: <WordCloudChart data={data.word_cloud} />,
    },
  ];

  const handleToggleChart = (chartId: string) => {
    const newVisible = new Set(visibleCharts);
    if (newVisible.has(chartId)) {
      newVisible.delete(chartId);
    } else {
      newVisible.add(chartId);
    }
    setVisibleCharts(newVisible);
    if (name) {
      localStorage.setItem(
        `dashboard-visible-${name}`,
        JSON.stringify(Array.from(newVisible))
      );
    }
  };

  const handleToggleFavorite = (chartId: string) => {
    const newFavorites = new Set(favoriteCharts);
    if (newFavorites.has(chartId)) {
      newFavorites.delete(chartId);
    } else {
      newFavorites.add(chartId);
    }
    setFavoriteCharts(newFavorites);
    if (name) {
      localStorage.setItem(
        `dashboard-favorites-${name}`,
        JSON.stringify(Array.from(newFavorites))
      );
    }
  };

  const handleResetFilters = () => {
    const allChartIds = chartConfigs.map((c) => c.id);
    setVisibleCharts(new Set(allChartIds));
    setFavoriteCharts(new Set());
    if (name) {
      localStorage.removeItem(`dashboard-visible-${name}`);
      localStorage.removeItem(`dashboard-favorites-${name}`);
    }
  };

  const handleShowAll = () => {
    const allChartIds = chartConfigs.map((c) => c.id);
    setVisibleCharts(new Set(allChartIds));
    if (name) {
      localStorage.setItem(
        `dashboard-visible-${name}`,
        JSON.stringify(allChartIds)
      );
    }
  };

  const handleHideAll = () => {
    setVisibleCharts(new Set());
    if (name) {
      localStorage.setItem(`dashboard-visible-${name}`, JSON.stringify([]));
    }
  };

  const handleShowOnlyFavorites = () => {
    setVisibleCharts(new Set(favoriteCharts));
    if (name) {
      localStorage.setItem(
        `dashboard-visible-${name}`,
        JSON.stringify(Array.from(favoriteCharts))
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <DashboardSidebar
        charts={chartConfigs}
        visibleCharts={visibleCharts}
        favoriteCharts={favoriteCharts}
        onToggleChart={handleToggleChart}
        onToggleFavorite={handleToggleFavorite}
        onResetFilters={handleResetFilters}
        onShowAll={handleShowAll}
        onHideAll={handleHideAll}
        onShowOnlyFavorites={handleShowOnlyFavorites}
      />

      {/* Main Content */}
      <div className="flex-1 w-full" style={{ marginLeft: "320px" }}>
        <div className="w-full py-8 px-4 lg:px-8 max-w-[1920px] mx-auto">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Dashboard Analítico
            </h1>
            <p className="text-gray-600">
              Sistema de filtrado avanzado - Selecciona los gráficos que deseas
              visualizar desde el panel lateral
            </p>
            <div className="mt-3 bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <p className="text-sm text-gray-700">
                <strong>💡 Tip:</strong> Usa el sidebar para filtrar gráficos
                por categoría y marca tus favoritos con la estrella. Tu
                configuración se guarda automáticamente.
              </p>
            </div>
          </div>

          {/* Grid de gráficos */}
          <DashboardGrid
            charts={chartItems}
            visibleCharts={visibleCharts}
            favoriteCharts={favoriteCharts}
          />
        </div>
      </div>
    </div>
  );
}
