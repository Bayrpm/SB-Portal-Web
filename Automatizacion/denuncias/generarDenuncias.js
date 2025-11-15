#!/usr/bin/env node

/**
 * Script principal para generar 1000 denuncias
 * Arquitectura modular - San Bernardo Portal Web
 */

import "dotenv/config";
import { cargarTodosDatos } from "./loaders/cargarDatos.js";
import { procesarTodasDenuncias } from "./processors/procesarLote.js";
import { generarReportes } from "./reports/generarReportes.js";
import { CONFIG } from "./config/configuracion.js";
import {
  tieneCheckpointPendiente,
  cargarCheckpoint,
  limpiarCheckpoint,
} from "./utils/checkpoint.js";
import readline from "readline";

/**
 * Pregunta al usuario si desea reanudar desde checkpoint
 */
async function preguntarReanudar() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      "\n¿Desea reanudar desde el checkpoint anterior? (s/n): ",
      (respuesta) => {
        rl.close();
        resolve(respuesta.toLowerCase() === "s");
      }
    );
  });
}

/**
 * Función principal
 */
async function main() {
  const inicio = Date.now();

  console.clear();
  console.log("═".repeat(80));
  console.log("  GENERADOR DE DENUNCIAS - PORTAL WEB SAN BERNARDO");
  console.log("═".repeat(80));
  console.log(`\n📋 Configuración:`);
  console.log(`   Total denuncias: ${CONFIG.TOTAL_DENUNCIAS}`);
  console.log(`   - Cerradas: ${CONFIG.CANTIDAD_CERRADAS}`);
  console.log(`   - En Proceso: ${CONFIG.CANTIDAD_EN_PROCESO}`);
  console.log(`   - Pendientes: ${CONFIG.CANTIDAD_PENDIENTES}`);
  console.log(`   Delay entre denuncias: ${CONFIG.DELAY_ENTRE_DENUNCIAS}ms`);
  console.log(`   Delay entre lotes: ${CONFIG.DELAY_ENTRE_LOTES}ms`);

  try {
    // Verificar si existe checkpoint pendiente
    let checkpoint = null;
    if (tieneCheckpointPendiente()) {
      checkpoint = await cargarCheckpoint();

      if (checkpoint) {
        console.log("\n" + "─".repeat(80));
        console.log("⚠️  SE ENCONTRÓ UN CHECKPOINT ANTERIOR");
        console.log("─".repeat(80));
        console.log(
          `   Fecha: ${new Date(checkpoint.timestamp).toLocaleString("es-CL")}`
        );
        console.log(
          `   Progreso: ${checkpoint.progreso.actual}/${checkpoint.progreso.total} denuncias`
        );
        console.log(
          `   - Cerradas: ${checkpoint.denuncias.cerradas}/${CONFIG.CANTIDAD_CERRADAS}`
        );
        console.log(
          `   - En Proceso: ${checkpoint.denuncias.enProceso}/${CONFIG.CANTIDAD_EN_PROCESO}`
        );
        console.log(
          `   - Pendientes: ${checkpoint.denuncias.pendientes}/${CONFIG.CANTIDAD_PENDIENTES}`
        );
        console.log(`   Errores: ${checkpoint.progreso.errores}`);
        if (checkpoint.ultimoFolio) {
          console.log(`   Último folio: ${checkpoint.ultimoFolio}`);
        }
        console.log("─".repeat(80));

        const reanudar = await preguntarReanudar();

        if (!reanudar) {
          console.log("\n🔄 Iniciando generación desde cero...");
          await limpiarCheckpoint();
          checkpoint = null;
        } else {
          console.log("\n✅ Reanudando desde checkpoint anterior...");
        }
      }
    }

    // 1. Cargar datos desde Supabase
    const datos = await cargarTodosDatos();

    // Validaciones
    if (datos.ciudadanos.length === 0) {
      throw new Error("No hay ciudadanos en la base de datos");
    }
    if (datos.inspectores.length === 0) {
      throw new Error("No hay inspectores en la base de datos");
    }
    if (datos.operadores.length === 0) {
      throw new Error("No hay operadores en la base de datos");
    }

    console.log(`\n✓ Datos cargados correctamente`);
    console.log(`   - ${datos.ciudadanos.length} ciudadanos`);
    console.log(`   - ${datos.inspectores.length} inspectores`);
    console.log(`   - ${datos.operadores.length} operadores`);

    // 2. Procesar denuncias
    const { resultado, contadoresInspectores, progreso } =
      await procesarTodasDenuncias(datos, checkpoint);

    // 3. Calcular duración
    const fin = Date.now();
    const duracionMs = fin - inicio;
    const minutos = Math.floor(duracionMs / 60000);
    const segundos = Math.floor((duracionMs % 60000) / 1000);
    const duracion = `${minutos}m ${segundos}s`;

    // 4. Generar reportes
    const { txtPath, jsonPath } = await generarReportes(
      resultado,
      contadoresInspectores,
      progreso,
      datos.inspectores,
      duracion
    );

    // 5. Limpiar checkpoint al completar exitosamente
    if (tieneCheckpointPendiente()) {
      await limpiarCheckpoint();
      console.log("\n🗑️  Checkpoint limpiado exitosamente");
    }

    // 6. Resumen final
    console.log("\n" + "═".repeat(80));
    console.log("  ✅ GENERACIÓN COMPLETADA");
    console.log("═".repeat(80));
    console.log(`\n📊 Estadísticas:`);
    console.log(`   Total generadas: ${progreso.actual}`);
    console.log(`   Errores: ${progreso.errores}`);
    console.log(`   Duración: ${duracion}`);
    console.log(`\n📄 Reportes generados:`);
    console.log(`   - ${txtPath}`);
    console.log(`   - ${jsonPath}`);
    console.log("\n" + "═".repeat(80) + "\n");
  } catch (error) {
    console.error("\n" + "═".repeat(80));
    console.error("  ❌ ERROR FATAL");
    console.error("═".repeat(80));
    console.error(`\n${error.message}`);
    console.error("\n💾 El checkpoint se ha guardado automáticamente.");
    console.log(
      "   Puede reanudar el proceso ejecutando el script nuevamente.\n"
    );
    console.log("═".repeat(80) + "\n");
    process.exit(1);
  }
}

// Ejecutar
main();
