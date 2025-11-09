"use client";

import ReactECharts from "echarts-for-react";

interface TendenciaTiempoData {
  mes: string;
  horas: number;
}

interface TendenciaTiempoRespuestaChartProps {
  data: TendenciaTiempoData[];
}

export default function TendenciaTiempoRespuestaChart({
  data,
}: TendenciaTiempoRespuestaChartProps) {
  const option = {
    title: {
      text: "Tendencia de Tiempo de Respuesta",
      left: "center",
      textStyle: {
        fontSize: 16,
        fontWeight: "bold",
      },
    },
    tooltip: {
      trigger: "axis",
      formatter: "{b}: {c} horas",
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "10%",
      top: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: data.map((d) => d.mes),
      boundaryGap: false,
    },
    yAxis: {
      type: "value",
      name: "Horas",
    },
    series: [
      {
        name: "Tiempo de Respuesta",
        type: "line",
        data: data.map((d) => d.horas),
        smooth: true,
        lineStyle: {
          width: 3,
          color: "#6366f1",
        },
        itemStyle: {
          color: "#6366f1",
        },
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
                color: "rgba(99, 102, 241, 0.4)",
              },
              {
                offset: 1,
                color: "rgba(99, 102, 241, 0.05)",
              },
            ],
          },
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
