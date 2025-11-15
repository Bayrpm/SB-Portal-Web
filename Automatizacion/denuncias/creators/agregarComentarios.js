/**
 * Agrega comentarios ciudadanos a denuncias
 */

import { supabase } from "../loaders/cargarDatos.js";
import { randomFrom, randomInt } from "../utils/helpers.js";
import { COMENTARIOS_PLANTILLAS } from "../data/categorias.js";

/**
 * Agrega comentarios a una denuncia
 */
export async function agregarComentarios(denuncia, ciudadanos) {
  const comentarios = [];
  const estadoId = denuncia.estado_id;
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

  // Determinar número de comentarios (más si está cerrada)
  let numComentarios = 0;
  if (estadoId === 3) {
    // Cerrada: 0-4 comentarios (60% tiene al menos 1)
    numComentarios = Math.random() < 0.6 ? randomInt(1, 4) : 0;
  } else if (estadoId === 2) {
    // En proceso: 0-2 comentarios (40% tiene al menos 1)
    numComentarios = Math.random() < 0.4 ? randomInt(1, 2) : 0;
  } else {
    // Pendiente: 0-1 comentarios (20% tiene 1)
    numComentarios = Math.random() < 0.2 ? 1 : 0;
  }

  if (numComentarios === 0) {
    return [];
  }

  // Generar comentarios
  const plantillas = COMENTARIOS_PLANTILLAS[categoriaNombre];

  for (let i = 0; i < numComentarios; i++) {
    const ciudadano = randomFrom(ciudadanos);
    const contenido = randomFrom(plantillas);
    const esAnonimo = Math.random() < 0.15; // 15% anónimos

    comentarios.push({
      denuncia_id: denuncia.id,
      usuario_id: ciudadano.usuario_id,
      contenido,
      anonimo: esAnonimo,
      parent_id: null, // Comentarios raíz solamente
    });
  }

  // Insertar comentarios
  const { data, error } = await supabase
    .from("comentarios_denuncias")
    .insert(comentarios)
    .select();

  if (error) {
    throw new Error(`Error al agregar comentarios: ${error.message}`);
  }

  return data;
}
