import React from "react";
import ReactECharts from "echarts-for-react";

interface CategoriaChartProps {
  data: { nombre: string; cantidad: number }[];
  title?: string;
}

export default function CategoriaChart({
  data,
  title = "Denuncias por Categoría",
}: CategoriaChartProps) {
  const option = {
    title: {
      text: title,
      left: "center",
      textStyle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1F2937",
      },
    },
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)",
    },
    legend: {
      orient: "horizontal",
      bottom: 0,
      left: "center",
      textStyle: {
        fontSize: 12,
      },
    },
    series: [
      {
        name: "Categorías",
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 10,
          borderColor: "#fff",
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: "{b}: {c}",
          fontSize: 11,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: "bold",
          },
        },
        data: data.map((item, index) => ({
          value: item.cantidad,
          name: item.nombre,
          itemStyle: {
            color: [
              "#003C96",
              "#0085CA",
              "#00A7CE",
              "#00B894",
              "#E17055",
              "#FDCB6E",
              "#6C5CE7",
              "#A29BFE",
            ][index % 8],
          },
        })),
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <ReactECharts option={option} style={{ height: "400px" }} />
    </div>
  );
}
