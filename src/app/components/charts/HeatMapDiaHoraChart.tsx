"use client";

import ReactECharts from "echarts-for-react";

interface HeatMapDiaHoraChartProps {
  data: Record<string, Record<number, number>>;
}

export default function HeatMapDiaHoraChart({
  data,
}: HeatMapDiaHoraChartProps) {
  const dias = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];
  const horas = Array.from({ length: 24 }, (_, i) => `${i}:00`);

  // Convertir datos al formato requerido por ECharts
  const chartData: [number, number, number][] = [];
  let maxValue = 0;

  dias.forEach((dia, diaIndex) => {
    horas.forEach((_, horaIndex) => {
      const valor = data[dia]?.[horaIndex] || 0;
      chartData.push([horaIndex, diaIndex, valor]);
      if (valor > maxValue) maxValue = valor;
    });
  });

  const option = {
    title: {
      text: "Denuncias por Día y Hora",
      left: "center",
      textStyle: {
        fontSize: 16,
        fontWeight: "bold",
      },
    },
    tooltip: {
      position: "top",
      formatter: (params: { data: number[] }) => {
        const hora = horas[params.data[0]];
        const dia = dias[params.data[1]];
        const cantidad = params.data[2];
        return `${dia} ${hora}<br/>Denuncias: ${cantidad}`;
      },
    },
    grid: {
      height: "70%",
      top: "15%",
      left: "10%",
      right: "5%",
    },
    xAxis: {
      type: "category",
      data: horas,
      splitArea: {
        show: true,
      },
      axisLabel: {
        interval: 2, // Mostrar cada 2 horas para no saturar
      },
    },
    yAxis: {
      type: "category",
      data: dias,
      splitArea: {
        show: true,
      },
    },
    visualMap: {
      min: 0,
      max: maxValue,
      calculable: true,
      orient: "horizontal",
      left: "center",
      bottom: "0",
      inRange: {
        color: ["#f0f9ff", "#60a5fa", "#1e40af"],
      },
    },
    series: [
      {
        name: "Denuncias",
        type: "heatmap",
        data: chartData,
        label: {
          show: false,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <ReactECharts option={option} style={{ height: "450px" }} />
    </div>
  );
}
