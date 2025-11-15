/**
 * Genera reportes de las denuncias creadas
 */

import fs from "fs/promises";
import path from "path";
import { calcularPorcentaje, formatearNumero } from "../utils/helpers.js";

/**
 * Genera reporte en texto
 */
export async function generarReporteTXT(
  resultado,
  contadoresInspectores,
  progreso,
  inspectores,
  duracion
) {
  const { cerradas, enProceso, pendientes } = resultado;
  const total = cerradas.length + enProceso.length + pendientes.length;

  let reporte = "";
  reporte += "═".repeat(80) + "\n";
  reporte += "  REPORTE DE GENERACIÓN DE DENUNCIAS\n";
  reporte += "═".repeat(80) + "\n\n";

  // Resumen general
  reporte += "📊 RESUMEN GENERAL\n";
  reporte += "─".repeat(80) + "\n";
  reporte += `Total de denuncias generadas: ${formatearNumero(total)}\n`;
  reporte += `Errores: ${progreso.errores}\n`;
  reporte += `Duración: ${duracion}\n\n`;

  // Por estado
  reporte += "📈 DISTRIBUCIÓN POR ESTADO\n";
  reporte += "─".repeat(80) + "\n";
  reporte += `Cerradas:     ${formatearNumero(
    cerradas.length
  )} (${calcularPorcentaje(cerradas.length, total)}%)\n`;
  reporte += `En Proceso:   ${formatearNumero(
    enProceso.length
  )} (${calcularPorcentaje(enProceso.length, total)}%)\n`;
  reporte += `Pendientes:   ${formatearNumero(
    pendientes.length
  )} (${calcularPorcentaje(pendientes.length, total)}%)\n\n`;

  // Por categoría
  const porCategoria = {};
  [...cerradas, ...enProceso, ...pendientes].forEach((d) => {
    const cat = d.categoriaId;
    porCategoria[cat] = (porCategoria[cat] || 0) + 1;
  });

  reporte += "📋 DISTRIBUCIÓN POR CATEGORÍA\n";
  reporte += "─".repeat(80) + "\n";
  const categorias = {
    1: "Emergencias",
    2: "Violencia y agresiones",
    3: "Robos y daños",
    4: "Drogas",
    5: "Armas",
    6: "Incivilidades",
    7: "Patrullaje municipal",
    8: "Otros",
  };
  Object.keys(categorias).forEach((catId) => {
    const cantidad = porCategoria[catId] || 0;
    const porcentaje = calcularPorcentaje(cantidad, total);
    reporte += `${categorias[catId].padEnd(25)}: ${formatearNumero(
      cantidad
    ).padStart(6)} (${porcentaje.padStart(5)}%)\n`;
  });

  // Por inspector
  reporte += "\n👷 DISTRIBUCIÓN POR INSPECTOR\n";
  reporte += "─".repeat(80) + "\n";
  const inspectoresOrdenados = Object.entries(contadoresInspectores).sort(
    (a, b) => b[1] - a[1]
  );

  inspectoresOrdenados.forEach(([inspId, cantidad]) => {
    const inspector = inspectores.find((i) => i.id === parseInt(inspId));
    const nombre = `${inspector.nombre} ${inspector.apellido}`;
    const porcentaje = calcularPorcentaje(cantidad, total - pendientes.length);
    reporte += `${nombre.padEnd(30)}: ${formatearNumero(cantidad).padStart(
      6
    )} (${porcentaje.padStart(5)}%)\n`;
  });

  reporte += "\n" + "═".repeat(80) + "\n";
  reporte += `Generado: ${new Date().toLocaleString("es-CL")}\n`;
  reporte += "═".repeat(80) + "\n";

  // Guardar archivo
  const filePath = path.join(process.cwd(), "denuncias_generadas_reporte.txt");
  await fs.writeFile(filePath, reporte, "utf-8");

  return filePath;
}

/**
 * Genera reporte en JSON
 */
export async function generarReporteJSON(
  resultado,
  contadoresInspectores,
  progreso,
  inspectores,
  duracion
) {
  const { cerradas, enProceso, pendientes } = resultado;
  const total = cerradas.length + enProceso.length + pendientes.length;

  const reporte = {
    resumen: {
      total,
      errores: progreso.errores,
      duracion,
      timestamp: new Date().toISOString(),
    },
    por_estado: {
      cerradas: {
        cantidad: cerradas.length,
        porcentaje: parseFloat(calcularPorcentaje(cerradas.length, total)),
        folios: cerradas.map((d) => d.folio),
      },
      en_proceso: {
        cantidad: enProceso.length,
        porcentaje: parseFloat(calcularPorcentaje(enProceso.length, total)),
        folios: enProceso.map((d) => d.folio),
      },
      pendientes: {
        cantidad: pendientes.length,
        porcentaje: parseFloat(calcularPorcentaje(pendientes.length, total)),
        folios: pendientes.map((d) => d.folio),
      },
    },
    por_inspector: {},
  };

  // Inspector stats
  Object.entries(contadoresInspectores).forEach(([inspId, cantidad]) => {
    const inspector = inspectores.find((i) => i.id === parseInt(inspId));
    reporte.por_inspector[inspId] = {
      nombre: `${inspector.nombre} ${inspector.apellido}`,
      email: inspector.email,
      cantidad,
      porcentaje: parseFloat(
        calcularPorcentaje(cantidad, total - pendientes.length)
      ),
    };
  });

  // Guardar archivo
  const filePath = path.join(process.cwd(), "denuncias_generadas_reporte.json");
  await fs.writeFile(filePath, JSON.stringify(reporte, null, 2), "utf-8");

  return filePath;
}

/**
 * Genera ambos reportes
 */
export async function generarReportes(
  resultado,
  contadoresInspectores,
  progreso,
  inspectores,
  duracion
) {
  console.log("\n📄 Generando reportes...\n");

  const [txtPath, jsonPath] = await Promise.all([
    generarReporteTXT(
      resultado,
      contadoresInspectores,
      progreso,
      inspectores,
      duracion
    ),
    generarReporteJSON(
      resultado,
      contadoresInspectores,
      progreso,
      inspectores,
      duracion
    ),
  ]);

  return { txtPath, jsonPath };
}
