"use client";

import ReactECharts from "echarts-for-react";

interface SLAData {
  cumplidas: number;
  vencidas: number;
  porcentaje_cumplimiento: number;
}

interface SLAGaugeChartProps {
  data: SLAData;
}

export default function SLAGaugeChart({ data }: SLAGaugeChartProps) {
  const option = {
    title: {
      text: "Cumplimiento de SLA",
      subtext: "48 horas para asignación",
      left: "center",
      textStyle: {
        fontSize: 16,
        fontWeight: "bold",
      },
    },
    tooltip: {
      formatter: () => {
        return `Cumplidas: ${data.cumplidas}<br/>Vencidas: ${data.vencidas}<br/>Cumplimiento: ${data.porcentaje_cumplimiento}%`;
      },
    },
    series: [
      {
        type: "gauge",
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max: 100,
        splitNumber: 10,
        axisLine: {
          lineStyle: {
            width: 30,
            color: [
              [0.5, "#ef4444"],
              [0.7, "#f59e0b"],
              [1, "#10b981"],
            ],
          },
        },
        pointer: {
          itemStyle: {
            color: "auto",
          },
        },
        axisTick: {
          distance: -30,
          length: 8,
          lineStyle: {
            color: "#fff",
            width: 2,
          },
        },
        splitLine: {
          distance: -30,
          length: 30,
          lineStyle: {
            color: "#fff",
            width: 4,
          },
        },
        axisLabel: {
          color: "auto",
          distance: 40,
          fontSize: 12,
        },
        detail: {
          valueAnimation: true,
          formatter: "{value}%",
          color: "auto",
          fontSize: 24,
          offsetCenter: [0, "70%"],
        },
        data: [
          {
            value: data.porcentaje_cumplimiento,
          },
        ],
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <ReactECharts option={option} style={{ height: "350px" }} />
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="text-center">
          <p className="text-sm text-gray-600">Cumplidas</p>
          <p className="text-2xl font-bold text-green-600">{data.cumplidas}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Vencidas</p>
          <p className="text-2xl font-bold text-red-600">{data.vencidas}</p>
        </div>
      </div>
    </div>
  );
}
