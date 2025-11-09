import React from "react";
import ReactECharts from "echarts-for-react";

interface EstadoDistribucionChartProps {
  data: Record<string, number>;
  title?: string;
}

export default function EstadoDistribucionChart({
  data,
  title = "Distribución por Estado",
}: EstadoDistribucionChartProps) {
  const estados = Object.keys(data);
  const valores = Object.values(data);

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
        type: "shadow",
      },
      formatter: "{b}: {c} denuncias",
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
      data: estados,
      axisLabel: {
        fontSize: 11,
        interval: 0,
        rotate: 0,
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
        name: "Denuncias",
        type: "bar",
        data: valores.map((valor, index) => ({
          value: valor,
          itemStyle: {
            color: ["#00B894", "#0085CA", "#E17055", "#FDCB6E"][index % 4],
            borderRadius: [8, 8, 0, 0],
          },
        })),
        label: {
          show: true,
          position: "top",
          fontSize: 12,
          fontWeight: "bold",
          color: "#1F2937",
        },
        barWidth: "60%",
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <ReactECharts option={option} style={{ height: "350px" }} />
    </div>
  );
}
