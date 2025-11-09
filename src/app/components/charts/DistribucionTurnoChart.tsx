"use client";

import ReactECharts from "echarts-for-react";

interface DistribucionTurnoChartProps {
  data: Record<string, number>;
}

export default function DistribucionTurnoChart({
  data,
}: DistribucionTurnoChartProps) {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value,
  }));

  const option = {
    title: {
      text: "Distribución de Inspectores por Turno",
      left: "center",
      textStyle: {
        fontSize: 16,
        fontWeight: "bold",
      },
    },
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} inspectores ({d}%)",
    },
    legend: {
      orient: "horizontal",
      bottom: "0",
    },
    series: [
      {
        name: "Turno",
        type: "pie",
        radius: "60%",
        center: ["50%", "45%"],
        data: chartData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
        label: {
          formatter: "{b}: {c}",
        },
        color: ["#f59e0b", "#3b82f6", "#8b5cf6"],
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <ReactECharts option={option} style={{ height: "350px" }} />
    </div>
  );
}
