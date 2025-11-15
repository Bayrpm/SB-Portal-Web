/**
 * Procesa lotes de denuncias
 */

import { delay } from "../utils/helpers.js";
import { CONFIG, ESTADOS } from "../config/configuracion.js";
import { crearDenuncia } from "../creators/crearDenuncia.js";
import { asignarInspectores } from "../creators/asignarInspectores.js";
import { agregarObservaciones } from "../creators/agregarObservaciones.js";
import { agregarComentarios } from "../creators/agregarComentarios.js";
import {
  agregarReaccionesDenuncia,
  agregarReaccionesComentarios,
} from "../creators/agregarReacciones.js";
import { guardarCheckpoint } from "../utils/checkpoint.js";

/**
 * Procesa un lote de denuncias
 */
export async function procesarLote(
  cantidad,
  estadoId,
  datos,
  contadoresInspectores,
  progreso,
  denunciasCreadas,
  inicio = 0
) {
  const { ciudadanos, inspectores, operadores } = datos;

  for (let i = inicio; i < cantidad; i++) {
    try {
      // 1. Crear denuncia base
      const denuncia = await crearDenuncia(ciudadanos, estadoId);

      // 2. Asignar inspectores (si aplica)
      const asignacionInfo = await asignarInspectores(
        denuncia,
        inspectores,
        operadores,
        contadoresInspectores
      );

      // 3. Agregar observaciones
      await agregarObservaciones(denuncia, asignacionInfo);

      // 4. Agregar comentarios
      const comentarios = await agregarComentarios(denuncia, ciudadanos);

      // 5. Agregar reacciones a denuncia
      await agregarReaccionesDenuncia(denuncia, ciudadanos);

      // 6. Agregar reacciones a comentarios
      await agregarReaccionesComentarios(comentarios, ciudadanos);

      denunciasCreadas.push(denuncia);

      // Delay entre denuncias
      await delay(CONFIG.DELAY_ENTRE_DENUNCIAS);

      // Actualizar progreso
      progreso.actual++;
      const porcentaje = ((progreso.actual / progreso.total) * 100).toFixed(1);
      process.stdout.write(
        `\r   Progreso: ${progreso.actual}/${progreso.total} (${porcentaje}%) - Folio: ${denuncia.folio}`
      );
    } catch (error) {
      console.error(`\n❌ Error al crear denuncia ${i + 1}:`, error.message);
      progreso.errores++;
    }
  }

  return denunciasCreadas;
}

/**
 * Procesa todas las denuncias por estado
 */
export async function procesarTodasDenuncias(datos, checkpoint = null) {
  const contadoresInspectores = {};
  datos.inspectores.forEach((insp) => {
    contadoresInspectores[insp.id] = 0;
  });

  const progreso = checkpoint
    ? checkpoint.progreso
    : {
        actual: 0,
        total: CONFIG.TOTAL_DENUNCIAS,
        errores: 0,
      };

  const resultado = {
    cerradas: [],
    enProceso: [],
    pendientes: [],
  };

  console.log("\n📝 Generando denuncias...\n");

  // Determinar desde dónde reanudar
  const inicioCerradas = checkpoint?.denuncias.cerradas || 0;
  const inicioEnProceso = checkpoint?.denuncias.enProceso || 0;
  const inicioPendientes = checkpoint?.denuncias.pendientes || 0;

  if (checkpoint) {
    console.log(`\n🔄 REANUDANDO desde checkpoint anterior:`);
    console.log(`   Ya generadas: ${progreso.actual} denuncias`);
    console.log(`   - Cerradas: ${inicioCerradas}`);
    console.log(`   - En Proceso: ${inicioEnProceso}`);
    console.log(`   - Pendientes: ${inicioPendientes}`);
    console.log(`   Errores previos: ${progreso.errores}\n`);
  }

  // 1. Denuncias cerradas (700)
  if (inicioCerradas < CONFIG.CANTIDAD_CERRADAS) {
    console.log(
      `\n🔵 Creando ${
        CONFIG.CANTIDAD_CERRADAS - inicioCerradas
      } denuncias CERRADAS...`
    );
    await procesarLote(
      CONFIG.CANTIDAD_CERRADAS,
      ESTADOS.CERRADA,
      datos,
      contadoresInspectores,
      progreso,
      resultado.cerradas,
      inicioCerradas
    );

    // Guardar checkpoint después de completar cerradas
    await guardarCheckpoint(progreso, {
      cerradas: resultado.cerradas.length,
      enProceso: resultado.enProceso.length,
      pendientes: resultado.pendientes.length,
    });
  } else {
    console.log(`\n✅ Denuncias CERRADAS ya completadas (${inicioCerradas})`);
  }

  // 2. Denuncias en proceso (240)
  if (inicioEnProceso < CONFIG.CANTIDAD_EN_PROCESO) {
    console.log(
      `\n\n🟡 Creando ${
        CONFIG.CANTIDAD_EN_PROCESO - inicioEnProceso
      } denuncias EN PROCESO...`
    );
    await procesarLote(
      CONFIG.CANTIDAD_EN_PROCESO,
      ESTADOS.EN_PROCESO,
      datos,
      contadoresInspectores,
      progreso,
      resultado.enProceso,
      inicioEnProceso
    );

    // Guardar checkpoint después de completar en proceso
    await guardarCheckpoint(progreso, {
      cerradas: resultado.cerradas.length,
      enProceso: resultado.enProceso.length,
      pendientes: resultado.pendientes.length,
    });
  } else {
    console.log(
      `\n✅ Denuncias EN PROCESO ya completadas (${inicioEnProceso})`
    );
  }

  // 3. Denuncias pendientes (60)
  if (inicioPendientes < CONFIG.CANTIDAD_PENDIENTES) {
    console.log(
      `\n\n🟠 Creando ${
        CONFIG.CANTIDAD_PENDIENTES - inicioPendientes
      } denuncias PENDIENTES...`
    );
    await procesarLote(
      CONFIG.CANTIDAD_PENDIENTES,
      ESTADOS.PENDIENTE,
      datos,
      contadoresInspectores,
      progreso,
      resultado.pendientes,
      inicioPendientes
    );

    // Guardar checkpoint final después de completar pendientes
    await guardarCheckpoint(progreso, {
      cerradas: resultado.cerradas.length,
      enProceso: resultado.enProceso.length,
      pendientes: resultado.pendientes.length,
    });
  } else {
    console.log(
      `\n✅ Denuncias PENDIENTES ya completadas (${inicioPendientes})`
    );
  }

  console.log("\n");

  return {
    resultado,
    contadoresInspectores,
    progreso,
  };
}
