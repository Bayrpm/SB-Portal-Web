import React from "react";
import ReactECharts from "echarts-for-react";

interface TendenciaTemporalChartProps {
  data: {
    mes: string;
    total: number;
    asignadas: number;
    sin_asignar: number;
  }[];
  title?: string;
}

export default function TendenciaTemporalChart({
  data,
  title = "Tendencia de Denuncias (Últimos 6 meses)",
}: TendenciaTemporalChartProps) {
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
      trigger: "axis",
      axisPointer: {
        type: "cross",
        label: {
          backgroundColor: "#6a7985",
        },
      },
    },
    legend: {
      data: ["Total", "Asignadas", "Sin Asignar"],
      bottom: 0,
      textStyle: {
        fontSize: 12,
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      top: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: data.map((d) => d.mes),
      axisLabel: {
        fontSize: 11,
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        fontSize: 11,
      },
    },
    series: [
      {
        name: "Total",
        type: "line",
        smooth: true,
        lineStyle: {
          width: 3,
          color: "#003C96",
        },
        itemStyle: {
          color: "#003C96",
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(0, 60, 150, 0.3)" },
              { offset: 1, color: "rgba(0, 60, 150, 0.05)" },
            ],
          },
        },
        data: data.map((d) => d.total),
      },
      {
        name: "Asignadas",
        type: "line",
        smooth: true,
        lineStyle: {
          width: 2,
          color: "#00B894",
        },
        itemStyle: {
          color: "#00B894",
        },
        data: data.map((d) => d.asignadas),
      },
      {
        name: "Sin Asignar",
        type: "line",
        smooth: true,
        lineStyle: {
          width: 2,
          color: "#E17055",
          type: "dashed",
        },
        itemStyle: {
          color: "#E17055",
        },
        data: data.map((d) => d.sin_asignar),
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <ReactECharts option={option} style={{ height: "400px" }} />
    </div>
  );
}
