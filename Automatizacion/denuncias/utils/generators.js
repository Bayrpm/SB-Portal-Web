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
  // Si hay una ubicación fija seleccionada, usarla
  if (
    CONFIG.UBICACION_SELECCIONADA &&
    CONFIG.UBICACION_SELECCIONADA.direccion
  ) {
    return CONFIG.UBICACION_SELECCIONADA.direccion;
  }

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
 * Si hay una ubicación fija, genera coordenadas alrededor de ella
 */
export function generarCoordenadas() {
  // Si hay una ubicación fija con coordenadas, generar alrededor de ella
  if (
    CONFIG.UBICACION_SELECCIONADA &&
    CONFIG.UBICACION_SELECCIONADA.coordenadas
  ) {
    const { lat, lng } = CONFIG.UBICACION_SELECCIONADA.coordenadas;
    const radio = (CONFIG.UBICACION_SELECCIONADA.radio_metros || 500) / 111320; // Convertir metros a grados

    return {
      x: randomFloat(lng - radio, lng + radio),
      y: randomFloat(lat - radio, lat + radio),
    };
  }

  // Coordenadas aleatorias dentro de San Bernardo
  return {
    x: randomFloat(-70.72, -70.68),
    y: randomFloat(-33.67, -33.59),
  };
}

/**
 * Genera fecha aleatoria según el rango de estado y configuración
 */
export function generarFechaAleatoria(estadoId) {
  const {
    FECHA_INICIO_PASADAS,
    FECHA_FIN_PASADAS,
    FECHA_INICIO_FUTURAS,
    FECHA_FIN_FUTURAS,
    FECHA_FIJA,
  } = CONFIG;

  // Si hay fechas fijas configuradas, usarlas según el tipo
  if (FECHA_FIJA) {
    let fechaInicio, fechaFin;

    if (FECHA_FIJA.tipo === "recientes") {
      fechaInicio = new Date(FECHA_FIJA.fechaInicioPasadas);
      fechaFin = new Date(FECHA_FIJA.fechaFinPasadas);
    } else if (FECHA_FIJA.tipo === "futuras") {
      fechaInicio = new Date(FECHA_FIJA.fechaInicioFuturas);
      fechaFin = new Date(FECHA_FIJA.fechaFinFuturas);
    } else if (FECHA_FIJA.tipo === "ambas") {
      // Para denuncias cerradas: usar rango pasado, sino futuro
      if (estadoId === 3) {
        fechaInicio = new Date(FECHA_FIJA.fechaInicioPasadas);
        fechaFin = new Date(FECHA_FIJA.fechaFinPasadas);
      } else {
        fechaInicio = new Date(FECHA_FIJA.fechaInicioFuturas);
        fechaFin = new Date(FECHA_FIJA.fechaFinFuturas);
      }
    }

    if (fechaInicio && fechaFin) {
      return fechaAleatoria(fechaInicio, fechaFin);
    }
  }

  // Comportamiento por defecto
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
 * Ajusta hora según categoría o rango horario fijo
 */
export function ajustarHoraCategoria(fecha, categoriaId) {
  let hora, minutos;

  // Si hay un rango horario fijo configurado, usarlo
  if (CONFIG.RANGO_HORARIO && CONFIG.RANGO_HORARIO.tipo === "fijo") {
    const { horaInicio, horaFin } = CONFIG.RANGO_HORARIO;
    hora = randomInt(horaInicio, horaFin);
    minutos = randomInt(0, 59);
  } else {
    // Usar rangos automáticos por categoría
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
    hora = randomInt(rangoHoras.min, rangoHoras.max);
    minutos = randomInt(0, 59);
  }

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
