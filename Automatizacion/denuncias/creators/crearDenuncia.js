/**
 * Crea la denuncia base en Supabase
 */

import { supabase } from "../loaders/cargarDatos.js";
import {
  generarDireccion,
  generarCoordenadas,
  generarFechaAleatoria,
  generarTitulo,
  generarDescripcion,
  ajustarHoraCategoria,
  generarFechasAtencion,
} from "../utils/generators.js";
import {
  seleccionarCategoria,
  seleccionarPrioridad,
  seleccionarCiudadano,
  esAnonima,
  consientePublicacion,
} from "../utils/selectors.js";
import { formatearFecha } from "../utils/helpers.js";

/**
 * Crea una denuncia base
 */
export async function crearDenuncia(ciudadanos, estadoId) {
  // Seleccionar datos base
  const categoriaId = seleccionarCategoria();
  const prioridadId = seleccionarPrioridad(categoriaId);
  const ciudadano = seleccionarCiudadano(ciudadanos);
  const coords = generarCoordenadas();

  // Generar fechas
  let fechaCreacion = generarFechaAleatoria(estadoId);
  fechaCreacion = ajustarHoraCategoria(fechaCreacion, categoriaId);

  const { fecha_inicio_atencion, fecha_cierre } = generarFechasAtencion(
    fechaCreacion,
    estadoId
  );

  // Construir denuncia
  const denuncia = {
    ciudadano_id: ciudadano.usuario_id,
    titulo: generarTitulo(categoriaId),
    descripcion: generarDescripcion(categoriaId),
    estado_id: estadoId,
    categoria_publica_id: categoriaId,
    prioridad_id: prioridadId,
    coords_x: coords.x,
    coords_y: coords.y,
    ubicacion_texto: generarDireccion(),
    consentir_publicacion: consientePublicacion(),
    anonimo: esAnonima(),
    fecha_creacion: formatearFecha(fechaCreacion),
    fecha_inicio_atencion: fecha_inicio_atencion
      ? formatearFecha(fecha_inicio_atencion)
      : null,
    fecha_cierre: fecha_cierre ? formatearFecha(fecha_cierre) : null,
  };

  // Insertar en Supabase
  const { data, error } = await supabase
    .from("denuncias")
    .insert([denuncia])
    .select()
    .single();

  if (error) {
    throw new Error(`Error al crear denuncia: ${error.message}`);
  }

  return {
    ...data,
    categoriaId,
    prioridadId,
  };
}
