"use client";

import ReactECharts from "echarts-for-react";

interface SaludSistemaData {
  score: number;
  sla: number;
  asignacion: number;
  resolucion: number;
}

interface SaludSistemaGaugeProps {
  data: SaludSistemaData;
}

export default function SaludSistemaGauge({ data }: SaludSistemaGaugeProps) {
  const getColor = (score: number) => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const getTexto = (score: number) => {
    if (score >= 80) return "Excelente";
    if (score >= 60) return "Bueno";
    if (score >= 40) return "Regular";
    return "Crítico";
  };

  const option = {
    title: {
      text: "Salud del Sistema",
      left: "center",
      textStyle: { fontSize: 16, fontWeight: "bold" },
    },
    series: [
      {
        type: "gauge",
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max: 100,
        splitNumber: 4,
        radius: "80%",
        center: ["50%", "70%"],
        axisLine: {
          lineStyle: {
            width: 30,
            color: [
              [0.4, "#ef4444"],
              [0.6, "#f59e0b"],
              [0.8, "#3b82f6"],
              [1, "#10b981"],
            ],
          },
        },
        pointer: {
          itemStyle: { color: "auto" },
        },
        axisTick: {
          distance: -30,
          length: 8,
          lineStyle: { color: "#fff", width: 2 },
        },
        splitLine: {
          distance: -30,
          length: 30,
          lineStyle: { color: "#fff", width: 4 },
        },
        axisLabel: {
          color: "auto",
          distance: 40,
          fontSize: 12,
        },
        detail: {
          valueAnimation: true,
          formatter: "{value}",
          color: getColor(data.score),
          fontSize: 40,
          offsetCenter: [0, "0%"],
        },
        data: [{ value: data.score }],
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <ReactECharts option={option} style={{ height: "300px" }} />
      <div className="text-center mt-2">
        <p
          className="text-2xl font-bold"
          style={{ color: getColor(data.score) }}
        >
          {getTexto(data.score)}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-center">
          <p className="text-xs text-gray-600">SLA</p>
          <p className="text-lg font-bold text-blue-600">{data.sla}%</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600">Asignación</p>
          <p className="text-lg font-bold text-green-600">{data.asignacion}%</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600">Resolución</p>
          <p className="text-lg font-bold text-purple-600">
            {data.resolucion}%
          </p>
        </div>
      </div>
    </div>
  );
}
