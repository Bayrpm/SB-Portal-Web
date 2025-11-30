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

const DOMAIN = "sanbernardo.gob.cl";

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

// Chequea si el email existe en auth.users usando Admin API
async function emailExists(email) {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.warn(`⚠️  Advertencia verificando email: ${error.message}`);
      return false;
    }

    // Buscar si existe un usuario con ese email
    const exists = data.users.some((user) => user.email === email);
    return exists;
  } catch (error) {
    console.warn(`⚠️  Error al verificar email: ${error.message}`);
    return false;
  }
}

// Genera un email único siguiendo la lógica corporativa (formatEmployeeEmails.ts)
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

// Obtener el rol_id de operador
async function obtenerRolOperador() {
  const { data, error } = await supabase
    .from("roles_portal")
    .select("id, nombre")
    .ilike("nombre", "%operador%")
    .limit(1);

  if (error) {
    console.error("Error obteniendo rol de operador:", error);
    return null;
  }

  if (!data || data.length === 0) {
    console.error('❌ No se encontró el rol "Operador" en roles_portal');
    return null;
  }

  return data[0];
}

// Función principal para crear operadores
async function generarOperadores() {
  

  // Obtener el rol de operador
  const rolOperador = await obtenerRolOperador();
  if (!rolOperador) {
    console.error(
      "❌ No se puede continuar sin el rol de operador. Abortando."
    );
    return;
  }
  

  const operadoresCreados = [];
  const errores = [];
  let exitosos = 0;

  for (let i = 1; i <= 15; i++) {
    try {
      // Generar datos aleatorios
      const nombre = faker.person.firstName();
      const apellido = faker.person.lastName();
      const nombreCompleto = `${nombre} ${apellido}`;

      // Generar email corporativo único usando formatEmployeeEmails.ts
      const email = await generateUniqueEmail(nombre, apellido);

      const password = `${nombre}${randomNumber(100, 999)}`;

      

      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true,
          user_metadata: {
            name: nombre,
            full_name: nombreCompleto,
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

      // Esperar para que el sistema se sincronice
      await delay(500);

      // Insertar en tabla usuarios_portal (solo usuario_id, rol_id y activo)
      const { error: portalError } = await supabase
        .from("usuarios_portal")
        .insert([
          {
            usuario_id: usuario_id,
            rol_id: rolOperador.id,
            activo: true,
          },
        ]);

      if (portalError) {
        console.error(
          `   ❌ Error creando operador en usuarios_portal: ${portalError.message}`
        );
        // Rollback: eliminar usuario de Auth
        await supabase.auth.admin.deleteUser(usuario_id);
        errores.push({
          numero: i,
          email: email,
          error: portalError.message,
        });
        continue;
      }

      // Guardar credenciales
      operadoresCreados.push({
        numero: i,
        nombreCompleto: nombreCompleto,
        nombre: nombre,
        apellido: apellido,
        email: email,
        password: password,
        rol: rolOperador.nombre,
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
  generarArchivoCredenciales(operadoresCreados);
  generarArchivoJSON(operadoresCreados);

  // Resumen final
  
  
  
  
  
  

  if (errores.length > 0) {
    
    errores.forEach((err) => {
      
    });
  }

  
  
  
}

// Generar archivo TXT con credenciales
function generarArchivoCredenciales(operadores) {
  const fecha = new Date().toLocaleDateString("es-CL");
  const hora = new Date().toLocaleTimeString("es-CL");

  let contenido = "";
  contenido += "=".repeat(80) + "\n";
  contenido += "           CREDENCIALES DE OPERADORES - PORTAL SAN BERNARDO\n";
  contenido += "=".repeat(80) + "\n";
  contenido += `Generado: ${fecha} a las ${hora}\n`;
  contenido += `Total de cuentas: ${operadores.length}\n`;
  contenido += `Dominio: @${DOMAIN}\n`;
  contenido += "=".repeat(80) + "\n\n";

  operadores.forEach((operador, index) => {
    contenido += `${(index + 1).toString().padStart(3, "0")}. ${
      operador.nombreCompleto
    }\n`;
    contenido += `     Email:      ${operador.email}\n`;
    contenido += `     Contraseña: ${operador.password}\n`;
    contenido += `     Rol:        ${operador.rol}\n`;
    contenido += `     ID:         ${operador.usuario_id}\n`;
    contenido += "\n";
  });

  contenido += "=".repeat(80) + "\n";
  contenido += "NOTAS:\n";
  contenido += "- Todas las cuentas están verificadas y listas para usar\n";
  contenido +=
    "- Las contraseñas siguen el formato: [Nombre][3 dígitos aleatorios]\n";
  contenido +=
    "- Emails corporativos: [inicial(es)][apellido]@sanbernardo.gob.cl\n";
  contenido += "  * 1 inicial + apellido (ej: jperez@sanbernardo.gob.cl)\n";
  contenido +=
    "  * Si existe, 2 letras + apellido (ej: juperez@sanbernardo.gob.cl)\n";
  contenido +=
    "  * Si también existe, sufijo numérico (ej: juperez2@sanbernardo.gob.cl)\n";
  contenido +=
    "- Este archivo contiene información sensible, manténgalo seguro\n";
  contenido += "=".repeat(80) + "\n";

  const rutaArchivo = path.join(__dirname, "credenciales_operadores.txt");
  fs.writeFileSync(rutaArchivo, contenido, "utf8");
}

// Generar archivo JSON con datos completos
function generarArchivoJSON(operadores) {
  const datos = {
    fecha_generacion: new Date().toISOString(),
    total: operadores.length,
    operadores: operadores,
  };

  const rutaArchivo = path.join(__dirname, "operadores_generados.json");
  fs.writeFileSync(rutaArchivo, JSON.stringify(datos, null, 2), "utf8");
}

// Ejecutar script
generarOperadores().catch((error) => {
  console.error("💥 Error fatal:", error);
  process.exit(1);
});
