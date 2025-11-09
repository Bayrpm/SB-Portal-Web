"use client";

import ReactECharts from "echarts-for-react";

interface PrioridadChartProps {
  data: Record<string, number>;
}

export default function PrioridadChart({ data }: PrioridadChartProps) {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value,
  }));

  const option = {
    title: {
      text: "Denuncias por Prioridad",
      left: "center",
      textStyle: {
        fontSize: 16,
        fontWeight: "bold",
      },
    },
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)",
    },
    legend: {
      orient: "horizontal",
      bottom: "0",
    },
    series: [
      {
        name: "Prioridad",
        type: "pie",
        radius: ["40%", "70%"], // Dona
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: "#fff",
          borderWidth: 2,
        },
        label: {
          show: false,
          position: "center",
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: "bold",
          },
        },
        labelLine: {
          show: false,
        },
        data: chartData,
        color: ["#ef4444", "#f59e0b", "#10b981", "#6b7280"],
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <ReactECharts option={option} style={{ height: "350px" }} />
    </div>
  );
}
