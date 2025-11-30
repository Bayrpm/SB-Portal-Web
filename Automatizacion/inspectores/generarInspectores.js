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

const DOMAIN = "sanbernardo.cl";

// Partículas comunes que se omiten en el username
const PARTICULAS = new Set([
  "de",
  "del",
  "la",
  "las",
  "los",
  "y",
  "da",
  "do",
  "das",
  "dos",
]);

// Función para normalizar texto (quitar tildes)
function stripDiacritics(input) {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function toAsciiLower(input) {
  return stripDiacritics(input).toLowerCase();
}

function sanitizeUsernamePart(input) {
  return input.replace(/[^a-z0-9]/g, "");
}

function getNameLetters(nombre, letters) {
  const firstWord = toAsciiLower(nombre).split(/\s+/).filter(Boolean)[0] || "";
  return sanitizeUsernamePart(firstWord.slice(0, Math.max(0, letters)));
}

function getLastnamesBlock(apellido) {
  const words = toAsciiLower(apellido)
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !PARTICULAS.has(w));
  return sanitizeUsernamePart(words.join(""));
}

function buildEmail(localPart) {
  return `${localPart}@${DOMAIN}`;
}

// Genera el local-part con N letras del nombre + todo el apellido
function makeLocalPart(nombre, apellido, letters) {
  const first = getNameLetters(nombre, letters);
  const last = getLastnamesBlock(apellido);
  if (!first && !last) return "";
  return `${first}${last}`;
}

// Chequea si el email existe en perfiles_ciudadanos
async function emailExists(email) {
  const { data, error } = await supabase
    .from("perfiles_ciudadanos")
    .select("email")
    .eq("email", email)
    .limit(1);

  if (error) {
    // Si hay error, intentamos verificar si el usuario existe
    console.warn(`⚠️  Advertencia verificando email: ${error.message}`);
    return false; // Asumimos que no existe si hay error
  }
  return Array.isArray(data) && data.length > 0;
}

// Genera un email único siguiendo la lógica corporativa
async function generateUniqueEmail(nombre, apellido) {
  // 1) 1 inicial + apellido
  const email1 = buildEmail(makeLocalPart(nombre, apellido, 1));
  if (email1 && !(await emailExists(email1))) {
    return email1;
  }

  // 2) 2 letras + apellido
  const local2 = makeLocalPart(nombre, apellido, 2);
  if (!local2) return email1;
  const email2 = buildEmail(local2);
  if (!(await emailExists(email2))) {
    return email2;
  }

  // 3) sufijos numéricos
  for (let i = 2; i < 100; i++) {
    const candidate = buildEmail(`${local2}${i}`);
    if (!(await emailExists(candidate))) {
      return candidate;
    }
  }

  throw new Error("No se pudo generar un email único");
}

// Función para generar un número aleatorio
function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Función para esperar (delay) entre peticiones
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Obtener tipos de turno disponibles
async function obtenerTiposTurno() {
  const { data, error } = await supabase
    .from("turno_tipo")
    .select("id, nombre")
    .eq("activo", true);

  if (error) {
    console.error("Error obteniendo tipos de turno:", error);
    return [];
  }

  return data || [];
}

