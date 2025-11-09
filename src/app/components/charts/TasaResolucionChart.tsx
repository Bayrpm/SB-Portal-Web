"use client";

import ReactECharts from "echarts-for-react";

interface TasaResolucionData {
  categoria: string;
  total: number;
  resueltas: number;
  tasa: number;
}

interface TasaResolucionChartProps {
  data: TasaResolucionData[];
}

export default function TasaResolucionChart({
  data,
}: TasaResolucionChartProps) {
  const sortedData = [...data].sort((a, b) => b.tasa - a.tasa).slice(0, 10);

  const option = {
    title: {
      text: "Tasa de Resolución por Categoría",
      left: "center",
      textStyle: { fontSize: 16, fontWeight: "bold" },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: { data: number; name: string }[]) => {
        const cat = sortedData.find((d) => d.categoria === params[0].name);
        return `${params[0].name}<br/>Total: ${cat?.total}<br/>Resueltas: ${cat?.resueltas}<br/>Tasa: ${params[0].data}%`;
      },
    },
    grid: { left: "20%", right: "5%", bottom: "10%", top: "15%" },
    xAxis: { type: "value", max: 100, axisLabel: { formatter: "{value}%" } },
    yAxis: {
      type: "category",
      data: sortedData.map((d) => d.categoria),
      axisLabel: { interval: 0 },
    },
    series: [
      {
        name: "Tasa de Resolución",
        type: "bar",
        data: sortedData.map((d) => d.tasa),
        itemStyle: {
          color: (params: { data: number }) => {
            if (params.data >= 75) return "#10b981";
            if (params.data >= 50) return "#f59e0b";
            return "#ef4444";
          },
        },
        label: { show: true, position: "right", formatter: "{c}%" },
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <ReactECharts option={option} style={{ height: "450px" }} />
    </div>
  );
}
