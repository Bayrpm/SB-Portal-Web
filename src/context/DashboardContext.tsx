"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";

interface DashboardData {
  resumen: {
    total_denuncias: number;
    denuncias_asignadas: number;
    denuncias_sin_asignar: number;
    tiempo_promedio_asignacion_horas: number;
  };
  denuncias_por_mes: Array<{
    mes: string;
    total: number;
    asignadas?: number;
    sin_asignar?: number;
  }>;
  top_categorias: Array<{
    categoria: string;
    total: number;
  }>;
  por_estado: Array<{
    estado: string;
    cantidad: number;
  }>;
  por_prioridad: Array<{
    prioridad: string;
    cantidad: number;
  }>;
  categorias_prioridad: Array<{
    categoria: string;
    baja: number;
    media: number;
    alta: number;
  }>;
  crecimiento_mensual: Array<{
    mes: string;
    tasa: number;
  }>;
  heat_map_dia_hora: Array<{
    dia: number;
    hora: number;
    cantidad: number;
  }>;
  carga_inspectores: Array<{
    inspector: string;
    asignadas: number;
    en_proceso: number;
    resueltas: number;
  }>;
  eficiencia_inspectores: Array<{
    inspector: string;
    total_gestionadas: number;
    tiempo_promedio_horas: number;
  }>;
  inspectores_activos: Array<{
    inspector: string;
    denuncias_gestionadas: number;
  }>;
  distribucion_turno: Array<{
    turno: string;
    cantidad: number;
  }>;
  sla: {
    cumplimiento?: number;
    total?: number;
    en_tiempo?: number;
    fuera_tiempo?: number;
    cumplidas?: number;
    vencidas?: number;
    porcentaje_cumplimiento?: number;
  };
  tiempo_promedio_estado: Array<{
    estado: string;
    horas_promedio: number;
  }>;
  embudo_conversion: Array<{
    etapa?: string;
    estado?: string;
    cantidad: number;
  }>;
  tendencia_tiempo_respuesta: Array<{
    fecha?: string;
    mes?: string;
    horas: number;
  }>;
  top_ubicaciones: Array<{
    ubicacion: string;
    cantidad: number;
  }>;
  categorias_asignacion: Array<{
    categoria: string;
    asignadas: number;
    sin_asignar: number;
  }>;
  estados_evolucion: Array<{
    fecha: string;
    pendiente: number;
    en_atencion: number;
    resuelta: number;
    cerrada: number;
  }>;
  tasa_resolucion_categoria: Array<{
    categoria: string;
    total: number;
    resueltas: number;
    tasa: number;
  }>;
  comparativa_anual: Array<{
    mes: string;
    anio_actual: number;
    anio_anterior: number;
  }>;
  proyeccion_denuncias: Array<{
    mes: string;
    total: number;
    asignadas: number;
    sin_asignar: number;
  }>;
  word_cloud: Array<{
    palabra: string;
    frecuencia: number;
  }>;
  salud_sistema: {
    score: number;
    sla: number;
    asignacion: number;
    resolucion: number;
  };
}

interface DashboardContextType {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  fetchDashboardData: (queryParams?: string) => Promise<void>;
  clearCache: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastQueryRef = useRef<string>("");

  const fetchDashboardData = useCallback(
    async (queryParams?: string) => {
      const currentQuery = queryParams || "";

      // Si es la misma query que la última, no volver a cargar
      if (lastQueryRef.current === currentQuery && data !== null) {
        return;
      }

      lastQueryRef.current = currentQuery;
      setLoading(true);
      setError(null);

      try {
        const url = queryParams
          ? `/api/dashboard${queryParams}`
          : "/api/dashboard";
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Error al cargar los datos del dashboard");
        }
        const dashboardData = await response.json();
        setData(dashboardData);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        console.error("Error al cargar dashboard:", err);
      } finally {
        setLoading(false);
      }
    },
    [data] // Incluir data como dependencia
  );

  const clearCache = useCallback(() => {
    setData(null);
    setError(null);
    lastQueryRef.current = "";
  }, []);

  return (
    <DashboardContext.Provider
      value={{ data, loading, error, fetchDashboardData, clearCache }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardData() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboardData debe usarse dentro de DashboardProvider");
  }
  return context;
}
