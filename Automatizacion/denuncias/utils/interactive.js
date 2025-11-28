/**
 * Utilidades para interacción interactiva con el usuario
 */

import readline from "readline";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Crear interfaz de readline
 */
function crearInterfaz() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * Hacer una pregunta al usuario
 */
export function hacerPregunta(pregunta) {
  return new Promise((resolve) => {
    const rl = crearInterfaz();
    rl.question(pregunta, (respuesta) => {
      rl.close();
      resolve(respuesta);
    });
  });
}

/**
 * Hacer una pregunta numérica
 */
export async function hacerPreguntaNumerica(pregunta) {
  let valor;
  while (!valor || isNaN(valor) || parseInt(valor) < 0) {
    const respuesta = await hacerPregunta(pregunta);
    valor = parseInt(respuesta);
    if (isNaN(valor) || valor < 0) {
      console.log("❌ Por favor ingresa un número válido y positivo");
    }
  }
  return valor;
}

/**
 * Hacer una pregunta de confirmación (s/n)
 */
export async function hacerPreguntaConfirmacion(pregunta) {
  const respuesta = await hacerPregunta(pregunta + " (s/n): ");
  return respuesta.toLowerCase() === "s" || respuesta.toLowerCase() === "si";
}

/**
 * Solicitar cantidades de denuncias al usuario
 */
export async function solicitarCantidadesDenuncias() {
  console.log("\n" + "═".repeat(80));
  console.log("  CONFIGURACIÓN DE DENUNCIAS A GENERAR");
  console.log("═".repeat(80) + "\n");

  const pendientes = await hacerPreguntaNumerica(
    "¿Cuántas denuncias PENDIENTES deseas crear? "
  );
  const enProceso = await hacerPreguntaNumerica(
    "¿Cuántas denuncias EN PROCESO deseas crear? "
  );
  const cerradas = await hacerPreguntaNumerica(
    "¿Cuántas denuncias CERRADAS deseas crear? "
  );

  const total = pendientes + enProceso + cerradas;

  console.log("\n" + "─".repeat(80));
  console.log("📊 RESUMEN DE CONFIGURACIÓN:");
  console.log("─".repeat(80));
  console.log(`   Denuncias Pendientes: ${pendientes}`);
  console.log(`   Denuncias En Proceso: ${enProceso}`);
  console.log(`   Denuncias Cerradas:   ${cerradas}`);
  console.log(`   ────────────────────────────`);
  console.log(`   TOTAL A CREAR:        ${total} denuncias`);
  console.log("─".repeat(80) + "\n");

  if (total === 0) {
    console.log(
      "❌ No puedes crear 0 denuncias. Por favor intenta nuevamente.\n"
    );
    return solicitarCantidadesDenuncias();
  }

  const aceptar = await hacerPreguntaConfirmacion(
    "¿Deseas continuar con esta configuración?"
  );

  if (!aceptar) {
    console.log("\n🔄 Reconfigurando...\n");
    return solicitarCantidadesDenuncias();
  }

  return {
    pendientes,
    enProceso,
    cerradas,
    total,
  };
}

/**
 * Obtener archivos de ubicación disponibles
 */
function obtenerArchivosUbicacion() {
  const dataPath = path.join(__dirname, "..", "data");
  const archivos = fs
    .readdirSync(dataPath)
    .filter((f) => f.startsWith("ubicacion") && f.endsWith(".js"))
    .map((f) => f.replace(".js", ""));

  return archivos;
}

/**
 * Cargar una ubicación desde un archivo
 */
async function cargarUbicacion(nombreArchivo) {
  try {
    const modulePath = `../data/${nombreArchivo}.js`;
    const modulo = await import(modulePath);

    // Buscar la primera exportación que sea un objeto de ubicación
    const ubicaciones = Object.entries(modulo).filter(
      ([, value]) =>
        typeof value === "object" &&
        value !== null &&
        (value.nombre || value.direccion || value.coordenadas)
    );

    if (ubicaciones.length === 0) {
      throw new Error("No se encontraron ubicaciones válidas");
    }

    return ubicaciones[0][1]; // Retornar la primera ubicación encontrada
  } catch (error) {
    console.error(`❌ Error al cargar ubicación: ${error.message}`);
    return null;
  }
}

/**
 * Validar formato de fecha YYYY-MM-DD
 */
function validarFecha(fecha) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(fecha)) return false;

  const date = new Date(fecha);
  return date instanceof Date && !isNaN(date);
}

/**
 * Hacer una pregunta de fecha
 */
async function hacerPreguntaFecha(pregunta) {
  let fecha;
  while (!fecha || !validarFecha(fecha)) {
    const respuesta = await hacerPregunta(pregunta);
    if (!validarFecha(respuesta)) {
      console.log(
        "❌ Formato inválido. Usa el formato YYYY-MM-DD (ej: 2025-11-24)"
      );
      fecha = null;
    } else {
      fecha = respuesta;
    }
  }
  return fecha;
}

