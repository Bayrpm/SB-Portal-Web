# 🔒 README Interno — Portal Web (Tecnología & Ejecución con Docker Desktop)

> **Propósito**: Documentar el **stack**, la **arquitectura** y **cómo ejecutar** el portal web de uso interno (administradores y operadores) usando **solo Docker Desktop**.  
> **Producción**: se despliega en **Vercel** (sin Docker). Este README cubre **desarrollo local**.

---

## 🧰 Stack Tecnológico (alto nivel)

| Capa | Tecnología | Notas |
|---|---|---|
| **Front/SSR** | **Next.js 15** + React 19 | App Router, Server/Route Handlers para BFF |
| **BFF** | **API Routes / Route Handlers** en Next.js | Capa de orquestación entre clientes y datos |
| **Datos** | **Supabase** | Auth (JWT), Postgres (RLS), Storage (archivos), Realtime/Edge Functions |
| **Autenticación** | Supabase Auth (JWT) | El BFF verifica y aplica roles |
| **Estilos/UI** | (a definir por el equipo) | — |
| **Entorno dev** | **Docker Desktop** | Misma versión de Node y dependencias para todos |

> La **aplicación móvil** vive en **otro repositorio** y consume los endpoints del **BFF** de este portal.

---

## 🏗️ Arquitectura (resumen)

**Patrón arquitectónico**: **BFF + Supabase**  
- El **BFF** vive dentro del portal (Next.js) en `/api/bff/**`.  
- Valida JWT/roles, compone datos y entrega DTOs “listos para UI”.  
- Lecturas por usuario: **RLS ON** (cliente Supabase con token del usuario).  
- Operaciones administrativas: **service-role** (solo servidor) + verificación estricta de rol.

**Patrón de diseño (frontend portal)**: **Feature-First Lite**  
- Código agrupado por **feature** (p. ej., `features/denuncias/*`), sin acoplar internals entre features.  
- Tipos/contratos compartidos mediante esquemas (Zod/TS), si aplica.

> **Producción**: Vercel ejecuta los handlers BFF como **Serverless/Edge** (según runtime que declare cada endpoint).

---

## 🔐 Variables de Entorno

Crea un archivo **`.env.local`** (no subir a Git). Ejemplo:

```env
# Público (cliente y servidor)
NEXT_PUBLIC_SUPABASE_URL=https://XXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Solo servidor (BFF/Server Actions) — NO público
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Opcionales si el BFF consume otros servicios internos
CORE_URL=http://localhost:4000
INTERNAL_TOKEN=dev-internal-token
```

> 📌 **Si no cuentas con los valores de `.env` o `.env.local`**, solicítalos en **Microsoft Teams → canal “Desarrollo”** del proyecto. Ahí se mantiene la versión actualizada de las credenciales/variables para cada entorno.

> En **Vercel**, define estas variables en **Project Settings → Environment Variables** (sin prefijo `NEXT_PUBLIC_` para las sensibles).

---

## 🗂️ Archivos relevantes en el repo

| Archivo | Para qué sirve |
|---|---|
| `Dockerfile.dev` | Imagen de **desarrollo** (Next.js con HMR / Turbopack) |
| `docker-compose.dev.yml` | Orquesta el contenedor dev y monta el código (bind mount) |
| `.dockerignore` | Evita copiar artefactos pesados/sensibles en imágenes |
| `next.config.js` | Config de Next.js (p. ej., `output: 'standalone'` si se usara imagen prod) |
| `README.md` | README **público/cliente** (orientado a no técnicos) |
| `README-interno.md` | **Este documento** |

---

## ▶️ Ejecución **con Docker Desktop** (GUI, sin terminal)

> **Requisitos**: Docker Desktop instalado. Este repo clonado en tu máquina. **`.env.local` creado** en la raíz (pídelo en Teams si no lo tienes).

1. **Abrir Docker Desktop**  
   - Ir a la pestaña **Containers**.

2. **Crear el stack desde el compose**  
   - Clic **Create** → **From compose file**.  
   - Selecciona **`docker-compose.dev.yml`** en la raíz del repo.

3. **Revisar configuración básica**  
   - Verifica el **service** `web`, el **build context** (carpeta del repo) y el **Dockerfile.dev`.  
   - En **Environment files**, debe cargar **`.env.local`**.

4. **Run**  
   - Docker Desktop construirá la imagen y levantará el contenedor.  
   - Cuando figure **Running**, entra al contenedor `web` para ver **Logs** (deberías ver Next.js en modo dev).

5. **Abrir el portal**  
   - Clic **Open in browser** o abre **http://localhost:3000**.

6. **Editar y ver cambios**  
   - Abre el repo en VS Code.  
   - Guarda cambios y observa **recarga en vivo** (HMR).  
   - No es necesario reiniciar el contenedor para ver cambios.

7. **Detener / Reiniciar**  
   - Desde **Containers**: **Stop** para detener, **Start** para iniciar.  
   - Si cambian dependencias (`package.json`/`lock`), usa **⋯ → Recreate (with build)**.

---

## 🔁 Actualizar dependencias (solo GUI)

- **Quien agrega una dependencia**  
  1) En **Containers → web → Exec** (terminal integrada de Docker Desktop):  
     - `npm install paquete@version` (o `npm install -D …`)  
  2) Haz **commit/push** de `package.json` y `package-lock.json` con tu cliente **Git GUI**.

- **El resto del equipo**  
  - En **Containers → web → ⋯ → Recreate (with build)** para reconstruir con el nuevo lockfile.  
  - Si quedara cacheado, **Delete** con “Also delete volumes” y **Create from compose** nuevamente.

---

## 🌐 CORS (si la app móvil consume el BFF en dev)

Si la app móvil (en otro repo) llama a `/api/bff/*` durante el desarrollo:
- Agregar un helper de CORS en los **Route Handlers** del BFF para permitir orígenes de Expo (`http://localhost:19006`, `exp://…`) y el dominio de Vercel Preview/Prod cuando corresponda.

> **Nota**: en producción, ajustar orígenes permitidos según los dominios oficiales.

---

## 🚀 Producción (referencia breve)

- **Vercel** construye y despliega el portal + BFF (sin Docker).  
- Endpoints que usen **`SUPABASE_SERVICE_ROLE_KEY`** deben forzar **Node.js runtime**:
  ```ts
  export const runtime = 'nodejs';
  ```
- Lecturas por usuario (RLS ON) pueden usar **Edge runtime** si aplica:
  ```ts
  export const runtime = 'edge';
  ```

---

## 🧯 Troubleshooting rápido (Docker Desktop)

| Síntoma | Causa probable | Solución (GUI) |
|---|---|
| No hay recarga al guardar | Falta “watch” en contenedor o volumen no montado | Verifica que iniciaste con `docker-compose.dev.yml`; si persiste, **Recreate (with build)** |
| Error de variables | `.env.local` no cargado | Editar stack → agregar **Environment file** |
| Puerto 3000 ocupado | Otro proceso usando 3000 | En **Run**, remapea a `3001:3000` |
| Dependencias “viejas” | Volumen de `node_modules` cacheado | **Delete** contenedor con “Also delete volumes” → **Create from compose** |

---

## 📬 Contacto interno

- **Soporte / Incidentes**: _[correo interno del equipo]_  
- **Observaciones sobre este README**: _[correo]_ (asunto “README Interno Portal”)

> Este documento se mantendrá **actualizado** conforme evolucione el proyecto y el entorno de trabajo.
