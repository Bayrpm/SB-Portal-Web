# Migración Zod - Fase 1: Infraestructura + Endpoints de Usuarios

## ✅ Completado

### Infraestructura Base

#### 1. Esquemas de Validación (`src/lib/validation/schemas/`)

- **`common.ts`**: Validadores reutilizables
  - UUID, email, teléfono chileno, nombres, passwords
  - Coordenadas geográficas, fechas ISO, booleanos
  - Paginación (page, limit), IDs positivos
  - Patentes chilenas, rol_id
- **`users.ts`**: Esquemas específicos de usuarios
  - `CreateUserSchema`: POST con validación completa
  - `UpdateUserSchema`: PUT con validación parcial + refine
  - `DeleteUserSchema`: DELETE con ID
  - `GetUserByEmailSchema`: GET con email en query
  - `LoginSchema`: POST con email y password
  - Schemas de respuesta: `UserResponse`, `UserInfoResponse`, `SuccessResponse`, `ErrorResponse`

#### 2. Middleware (`src/lib/validation/middleware/`)

- **`auth.ts`**: Autenticación básica (sin roles)
  - `validateAuth()`: Verifica sesión activa
  - `validatePortalUser()`: Verifica usuario activo en portal
  - `withAuth()`: HOC para proteger endpoints
  - `getUserFromRequest()`: Helper para logging
- **`rate-limit.ts`**: Protección contra abuso
  - Implementación con Map en memoria
  - Estructura preparada para Redis (REDIS_URL)
  - Presets: login (5/min), write (30/min), read (100/min), critical (10/min)
  - Headers `X-RateLimit-*` informativos
  - Respuesta 429 con `Retry-After`

#### 3. Utilidades (`src/lib/validation/utils/`)

- **`validators.ts`**: Funciones de validación
  - `validateInput<T>()`: Valida entrada con Zod
  - `validateOutput<T>()`: Valida salida (type-safe DTOs)
  - `createErrorResponse()`: Formatea errores de Zod
  - `handleDuplicateError()`: Detecta código 23505 de PostgreSQL
  - `normalizeCoordinates()`: Validación de coordenadas chilenas
  - `formDataToObject()`: Convierte FormData a objeto
  - `parseQueryParams()`: Extrae query params
- **`logger.ts`**: Logging estructurado
  - Niveles: debug, info, warn, error
  - Formato desarrollo: colorizado en consola
  - Formato producción: JSON para sistemas de logging
  - Contexto y stack traces

#### 4. Exports Centralizados

- **`index.ts`**: Re-exporta todo desde `@/lib/validation`

### Endpoints Migrados

#### `/api/users/login` (POST)

✅ **MIGRADO**

- Validación de entrada con `loginSchema`
- Rate limiting: 5 intentos/minuto
- Validación de salida con `successResponseSchema`
- Logging estructurado de eventos (éxito, fallos)
- Manejo de errores mejorado

#### `/api/users` (POST - Crear Usuario)

✅ **MIGRADO + PROTEGIDO**

- **CRÍTICO**: Ahora requiere autenticación con `withAuth()`
- Validación de entrada con `createUserSchema`
- Rate limiting: 10 creaciones/minuto (preset `critical`)
- Validación de salida con `userResponseSchema`
- Rollback transaccional preservado
- Logging completo del ciclo de vida

#### `/api/users` (PUT - Actualizar Usuario)

✅ **MIGRADO + PROTEGIDO**

- **CRÍTICO**: Ahora requiere autenticación con `withAuth()`
- Validación de entrada con `updateUserSchema` (parcial + refine)
- Validación de salida con `successResponseSchema`
- Actualización de metadata + perfiles preservada
- Logging de operaciones

#### `/api/users` (DELETE - Eliminar Usuario)

✅ **MIGRADO + PROTEGIDO**

- **CRÍTICO**: Ahora requiere autenticación con `withAuth()`
- Validación de entrada con `deleteUserSchema`
- Validación de salida con `successResponseSchema`
- Eliminación en cascada preservada
- Logging de eliminaciones

#### `/api/users` (GET - Obtener por Email)

✅ **MIGRADO + PROTEGIDO**

- **CRÍTICO**: Ahora requiere autenticación con `withAuth()`
- Validación de query params con `getUserByEmailSchema`
- Validación de salida con `userInfoResponseSchema`
- Logging de consultas

## 🔒 Seguridad Implementada

### Antes (Vulnerabilidades)

- ❌ POST, PUT, DELETE sin autenticación (cualquiera podía crear/modificar/eliminar usuarios)
- ❌ GET sin protección
- ❌ Sin rate limiting (vulnerable a abuso)
- ❌ Sin validación de tipos
- ❌ Console.log dispersos

### Después (Mitigado)

- ✅ Todos los métodos protegidos con `withAuth()`
- ✅ Rate limiting en endpoints críticos
- ✅ Validación estricta de entrada/salida con Zod
- ✅ Type-safety completo
- ✅ Logging estructurado y centralizado

## 📊 Métricas de Cambio

- **Archivos creados**: 9 (infraestructura)
- **Archivos modificados**: 2 (endpoints)
- **Líneas de código agregadas**: ~1,100
- **Endpoints protegidos**: 5 (de 0 a 5)
- **Vulnerabilidades críticas resueltas**: 5

## 🧪 Testing Manual Requerido

### Login

```bash
# Válido
curl -X POST http://localhost:3000/api/users/login \
  -F "email=admin@example.com" \
  -F "password=password123"

# Rate limit (intentar 6 veces rápido)
# Debería retornar 429 en el sexto intento
```

### Crear Usuario (requiere autenticación)

```bash
# Sin autenticación - debería retornar 401
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test",
    "last_name": "User",
    "phone": "+56 9 1234 5678",
    "rol_id": 2
  }'

# Con autenticación - debería funcionar
# (requiere cookie de sesión de Supabase)
```

### Validación de Entrada

```bash
# Email inválido
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid-email", ...}'
# Debería retornar 400 con mensaje claro

# Teléfono inválido
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"phone": "123456", ...}'
# Debería retornar 400 con formato esperado
```

## 📝 Notas de Implementación

### Rate Limiting

- **Desarrollo**: Usa Map en memoria (se resetea con cada deploy)
- **Producción**: Configurar `REDIS_URL` en variables de entorno para persistencia
- **Estructura Redis preparada** pero no implementada (requiere instalar `redis` npm package)

### Logging

- **Desarrollo**: Console con colores y stack traces
- **Producción**: JSON estructurado compatible con CloudWatch, Datadog, etc.

### Validación de Salida

- Garantiza contratos de API consistentes
- Detecta bugs donde la respuesta no coincide con el schema esperado
- Previene exposición accidental de datos sensibles

## 🚀 Próximos Pasos (Fase 2)

1. Migrar `/api/inspectors` (CRÍTICO - similar a usuarios)
2. Implementar esquemas de inspectores
3. Proteger endpoints de creación/modificación/eliminación
4. Aplicar rate limiting
5. Validación de entrada/salida

## 🔧 Configuración Requerida

### Variables de Entorno (Opcional)

```env
# Rate limiting con Redis (producción)
REDIS_URL=redis://localhost:6379

# Ya existentes
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## ⚠️ Consideraciones

- **Sin validación de roles**: Como se solicitó, solo validamos autenticación, no rol de administrador
- **Rate limiting en memoria**: Funcional pero no persistente entre deploys
- **Redis preparado**: Estructura lista para cuando se necesite (agregar `npm install redis` + descomentar código)
- **Breaking changes**: Endpoints ahora requieren autenticación (frontend debe enviar cookies de sesión)
