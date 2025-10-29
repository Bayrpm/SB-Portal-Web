# Instrucciones para Agentes de IA - Portal Web San Bernardo

Este documento proporciona información esencial para trabajar eficientemente con el código del Portal Web de San Bernardo, una plataforma interna para la gestión de denuncias ciudadanas.

## Arquitectura General

- **Frontend/SSR**: Next.js 15 con App Router usando React 19
- **Backend**: BFF (Backend For Frontend) implementado con API Routes/Route Handlers de Next.js
- **Base de datos**: Supabase (PostgreSQL) con autenticación JWT, RLS y almacenamiento
- **Estilizado**: TailwindCSS 4

### Estructura de carpetas clave

- `/api`: Endpoints BFF para comunicación entre frontend y Supabase
- `/app`: Componentes y páginas usando App Router de Next.js
- `/app/components`: Componentes reutilizables globales
- `/app/portal/`: Secciones principales post-autenticación (dashboard, denuncias, usuarios)
- `/context`: Contextos de React, incluyendo UserContext para gestión de sesiones
- `/lib`: Utilidades, incluida la configuración del cliente Supabase

## Patrones y Convenciones

### Arquitectura BFF + Supabase

- El BFF vive dentro de `/api` y es responsable de:
  - Validar JWT y roles de usuario
  - Componer datos desde Supabase
  - Entregar DTOs preparados para UI

### Supabase en el proyecto

1. **Cliente**: 3 tipos diferentes de clientes de Supabase:

   - `/lib/supabase/client.ts`: Cliente para uso en navegador
   - `/lib/supabase/server.ts`: Cliente para uso en Server Components
   - `/lib/supabase/middleware.ts`: Cliente para uso en middleware de Next.js

2. **Autenticación**:

   - La autenticación se realiza mediante JWT de Supabase Auth
   - Los roles se almacenan en `usuarios_portal.rol_id`
   - El flujo de autenticación está implementado en `/api/users/login.ts`

3. **Acceso a datos**:
   - Lecturas por usuario: RLS activado (cliente Supabase con token del usuario)
   - Operaciones administrativas: service-role (solo servidor) + verificación de rol

### Gestión de estado

- `UserContext.tsx`: Maneja la sesión de usuario con:
  - `role`: El rol del usuario actual (almacenado en localStorage)
  - `name`: El nombre del usuario (almacenado en localStorage)
  - Verificación automática de expiración de sesión (12 horas por defecto)

## Flujos de Trabajo

### Desarrollo local

