"use client";

import ReactECharts from "echarts-for-react";

interface WordData {
  palabra: string;
  frecuencia: number;
}

interface WordCloudChartProps {
  data: WordData[];
}

export default function WordCloudChart({ data }: WordCloudChartProps) {
  // Ordenar por frecuencia y tomar top 20
  const sortedData = [...data]
    .sort((a, b) => b.frecuencia - a.frecuencia)
    .slice(0, 20);

  const option = {
    title: {
      text: "Palabras Más Frecuentes en Denuncias",
      left: "center",
      textStyle: { fontSize: 16, fontWeight: "bold" },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      formatter: (params: { name: string; value: number }[]) => {
        const param = params[0];
        return `${param.name}: ${param.value} veces`;
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      top: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
      name: "Frecuencia",
      nameTextStyle: {
        fontSize: 12,
        fontWeight: "bold",
      },
    },
    yAxis: {
      type: "category",
      data: sortedData.map((d) => d.palabra),
      axisLabel: {
        fontSize: 11,
        interval: 0,
      },
    },
    series: [
      {
        name: "Frecuencia",
        type: "bar",
        data: sortedData.map((d) => d.frecuencia),
        itemStyle: {
          color: (params: { dataIndex: number }) => {
            const colors = [
              "#3b82f6",
              "#10b981",
              "#f59e0b",
              "#ef4444",
              "#8b5cf6",
              "#14b8a6",
              "#f97316",
              "#06b6d4",
              "#ec4899",
              "#84cc16",
            ];
            return colors[params.dataIndex % colors.length];
          },
          borderRadius: [0, 4, 4, 0],
        },
        label: {
          show: true,
          position: "right",
          formatter: "{c}",
          fontSize: 11,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: "rgba(0, 0, 0, 0.3)",
          },
        },
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <ReactECharts option={option} style={{ height: "500px" }} />
    </div>
  );
}
