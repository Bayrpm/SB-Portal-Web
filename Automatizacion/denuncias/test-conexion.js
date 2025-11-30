#!/usr/bin/env node

/**
 * Script de prueba de conexión a Supabase
 * Verifica que las credenciales sean correctas y que haya datos disponibles
 */

import "dotenv/config";
import { cargarTodosDatos } from "./loaders/cargarDatos.js";

async function testConexion() {
  

  try {
    const datos = await cargarTodosDatos();

    
    
    
    
    

    // Validaciones
    if (datos.ciudadanos.length < 50) {
      
    }
    if (datos.inspectores.length < 20) {
      
    }
    if (datos.operadores.length < 15) {
      
    }

    
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
