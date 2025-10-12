"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { PieChartProps } from "../types/types";

export const PieChart = ({ meses, paleta }: PieChartProps) => {
  const totalRegistradas = meses.reduce(
    (a, m) => a + m.denuncias_registradas,
    0
  );
  const totalAsignadas = meses.reduce((a, m) => a + m.denuncias_asignadas, 0);
  const totalCerradas = meses.reduce((a, m) => a + m.denuncias_cerradas, 0);

  const optionPie = useMemo(
    () => ({
      tooltip: { trigger: "item" },
      legend: { bottom: 0 },
      series: [
        {
          name: "Estados de Denuncias",
          type: "pie",
          radius: ["40%", "70%"],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: "#fff",
            borderWidth: 2,
          },
          label: {
            show: true,
            formatter: "{b}: {d}%",
          },
          data: [
            {
              value: totalRegistradas,
              name: "Pendientes",
              itemStyle: { color: paleta.primaria },
            },
            {
              value: totalAsignadas,
              name: "En curso",
              itemStyle: { color: paleta.secundaria },
            },
            {
              value: totalCerradas,
              name: "Cerradas",
              itemStyle: { color: paleta.acento },
            },
          ],
        },
      ],
    }),
    [totalRegistradas, totalAsignadas, totalCerradas, paleta]
  );

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
      <div className="font-semibold text-gray-700 mb-4">
        Estados de las Denuncias (Total)
      </div>
      <ReactECharts
        option={optionPie}
        style={{ width: "100%", height: 320 }}
        opts={{ renderer: "svg" }}
      />
    </div>
  );
};
