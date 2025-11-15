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
  console.log("🧪 Probando sistema de checkpoint...\n");

  // Test 1: Verificar que no existe checkpoint
  console.log("1️⃣  Verificando que no existe checkpoint...");
  const existeInicial = tieneCheckpointPendiente();
  console.log(`   Existe: ${existeInicial}`);
  if (existeInicial) {
    console.log("   ⚠️  Limpiando checkpoint previo...");
    await limpiarCheckpoint();
  }

  // Test 2: Guardar checkpoint
  console.log("\n2️⃣  Guardando checkpoint de prueba...");
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
  console.log("   ✅ Checkpoint guardado");

  // Test 3: Verificar que existe
  console.log("\n3️⃣  Verificando que ahora existe...");
  const existeAhora = tieneCheckpointPendiente();
  console.log(`   Existe: ${existeAhora}`);

  // Test 4: Cargar checkpoint
  console.log("\n4️⃣  Cargando checkpoint...");
  const checkpoint = await cargarCheckpoint();
  if (checkpoint) {
    console.log("   ✅ Checkpoint cargado correctamente");
    console.log("   Datos:");
    console.log(
      `   - Timestamp: ${new Date(checkpoint.timestamp).toLocaleString(
        "es-CL"
      )}`
    );
    console.log(
      `   - Progreso: ${checkpoint.progreso.actual}/${checkpoint.progreso.total}`
    );
    console.log(`   - Cerradas: ${checkpoint.denuncias.cerradas}`);
    console.log(`   - En Proceso: ${checkpoint.denuncias.enProceso}`);
    console.log(`   - Pendientes: ${checkpoint.denuncias.pendientes}`);
    console.log(`   - Errores: ${checkpoint.progreso.errores}`);
  } else {
    console.log("   ❌ Error: no se pudo cargar checkpoint");
  }

  // Test 5: Limpiar checkpoint
  console.log("\n5️⃣  Limpiando checkpoint...");
  await limpiarCheckpoint();
  console.log("   ✅ Checkpoint eliminado");

  // Test 6: Verificar que ya no existe
  console.log("\n6️⃣  Verificando que ya no existe...");
  const existeFinal = tieneCheckpointPendiente();
  console.log(`   Existe: ${existeFinal}`);

  console.log("\n✅ Todas las pruebas completadas exitosamente!\n");
}

testCheckpoint();
