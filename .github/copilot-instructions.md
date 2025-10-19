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

## Dependencias Principales

- `@supabase/ssr` y `@supabase/supabase-js` para interacción con Supabase
- `echarts` y `echarts-for-react` para visualizaciones y gráficos
- `lucide-react` para iconos
- `clsx` para manejo de clases condicionales en CSS
- `sweetalert2` para notificaciones y modales

---

Consulta `README-interno.md` para más detalles sobre la configuración de Docker y entornos.
