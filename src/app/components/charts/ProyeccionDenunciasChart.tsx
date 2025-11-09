"use client";

import ReactECharts from "echarts-for-react";

interface ProyeccionData {
  mes: string;
  total: number;
  asignadas: number;
  sin_asignar: number;
}

interface ProyeccionDenunciasChartProps {
  data: ProyeccionData[];
  historicCount: number; // Cuántos meses son históricos (vs proyectados)
}

export default function ProyeccionDenunciasChart({
  data,
  historicCount = 6,
}: ProyeccionDenunciasChartProps) {
  const meses = data.map((d) => d.mes);
  const totales = data.map((d, idx) => ({
    value: d.total,
    itemStyle:
      idx >= historicCount
        ? {
            color: "#93c5fd",
            borderColor: "#3b82f6",
            borderWidth: 2,
            borderType: "dashed",
          }
        : { color: "#3b82f6" },
  }));

  const option = {
    title: {
      text: "Proyección de Denuncias",
      subtext: "Basada en tendencia histórica",
      left: "center",
      textStyle: { fontSize: 16, fontWeight: "bold" },
    },
    tooltip: {
      trigger: "axis",
      formatter: (params: { value: number; dataIndex: number }[]) => {
        const idx = params[0].dataIndex;
        const tipo = idx >= historicCount ? "Proyección" : "Real";
        return `${meses[idx]} (${tipo})<br/>Denuncias: ${params[0].value}`;
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "10%",
      top: "20%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: meses,
      axisLabel: {
        formatter: (value: string, index: number) =>
          index >= historicCount ? `${value} *` : value,
      },
    },
    yAxis: { type: "value", name: "Denuncias" },
    series: [
      {
        name: "Denuncias",
        type: "line",
        data: totales,
        smooth: true,
        lineStyle: { width: 3 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(59, 130, 246, 0.3)" },
              { offset: 1, color: "rgba(59, 130, 246, 0.05)" },
            ],
          },
        },
        markLine: {
          silent: true,
          data: [{ xAxis: historicCount - 0.5 }],
          label: { formatter: "Proyección →", position: "end" },
        },
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <ReactECharts option={option} style={{ height: "350px" }} />
      <p className="text-xs text-gray-500 mt-2 text-center">
        * Los meses marcados son proyecciones basadas en tendencia
      </p>
    </div>
  );
}
