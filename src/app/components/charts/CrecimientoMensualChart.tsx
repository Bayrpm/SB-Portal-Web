"use client";

import ReactECharts from "echarts-for-react";

interface CrecimientoData {
  mes: string;
  crecimiento: number;
}

interface CrecimientoMensualChartProps {
  data: CrecimientoData[];
}

export default function CrecimientoMensualChart({
  data,
}: CrecimientoMensualChartProps) {
  const option = {
    title: {
      text: "Tasa de Crecimiento Mensual (%)",
      left: "center",
      textStyle: {
        fontSize: 16,
        fontWeight: "bold",
      },
    },
    tooltip: {
      trigger: "axis",
      formatter: "{b}: {c}%",
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: data.map((d) => d.mes),
      boundaryGap: false,
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: "{value}%",
      },
    },
    series: [
      {
        name: "Crecimiento",
        type: "line",
        data: data.map((d) => d.crecimiento),
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: "rgba(59, 130, 246, 0.5)",
              },
              {
                offset: 1,
                color: "rgba(59, 130, 246, 0.1)",
              },
            ],
          },
        },
        itemStyle: {
          color: "#3b82f6",
        },
        lineStyle: {
          width: 2,
        },
        smooth: true,
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <ReactECharts option={option} style={{ height: "350px" }} />
    </div>
  );
}
