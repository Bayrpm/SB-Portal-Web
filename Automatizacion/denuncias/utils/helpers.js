/**
 * Funciones auxiliares generales
 */

/**
 * Pausa la ejecución por un tiempo determinado
 */
export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Genera un número entero aleatorio entre min y max (inclusivo)
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Genera un número decimal aleatorio entre min y max
 */
export function randomFloat(min, max, decimals = 6) {
  const num = Math.random() * (max - min) + min;
  return parseFloat(num.toFixed(decimals));
}

/**
 * Selecciona un elemento aleatorio de un array
 */
export function randomFrom(array) {
  if (!array || array.length === 0) return null;
  return array[randomInt(0, array.length - 1)];
}

/**
 * Selecciona elemento aleatorio basado en pesos
 */
export function randomWeighted(weights) {
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (const [key, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) return key;
  }

  return Object.keys(weights)[0];
}

/**
 * Formatea una fecha a ISO string
 */
export function formatearFecha(fecha) {
  return fecha.toISOString();
}

/**
 * Genera una fecha aleatoria entre dos fechas
 */
export function fechaAleatoria(inicio, fin) {
  const inicioTime = inicio.getTime();
  const finTime = fin.getTime();
  const randomTime = inicioTime + Math.random() * (finTime - inicioTime);
  return new Date(randomTime);
}

/**
 * Mezcla un array (Fisher-Yates shuffle)
 */
export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Divide un array en chunks
 */
export function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Genera un UUID v4 simple
 */
export function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Calcula porcentaje
 */
export function calcularPorcentaje(valor, total) {
  return total === 0 ? 0 : ((valor / total) * 100).toFixed(2);
}

/**
 * Formatea número con separadores de miles
 */
export function formatearNumero(numero) {
  return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
