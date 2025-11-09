"use client";

import ReactECharts from "echarts-for-react";

interface TopUbicacionData {
  ubicacion: string;
  cantidad: number;
}

interface TopUbicacionesChartProps {
  data: TopUbicacionData[];
}

export default function TopUbicacionesChart({
  data,
}: TopUbicacionesChartProps) {
  const option = {
    title: {
      text: "Top 10 Ubicaciones Más Reportadas",
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
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: data.map((d) => d.ubicacion),
      axisLabel: {
        rotate: 45,
        interval: 0,
        formatter: (value: string) => {
          return value.length > 30 ? value.substring(0, 27) + "..." : value;
        },
      },
    },
    yAxis: {
      type: "value",
      name: "Denuncias",
    },
    series: [
      {
        name: "Cantidad",
        type: "bar",
        data: data.map((d) => d.cantidad),
        itemStyle: {
          color: "#14b8a6",
        },
        label: {
          show: true,
          position: "top",
        },
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <ReactECharts option={option} style={{ height: "400px" }} />
    </div>
  );
}
