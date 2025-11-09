"use client";

import ReactECharts from "echarts-for-react";

interface InspectorActivoData {
  nombre: string;
  cantidad: number;
  tiempoPromedio: number;
}

interface InspectoresActivosChartProps {
  data: InspectorActivoData[];
}

export default function InspectoresActivosChart({
  data,
}: InspectoresActivosChartProps) {
  const option = {
    title: {
      text: "Top 10 Inspectores Más Activos",
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
      formatter: (params: { data: number; name: string }[]) => {
        const inspector = data.find((d) => d.nombre === params[0].name);
        return `${params[0].name}<br/>Denuncias: ${
          params[0].data
        }<br/>Tiempo Promedio: ${inspector?.tiempoPromedio || 0} horas`;
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
      data: data.map((d) => d.nombre),
      axisLabel: {
        rotate: 45,
        interval: 0,
      },
    },
    yAxis: {
      type: "value",
      name: "Denuncias Asignadas",
    },
    series: [
      {
        name: "Denuncias",
        type: "bar",
        data: data.map((d) => d.cantidad),
        itemStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: "#6366f1",
              },
              {
                offset: 1,
                color: "#3b82f6",
              },
            ],
          },
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
