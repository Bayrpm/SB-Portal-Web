"use client";

import ReactECharts from "echarts-for-react";

interface EstadosEvolucionData {
  mes: string;
  estados: Record<string, number>;
}

interface EstadosEvolucionChartProps {
  data: EstadosEvolucionData[];
}

export default function EstadosEvolucionChart({
  data,
}: EstadosEvolucionChartProps) {
  const meses = data.map((d) => d.mes);
  const estadosSet = new Set<string>();
  data.forEach((d) => Object.keys(d.estados).forEach((e) => estadosSet.add(e)));
  const estados = Array.from(estadosSet);

  const series = estados.map((estado) => ({
    name: estado,
    type: "line",
    stack: "total",
    areaStyle: {},
    emphasis: { focus: "series" },
    data: data.map((d) => d.estados[estado] || 0),
  }));

  const option = {
    title: {
      text: "Evolución de Estados en el Tiempo",
      left: "center",
      textStyle: { fontSize: 16, fontWeight: "bold" },
    },
    tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
    legend: { data: estados, bottom: "0" },
    grid: { left: "3%", right: "4%", bottom: "15%", containLabel: true },
    xAxis: { type: "category", boundaryGap: false, data: meses },
    yAxis: { type: "value" },
    series,
    color: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <ReactECharts option={option} style={{ height: "400px" }} />
    </div>
  );
}