/**
 * Solicitar configuración de fechas al usuario
 */
export async function solicitarConfiguracionFechas() {
  console.log("\n" + "═".repeat(80));
  console.log("  CONFIGURACIÓN DE FECHAS");
  console.log("═".repeat(80) + "\n");

  console.log("¿Qué tipo de denuncias deseas crear?\n");
  console.log("   1. Solo denuncias recientes (pasadas)");
  console.log("   2. Solo denuncias futuras");
  console.log("   3. Ambas (recientes y futuras)\n");

  let opcion;
  while (!opcion || opcion < 1 || opcion > 3) {
    const respuesta = await hacerPregunta("Selecciona una opción (1, 2 o 3): ");
    opcion = parseInt(respuesta);
    if (isNaN(opcion) || opcion < 1 || opcion > 3) {
      console.log("❌ Opción inválida. Intenta nuevamente.");
      opcion = null;
    }
  }

  const config = {};

  if (opcion === 1) {
    // Solo denuncias recientes
    console.log("\n" + "─".repeat(80));
    console.log("📅 DENUNCIAS RECIENTES");
    console.log("─".repeat(80) + "\n");

    config.fechaInicioPasadas = await hacerPreguntaFecha(
      "Ingresa la fecha de inicio (YYYY-MM-DD): "
    );
    config.fechaFinPasadas = await hacerPreguntaFecha(
      "Ingresa la fecha de fin (YYYY-MM-DD): "
    );
    config.tipo = "recientes";
  } else if (opcion === 2) {
    // Solo denuncias futuras
    console.log("\n" + "─".repeat(80));
    console.log("📅 DENUNCIAS FUTURAS");
    console.log("─".repeat(80) + "\n");

    config.fechaInicioFuturas = await hacerPreguntaFecha(
      "Ingresa la fecha de inicio (YYYY-MM-DD): "
    );
    config.fechaFinFuturas = await hacerPreguntaFecha(
      "Ingresa la fecha de fin (YYYY-MM-DD): "
    );
    config.tipo = "futuras";
  } else {
    // Ambas
    console.log("\n" + "─".repeat(80));
    console.log("📅 DENUNCIAS RECIENTES");
    console.log("─".repeat(80) + "\n");

    config.fechaInicioPasadas = await hacerPreguntaFecha(
      "Ingresa la fecha de inicio (YYYY-MM-DD): "
    );
    config.fechaFinPasadas = await hacerPreguntaFecha(
      "Ingresa la fecha de fin (YYYY-MM-DD): "
    );

    console.log("\n" + "─".repeat(80));
    console.log("📅 DENUNCIAS FUTURAS");
    console.log("─".repeat(80) + "\n");

    config.fechaInicioFuturas = await hacerPreguntaFecha(
      "Ingresa la fecha de inicio (YYYY-MM-DD): "
    );
    config.fechaFinFuturas = await hacerPreguntaFecha(
      "Ingresa la fecha de fin (YYYY-MM-DD): "
    );
    config.tipo = "ambas";
  }

  // Mostrar resumen de fechas
  console.log("\n" + "─".repeat(80));
  console.log("📅 FECHAS CONFIGURADAS:");
  console.log("─".repeat(80));

  if (config.fechaInicioPasadas) {
    console.log(
      `   Denuncias Recientes: ${config.fechaInicioPasadas} a ${config.fechaFinPasadas}`
    );
  }
  if (config.fechaInicioFuturas) {
    console.log(
      `   Denuncias Futuras: ${config.fechaInicioFuturas} a ${config.fechaFinFuturas}`
    );
  }
  console.log("─".repeat(80) + "\n");

  const aceptar = await hacerPreguntaConfirmacion("¿Deseas usar estas fechas?");

  if (!aceptar) {
    console.log("\n🔄 Reconfigurando fechas...\n");
    return solicitarConfiguracionFechas();
  }

  return config;
}

/**
 * Solicitar selección de ubicación al usuario
 */