// Función principal para crear inspectores
async function generarInspectores() {
  

  // Obtener tipos de turno
  const tiposTurno = await obtenerTiposTurno();
  if (tiposTurno.length === 0) {
    console.error("❌ No se encontraron tipos de turno. Abortando.");
    return;
  }
  

  const inspectoresCreados = [];
  const errores = [];
  let exitosos = 0;

  for (let i = 1; i <= 20; i++) {
    try {
      // Generar datos aleatorios
      const nombre = faker.person.firstName();
      const apellido = faker.person.lastName();
      const nombreCompleto = `${nombre} ${apellido}`;

      // Generar email corporativo único
      const email = await generateUniqueEmail(nombre, apellido);

      const telefono = `+56 9 ${randomNumber(1000, 9999)} ${randomNumber(
        1000,
        9999
      )}`;
      const password = `${nombre}${randomNumber(100, 999)}`;

      // Asignar turno aleatorio
      const turnoAleatorio = tiposTurno[randomNumber(0, tiposTurno.length - 1)];

      

      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true,
          user_metadata: {
            name: nombre,
            last_name: apellido,
            phone: telefono,
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

      const usuario_id = authData.user.id;

      // Esperar para que el trigger cree el perfil
      await delay(500);

      // Actualizar perfil del ciudadano
      const { error: perfilError } = await supabase
        .from("perfiles_ciudadanos")
        .update({
          nombre: nombre,
          apellido: apellido,
          telefono: telefono,
          email: email,
        })
        .eq("usuario_id", usuario_id);

      if (perfilError) {
        console.error(
          `   ⚠️  Error actualizando perfil: ${perfilError.message}`
        );
      }

      // Insertar en tabla inspectores
      const { error: inspectorError } = await supabase
        .from("inspectores")
        .insert([
          {
            usuario_id: usuario_id,
            tipo_turno: turnoAleatorio.id,
            activo: true,
          },
        ]);

      if (inspectorError) {
        console.error(
          `   ❌ Error creando inspector: ${inspectorError.message}`
        );
        // Rollback: eliminar usuario
        await supabase.auth.admin.deleteUser(usuario_id);
        errores.push({
          numero: i,
          email: email,
          error: inspectorError.message,
        });
        continue;
      }

      // Guardar credenciales
      inspectoresCreados.push({
        numero: i,
        nombreCompleto: nombreCompleto,
        nombre: nombre,
        apellido: apellido,
        email: email,
        password: password,
        telefono: telefono,
        turno: turnoAleatorio.nombre,
        usuario_id: usuario_id,
      });

      exitosos++;
      

      // Delay entre creaciones (1.5 segundos)
      await delay(1500);
    } catch (error) {
      console.error(`   ❌ Error inesperado: ${error.message}\n`);
      errores.push({
        numero: i,
        error: error.message,
      });
    }
  }

  // Generar archivos
  generarArchivoCredenciales(inspectoresCreados);
  generarArchivoJSON(inspectoresCreados);

  // Resumen final
  
  
  
  
  
  

  if (errores.length > 0) {
    
    errores.forEach((err) => {
      
    });
  }

  
  
  
}

// Generar archivo TXT con credenciales
function generarArchivoCredenciales(inspectores) {
  const fecha = new Date().toLocaleDateString("es-CL");
  const hora = new Date().toLocaleTimeString("es-CL");

  let contenido = "";
  contenido += "=".repeat(80) + "\n";
  contenido += "           CREDENCIALES DE INSPECTORES - PORTAL SAN BERNARDO\n";
  contenido += "=".repeat(80) + "\n";
  contenido += `Generado: ${fecha} a las ${hora}\n`;
  contenido += `Total de cuentas: ${inspectores.length}\n`;
  contenido += `Dominio: @${DOMAIN}\n`;
  contenido += "=".repeat(80) + "\n\n";

  inspectores.forEach((inspector, index) => {
    contenido += `${(index + 1).toString().padStart(3, "0")}. ${
      inspector.nombreCompleto
    }\n`;
    contenido += `     Email:      ${inspector.email}\n`;
    contenido += `     Contraseña: ${inspector.password}\n`;
    contenido += `     Teléfono:   ${inspector.telefono}\n`;
    contenido += `     Turno:      ${inspector.turno}\n`;
    contenido += `     ID:         ${inspector.usuario_id}\n`;
    contenido += "\n";
  });

  contenido += "=".repeat(80) + "\n";
  contenido += "NOTAS:\n";
  contenido += "- Todas las cuentas están verificadas y listas para usar\n";
  contenido +=
    "- Las contraseñas siguen el formato: [Nombre][3 dígitos aleatorios]\n";
  contenido +=
    "- Emails corporativos: [inicial(es)][apellido]@sanbernardo.cl\n";
  contenido +=
    "- Este archivo contiene información sensible, manténgalo seguro\n";
  contenido += "=".repeat(80) + "\n";

  const rutaArchivo = path.join(__dirname, "credenciales_inspectores.txt");
  fs.writeFileSync(rutaArchivo, contenido, "utf8");
}

// Generar archivo JSON con datos completos
function generarArchivoJSON(inspectores) {
  const datos = {
    fecha_generacion: new Date().toISOString(),
    total: inspectores.length,
    inspectores: inspectores,
  };

  const rutaArchivo = path.join(__dirname, "inspectores_generados.json");
  fs.writeFileSync(rutaArchivo, JSON.stringify(datos, null, 2), "utf8");
}

// Ejecutar script
generarInspectores().catch((error) => {
  console.error("💥 Error fatal:", error);
  process.exit(1);
});
