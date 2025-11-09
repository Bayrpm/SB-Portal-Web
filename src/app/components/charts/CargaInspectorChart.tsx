"use client";

import ReactECharts from "echarts-for-react";

interface CargaInspectorData {
  nombre: string;
  cantidad: number;
  turno: string;
}

interface CargaInspectorChartProps {
  data: CargaInspectorData[];
}

export default function CargaInspectorChart({
  data,
}: CargaInspectorChartProps) {
  // Tomar solo los primeros 15 para no saturar el gráfico
  const topData = data.slice(0, 15);

  const option = {
    title: {
      text: "Carga de Trabajo por Inspector",
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
        const inspector = topData.find((d) => d.nombre === params[0].name);
        return `${params[0].name}<br/>Denuncias: ${params[0].data}<br/>Turno: ${
          inspector?.turno || "N/A"
        }`;
      },
    },
    grid: {
      left: "20%",
      right: "5%",
      bottom: "10%",
      top: "15%",
    },
    xAxis: {
      type: "value",
      name: "Cantidad de Denuncias",
    },
    yAxis: {
      type: "category",
      data: topData.map((d) => d.nombre),
      axisLabel: {
        interval: 0,
      },
    },
    series: [
      {
        name: "Denuncias Asignadas",
        type: "bar",
        data: topData.map((d) => d.cantidad),
        itemStyle: {
          color: "#3b82f6",
        },
        label: {
          show: true,
          position: "right",
        },
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <ReactECharts option={option} style={{ height: "500px" }} />
    </div>
  );
}
