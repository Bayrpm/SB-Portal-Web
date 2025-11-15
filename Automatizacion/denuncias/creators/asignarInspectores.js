/**
 * Asigna inspectores a denuncias
 */

import { supabase } from "../loaders/cargarDatos.js";
import {
  seleccionarInspectorEquitativo,
  seleccionarAcompanantes,
  seleccionarOperador,
} from "../utils/selectors.js";
import { formatearFecha } from "../utils/helpers.js";

/**
 * Asigna inspector a una denuncia
 */
export async function asignarInspectores(
  denuncia,
  inspectores,
  operadores,
  contadoresInspectores
) {
  const estadoId = denuncia.estado_id;

  // Solo asignar si no es Pendiente
  if (estadoId === 1) {
    return null;
  }

  // Seleccionar inspector equitativamente
  const inspector = seleccionarInspectorEquitativo(
    inspectores,
    contadoresInspectores
  );
  const operador = seleccionarOperador(operadores);

  // Incrementar contador
  contadoresInspectores[inspector.id]++;

  // Seleccionar acompañantes (0-2)
  const acompanantes = seleccionarAcompanantes(inspectores, inspector);

  // Fecha de derivación: poco después de creación
  const fechaDerivacion = new Date(denuncia.fecha_creacion);
  fechaDerivacion.setMinutes(
    fechaDerivacion.getMinutes() + Math.floor(Math.random() * 120) + 30
  );

  // Construir asignación
  const asignacion = {
    denuncia_id: denuncia.id,
    inspector_id: inspector.id,
    asignado_por: operador.usuario_id,
    fecha_derivacion: formatearFecha(fechaDerivacion),
    fecha_inicio_atencion: denuncia.fecha_inicio_atencion,
    fecha_termino: denuncia.fecha_cierre,
  };

  // Insertar en Supabase
  const { data, error } = await supabase
    .from("asignaciones_inspector")
    .insert([asignacion])
    .select()
    .single();

  if (error) {
    throw new Error(`Error al asignar inspector: ${error.message}`);
  }

  // Actualizar inspector_id en denuncia
  await supabase
    .from("denuncias")
    .update({ inspector_id: inspector.id })
    .eq("id", denuncia.id);

  return {
    asignacion: data,
    inspector,
    acompanantes,
    operador,
  };
}