export async function solicitarSeleccionUbicacion() {
  const archivos = obtenerArchivosUbicacion();

  console.log("\n" + "═".repeat(80));
  console.log("  SELECCIONAR ARCHIVO DE UBICACIÓN");
  console.log("═".repeat(80) + "\n");

  if (archivos.length === 0) {
    console.log("❌ No se encontraron archivos de ubicación disponibles.\n");
    return null;
  }

  console.log("📍 Archivos de ubicación disponibles:\n");
  archivos.forEach((archivo, index) => {
    console.log(`   ${index + 1}. ${archivo}`);
  });

  console.log();
  let opcion;
  while (!opcion || opcion < 1 || opcion > archivos.length) {
    const respuesta = await hacerPregunta(
      "Selecciona el número del archivo (o ingresa el nombre exacto): "
    );

    // Si es un número
    if (!isNaN(respuesta) && respuesta > 0 && respuesta <= archivos.length) {
      opcion = parseInt(respuesta);
    }
    // Si es un nombre exacto
    else if (archivos.includes(respuesta)) {
      opcion = archivos.indexOf(respuesta) + 1;
    } else {
      console.log("❌ Opción inválida. Intenta nuevamente.");
    }
  }

  const archivoSeleccionado = archivos[opcion - 1];
  console.log(`\n✓ Cargando ubicación desde: ${archivoSeleccionado}`);

  const ubicacion = await cargarUbicacion(archivoSeleccionado);

  if (!ubicacion) {
    console.log("❌ No se pudo cargar la ubicación. Intenta nuevamente.\n");
    return solicitarSeleccionUbicacion();
  }

  console.log("\n" + "─".repeat(80));
  console.log("📍 UBICACIÓN SELECCIONADA:");
  console.log("─".repeat(80));
  console.log(`   Nombre: ${ubicacion.nombre || "N/A"}`);
  console.log(`   Dirección: ${ubicacion.direccion || "N/A"}`);
  if (ubicacion.coordenadas) {
    console.log(
      `   Coordenadas: ${ubicacion.coordenadas.lat}, ${ubicacion.coordenadas.lng}`
    );
  }
  if (ubicacion.radio_metros) {
    console.log(`   Radio: ${ubicacion.radio_metros} metros`);
  }
  console.log("─".repeat(80) + "\n");

  const aceptar = await hacerPreguntaConfirmacion(
    "¿Deseas usar esta ubicación?"
  );

  if (!aceptar) {
    console.log("\n🔄 Seleccionando otra ubicación...\n");
    return solicitarSeleccionUbicacion();
  }

  return ubicacion;
}

/**
 * Solicitar configuración de rango horario
 */
export async function solicitarRangoHorario() {
  console.log("\n" + "═".repeat(80));
  console.log("  CONFIGURACIÓN DE RANGO HORARIO");
  console.log("═".repeat(80) + "\n");

  console.log("¿Deseas especificar un rango horario para las denuncias?\n");
  console.log("   1. Utilizar rangos automáticos por categoría");
  console.log("   2. Especificar un rango horario fijo\n");

  let opcion;
  while (!opcion || opcion < 1 || opcion > 2) {
    const respuesta = await hacerPregunta("Selecciona una opción (1 o 2): ");
    opcion = parseInt(respuesta);
    if (isNaN(opcion) || opcion < 1 || opcion > 2) {
      console.log("❌ Opción inválida. Intenta nuevamente.");
      opcion = null;
    }
  }

  const config = {};

  if (opcion === 1) {
    config.tipo = "automatico";
    console.log(
      "\n✓ Se utilizarán rangos horarios automáticos por categoría.\n"
    );
  } else {
    config.tipo = "fijo";

    console.log("\n" + "─".repeat(80));
    console.log("⏰ RANGO HORARIO FIJO");
    console.log("─".repeat(80) + "\n");

    let horaInicio;
    while (
      horaInicio === undefined ||
      isNaN(horaInicio) ||
      horaInicio < 0 ||
      horaInicio > 23
    ) {
      const respuesta = await hacerPregunta(
        "Ingresa la hora de inicio (0-23): "
      );
      horaInicio = parseInt(respuesta);
      if (isNaN(horaInicio) || horaInicio < 0 || horaInicio > 23) {
        console.log("❌ Por favor ingresa una hora válida (0-23).");
        horaInicio = undefined;
      }
    }

    let horaFin;
    while (
      horaFin === undefined ||
      isNaN(horaFin) ||
      horaFin < 0 ||
      horaFin > 23
    ) {
      const respuesta = await hacerPregunta("Ingresa la hora de fin (0-23): ");
      horaFin = parseInt(respuesta);
      if (isNaN(horaFin) || horaFin < 0 || horaFin > 23) {
        console.log("❌ Por favor ingresa una hora válida (0-23).");
        horaFin = undefined;
      }
    }

    config.horaInicio = horaInicio;
    config.horaFin = horaFin;

    console.log("\n" + "─".repeat(80));
    console.log("⏰ RANGO HORARIO CONFIGURADO:");
    console.log("─".repeat(80));
    console.log(`   De: ${String(horaInicio).padStart(2, "0")}:00`);
    console.log(`   Hasta: ${String(horaFin).padStart(2, "0")}:00`);
    console.log("─".repeat(80) + "\n");

    const aceptar = await hacerPreguntaConfirmacion(
      "¿Deseas usar este rango horario?"
    );

    if (!aceptar) {
      console.log("\n🔄 Reconfigurando rango horario...\n");
      return solicitarRangoHorario();
    }
  }

  return config;
}
