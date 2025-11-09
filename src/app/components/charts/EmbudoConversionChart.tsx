"use client";

import ReactECharts from "echarts-for-react";

interface EmbudoData {
  estado: string;
  cantidad: number;
}

interface EmbudoConversionChartProps {
  data: EmbudoData[];
}

export default function EmbudoConversionChart({
  data,
}: EmbudoConversionChartProps) {
  const sortedData = [...data].sort((a, b) => b.cantidad - a.cantidad);

  const option = {
    title: {
      text: "Embudo de Conversión de Denuncias",
      left: "center",
      textStyle: {
        fontSize: 16,
        fontWeight: "bold",
      },
    },
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} denuncias",
    },
    series: [
      {
        name: "Embudo",
        type: "funnel",
        left: "10%",
        top: "15%",
        bottom: "10%",
        width: "80%",
        min: 0,
        max: Math.max(...sortedData.map((d) => d.cantidad)),
        minSize: "0%",
        maxSize: "100%",
        sort: "none",
        gap: 2,
        label: {
          show: true,
          position: "inside",
          formatter: "{b}: {c}",
        },
        labelLine: {
          length: 10,
          lineStyle: {
            width: 1,
            type: "solid",
          },
        },
        itemStyle: {
          borderColor: "#fff",
          borderWidth: 1,
        },
        emphasis: {
          label: {
            fontSize: 16,
            fontWeight: "bold",
          },
        },
        data: sortedData.map((d) => ({
          value: d.cantidad,
          name: d.estado,
        })),
        color: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <ReactECharts option={option} style={{ height: "450px" }} />
    </div>
  );
}
