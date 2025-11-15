/**
 * Funciones de selección y distribución
 */

import { randomWeighted, randomInt, randomFrom } from "./helpers.js";
import {
  PESOS_CATEGORIAS,
  PRIORIDADES_POR_CATEGORIA,
} from "../config/configuracion.js";

/**
 * Selecciona una categoría basada en pesos configurados
 */
export function seleccionarCategoria() {
  return parseInt(randomWeighted(PESOS_CATEGORIAS));
}

/**
 * Selecciona prioridad según la categoría
 */
export function seleccionarPrioridad(categoriaId) {
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

  const pesos = PRIORIDADES_POR_CATEGORIA[categoriaNombre];
  return parseInt(randomWeighted(pesos));
}

/**
 * Selecciona inspector de forma equitativa
 * Cuenta cuántas denuncias tiene cada inspector y selecciona el que menos tiene
 */
export function seleccionarInspectorEquitativo(inspectores, contadores) {
  // Encontrar el mínimo número de asignaciones
  const minAsignaciones = Math.min(...Object.values(contadores));

  // Filtrar inspectores con mínimo de asignaciones
  const inspectoresDisponibles = inspectores.filter(
    (insp) => contadores[insp.id] === minAsignaciones
  );

  // Seleccionar uno aleatoriamente de los disponibles
  return randomFrom(inspectoresDisponibles);
}

/**
 * Selecciona inspectores acompañantes (0-2 adicionales)
 */
export function seleccionarAcompanantes(inspectores, inspectorPrincipal) {
  const numAcompanantes = randomInt(0, 2);
  if (numAcompanantes === 0) return [];

  const disponibles = inspectores.filter((i) => i.id !== inspectorPrincipal.id);
  const seleccionados = [];

  for (let i = 0; i < numAcompanantes && disponibles.length > 0; i++) {
    const idx = randomInt(0, disponibles.length - 1);
    seleccionados.push(disponibles.splice(idx, 1)[0]);
  }

  return seleccionados;
}

/**
 * Selecciona operador aleatorio
 */
export function seleccionarOperador(operadores) {
  return randomFrom(operadores);
}

/**
 * Selecciona ciudadano aleatorio
 */
export function seleccionarCiudadano(ciudadanos) {
  return randomFrom(ciudadanos);
}

/**
 * Determina si la denuncia será anónima (20% de probabilidad)
 */
export function esAnonima() {
  return Math.random() < 0.2;
}

/**
 * Determina si consiente publicación (70% de probabilidad)
 */
export function consientePublicacion() {
  return Math.random() < 0.7;
}
