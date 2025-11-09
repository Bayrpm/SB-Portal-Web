"use client";

import ReactECharts from "echarts-for-react";

interface CategoriasAsignacionData {
  asignadas: number;
  sin_asignar: number;
}

interface CategoriasAsignadasChartProps {
  data: Record<string, CategoriasAsignacionData>;
}

export default function CategoriasAsignadasChart({
  data,
}: CategoriasAsignadasChartProps) {
  const categorias = Object.keys(data);
  const asignadas = categorias.map((c) => data[c].asignadas);
  const sinAsignar = categorias.map((c) => data[c].sin_asignar);

  const option = {
    title: {
      text: "Categorías: Asignadas vs Sin Asignar",
      left: "center",
      textStyle: { fontSize: 16, fontWeight: "bold" },
    },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: { data: ["Asignadas", "Sin Asignar"], bottom: "0" },
    grid: { left: "3%", right: "4%", bottom: "15%", containLabel: true },
    xAxis: {
      type: "category",
      data: categorias,
      axisLabel: { rotate: 45, interval: 0 },
    },
    yAxis: { type: "value" },
    series: [
      {
        name: "Asignadas",
        type: "bar",
        data: asignadas,
        itemStyle: { color: "#10b981" },
      },
      {
        name: "Sin Asignar",
        type: "bar",
        data: sinAsignar,
        itemStyle: { color: "#ef4444" },
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <ReactECharts option={option} style={{ height: "400px" }} />
    </div>
  );
}
