export type MesMetric = {
  mes: string;
  denuncias_registradas: number;
  denuncias_asignadas: number;
  denuncias_cerradas: number;
  tiempo_promedio_cierre_dias: number;
};

export type DashboardData = {
  metrics_anuales: {
    anio: number;
    meses: MesMetric[];
  };
};

export type PieChartProps = {
  meses: MesMetric[];
  paleta: {
    primaria: string;
    secundaria: string;
    acento: string;
  };
};
