import { createClient } from "@supabase/supabase-js";
import { Faker, es } from "@faker-js/faker";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

// Crear instancia de Faker en español
const faker = new Faker({ locale: [es] });

// Cliente de Supabase con service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Función para normalizar texto (quitar tildes, espacios, caracteres especiales)
function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quitar tildes
    .replace(/[^a-z0-9]/g, ""); // Solo letras y números
}

// Función para generar un número aleatorio
function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Función para esperar (delay) entre peticiones
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Función principal para crear ciudadanos
async function generarCiudadanos() {
  

  const ciudadanosCreados = [];
  const errores = [];
  let exitosos = 0;

  for (let i = 1; i <= 50; i++) {
    try {
      // Generar datos aleatorios
      const nombre = faker.person.firstName();
      const apellido = faker.person.lastName();
      const nombreCompleto = `${nombre} ${apellido}`;

      // Normalizar para email (sin tildes, espacios, caracteres especiales)
      const nombreEmail = normalizeText(nombre);
      const apellidoEmail = normalizeText(apellido);
      const email = `${nombreEmail}.${apellidoEmail}${i}@demo.sanbernardo.cl`;

      const telefono = `+569${randomNumber(10000000, 99999999)}`;
      const password = `${nombre}${randomNumber(100, 999)}`;

      

      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true, // Email ya verificado
          user_metadata: {
            nombre: nombre,
            apellido: apellido,
          },
        });

      if (authError) {
        console.error(`   ❌ Error en Auth: ${authError.message}`);
        errores.push({
          numero: i,
          email: email,
          error: authError.message,
        });
        continue;
      }

      // Esperar un poco para que el trigger cree el perfil
      await delay(500);

      // Actualizar el perfil del ciudadano con datos completos
      const { error: perfilError } = await supabase
        .from("perfiles_ciudadanos")
        .update({
          nombre: nombre,
          apellido: apellido,
          telefono: telefono,
          email: email,
        })
        .eq("usuario_id", authData.user.id);

      if (perfilError) {
        console.error(
          `   ⚠️  Error actualizando perfil: ${perfilError.message}`
        );
        // No es crítico, continuamos
      }

      // Guardar credenciales
      ciudadanosCreados.push({
        numero: i,
        nombreCompleto: nombreCompleto,
        nombre: nombre,
        apellido: apellido,
        email: email,
        password: password,
        telefono: telefono,
        usuario_id: authData.user.id,
      });

      exitosos++;
      

      // Delay entre creaciones para no saturar Supabase (1 segundo)
      await delay(1000);
    } catch (error) {
      console.error(`   ❌ Error inesperado: ${error.message}\n`);
      errores.push({
        numero: i,
        error: error.message,
      });
    }
  }

  // Generar archivo TXT con las credenciales
  generarArchivoCredenciales(ciudadanosCreados);

  // Generar archivo JSON con datos completos (backup)
  generarArchivoJSON(ciudadanosCreados);

  // Resumen final
  
  
  
  
  
  

  if (errores.length > 0) {
    
    errores.forEach((err) => {
      
    });
  }

  
  
  
}

// Generar archivo TXT con credenciales
function generarArchivoCredenciales(ciudadanos) {
  const fecha = new Date().toLocaleDateString("es-CL");
  const hora = new Date().toLocaleTimeString("es-CL");

  let contenido = "";
  contenido += "=".repeat(80) + "\n";
  contenido += "           CREDENCIALES DE CIUDADANOS - PORTAL SAN BERNARDO\n";
  contenido += "=".repeat(80) + "\n";
  contenido += `Generado: ${fecha} a las ${hora}\n`;
  contenido += `Total de cuentas: ${ciudadanos.length}\n`;
  contenido += `Dominio: @demo.sanbernardo.cl\n`;
  contenido += "=".repeat(80) + "\n\n";

  ciudadanos.forEach((ciudadano, index) => {
    contenido += `${(index + 1).toString().padStart(3, "0")}. ${
      ciudadano.nombreCompleto
    }\n`;
    contenido += `     Email:      ${ciudadano.email}\n`;
    contenido += `     Contraseña: ${ciudadano.password}\n`;
    contenido += `     Teléfono:   ${ciudadano.telefono}\n`;
    contenido += `     ID:         ${ciudadano.usuario_id}\n`;
    contenido += "\n";
  });

  contenido += "=".repeat(80) + "\n";
  contenido += "NOTAS:\n";
  contenido += "- Todas las cuentas están verificadas y listas para usar\n";
  contenido +=
    "- Las contraseñas siguen el formato: [Nombre][3 dígitos aleatorios]\n";
  contenido +=
    "- Este archivo contiene información sensible, manténgalo seguro\n";
  contenido += "=".repeat(80) + "\n";

  const rutaArchivo = path.join(__dirname, "credenciales_ciudadanos.txt");
  fs.writeFileSync(rutaArchivo, contenido, "utf8");
}

// Generar archivo JSON con datos completos
function generarArchivoJSON(ciudadanos) {
  const datos = {
    fecha_generacion: new Date().toISOString(),
    total: ciudadanos.length,
    ciudadanos: ciudadanos,
  };

  const rutaArchivo = path.join(__dirname, "ciudadanos_generados.json");
  fs.writeFileSync(rutaArchivo, JSON.stringify(datos, null, 2), "utf8");
}

// Ejecutar script
generarCiudadanos().catch((error) => {
  console.error("💥 Error fatal:", error);
  process.exit(1);
});
