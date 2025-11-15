/**
 * Sistema de checkpoint para reanudar generación
 */

import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const CHECKPOINT_FILE = "generacion_checkpoint.json";

/**
 * Guarda el progreso actual
 */
export async function guardarCheckpoint(progreso, denunciasCreadas) {
  try {
    const checkpoint = {
      timestamp: new Date().toISOString(),
      progreso: {
        actual: progreso?.actual || 0,
        total: progreso?.total || 1000,
        errores: progreso?.errores || 0,
      },
      denuncias: {
        cerradas:
          typeof denunciasCreadas?.cerradas === "number"
            ? denunciasCreadas.cerradas
            : denunciasCreadas?.cerradas?.length || 0,
        enProceso:
          typeof denunciasCreadas?.enProceso === "number"
            ? denunciasCreadas.enProceso
            : denunciasCreadas?.enProceso?.length || 0,
        pendientes:
          typeof denunciasCreadas?.pendientes === "number"
            ? denunciasCreadas.pendientes
            : denunciasCreadas?.pendientes?.length || 0,
      },
      ultimoFolio: null,
    };

    const filePath = path.join(process.cwd(), CHECKPOINT_FILE);
    await fs.writeFile(filePath, JSON.stringify(checkpoint, null, 2), "utf-8");
  } catch (error) {
    console.error("⚠️  Error al guardar checkpoint:", error.message);
  }
}

/**
 * Carga el checkpoint si existe y valida su estructura
 */
export async function cargarCheckpoint() {
  try {
    const filePath = path.join(process.cwd(), CHECKPOINT_FILE);
    const contenido = await fs.readFile(filePath, "utf-8");
    const checkpoint = JSON.parse(contenido);

    // Validar estructura
    if (!checkpoint.progreso || !checkpoint.denuncias) {
      console.warn("⚠️  Checkpoint corrupto, ignorando...");
      return null;
    }

    return checkpoint;
  } catch {
    // No existe checkpoint previo o está corrupto
    return null;
  }
}

/**
 * Elimina el checkpoint al completar
 */
export async function limpiarCheckpoint() {
  try {
    const filePath = path.join(process.cwd(), CHECKPOINT_FILE);
    await fs.unlink(filePath);
  } catch {
    // No importa si no existe
  }
}

/**
 * Verifica si hay checkpoint pendiente (síncrono)
 */
export function tieneCheckpointPendiente() {
  const filePath = path.join(process.cwd(), CHECKPOINT_FILE);
  return existsSync(filePath);
}
