#!/usr/bin/env node

/**
 * Script de prueba de conexión a Supabase
 * Verifica que las credenciales sean correctas y que haya datos disponibles
 */

import "dotenv/config";
import { cargarTodosDatos } from "./loaders/cargarDatos.js";

async function testConexion() {
  console.log("\n🔍 Verificando conexión y datos...\n");

  try {
    const datos = await cargarTodosDatos();

    console.log("\n✅ Conexión exitosa!\n");
    console.log("📊 Datos disponibles:");
    console.log(`   - Ciudadanos: ${datos.ciudadanos.length}`);
    console.log(`   - Inspectores: ${datos.inspectores.length}`);
    console.log(`   - Operadores: ${datos.operadores.length}`);

    // Validaciones
    if (datos.ciudadanos.length < 50) {
      console.log(
        "\n⚠️  Advertencia: Se recomienda tener al menos 50 ciudadanos"
      );
    }
    if (datos.inspectores.length < 20) {
      console.log(
        "\n⚠️  Advertencia: Se recomienda tener al menos 20 inspectores"
      );
    }
    if (datos.operadores.length < 15) {
      console.log(
        "\n⚠️  Advertencia: Se recomienda tener al menos 15 operadores"
      );
    }

    console.log("\n✅ Todo listo para generar denuncias!\n");
  } catch (error) {
    console.error("\n❌ Error de conexión:", error.message);
    console.error("\n💡 Verifica que:");
    console.error(
      "   1. El archivo .env existe y tiene las variables correctas"
    );
    console.error("   2. Las credenciales de Supabase sean válidas");
    console.error("   3. Las tablas existan en la base de datos\n");
    process.exit(1);
  }
}

testConexion();
