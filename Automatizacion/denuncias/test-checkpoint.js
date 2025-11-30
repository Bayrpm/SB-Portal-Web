/**
 * Script de prueba del sistema de checkpoint
 */

import {
  guardarCheckpoint,
  cargarCheckpoint,
  tieneCheckpointPendiente,
  limpiarCheckpoint,
} from "./utils/checkpoint.js";

async function testCheckpoint() {
  

  // Test 1: Verificar que no existe checkpoint
  
  const existeInicial = tieneCheckpointPendiente();
  
  if (existeInicial) {
    
    await limpiarCheckpoint();
  }

  // Test 2: Guardar checkpoint
  
  const progreso = {
    actual: 350,
    total: 1000,
    errores: 2,
  };
  const denuncias = {
    cerradas: 350,
    enProceso: 0,
    pendientes: 0,
  };
  await guardarCheckpoint(progreso, denuncias);
  

  // Test 3: Verificar que existe
  
  const existeAhora = tieneCheckpointPendiente();
  

  // Test 4: Cargar checkpoint
  
  const checkpoint = await cargarCheckpoint();
  if (checkpoint) {
    
    
    
    
    
    
    
    
  } else {
    
  }

  // Test 5: Limpiar checkpoint
  
  await limpiarCheckpoint();
  

  // Test 6: Verificar que ya no existe
  
  const existeFinal = tieneCheckpointPendiente();
  

  
}

testCheckpoint();
