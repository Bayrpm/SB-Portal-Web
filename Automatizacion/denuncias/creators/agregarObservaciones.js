/**
 * Agrega observaciones de operadores e inspectores
 */

import { supabase } from "../loaders/cargarDatos.js";
import { randomFrom } from "../utils/helpers.js";
import {
  OBSERVACIONES_OPERADOR,
  OBSERVACIONES_INSPECTOR,
} from "../data/categorias.js";

/**
 * Agrega observaciones a una denuncia
 */
export async function agregarObservaciones(denuncia, asignacionInfo) {
  const observaciones = [];
  const estadoId = denuncia.estado_id;

  // Solo agregar observaciones si hay asignación
  if (!asignacionInfo) {
    return [];
  }

  const { operador, inspector } = asignacionInfo;
  const categoriaNombre = {
    1: "Emergencias",
    2: "Violencia y agresiones",
    3: "Robos y daños",
    4: "Drogas",
    5: "Armas",
    6: "Incivilidades",
    7: "Patrullaje municipal",
    8: "Otros",
  }[denuncia.categoriaId];

  const prioridadNombre = {
    1: "Baja",
    2: "Media",
    3: "Alta",
    4: "Urgencia",
  }[denuncia.prioridadId];

  // Observación del operador (90% de probabilidad)
  if (Math.random() < 0.9) {
    let contenido = randomFrom(OBSERVACIONES_OPERADOR);
    contenido = contenido
      .replace("{prioridad}", prioridadNombre)
      .replace("{categoria}", categoriaNombre);

    observaciones.push({
      denuncia_id: denuncia.id,
      tipo: "OPERADOR",
      contenido,
      creado_por: operador.usuario_id,
    });
  }

  // Observación del inspector (solo si está cerrada o en proceso)
  if (estadoId >= 2 && Math.random() < 0.85) {
    const plantillas = OBSERVACIONES_INSPECTOR[categoriaNombre];
    const contenido = randomFrom(plantillas);

    observaciones.push({
      denuncia_id: denuncia.id,
      tipo: "TERRENO",
      contenido,
      creado_por: inspector.usuario_id,
    });
  }

  // Insertar observaciones
  if (observaciones.length > 0) {
    const { data, error } = await supabase
      .from("denuncia_observaciones")
      .insert(observaciones)
      .select();

    if (error) {
      throw new Error(`Error al agregar observaciones: ${error.message}`);
    }

    return data;
  }

  return [];
}
