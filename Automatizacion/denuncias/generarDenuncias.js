#!/usr/bin/env node

/**
 * Script principal para generar denuncias
 * Arquitectura modular - San Bernardo Portal Web
 */

import "dotenv/config";
import { cargarTodosDatos } from "./loaders/cargarDatos.js";
import { procesarTodasDenuncias } from "./processors/procesarLote.js";
import { generarReportes } from "./reports/generarReportes.js";
import { CONFIG, actualizarCONFIG } from "./config/configuracion.js";
import {
  tieneCheckpointPendiente,
  cargarCheckpoint,
  limpiarCheckpoint,
} from "./utils/checkpoint.js";
import {
  solicitarCantidadesDenuncias,
  solicitarSeleccionUbicacion,
  solicitarConfiguracionFechas,
  solicitarRangoHorario,
  hacerPreguntaConfirmacion,
} from "./utils/interactive.js";

/**
 * Función principal
 */
async function main() {
  const inicio = Date.now();

  console.clear();
  
  
  

  try {
    // 1. Solicitar configuración al usuario
    const cantidades = await solicitarCantidadesDenuncias();
    const ubicacion = await solicitarSeleccionUbicacion();
    const fechas = await solicitarConfiguracionFechas();
    const rangoHorario = await solicitarRangoHorario();

    if (!ubicacion) {
      throw new Error("No se seleccionó una ubicación válida");
    }

    // 2. Actualizar CONFIG con los valores del usuario
    actualizarCONFIG({
      CANTIDAD_PENDIENTES: cantidades.pendientes,
      CANTIDAD_EN_PROCESO: cantidades.enProceso,
      CANTIDAD_CERRADAS: cantidades.cerradas,
      TOTAL_DENUNCIAS: cantidades.total,
      UBICACION_SELECCIONADA: ubicacion,
      FECHA_FIJA: fechas,
      RANGO_HORARIO: rangoHorario,
    });

    // 3. Mostrar configuración final
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    if (fechas.tipo === "recientes") {
      
      
    } else if (fechas.tipo === "futuras") {
      
      
    } else {
      
      
      
    }
    
    if (rangoHorario.tipo === "automatico") {
      
    } else {
      
    }
    

    // 4. Verificar si existe checkpoint pendiente
    let checkpoint = null;
    if (tieneCheckpointPendiente()) {
      checkpoint = await cargarCheckpoint();

      if (checkpoint) {
        
        
        
        
        
        
        
        
        
        if (checkpoint.ultimoFolio) {
          
        }
        

        const reanudar = await hacerPreguntaConfirmacion(
          "\n¿Desea reanudar desde el checkpoint anterior?"
        );

        if (!reanudar) {
          
          await limpiarCheckpoint();
          checkpoint = null;
        } else {
          
        }
      }
    }

    // 5. Cargar datos desde Supabase
    const datos = await cargarTodosDatos();

    // Validaciones
    if (datos.ciudadanos.length === 0) {
      throw new Error("No hay ciudadanos en la base de datos");
    }
    if (datos.inspectores.length === 0) {
      throw new Error("No hay inspectores en la base de datos");
    }
    if (datos.operadores.length === 0) {
      throw new Error("No hay operadores en la base de datos");
    }

    
    
    
    

    // 6. Procesar denuncias
    const { resultado, contadoresInspectores, progreso } =
      await procesarTodasDenuncias(datos, checkpoint);

    // 7. Calcular duración
    const fin = Date.now();
    const duracionMs = fin - inicio;
    const minutos = Math.floor(duracionMs / 60000);
    const segundos = Math.floor((duracionMs % 60000) / 1000);
    const duracion = `${minutos}m ${segundos}s`;

    // 8. Generar reportes
    const { txtPath, jsonPath } = await generarReportes(
      resultado,
      contadoresInspectores,
      progreso,
      datos.inspectores,
      duracion
    );

    // 9. Limpiar checkpoint al completar exitosamente
    if (tieneCheckpointPendiente()) {
      await limpiarCheckpoint();
      
    }

    // 10. Resumen final
    
    
    
    
    
    
    
    
    
    
    
  } catch (error) {
    console.error("\n" + "═".repeat(80));
    console.error("  ❌ ERROR FATAL");
    console.error("═".repeat(80));
    console.error(`\n${error.message}`);
    console.error("\n💾 El checkpoint se ha guardado automáticamente.");
    
    
    process.exit(1);
  }
}

// Ejecutar
main();
