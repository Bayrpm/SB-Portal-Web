"use client";

import ReactECharts from "echarts-for-react";

interface TiempoEstadoData {
  estado: string;
  horas: number;
}

interface TiempoPorEstadoChartProps {
  data: TiempoEstadoData[];
}

export default function TiempoPorEstadoChart({
  data,
}: TiempoPorEstadoChartProps) {
  const option = {
    title: {
      text: "Tiempo Promedio por Estado",
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
      formatter: "{b}: {c} horas",
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: data.map((d) => d.estado),
      axisLabel: {
        rotate: 45,
        interval: 0,
      },
    },
    yAxis: {
      type: "value",
      name: "Horas",
    },
    series: [
      {
        name: "Tiempo Promedio",
        type: "bar",
        data: data.map((d) => d.horas),
        itemStyle: {
          color: "#8b5cf6",
        },
        label: {
          show: true,
          position: "top",
          formatter: "{c}h",
        },
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <ReactECharts option={option} style={{ height: "350px" }} />
    </div>
  );
}
