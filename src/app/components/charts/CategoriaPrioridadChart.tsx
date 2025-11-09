"use client";

import ReactECharts from "echarts-for-react";

interface CategoriaPrioridadChartProps {
  data: Record<string, Record<string, number>>;
}

export default function CategoriaPrioridadChart({
  data,
}: CategoriaPrioridadChartProps) {
  // Obtener todas las prioridades únicas
  const prioridadesSet = new Set<string>();
  Object.values(data).forEach((prioridades) => {
    Object.keys(prioridades).forEach((p) => prioridadesSet.add(p));
  });
  const prioridades = Array.from(prioridadesSet);

  // Obtener categorías
  const categorias = Object.keys(data);

  // Preparar series para cada prioridad
  const series = prioridades.map((prioridad) => ({
    name: prioridad,
    type: "bar",
    stack: "total",
    emphasis: {
      focus: "series",
    },
    data: categorias.map((categoria) => data[categoria][prioridad] || 0),
  }));

  const option = {
    title: {
      text: "Categorías vs Prioridad",
      left: "center",
      textStyle: {
        fontSize: 16,
        fontWeight: "bold",
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },
    legend: {
      data: prioridades,
      bottom: "0",
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: categorias,
      axisLabel: {
        rotate: 45,
        interval: 0,
      },
    },
    yAxis: {
      type: "value",
    },
    series,
    color: ["#ef4444", "#f59e0b", "#10b981", "#6b7280"],
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <ReactECharts option={option} style={{ height: "400px" }} />
    </div>
  );
}
