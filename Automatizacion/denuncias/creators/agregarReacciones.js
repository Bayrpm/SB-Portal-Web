/**
 * Agrega reacciones a denuncias y comentarios
 */

import { supabase } from "../loaders/cargarDatos.js";
import { randomFrom, randomInt } from "../utils/helpers.js";

/**
 * Agrega reacciones a una denuncia
 */
export async function agregarReaccionesDenuncia(denuncia, ciudadanos) {
  const estadoId = denuncia.estado_id;

  // Determinar número de reacciones (más si está cerrada)
  let numReacciones = 0;
  if (estadoId === 3) {
    // Cerrada: 0-8 reacciones (70% tiene al menos 1)
    numReacciones = Math.random() < 0.7 ? randomInt(1, 8) : 0;
  } else if (estadoId === 2) {
    // En proceso: 0-5 reacciones (50% tiene al menos 1)
    numReacciones = Math.random() < 0.5 ? randomInt(1, 5) : 0;
  } else {
    // Pendiente: 0-2 reacciones (30% tiene al menos 1)
    numReacciones = Math.random() < 0.3 ? randomInt(1, 2) : 0;
  }

  if (numReacciones === 0) {
    return [];
  }

  // Generar reacciones únicas por usuario
  const reacciones = [];
  const usuariosUsados = new Set();

  for (
    let i = 0;
    i < numReacciones && usuariosUsados.size < ciudadanos.length;
    i++
  ) {
    let ciudadano;
    do {
      ciudadano = randomFrom(ciudadanos);
    } while (usuariosUsados.has(ciudadano.usuario_id));

    usuariosUsados.add(ciudadano.usuario_id);

    // 80% LIKE, 20% DISLIKE
    const tipo = Math.random() < 0.8 ? "LIKE" : "DISLIKE";

    reacciones.push({
      denuncia_id: denuncia.id,
      usuario_id: ciudadano.usuario_id,
      tipo,
    });
  }

  // Insertar reacciones
  const { data, error } = await supabase
    .from("denuncia_reacciones")
    .insert(reacciones)
    .select();

  if (error) {
    throw new Error(`Error al agregar reacciones a denuncia: ${error.message}`);
  }

  return data;
}

/**
 * Agrega reacciones a comentarios
 */
export async function agregarReaccionesComentarios(comentarios, ciudadanos) {
  if (!comentarios || comentarios.length === 0) {
    return [];
  }

  const todasReacciones = [];

  for (const comentario of comentarios) {
    // 50% de probabilidad de tener reacciones
    if (Math.random() < 0.5) {
      const numReacciones = randomInt(1, 5);
      const usuariosUsados = new Set();

      for (
        let i = 0;
        i < numReacciones && usuariosUsados.size < ciudadanos.length;
        i++
      ) {
        let ciudadano;
        do {
          ciudadano = randomFrom(ciudadanos);
        } while (usuariosUsados.has(ciudadano.usuario_id));

        usuariosUsados.add(ciudadano.usuario_id);

        // 75% LIKE, 25% DISLIKE
        const tipo = Math.random() < 0.75 ? "LIKE" : "DISLIKE";

        todasReacciones.push({
          comentario_id: comentario.id,
          usuario_id: ciudadano.usuario_id,
          tipo,
        });
      }
    }
  }

  if (todasReacciones.length === 0) {
    return [];
  }

  // Insertar reacciones
  const { data, error } = await supabase
    .from("comentario_reacciones")
    .insert(todasReacciones)
    .select();

  if (error) {
    throw new Error(
      `Error al agregar reacciones a comentarios: ${error.message}`
    );
  }

  return data;
}
