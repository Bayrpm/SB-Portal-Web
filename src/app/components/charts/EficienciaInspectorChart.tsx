"use client";

import ReactECharts from "echarts-for-react";

interface EficienciaData {
  nombre: string;
  cantidad: number;
  tiempoPromedio: number;
}

interface EficienciaInspectorChartProps {
  data: EficienciaData[];
}

export default function EficienciaInspectorChart({
  data,
}: EficienciaInspectorChartProps) {
  const chartData = data
    .filter((d) => d.cantidad > 0) // Solo mostrar inspectores con asignaciones
    .map((d) => [d.cantidad, d.tiempoPromedio, d.nombre]);

  const option = {
    title: {
      text: "Eficiencia de Inspectores",
      subtext: "Denuncias vs Tiempo Promedio de Resolución",
      left: "center",
      textStyle: {
        fontSize: 16,
        fontWeight: "bold",
      },
    },
    tooltip: {
      trigger: "item",
      formatter: (params: { value: [number, number, string] }) => {
        return `${params.value[2]}<br/>Denuncias: ${params.value[0]}<br/>Tiempo Promedio: ${params.value[1]} horas`;
      },
    },
    grid: {
      left: "10%",
      right: "5%",
      bottom: "15%",
      top: "20%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
      name: "Cantidad de Denuncias",
      nameLocation: "middle",
      nameGap: 30,
    },
    yAxis: {
      type: "value",
      name: "Tiempo Promedio (horas)",
      nameLocation: "middle",
      nameGap: 50,
    },
    series: [
      {
        name: "Inspectores",
        type: "scatter",
        symbolSize: 15,
        data: chartData,
        itemStyle: {
          color: "#10b981",
          opacity: 0.7,
        },
        emphasis: {
          itemStyle: {
            color: "#059669",
            opacity: 1,
            borderColor: "#000",
            borderWidth: 2,
          },
        },
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <ReactECharts option={option} style={{ height: "400px" }} />
      <p className="text-xs text-gray-500 mt-2 text-center">
        💡 Inspectores en la parte inferior izquierda son más eficientes (menos
        tiempo, pocas denuncias) o nuevos
      </p>
    </div>
  );
}
