"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { MesMetric } from "../types/types";

type ChartsProps = {
  meses: MesMetric[];
  paleta: {
    primaria: string;
    secundaria: string;
    acento: string;
  };
};

export const BarChart = ({ meses, paleta }: ChartsProps) => {
  const optionBarras = useMemo(
    () => ({
      tooltip: { trigger: "axis" },
      legend: { bottom: 0 },
      grid: { left: 48, right: 24, top: 24, bottom: 64 },
      xAxis: { type: "category", data: meses.map((m) => m.mes) },
      yAxis: { type: "value" },
      dataZoom: [
        { type: "slider", height: 18, bottom: 36 },
        { type: "inside" },
      ],
      series: [
        {
          name: "Registradas",
          type: "bar",
          data: meses.map((m) => m.denuncias_registradas),
          itemStyle: { color: paleta.primaria },
        },
        {
          name: "Asignadas",
          type: "bar",
          data: meses.map((m) => m.denuncias_asignadas),
          itemStyle: { color: paleta.secundaria },
        },
        {
          name: "Cerradas",
          type: "bar",
          data: meses.map((m) => m.denuncias_cerradas),
          itemStyle: { color: paleta.acento },
        },
      ],
    }),
    [meses, paleta]
  );

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
      <div className="font-semibold text-gray-700 mb-4">Denuncias por Mes</div>
      <ReactECharts
        option={optionBarras}
        style={{ width: "100%", height: 320 }}
        opts={{ renderer: "svg" }}
      />
    </div>
  );
};

export const LineChart = ({ meses, paleta }: ChartsProps) => {
  const optionLinea = useMemo(
    () => ({
      tooltip: { trigger: "axis" },
      legend: { bottom: 0 },
      grid: { left: 48, right: 24, top: 24, bottom: 64 },
      xAxis: { type: "category", data: meses.map((m) => m.mes) },
      yAxis: [{ type: "value" }, { type: "value" }],
      dataZoom: [
        { type: "slider", height: 18, bottom: 36 },
        { type: "inside" },
      ],
      series: [
        {
          name: "Registradas",
          type: "line",
          smooth: true,
          data: meses.map((m) => m.denuncias_registradas),
          lineStyle: { width: 3, color: paleta.primaria },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: paleta.primaria + "99" }, // color con opacidad
                { offset: 1, color: paleta.primaria + "00" }, // transparente
              ],
            },
          },
        },
        {
          name: "Asignadas",
          type: "line",
          smooth: true,
          data: meses.map((m) => m.denuncias_asignadas),
          lineStyle: { width: 3, color: paleta.secundaria },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: paleta.secundaria + "99" },
                { offset: 1, color: paleta.secundaria + "00" },
              ],
            },
          },
        },
        {
          name: "Cerradas",
          type: "line",
          smooth: true,
          data: meses.map((m) => m.denuncias_cerradas),
          lineStyle: { width: 3, color: paleta.acento },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: paleta.acento + "99" },
                { offset: 1, color: paleta.acento + "00" },
              ],
            },
          },
        },
      ],
    }),
    [meses, paleta]
  );

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
      <div className="font-semibold text-gray-700 mb-4">
        Tendencia Anual - Denuncias
      </div>
      <ReactECharts
        option={optionLinea}
        style={{ width: "100%", height: 320 }}
        opts={{ renderer: "svg" }}
      />
    </div>
  );
};
