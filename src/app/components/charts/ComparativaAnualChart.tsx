"use client";

import ReactECharts from "echarts-for-react";

interface ComparativaAnualData {
  mes: string;
  actual: number;
  anterior: number;
}

interface ComparativaAnualChartProps {
  data: ComparativaAnualData[];
}

export default function ComparativaAnualChart({
  data,
}: ComparativaAnualChartProps) {
  const option = {
    title: {
      text: "Comparativa Año Actual vs Año Anterior",
      left: "center",
      textStyle: { fontSize: 16, fontWeight: "bold" },
    },
    tooltip: { trigger: "axis" },
    legend: { data: ["Año Actual", "Año Anterior"], bottom: "0" },
    grid: { left: "3%", right: "4%", bottom: "15%", containLabel: true },
    xAxis: { type: "category", data: data.map((d) => d.mes) },
    yAxis: { type: "value", name: "Denuncias" },
    series: [
      {
        name: "Año Actual",
        type: "line",
        data: data.map((d) => d.actual),
        smooth: true,
        lineStyle: { width: 3, color: "#3b82f6" },
        itemStyle: { color: "#3b82f6" },
      },
      {
        name: "Año Anterior",
        type: "line",
        data: data.map((d) => d.anterior),
        smooth: true,
        lineStyle: { width: 3, color: "#9ca3af", type: "dashed" },
        itemStyle: { color: "#9ca3af" },
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <ReactECharts option={option} style={{ height: "350px" }} />
    </div>
  );
}
