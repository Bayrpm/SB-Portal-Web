"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboardData } from "@/context/DashboardContext";
import { useUser } from "@/context/UserContext";
import ChartWrapper from "@/app/components/ChartWrapper";
import KPICard from "@/app/components/dashboard/KPICard";
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
import TiempoPorEstadoChart from "@/app/components/charts/TiempoPorEstadoChart";
import TendenciaTiempoRespuestaChart from "@/app/components/charts/TendenciaTiempoRespuestaChart";
import TopUbicacionesChart from "@/app/components/charts/TopUbicacionesChart";
import CategoriasAsignadasChart from "@/app/components/charts/CategoriasAsignadasChart";
import EstadosEvolucionChart from "@/app/components/charts/EstadosEvolucionChart";
import TasaResolucionChart from "@/app/components/charts/TasaResolucionChart";
import ComparativaAnualChart from "@/app/components/charts/ComparativaAnualChart";
import ProyeccionDenunciasChart from "@/app/components/charts/ProyeccionDenunciasChart";
import WordCloudChart from "@/app/components/charts/WordCloudChart";

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
interface RawDashboardData {
  resumen: {
    total_denuncias: number;
    denuncias_asignadas: number;
    denuncias_sin_asignar: number;
    tiempo_promedio_asignacion_horas: number;
  };
  denuncias_por_mes: {
    mes: string;
    total: number;
    asignadas?: number;
    sin_asignar?: number;
  }[];
  top_categorias: {
    categoria: string;
    total: number;
  }[];
  por_categoria: {
    categoria: string;
    total: number;
  }[];
  por_estado: {
    estado: string;
    cantidad: number;
  }[];
  por_cuadrante: {
    cuadrante: string;
    cantidad: number;
  }[];
  por_dia: {
    dia: string;
    cantidad: number;
  }[];
  por_hora: {
    hora: string;
    cantidad: number;
  }[];
  tiempo_promedio: {
    estado: string;
    horas: number;
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
    turno?: string;
  }[];
  eficiencia_inspectores: {
    inspector: string;
    total_gestionadas: number;
    tiempo_promedio_horas: number;
  }[];
  inspectores_activos: {
    inspector: string;
    denuncias_gestionadas: number;
    tiempo_promedio_horas?: number;
  }[];
  distribucion_turno: {
    turno: string;
    cantidad: number;
  }[];
  sla: {
    cumplimiento?: number;
    total?: number;
    en_tiempo?: number;
    fuera_tiempo?: number;
    cumplidas?: number;
    vencidas?: number;
    porcentaje_cumplimiento?: number;
  };
  tiempo_promedio_estado: {
    estado: string;
    horas_promedio: number;
  }[];
  embudo_conversion: {
    etapa?: string;
    estado?: string;
    cantidad: number;
  }[];
  tendencia_tiempo_respuesta: {
    fecha?: string;
    mes?: string;
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

type DashboardData = RawDashboardData;

export default function DashboardPage() {
  const router = useRouter();
  const { isPageAllowed } = useUser();
  const { data, fetchDashboardData } = useDashboardData();
  const [activeTab, setActiveTab] = useState<TabType>("resumen");
  const [dateRange] = useState("last30days");
  const [customStartDate] = useState("");
  const [customEndDate] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);

  // Estado para controlar qué gráficos se han cargado
  const [loadedCharts, setLoadedCharts] = useState<Set<string>>(new Set());

  // Verificar acceso a la página
  useEffect(() => {
    if (!isPageAllowed("/portal/dashboard")) {
      console.warn("Usuario no tiene acceso a /portal/dashboard");
      setAccessDenied(true);

      // Redirigir después de 2 segundos
      const timer = setTimeout(() => {
        router.push("/portal");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isPageAllowed, router]);

  // Configuración de tabs
  const tabs: TabConfig[] = [
    { id: "resumen", label: "Resumen General", icon: Activity },
    { id: "categorias", label: "Categorías", icon: Layers },
    { id: "inspectores", label: "Inspectores", icon: Users },
    { id: "ubicaciones", label: "Ubicaciones", icon: MapPin },
    { id: "tendencias", label: "Tendencias", icon: TrendingUp },
  ];

  useEffect(() => {
    // Cargar datos del dashboard con filtros
    const params = new URLSearchParams();

    // Agregar filtro de período
    if (dateRange === "custom" && customStartDate && customEndDate) {
      params.append("startDate", customStartDate);
      params.append("endDate", customEndDate);
    } else if (dateRange !== "all") {
      params.append("period", dateRange);
    }

    // Llamar a la API con parámetros
    const queryString = params.toString();
    fetchDashboardData(queryString ? `?${queryString}` : "");
  }, [dateRange, customStartDate, customEndDate, fetchDashboardData]);

  // Simular carga progresiva de gráficos
  useEffect(() => {
    if (!data) return;

    // Limpiar gráficos cargados para mostrar loaders nuevamente
    setLoadedCharts(new Set());

    // Marcar progresivamente los gráficos como cargados con un pequeño delay
    const chartNames = [
      "tendencia-temporal",
      "top-categorias",
      "estado-distribucion",
      "patron-dia-hora",
      "salud-sistema",
      "sla",
      "embudo",
      "prioridad",
      "categoria-prioridad",
      "crecimiento",
      "categorias-asignadas",
      "tasa-resolucion",
      "word-cloud",
      "carga-inspector",
      "eficiencia-inspector",
      "inspectores-activos",
      "distribucion-turno",
      "tiempo-estado",
      "tendencia-tiempo",
      "top-ubicaciones",
      "patron-ubicaciones",
      "comparativa-anual",
      "proyeccion",
      "estados-evolucion",
      "crecimiento-mensual",
    ];

    chartNames.forEach((chartName, index) => {
      setTimeout(() => {
        setLoadedCharts((prev) => new Set(prev).add(chartName));
      }, index * 100); // 100ms entre cada gráfico
    });
  }, [data]);

  const raw_data: DashboardData = (data || {
    resumen: {
      total_denuncias: 0,
      denuncias_asignadas: 0,
      denuncias_sin_asignar: 0,
      tiempo_promedio_asignacion_horas: 0,
    },
    denuncias_por_mes: [],
    top_categorias: [],
    por_categoria: [],
    por_estado: [],
    por_cuadrante: [],
    por_dia: [],
    por_hora: [],
    tiempo_promedio: [],
    por_prioridad: [],
    categorias_prioridad: [],
    crecimiento_mensual: [],
    heat_map_dia_hora: [],
    carga_inspectores: [],
    eficiencia_inspectores: [],
    inspectores_activos: [],
    distribucion_turno: [],
    sla: {},
    tiempo_promedio_estado: [],
    embudo_conversion: [],
    tendencia_tiempo_respuesta: [],
    top_ubicaciones: [],
    categorias_asignacion: [],
    estados_evolucion: [],
    tasa_resolucion_categoria: [],
    comparativa_anual: [],
    proyeccion_denuncias: [],
    word_cloud: [],
    salud_sistema: { score: 0, sla: 0, asignacion: 0, resolucion: 0 },
  }) as DashboardData;

  // Funciones de transformación de datos
  const transformTendenciaTemporalData = (
    data: DashboardData["denuncias_por_mes"]
  ) => {
    return data.map((item) => ({
      mes: item.mes,
      total: item.total,
      asignadas: item.asignadas ?? 0,
      sin_asignar: item.sin_asignar ?? 0,
    }));
  };

  const transformCategoriaData = (data: typeof raw_data.top_categorias) => {
    return data.map((item) => ({
      nombre: item.categoria,
      cantidad: item.total,
    }));
  };

  const transformEstadoData = (
    data: typeof raw_data.por_estado
  ): Record<string, number> => {
    const result: Record<string, number> = {};
    data.forEach((item) => {
      result[item.estado] = item.cantidad;
    });
    return result;
  };

  const transformPrioridadData = (
    data: typeof raw_data.por_prioridad
  ): Record<string, number> => {
    const result: Record<string, number> = {};
    data.forEach((item) => {
      result[item.prioridad] = item.cantidad;
    });
    return result;
  };

  const transformCategoriasPrioridadData = (
    data: typeof raw_data.categorias_prioridad
  ): Record<string, Record<string, number>> => {
    const result: Record<string, Record<string, number>> = {};
    data.forEach((item) => {
      result[item.categoria] = {
        baja: item.baja,
        media: item.media,
        alta: item.alta,
      };
    });
    return result;
  };

  const transformCrecimientoData = (
    data: typeof raw_data.crecimiento_mensual
  ) => {
    return data.map((item) => ({
      mes: item.mes,
      crecimiento: item.tasa,
    }));
  };

  const transformHeatMapData = (
    data: typeof raw_data.heat_map_dia_hora
  ): Record<string, Record<number, number>> => {
    const result: Record<string, Record<number, number>> = {};
    const diasSemanaMap = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];

    // Inicializar todos los días con todas las horas en 0
    diasSemanaMap.forEach((dia) => {
      result[dia] = {};
      for (let h = 0; h < 24; h++) {
        result[dia][h] = 0;
      }
    });

    // Llenar con los datos reales
    data.forEach((item) => {
      const diaStr = diasSemanaMap[item.dia] || `Día ${item.dia}`;
      if (!result[diaStr]) {
        result[diaStr] = {};
      }
      result[diaStr][item.hora] = item.cantidad;
    });
    return result;
  };

  const transformTiempoPorEstadoData = (
    data: typeof raw_data.tiempo_promedio_estado
  ) => {
    return data.map((item) => ({
      estado: item.estado,
      horas: item.horas_promedio,
    }));
  };

  const transformTendenciaTiempoRespuestaData = (
    data: typeof raw_data.tendencia_tiempo_respuesta
  ) => {
    return data.map((item) => ({
      mes: item.mes ?? item.fecha ?? "",
      horas: item.horas,
    }));
  };

  const transformCategoriasAsignacionData = (
    data: typeof raw_data.categorias_asignacion
  ): Record<string, { asignadas: number; sin_asignar: number }> => {
    const result: Record<string, { asignadas: number; sin_asignar: number }> =
      {};
    data.forEach((item) => {
      result[item.categoria] = {
        asignadas: item.asignadas,
        sin_asignar: item.sin_asignar,
      };
    });
    return result;
  };

  const transformDistribucionTurnoData = (
    data: typeof raw_data.distribucion_turno
  ): Record<string, number> => {
    const result: Record<string, number> = {};
    data.forEach((item) => {
      result[item.turno] = item.cantidad;
    });
    return result;
  };

  const transformCargaInspectorData = (
    data: typeof raw_data.carga_inspectores
  ) => {
    return data.map((item) => ({
      nombre: item.inspector,
      cantidad: item.asignadas + item.en_proceso + item.resueltas,
      turno: item.turno || "Sin turno",
    }));
  };

  const transformEficienciaData = (
    data: typeof raw_data.eficiencia_inspectores
  ) => {
    return data.map((item) => ({
      nombre: item.inspector,
      cantidad: item.total_gestionadas,
      tiempoPromedio: item.tiempo_promedio_horas,
    }));
  };

  const transformInspectoresActivosData = (
    data: typeof raw_data.inspectores_activos
  ) => {
    return data.map((item) => ({
      nombre: item.inspector,
      cantidad: item.denuncias_gestionadas,
      tiempoPromedio: item.tiempo_promedio_horas || 0,
    }));
  };

  const transformComparativaAnualData = (
    data: DashboardData["comparativa_anual"]
  ) => {
    return data.map((item) => ({
      mes: item.mes,
      actual: item.anio_actual,
      anterior: item.anio_anterior,
    }));
  };

  const transformEstadosEvolucionData = (
    data: DashboardData["estados_evolucion"]
  ) => {
    return data.map((item) => ({
      mes: item.fecha,
      estados: {
        pendiente: item.pendiente,
        en_atencion: item.en_atencion,
        resuelta: item.resuelta,
        cerrada: item.cerrada,
      },
    }));
  };

  // Usar datos en caché o valores vacíos por defecto
  // Calcular tendencias para KPIs
  const totalTrend =
    raw_data.denuncias_por_mes.length >= 2
      ? ((raw_data.denuncias_por_mes[raw_data.denuncias_por_mes.length - 1]
          .total -
          raw_data.denuncias_por_mes[raw_data.denuncias_por_mes.length - 2]
            .total) /
          raw_data.denuncias_por_mes[raw_data.denuncias_por_mes.length - 2]
            .total) *
        100
      : 0;

  const tasaAsignacion =
    raw_data.resumen.denuncias_asignadas && raw_data.resumen.total_denuncias
      ? (raw_data.resumen.denuncias_asignadas /
          raw_data.resumen.total_denuncias) *
        100
      : 0;

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Si no tiene acceso, mostrar pantalla de acceso denegado */}
      {accessDenied ? (
        <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-red-600 mb-4">
              Acceso Denegado
            </h1>
            <p className="text-gray-600 mb-6">
              No tienes permiso para acceder a esta página.
            </p>
            <p className="text-sm text-gray-500">
              Serás redirigido al portal en unos momentos...
            </p>
            <button
              onClick={() => router.push("/portal")}
              className="mt-6 px-6 py-2 bg-[#003C96] text-white rounded-lg hover:bg-[#0085CA] transition-colors"
            >
              Ir al Portal
            </button>
          </div>
        </div>
      ) : (
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
              value={raw_data.resumen.total_denuncias.toLocaleString()}
              icon={BarChart3}
              trend={{ value: totalTrend, isPositive: totalTrend >= 0 }}
              description="Últimos 30 días"
              color="blue"
            />
            <KPICard
              title="Denuncias Asignadas"
              value={raw_data.resumen.denuncias_asignadas.toLocaleString()}
              icon={CheckCircle2}
              trend={{
                value: tasaAsignacion,
                isPositive: tasaAsignacion >= 50,
              }}
              description={`${tasaAsignacion.toFixed(1)}% del total`}
              color="green"
            />
            <KPICard
              title="Sin Asignar"
              value={raw_data.resumen.denuncias_sin_asignar.toLocaleString()}
              icon={Target}
              description="Requieren atención"
              color="orange"
            />
            <KPICard
              title="Tiempo Promedio"
              value={`${raw_data.resumen.tiempo_promedio_asignacion_horas.toFixed(
                1
              )}h`}
              icon={Clock}
              description="Asignación (horas)"
              color="purple"
            />
          </div>

          {/* Paneles por tab */}
          <div className="bg-white rounded-b-lg shadow px-6 py-8">
            {/* Tab: Resumen */}
            {activeTab === "resumen" && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <ChartWrapper
                    title="Denuncias por Estado"
                    loading={!loadedCharts.has("estado")}
                  >
                    <EstadoDistribucionChart
                      data={transformEstadoData(raw_data.por_estado)}
                    />
                  </ChartWrapper>

                  <ChartWrapper
                    title="Denuncias por Categoría"
                    loading={!loadedCharts.has("categoria")}
                  >
                    <CategoriaChart
                      data={transformCategoriaData(raw_data.top_categorias)}
                      title="Top 5 Categorías"
                    />
                  </ChartWrapper>

                  <ChartWrapper
                    title="Denuncias por Prioridad"
                    loading={!loadedCharts.has("prioridad")}
                  >
                    <PrioridadChart
                      data={transformPrioridadData(raw_data.por_prioridad)}
                    />
                  </ChartWrapper>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  <ChartWrapper
                    title="Crecimiento Mensual"
                    loading={!loadedCharts.has("crecimiento")}
                  >
                    <CrecimientoMensualChart
                      data={transformCrecimientoData(
                        raw_data.crecimiento_mensual
                      )}
                    />
                  </ChartWrapper>

                  <ChartWrapper
                    title="Categorías por Prioridad"
                    loading={!loadedCharts.has("categoria-prioridad")}
                  >
                    <CategoriaPrioridadChart
                      data={transformCategoriasPrioridadData(
                        raw_data.categorias_prioridad
                      )}
                    />
                  </ChartWrapper>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  <ChartWrapper
                    title="Patrón Temporal Día-Hora"
                    loading={!loadedCharts.has("patron-dia-hora")}
                  >
                    <HeatMapDiaHoraChart
                      data={transformHeatMapData(raw_data.heat_map_dia_hora)}
                    />
                  </ChartWrapper>

                  <ChartWrapper
                    title="Tiempo por Estado"
                    loading={!loadedCharts.has("tiempo-estado")}
                  >
                    <TiempoPorEstadoChart
                      data={transformTiempoPorEstadoData(
                        raw_data.tiempo_promedio_estado
                      )}
                    />
                  </ChartWrapper>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  <ChartWrapper
                    title="Tendencia Temporal (6 meses)"
                    loading={!loadedCharts.has("tendencia-temporal")}
                  >
                    <TendenciaTemporalChart
                      data={transformTendenciaTemporalData(
                        raw_data.denuncias_por_mes
                      )}
                    />
                  </ChartWrapper>

                  <ChartWrapper
                    title="Comparativa Año Actual vs Anterior"
                    loading={!loadedCharts.has("comparativa-anual")}
                  >
                    <ComparativaAnualChart
                      data={transformComparativaAnualData(
                        raw_data.comparativa_anual
                      )}
                    />
                  </ChartWrapper>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  <ChartWrapper
                    title="Proyección de Denuncias"
                    loading={!loadedCharts.has("proyeccion")}
                  >
                    <ProyeccionDenunciasChart
                      data={raw_data.proyeccion_denuncias}
                      historicCount={6}
                    />
                  </ChartWrapper>

                  <ChartWrapper
                    title="Evolución de Estados"
                    loading={!loadedCharts.has("estados-evolucion")}
                  >
                    <EstadosEvolucionChart
                      data={transformEstadosEvolucionData(
                        raw_data.estados_evolucion
                      )}
                    />
                  </ChartWrapper>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  <ChartWrapper
                    title="Tasa de Crecimiento Mensual"
                    loading={!loadedCharts.has("crecimiento-mensual")}
                  >
                    <CrecimientoMensualChart
                      data={transformCrecimientoData(
                        raw_data.crecimiento_mensual
                      )}
                    />
                  </ChartWrapper>

                  <ChartWrapper
                    title="Tendencia Tiempo Respuesta"
                    loading={!loadedCharts.has("tendencia-tiempo")}
                  >
                    <TendenciaTiempoRespuestaChart
                      data={transformTendenciaTiempoRespuestaData(
                        raw_data.tendencia_tiempo_respuesta
                      )}
                    />
                  </ChartWrapper>
                </div>
              </>
            )}

            {/* Tab: Categorías */}
            {activeTab === "categorias" && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ChartWrapper
                    title="Distribución por Prioridad"
                    loading={!loadedCharts.has("prioridad")}
                  >
                    <PrioridadChart
                      data={transformPrioridadData(raw_data.por_prioridad)}
                    />
                  </ChartWrapper>

                  <ChartWrapper
                    title="Categorías por Prioridad"
                    loading={!loadedCharts.has("categoria-prioridad")}
                  >
                    <CategoriaPrioridadChart
                      data={transformCategoriasPrioridadData(
                        raw_data.categorias_prioridad
                      )}
                    />
                  </ChartWrapper>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  <ChartWrapper
                    title="Categorías Asignadas"
                    loading={!loadedCharts.has("categorias-asignadas")}
                  >
                    <CategoriasAsignadasChart
                      data={transformCategoriasAsignacionData(
                        raw_data.categorias_asignacion
                      )}
                    />
                  </ChartWrapper>

                  <ChartWrapper
                    title="Tasa de Resolución por Categoría"
                    loading={!loadedCharts.has("tasa-resolucion")}
                  >
                    <TasaResolucionChart
                      data={raw_data.tasa_resolucion_categoria}
                    />
                  </ChartWrapper>
                </div>

                <div className="grid grid-cols-1 gap-6 mt-6">
                  <ChartWrapper
                    title="Palabras Más Frecuentes"
                    loading={!loadedCharts.has("word-cloud")}
                  >
                    <WordCloudChart data={raw_data.word_cloud} />
                  </ChartWrapper>
                </div>
              </>
            )}

            {/* Tab: Inspectores */}
            {activeTab === "inspectores" && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ChartWrapper
                    title="Carga de Trabajo"
                    loading={!loadedCharts.has("carga-inspector")}
                  >
                    <CargaInspectorChart
                      data={transformCargaInspectorData(
                        raw_data.carga_inspectores
                      )}
                    />
                  </ChartWrapper>

                  <ChartWrapper
                    title="Eficiencia de Inspectores"
                    loading={!loadedCharts.has("eficiencia-inspector")}
                  >
                    <EficienciaInspectorChart
                      data={transformEficienciaData(
                        raw_data.eficiencia_inspectores
                      )}
                    />
                  </ChartWrapper>

                  <ChartWrapper
                    title="Top 10 Más Activos"
                    loading={!loadedCharts.has("inspectores-activos")}
                  >
                    <InspectoresActivosChart
                      data={transformInspectoresActivosData(
                        raw_data.inspectores_activos
                      )}
                    />
                  </ChartWrapper>

                  <ChartWrapper
                    title="Distribución por Turno"
                    loading={!loadedCharts.has("distribucion-turno")}
                  >
                    <DistribucionTurnoChart
                      data={transformDistribucionTurnoData(
                        raw_data.distribucion_turno
                      )}
                    />
                  </ChartWrapper>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  <ChartWrapper
                    title="Tiempo por Estado"
                    loading={!loadedCharts.has("tiempo-estado")}
                  >
                    <TiempoPorEstadoChart
                      data={transformTiempoPorEstadoData(
                        raw_data.tiempo_promedio_estado
                      )}
                    />
                  </ChartWrapper>

                  <ChartWrapper
                    title="Tendencia Tiempo Respuesta"
                    loading={!loadedCharts.has("tendencia-tiempo")}
                  >
                    <TendenciaTiempoRespuestaChart
                      data={transformTendenciaTiempoRespuestaData(
                        raw_data.tendencia_tiempo_respuesta
                      )}
                    />
                  </ChartWrapper>
                </div>
              </>
            )}

            {/* Tab: Ubicaciones */}
            {activeTab === "ubicaciones" && (
              <>
                <ChartWrapper
                  title="Top 10 Ubicaciones con Más Denuncias"
                  loading={!loadedCharts.has("top-ubicaciones")}
                >
                  <TopUbicacionesChart data={raw_data.top_ubicaciones} />
                </ChartWrapper>

                <div className="grid grid-cols-1 gap-6 mt-6">
                  <ChartWrapper
                    title="Patrón de Reporte por Día y Hora"
                    loading={!loadedCharts.has("patron-ubicaciones")}
                  >
                    <HeatMapDiaHoraChart
                      data={transformHeatMapData(raw_data.heat_map_dia_hora)}
                    />
                  </ChartWrapper>
                </div>
              </>
            )}

            {/* Tab: Tendencias */}
            {activeTab === "tendencias" && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ChartWrapper
                    title="Tendencia Temporal (6 meses)"
                    loading={!loadedCharts.has("tendencia-temporal")}
                  >
                    <TendenciaTemporalChart
                      data={transformTendenciaTemporalData(
                        raw_data.denuncias_por_mes
                      )}
                    />
                  </ChartWrapper>

                  <ChartWrapper
                    title="Comparativa Año Actual vs Anterior"
                    loading={!loadedCharts.has("comparativa-anual")}
                  >
                    <ComparativaAnualChart
                      data={transformComparativaAnualData(
                        raw_data.comparativa_anual
                      )}
                    />
                  </ChartWrapper>

                  <ChartWrapper
                    title="Proyección de Denuncias"
                    loading={!loadedCharts.has("proyeccion")}
                  >
                    <ProyeccionDenunciasChart
                      data={raw_data.proyeccion_denuncias}
                      historicCount={6}
                    />
                  </ChartWrapper>

                  <ChartWrapper
                    title="Evolución de Estados"
                    loading={!loadedCharts.has("estados-evolucion")}
                  >
                    <EstadosEvolucionChart
                      data={transformEstadosEvolucionData(
                        raw_data.estados_evolucion
                      )}
                    />
                  </ChartWrapper>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  <ChartWrapper
                    title="Tasa de Crecimiento Mensual"
                    loading={!loadedCharts.has("crecimiento-mensual")}
                  >
                    <CrecimientoMensualChart
                      data={transformCrecimientoData(
                        raw_data.crecimiento_mensual
                      )}
                    />
                  </ChartWrapper>

                  <ChartWrapper
                    title="Tendencia Tiempo Respuesta"
                    loading={!loadedCharts.has("tendencia-tiempo")}
                  >
                    <TendenciaTiempoRespuestaChart
                      data={transformTendenciaTiempoRespuestaData(
                        raw_data.tendencia_tiempo_respuesta
                      )}
                    />
                  </ChartWrapper>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