1. **Configuración de entorno**:

   - Crear archivo `.env.local` con:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://XXXXX.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
     SUPABASE_SERVICE_ROLE_KEY=eyJ...
     ```

2. **Docker Desktop**:

   - Usar Docker Desktop con `docker-compose.dev.yml` para desarrollo
   - El contenedor monta el código en modo HMR/watch

3. **Comandos npm**:
   ```bash
   npm run dev    # Desarrollo con Turbopack
   npm run build  # Construcción con Turbopack
   npm run start  # Servir build
   npm run lint   # Ejecutar linter
   ```

### Autenticación y Autorización

1. El flujo de login está en `/app/page.tsx` y `/api/users/login.ts`:

   - Valida credenciales con Supabase Auth
   - Verifica que el usuario esté activo en la tabla `usuarios_portal`
   - Almacena información de sesión en localStorage

2. Protección de rutas:
   - Las rutas bajo `/portal/` están protegidas y requieren autenticación
   - La verificación se realiza en el lado cliente con UserContext

## Datos y API

### Estructura de datos principal

- **usuarios_portal**: Almacena datos de usuario incluyendo:

  - `email`: Email del usuario (debe coincidir con Auth de Supabase)
  - `rol_id`: Nivel de acceso del usuario
  - `nombre`: Nombre para mostrar
  - `activo`: Flag para habilitar/deshabilitar acceso

- **Dashboard**: Los datos se obtienen actualmente de archivos JSON estáticos en `/public`
  - Cuando se implemente completamente, serán endpoints en el BFF

## Pautas y Mejores Prácticas

1. **API y BFF**:

   - Usar `/api` para crear nuevos endpoints
   - Las carpetas dentro de `/api` siempre deben estar en inglés (por ejemplo: `/api/inspectors`, `/api/categories`, `/api/priorities`).
   - Validar siempre autenticación y autorización
   - Para operaciones con el rol de servicio, usar `SUPABASE_SERVICE_ROLE_KEY`

2. **Componentes**:

   - Crear componentes reutilizables en `/app/components`
   - Para componentes específicos de funcionalidad, usar carpetas dentro de la sección correspondiente

3. **Variables de entorno**:

   - Las variables públicas deben tener prefijo `NEXT_PUBLIC_`
   - Variables sensibles deben estar sin prefijo y usarse solo en servidor

4. **Implementación de nuevas funcionalidades**:
   1. Primero crear/actualizar endpoints en `/api`
   2. Implementar componentes de UI en la sección correspondiente
   3. Conectar ambos usando UserContext cuando sea necesario

## Notas para Next.js 15+ y React 19

### Acceso a params en Componentes Cliente

- En Next.js 15+ los parámetros de ruta (`params`) en componentes cliente son una promesa y deben ser accedidos usando `React.use(params)`.
- Ejemplo correcto:

  ```tsx
  export default function MiComponente({ params }: { params: any }) {
    const { folio } = React.use(params);
    // ...
  }
  ```

- No accedas directamente a `params.folio`, ya que esto generará un warning y en futuras versiones será un error.

## Dependencias Principales

- `@supabase/ssr` y `@supabase/supabase-js` para interacción con Supabase
- `echarts` y `echarts-for-react` para visualizaciones y gráficos
- `lucide-react` para iconos
- `clsx` para manejo de clases condicionales en CSS
- `sweetalert2` para notificaciones y modales

## Testing

Actualmente el proyecto no tiene infraestructura de testing configurada. Si se necesita agregar tests:
- Considera usar Jest + React Testing Library para pruebas unitarias e integración
- Para pruebas E2E, Playwright es una buena opción (ya compatible con Next.js 15)
- Los tests deben colocarse en una carpeta `__tests__` junto al código que prueban o en una carpeta `/tests` en la raíz

## Build y Deployment

### Build Local

```bash
npm run build  # Construcción con Turbopack
npm run start  # Servir build de producción en puerto 3000
```

### Verificación de Build

Antes de hacer commit de cambios significativos:
1. Ejecutar `npm run lint` para verificar calidad de código
2. Ejecutar `npm run build` para asegurar que el proyecto compila sin errores
3. Revisar warnings del build que puedan indicar problemas

### Deployment en Vercel

- La aplicación se despliega automáticamente en Vercel
- Variables de entorno deben configurarse en Vercel Project Settings
- Los endpoints del BFF que usan `SUPABASE_SERVICE_ROLE_KEY` deben usar Node.js runtime:
  ```ts
  export const runtime = 'nodejs';
  ```
- Endpoints con RLS pueden usar Edge runtime para mejor performance:
  ```ts
  export const runtime = 'edge';
  ```

## Code Quality y Linting

### ESLint

El proyecto usa ESLint con la configuración de Next.js:
- Ejecutar: `npm run lint`
- Configuración en `eslint.config.mjs`
- Extends: `next/core-web-vitals` y `next/typescript`
- Ignora: `node_modules/`, `.next/`, `out/`, `build/`, `next-env.d.ts`

### Commits

- Hay un workflow de GitHub Actions que ejecuta ESLint en cada push a `main` o `develop`
- Revisar el resultado del workflow antes de merge

## Seguridad

### Manejo de Secrets

- **NUNCA** commitear archivos `.env`, `.env.local` o similares
- Las variables sensibles (sin prefijo `NEXT_PUBLIC_`) solo deben usarse en servidor
- Usar `SUPABASE_SERVICE_ROLE_KEY` solo en endpoints del servidor, nunca en cliente
- Validar siempre la autenticación y autorización en endpoints del BFF

### RLS (Row Level Security)

- Para operaciones de lectura de usuario: usar cliente con token del usuario (RLS activado)
- Para operaciones administrativas: usar service-role en servidor + verificación de rol
- Nunca exponer el service-role key al cliente

### Validación de Datos

- Validar y sanitizar todos los inputs de usuario antes de procesarlos
- Usar TypeScript para type safety
- Considerar usar bibliotecas como Zod para validación de schemas en runtime

## Troubleshooting Común

### Error: ESLint no encontrado
**Solución**: Ejecutar `npm install` para instalar dependencias

### Error: Variables de entorno no definidas
**Solución**: Crear archivo `.env.local` en la raíz con las variables necesarias (solicitar valores en Teams)

### Error: Puerto 3000 ocupado
**Solución**: Detener otros procesos en el puerto o cambiar el puerto con `PORT=3001 npm run dev`

### Error: Módulo de Supabase no encontrado
**Solución**: Verificar que las rutas de import sean correctas según el tipo de componente:
- Cliente (navegador): `@/lib/supabase/client`
- Server Component: `@/lib/supabase/server`
- Middleware: `@/lib/supabase/middleware`

### Build falla con errores de TypeScript
**Solución**: 
1. Verificar que todos los tipos estén correctamente definidos
2. Revisar imports y exports
3. Ejecutar `npm run build` localmente para ver el error completo

## Convenciones de Código

### Nomenclatura

- **Archivos y carpetas**: usar kebab-case (por ejemplo: `user-profile.tsx`, `api-helpers.ts`)
- **Componentes React**: usar PascalCase (por ejemplo: `UserProfile`, `DashboardCard`)
- **Funciones y variables**: usar camelCase (por ejemplo: `getUserData`, `isAuthenticated`)
- **Constantes**: usar UPPER_SNAKE_CASE para constantes globales (por ejemplo: `MAX_RETRIES`, `API_BASE_URL`)

### Imports

- Usar alias `@/` para imports desde `src/`:
  ```ts
  import { UserContext } from '@/context/UserContext';
  import { createClient } from '@/lib/supabase/client';
  ```
- Agrupar imports: externos primero, luego internos
- Ordenar alfabéticamente dentro de cada grupo

### Tipado

- Siempre tipar props de componentes
- Evitar usar `any`; preferir `unknown` si el tipo es desconocido
- Crear interfaces/types en archivos separados si se reutilizan en múltiples lugares

---

Consulta `README-interno.md` para más detalles sobre la configuración de Docker y entornos.
