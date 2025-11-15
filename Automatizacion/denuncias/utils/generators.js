/**
 * Funciones generadoras de datos realistas
 */

import { faker } from "@faker-js/faker/locale/es";
import {
  randomFrom,
  randomInt,
  randomFloat,
  fechaAleatoria,
} from "./helpers.js";
import { DIRECCIONES } from "../data/direcciones.js";
import { TITULOS_PLANTILLAS, DESCRIPCIONES_BASE } from "../data/categorias.js";
import {
  CONFIG,
  HORAS_POR_CATEGORIA as HORAS_CONFIG,
} from "../config/configuracion.js";

/**
 * Genera una dirección realista de San Bernardo
 */
export function generarDireccion() {
  const tipo = randomFrom(["avenida", "calle", "pasaje"]);
  const nombreVia = randomFrom(
    DIRECCIONES[
      tipo === "avenida" ? "avenidas" : tipo === "calle" ? "calles" : "pasajes"
    ]
  );
  const numero = randomInt(100, 9999);

  return `${
    tipo === "avenida" ? "Av." : tipo === "calle" ? "Calle" : "Pasaje"
  } ${nombreVia} ${numero}`;
}

/**
 * Genera coordenadas dentro de San Bernardo
 * Aproximadamente: lat -33.59 a -33.67, lon -70.68 a -70.72
 */
export function generarCoordenadas() {
  return {
    x: randomFloat(-70.72, -70.68),
    y: randomFloat(-33.67, -33.59),
  };
}

/**
 * Genera fecha aleatoria según el rango de estado
 */
export function generarFechaAleatoria(estadoId) {
  const {
    FECHA_INICIO_PASADAS,
    FECHA_FIN_PASADAS,
    FECHA_INICIO_FUTURAS,
    FECHA_FIN_FUTURAS,
  } = CONFIG;

  // Cerradas: entre mayo y noviembre 2025
  if (estadoId === 3) {
    return fechaAleatoria(
      new Date(FECHA_INICIO_PASADAS),
      new Date(FECHA_FIN_PASADAS)
    );
  }

  // Pendientes y En proceso: entre diciembre 1 y 15, 2025
  return fechaAleatoria(
    new Date(FECHA_INICIO_FUTURAS),
    new Date(FECHA_FIN_FUTURAS)
  );
}

/**
 * Genera título según categoría
 */
export function generarTitulo(categoriaId) {
  const categoriaNombre = {
    1: "Emergencias",
    2: "Violencia y agresiones",
    3: "Robos y daños",
    4: "Drogas",
    5: "Armas",
    6: "Incivilidades",
    7: "Patrullaje municipal",
    8: "Otros",
  }[categoriaId];

  const plantillas = TITULOS_PLANTILLAS[categoriaNombre];
  const plantilla = randomFrom(plantillas);
  const direccion = generarDireccion();

  return plantilla.replace("{direccion}", direccion);
}

/**
 * Genera descripción según categoría
 */
export function generarDescripcion(categoriaId) {
  const categoriaNombre = {
    1: "Emergencias",
    2: "Violencia y agresiones",
    3: "Robos y daños",
    4: "Drogas",
    5: "Armas",
    6: "Incivilidades",
    7: "Patrullaje municipal",
    8: "Otros",
  }[categoriaId];

  const bases = DESCRIPCIONES_BASE[categoriaNombre];
  const base = randomFrom(bases);

  // 50% de probabilidad de agregar detalles adicionales
  if (Math.random() < 0.5) {
    const detalle = faker.lorem.sentence();
    return `${base} ${detalle}`;
  }

  return base;
}

/**
 * Ajusta hora según categoría
 */
export function ajustarHoraCategoria(fecha, categoriaId) {
  const categoriaNombre = {
    1: "Emergencias",
    2: "Violencia y agresiones",
    3: "Robos y daños",
    4: "Drogas",
    5: "Armas",
    6: "Incivilidades",
    7: "Patrullaje municipal",
    8: "Otros",
  }[categoriaId];

  const rangoHoras = HORAS_CONFIG[categoriaNombre];
  const hora = randomInt(rangoHoras.min, rangoHoras.max);
  const minutos = randomInt(0, 59);

  fecha.setHours(hora, minutos, 0, 0);
  return fecha;
}

/**
 * Genera fechas de atención para denuncias cerradas
 */
export function generarFechasAtencion(fechaCreacion, estadoId) {
  if (estadoId === 1) {
    // Pendiente: sin fechas de atención
    return { fecha_inicio_atencion: null, fecha_cierre: null };
  }

  // Inicio de atención: entre 1-48 horas después de creación
  const inicioAtencion = new Date(fechaCreacion);
  inicioAtencion.setHours(inicioAtencion.getHours() + randomInt(1, 48));

  if (estadoId === 2) {
    // En proceso: solo inicio de atención
    return { fecha_inicio_atencion: inicioAtencion, fecha_cierre: null };
  }

  // Cerrada: inicio + cierre (entre 1-72 horas después de inicio)
  const cierre = new Date(inicioAtencion);
  cierre.setHours(cierre.getHours() + randomInt(1, 72));

  return { fecha_inicio_atencion: inicioAtencion, fecha_cierre: cierre };
}
