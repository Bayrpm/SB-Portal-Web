/**
 * Configuración dinámica que se solicita al usuario en tiempo de ejecución
 * Estas son las constantes fijas que no cambian
 */
export const CONFIG_DEFAULTS = {
  DELAY_ENTRE_DENUNCIAS: 100, // 100ms - Seguro para Supabase
  DELAY_ENTRE_LOTES: 2000, // 2s - Pausa entre lotes

  // Fechas actualizadas hasta diciembre 15, 2025
  FECHA_INICIO_PASADAS: "2025-05-01",
  FECHA_FIN_PASADAS: "2025-11-30",
  FECHA_INICIO_FUTURAS: "2025-12-01",
  FECHA_FIN_FUTURAS: "2025-12-15",
};

/**
 * Configuración dinámica que se obtiene del usuario
 * Se inicializa después de solicitar los datos interactivos
 */
export let CONFIG = {
  TOTAL_DENUNCIAS: 0,
  CANTIDAD_CERRADAS: 0,
  CANTIDAD_EN_PROCESO: 0,
  CANTIDAD_PENDIENTES: 0,
  DELAY_ENTRE_DENUNCIAS: CONFIG_DEFAULTS.DELAY_ENTRE_DENUNCIAS,
  DELAY_ENTRE_LOTES: CONFIG_DEFAULTS.DELAY_ENTRE_LOTES,
  FECHA_INICIO_PASADAS: CONFIG_DEFAULTS.FECHA_INICIO_PASADAS,
  FECHA_FIN_PASADAS: CONFIG_DEFAULTS.FECHA_FIN_PASADAS,
  FECHA_INICIO_FUTURAS: CONFIG_DEFAULTS.FECHA_INICIO_FUTURAS,
  FECHA_FIN_FUTURAS: CONFIG_DEFAULTS.FECHA_FIN_FUTURAS,
  UBICACION_SELECCIONADA: null,
};

/**
 * Función para actualizar la configuración
 */
export function actualizarCONFIG(nuevaConfig) {
  Object.assign(CONFIG, nuevaConfig);
}

export const ESTADOS = {
  PENDIENTE: 1,
  EN_PROCESO: 2,
  CERRADA: 3,
};

export const PESOS_CATEGORIAS = {
  1: 0.12, // Emergencias
  2: 0.2, // Violencia y agresiones
  3: 0.18, // Robos y daños
  4: 0.05, // Drogas
  5: 0.03, // Armas
  6: 0.3, // Incivilidades
  7: 0.1, // Patrullaje municipal
  8: 0.02, // Otros
};

export const PRIORIDADES_POR_CATEGORIA = {
  Emergencias: { 4: 0.6, 3: 0.3, 2: 0.1, 1: 0.0 },
  "Violencia y agresiones": { 4: 0.3, 3: 0.5, 2: 0.15, 1: 0.05 },
  "Robos y daños": { 4: 0.1, 3: 0.4, 2: 0.4, 1: 0.1 },
  Drogas: { 4: 0.2, 3: 0.4, 2: 0.3, 1: 0.1 },
  Armas: { 4: 0.5, 3: 0.4, 2: 0.1, 1: 0.0 },
  Incivilidades: { 4: 0.0, 3: 0.1, 2: 0.5, 1: 0.4 },
  "Patrullaje municipal": { 4: 0.0, 3: 0.05, 2: 0.45, 1: 0.5 },
  Otros: { 4: 0.05, 3: 0.2, 2: 0.45, 1: 0.3 },
};

export const HORAS_POR_CATEGORIA = {
  Emergencias: { min: 0, max: 23 }, // 24/7
  "Violencia y agresiones": { min: 18, max: 2 }, // 18:00-02:00
  "Robos y daños": { min: 20, max: 5 }, // 20:00-05:00
  Drogas: { min: 16, max: 23 }, // 16:00-23:00
  Armas: { min: 18, max: 2 }, // 18:00-02:00
  Incivilidades: { min: 19, max: 1 }, // 19:00-01:00
  "Patrullaje municipal": { min: 8, max: 18 }, // 08:00-18:00
  Otros: { min: 8, max: 20 }, // 08:00-20:00
};
