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

  
  
  
  
  
  
  
  
  

  if (total === 0) {
    
    return solicitarCantidadesDenuncias();
  }

  const aceptar = await hacerPreguntaConfirmacion(
    "¿Deseas continuar con esta configuración?"
  );

  if (!aceptar) {
    
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

  // Parse year, month, day
  const [year, month, day] = fecha.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  // Check that the date components match (to avoid Date auto-correction)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Hacer una pregunta de fecha
 */
async function hacerPreguntaFecha(pregunta) {
  let fecha;
  while (!fecha || !validarFecha(fecha)) {
    const respuesta = await hacerPregunta(pregunta);
    if (!validarFecha(respuesta)) {
      
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
  
  
  

  
  
  
  

  let opcion;
  while (!opcion || opcion < 1 || opcion > 3) {
    const respuesta = await hacerPregunta("Selecciona una opción (1, 2 o 3): ");
    opcion = parseInt(respuesta);
    if (isNaN(opcion) || opcion < 1 || opcion > 3) {
      
      opcion = null;
    }
  }

  const config = {};

  if (opcion === 1) {
    // Solo denuncias recientes
    
    
    

    config.fechaInicioPasadas = await hacerPreguntaFecha(
      "Ingresa la fecha de inicio (YYYY-MM-DD): "
    );
    config.fechaFinPasadas = await hacerPreguntaFecha(
      "Ingresa la fecha de fin (YYYY-MM-DD): "
    );
    config.tipo = "recientes";
  } else if (opcion === 2) {
    // Solo denuncias futuras
    
    
    

    config.fechaInicioFuturas = await hacerPreguntaFecha(
      "Ingresa la fecha de inicio (YYYY-MM-DD): "
    );
    config.fechaFinFuturas = await hacerPreguntaFecha(
      "Ingresa la fecha de fin (YYYY-MM-DD): "
    );
    config.tipo = "futuras";
  } else {
    // Ambas
    
    
    

    config.fechaInicioPasadas = await hacerPreguntaFecha(
      "Ingresa la fecha de inicio (YYYY-MM-DD): "
    );
    config.fechaFinPasadas = await hacerPreguntaFecha(
      "Ingresa la fecha de fin (YYYY-MM-DD): "
    );

    
    
    

    config.fechaInicioFuturas = await hacerPreguntaFecha(
      "Ingresa la fecha de inicio (YYYY-MM-DD): "
    );
    config.fechaFinFuturas = await hacerPreguntaFecha(
      "Ingresa la fecha de fin (YYYY-MM-DD): "
    );
    config.tipo = "ambas";
  }

  // Mostrar resumen de fechas
  
  
  

  if (config.fechaInicioPasadas) {
    
  }
  if (config.fechaInicioFuturas) {
    
  }
  

  const aceptar = await hacerPreguntaConfirmacion("¿Deseas usar estas fechas?");

  if (!aceptar) {
    
    return solicitarConfiguracionFechas();
  }

  return config;
}

/**
 * Solicitar selección de ubicación al usuario
 */
export async function solicitarSeleccionUbicacion() {
  const archivos = obtenerArchivosUbicacion();

  
  
  

  if (archivos.length === 0) {
    
    return null;
  }

  
  archivos.forEach((archivo, index) => {
    
  });

  
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
      
    }
  }

  const archivoSeleccionado = archivos[opcion - 1];
  

  const ubicacion = await cargarUbicacion(archivoSeleccionado);

  if (!ubicacion) {
    
    return solicitarSeleccionUbicacion();
  }

  
  
  
  
  
  if (ubicacion.coordenadas) {
    
  }
  if (ubicacion.radio_metros) {
    
  }
  

  const aceptar = await hacerPreguntaConfirmacion(
    "¿Deseas usar esta ubicación?"
  );

  if (!aceptar) {
    
    return solicitarSeleccionUbicacion();
  }

  return ubicacion;
}

/**
 * Solicitar configuración de rango horario
 */
export async function solicitarRangoHorario() {
  
  
  

  
  
  

  let opcion;
  while (!opcion || opcion < 1 || opcion > 2) {
    const respuesta = await hacerPregunta("Selecciona una opción (1 o 2): ");
    opcion = parseInt(respuesta);
    if (isNaN(opcion) || opcion < 1 || opcion > 2) {
      
      opcion = null;
    }
  }

  const config = {};

  if (opcion === 1) {
    config.tipo = "automatico";
    
  } else {
    config.tipo = "fijo";

    
    
    

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
        
        horaFin = undefined;
      }
    }

    config.horaInicio = horaInicio;
    config.horaFin = horaFin;

    
    
    
    
    
    

    const aceptar = await hacerPreguntaConfirmacion(
      "¿Deseas usar este rango horario?"
    );

    if (!aceptar) {
      
      return solicitarRangoHorario();
    }
  }

  return config;
}
