# Instrucciones para Agentes de IA - Portal Web San Bernardo

Este documento proporciona información esencial para trabajar eficientemente con el código del Portal Web de San Bernardo, una plataforma interna para la gestión de denuncias ciudadanas.

## Instrucción clave sobre endpoints y base de datos

**IMPORTANTE:** Si la tarea involucra la creación, modificación o análisis de un endpoint (API) o cualquier información relacionada con la base de datos, SIEMPRE se debe consultar primero la estructura de la base de datos utilizando los siguientes archivos de referencia:

- `public/script-BD-13-11.sql`: Definición oficial de las tablas, campos, tipos y relaciones.
- `public/Supabase Snippet Inventario de triggers de usuario.csv`: Inventario actualizado de triggers y funciones asociadas a cada tabla.
- `public/Supabase Snippet Funciones y procedimientos de usuario.csv`: Listado de funciones y procedimientos definidos en la base de datos, con sus argumentos y tipos de retorno.
- `public/Supabase Snippet Indexes Overview.csv`: Resumen de los índices existentes en cada tabla.

Estos archivos son la referencia obligatoria para asegurar la coherencia y validez de cualquier cambio o consulta sobre la capa de datos.

No asumas la estructura de la base de datos, los triggers, funciones ni los nombres de los campos sin revisar estos archivos.

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

### Buckets de almacenamiento en Supabase

En Supabase existen 2 buckets principales para almacenamiento de archivos:

- **avatars**: Solo imágenes. Se utiliza para almacenar los avatares de los usuarios del sistema. Solo se permiten archivos de tipo imagen (jpg, png, webp, etc.).
- **evidencias**: Imágenes y/o videos. Se utiliza para almacenar archivos adjuntos a denuncias, como fotos y videos subidos por los usuarios o inspectores.

Ten en cuenta:

- El bucket `avatars` solo debe aceptar imágenes.
- El bucket `evidencias` puede aceptar imágenes y videos (formatos comunes: jpg, png, mp4, mov, webp, etc.).

Al subir archivos, asegúrate de validar el tipo de archivo según el bucket destino.

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

La base de datos en Supabase (PostgreSQL) contiene las siguientes tablas principales:

#### Gestión de Usuarios y Autenticación

- **usuarios_portal**: Usuarios del portal administrativo

  - `usuario_id` (uuid, FK a auth.users): ID del usuario en Supabase Auth
  - `email`: Email del usuario (debe coincidir con Auth de Supabase)
  - `rol_id` (FK a roles_portal): Nivel de acceso del usuario
  - `nombre`: Nombre para mostrar
  - `activo`: Flag para habilitar/deshabilitar acceso
  - Trigger: `t_audit_up` - Auditoría de cambios

- **roles_portal**: Roles disponibles en el sistema

  - `id`: Identificador del rol
  - `nombre`: Nombre del rol (ej: "Administrador", "Operador")

- **perfiles_ciudadanos**: Perfiles de ciudadanos que reportan denuncias

  - `usuario_id` (uuid, PK, FK a auth.users): ID del usuario
  - `nombre`, `apellido`: Datos personales
  - `telefono`, `email`: Información de contacto
  - `created_at`: Fecha de creación
  - Nota: Se crea automáticamente vía trigger `handle_new_auth_user` en auth.users

- **inspectores**: Inspectores de terreno
  - `id`: Identificador del inspector
  - `usuario_id` (FK a auth.users y perfiles_ciudadanos): Usuario asociado
  - `tipo_turno` (FK a turno_tipo): Tipo de turno asignado
  - `activo`: Estado del inspector

#### Denuncias y Categorización

- **denuncias**: Denuncias ciudadanas (tabla central del sistema)

  - `id` (uuid, PK): Identificador único
  - `folio`: Número de folio generado automáticamente (único)
  - `ciudadano_id` (FK a perfiles_ciudadanos): Quien reporta
  - `titulo`, `descripcion`: Contenido de la denuncia
  - `estado_id` (FK a estados_denuncia): Estado actual
  - `categoria_publica_id` (FK a categorias_publicas): Categoría vista por ciudadanos
  - `inspector_id` (FK a inspectores): Inspector asignado
  - `prioridad_id` (FK a prioridades_denuncia): Nivel de prioridad
  - `cuadrante_id` (FK a cuadrantes): Ubicación geográfica
  - `coords_x`, `coords_y`: Coordenadas geográficas
  - `ubicacion_texto`: Dirección en texto
  - `consentir_publicacion`: Permiso para publicar
  - `anonimo`: Si el reporte es anónimo
  - `fecha_creacion`, `fecha_inicio_atencion`, `fecha_cierre`: Fechas del ciclo de vida
  - Triggers:
    - `tg_denuncias_bi`: Genera folio antes de insertar
    - `tg_denuncias_ai`: Registra historial después de insertar
    - `tg_denuncias_au`: Registra historial después de actualizar
    - `trg_denuncias_status_notify`: Encola notificación al cambiar estado

- **estados_denuncia**: Estados del ciclo de vida

  - `id`: Identificador
  - `nombre`: Nombre del estado (ej: "Pendiente", "En Atención", "Cerrada")
  - `orden`: Orden de visualización

- **prioridades_denuncia**: Niveles de prioridad

  - `id`: Identificador
  - `nombre`: Nombre de la prioridad

- **categorias_publicas**: Categorías visibles para ciudadanos

  - `id`: Identificador
  - `nombre`: Nombre de la categoría (único)
  - `descripcion`: Descripción detallada
  - `orden`: Orden de visualización
  - `activo`: Estado de la categoría

- **denuncia_clasificaciones**: Clasificación interna de denuncias

  - `id`: Identificador
  - `denuncia_id` (FK a denuncias): Denuncia asociada
  - `requerimiento_id` (FK a cat_requerimientos): Clasificación interna
  - `vigente`: Si es la clasificación actual
  - `comentario`: Observaciones
  - `clasificado_por` (FK a auth.users): Quien clasificó
  - Trigger: `trg_denuncia_clasif_unica_vigente` - Solo una clasificación vigente por denuncia

- **denuncia_historial**: Historial de eventos de cada denuncia

  - `id`: Identificador
  - `denuncia_id` (FK a denuncias): Denuncia asociada
  - `evento`: Tipo de evento
  - `detalle` (jsonb): Información adicional
  - `actor_usuario_id` (FK a auth.users): Quien realizó la acción
  - `created_at`: Fecha del evento

- **denuncia_evidencias**: Fotos y videos de denuncias

  - `id`: Identificador
  - `denuncia_id` (FK a denuncias): Denuncia asociada
  - `tipo`: 'FOTO' o 'VIDEO'
  - `storage_path`: Ruta en Supabase Storage
  - `orden`: Orden de visualización
  - `hash`: Hash del archivo
  - `created_by` (FK a auth.users): Quien subió la evidencia
  - Triggers:
    - `trg_evidencias_set_created_by`: Establece created_by automáticamente
    - `t_audit_ev`: Auditoría de cambios

- **denuncia_observaciones**: Observaciones de operadores e inspectores
  - `id`: Identificador
  - `denuncia_id` (FK a denuncias): Denuncia asociada
  - `tipo`: 'OPERADOR' o 'TERRENO'
  - `contenido`: Texto de la observación
  - `creado_por` (FK a auth.users): Quien creó la observación
  - Trigger: `t_audit_obs` - Auditoría de cambios

#### Categorización Interna (4 niveles jerárquicos)

- **cat_familias**: Nivel 1 de categorización interna

  - `id`: Identificador
  - `nombre`: Nombre de la familia (único)
  - `activo`: Estado

- **cat_grupos**: Nivel 2 de categorización interna

  - `id`: Identificador
  - `familia_id` (FK a cat_familias): Familia padre
  - `nombre`: Nombre del grupo
  - `activo`: Estado

- **cat_subgrupos**: Nivel 3 de categorización interna

  - `id`: Identificador
  - `grupo_id` (FK a cat_grupos): Grupo padre
  - `nombre`: Nombre del subgrupo
  - `activo`: Estado

- **cat_requerimientos**: Nivel 4 de categorización interna

  - `id`: Identificador
  - `subgrupo_id` (FK a cat_subgrupos): Subgrupo padre
  - `nombre`: Nombre del requerimiento
  - `prioridad`: Nivel de prioridad
  - `activo`: Estado

- **cat_req_mapeo_publico**: Mapeo entre categorías públicas e internas
  - `requerimiento_id` (PK, FK a cat_requerimientos): Requerimiento interno
  - `categoria_publica_id` (FK a categorias_publicas): Categoría pública

#### Asignaciones y Derivaciones

- **asignaciones_inspector**: Asignaciones de denuncias a inspectores
  - `id`: Identificador
  - `denuncia_id` (FK a denuncias): Denuncia asignada
  - `inspector_id` (FK a inspectores): Inspector asignado
  - `asignado_por` (FK a auth.users): Quien asignó
  - `fecha_derivacion`: Cuándo se asignó
  - `fecha_inicio_atencion`: Cuándo comenzó la atención
  - `fecha_termino`: Cuándo finalizó
  - Triggers:
    - `tg_asignaciones_ai`: Registra historial después de asignar
    - `t_audit_asign`: Auditoría de cambios

#### Gestión de Turnos

- **turno_tipo**: Tipos de turno disponibles

  - `id`: Identificador
  - `nombre`: Nombre del tipo (ej: "Mañana", "Tarde", "Noche")
  - `hora_inicio`, `hora_fin`: Horario del turno
  - `activo`: Estado

- **turnos**: Turnos de trabajo de inspectores

  - `id`: Identificador
  - `inspector_id` (FK a inspectores): Inspector del turno
  - `turno_tipo_id` (FK a turno_tipo): Tipo de turno
  - `fecha`: Fecha del turno
  - `inicio_real`, `fin_real`: Inicio y fin reales
  - `estado`: Estado del turno
  - `es_planificado`: Si fue planificado
  - `observacion`: Observaciones

- **turnos_planificados**: Planificación de turnos

  - `id`: Identificador
  - `inspector_id` (FK a inspectores): Inspector planificado
  - `turno_tipo_id` (FK a turno_tipo): Tipo de turno
  - `dia_semana`: Día de la semana (1-7)
  - `fecha_inicio`, `fecha_fin`: Rango de validez
  - `activo`: Estado

- **turnos_excepciones**: Excepciones a la planificación

  - `id`: Identificador
  - `inspector_id` (FK a inspectores): Inspector afectado
  - `fecha`: Fecha de la excepción
  - `tipo`: Tipo de excepción
  - `observacion`: Razón

- **evento_turno_tipo**: Tipos de eventos de turno

  - `id`: Identificador
  - `codigo`: Código del evento (ej: 'PAUSA_INI', 'PAUSA_FIN')
  - `descripcion`: Descripción
  - `activo`: Estado

- **eventos_turno**: Eventos durante el turno
  - `id`: Identificador
  - `turno_id` (FK a turnos): Turno asociado
  - `tipo_id` (FK a evento_turno_tipo): Tipo de evento
  - `ts`: Timestamp del evento
  - `observacion`: Observaciones
  - `actor_user_id` (FK a auth.users): Quien registró el evento
  - Trigger: `trg_eventos_turno_apply` - Aplica lógica de negocio del evento

#### Gestión de Móviles/Vehículos

- **movil_tipo**: Tipos de vehículos

  - `id`: Identificador
  - `nombre`: Nombre del tipo (único)
  - `descripcion`: Descripción
  - `activo`: Estado

- **moviles**: Vehículos disponibles

  - `id`: Identificador
  - `patente`: Patente del vehículo (única)
  - `tipo_id` (FK a movil_tipo): Tipo de vehículo
  - `marca`, `modelo`, `anio`: Datos del vehículo
  - `estado`: Estado actual ('DISPONIBLE', 'ASIGNADO', etc.)
  - `kilometraje_actual`: Kilometraje acumulado
  - `activo`: Estado

- **movil_usos**: Registro de uso de vehículos

  - `id`: Identificador
  - `movil_id` (FK a moviles): Vehículo usado
  - `inspector_id` (FK a inspectores): Inspector que lo usa
  - `turno_id` (FK a turnos): Turno asociado
  - `inicio_ts`, `fin_ts`: Inicio y fin del uso
  - `km_recorridos`: Kilómetros recorridos
  - `observacion`: Observaciones
  - `actor_user_id` (FK a auth.users): Quien registró
  - Triggers:
    - `trg_usos_no_solapados_ins` - Valida que no haya usos solapados
    - `trg_usos_set_estado_movil_ins/upd` - Actualiza estado del móvil

- **movil_uso_kilometraje**: Lecturas de kilometraje durante uso
  - `id`: Identificador
  - `uso_id` (FK a movil_usos): Uso asociado
  - `lectura_ts`: Timestamp de la lectura
  - `kilometraje_km`: Kilometraje registrado
  - `tipo`: 'INICIO', 'FIN', 'INTERMEDIA'
  - `actor_user_id` (FK a auth.users): Quien registró
  - Trigger: `trg_kilometraje_validar_y_sumar` - Valida y acumula kilometraje

#### Interacción Ciudadana

- **comentarios_denuncias**: Comentarios en denuncias

  - `id`: Identificador
  - `denuncia_id` (FK a denuncias): Denuncia comentada
  - `usuario_id` (FK a auth.users): Usuario que comenta
  - `parent_id` (FK a comentarios_denuncias): Comentario padre (para respuestas)
  - `contenido`: Texto del comentario
  - `anonimo`: Si el comentario es anónimo
  - Triggers:
    - `trg_comentarios_den_set_usuario` - Establece usuario_id automáticamente
    - `trg_validate_parent_comment` - Valida que el comentario padre sea válido
    - `trg_prevent_parent_change` - Previene cambiar el parent_id después de crear

- **comentario_reacciones**: Reacciones a comentarios

  - `id`: Identificador
  - `comentario_id` (FK a comentarios_denuncias): Comentario reaccionado
  - `usuario_id` (FK a auth.users): Usuario que reacciona
  - `tipo`: 'LIKE' o 'DISLIKE'
  - Trigger: `trg_comentario_reac_touch` - Actualiza updated_at

- **denuncia_reacciones**: Reacciones a denuncias
  - `id`: Identificador
  - `denuncia_id` (FK a denuncias): Denuncia reaccionada
  - `usuario_id` (FK a auth.users): Usuario que reacciona
  - `tipo`: 'LIKE' o 'DISLIKE'
  - Trigger: `trg_reacciones_touch` - Actualiza updated_at

#### Notificaciones y Alertas

- **tokens_push**: Tokens para notificaciones push

  - `id`: Identificador
  - `usuario_id` (FK a auth.users): Usuario asociado
  - `token`: Token del dispositivo
  - `plataforma`: 'IOS', 'ANDROID', 'WEB'
  - `activo`: Estado

- **push_status_queue**: Cola de notificaciones de cambio de estado

  - `id`: Identificador
  - `denuncia_id` (FK a denuncias): Denuncia asociada
  - `user_id` (FK a auth.users): Usuario a notificar
  - `old_status_id`, `new_status_id` (FK a estados_denuncia): Cambio de estado
  - `attempts`: Intentos de envío
  - `sent_at`: Cuándo se envió
  - Trigger: `notify-status-change` - HTTP request a Edge Function de Supabase

- **notificaciones_enviadas**: Registro de notificaciones enviadas

  - `id`: Identificador
  - `usuario_id` (FK a auth.users): Usuario notificado
  - `tipo`: Tipo de notificación
  - `contenido` (jsonb): Contenido de la notificación
  - `leido`: Si fue leída
  - `created_at`: Fecha de envío

- **alertas_oficiales**: Alertas emitidas por el sistema
  - `id`: Identificador
  - `titulo`: Título de la alerta
  - `cuerpo`: Contenido
  - `nivel`: 'CRITICA', 'RELEVANTE', 'OFICIAL'
  - `denuncia_id` (FK a denuncias): Denuncia relacionada (opcional)
  - `cuadrante_id` (FK a cuadrantes): Cuadrante afectado (opcional)
  - `creado_por` (FK a auth.users): Quien creó la alerta
  - Trigger: `t_audit_alertas` - Auditoría de cambios

#### Otras Tablas

- **cuadrantes**: Cuadrantes geográficos de la comuna

  - `id`: Identificador
  - `codigo`: Código del cuadrante (único)
  - `nombre`: Nombre descriptivo
  - `descripcion`: Descripción

- **audit_log**: Registro de auditoría global
  - `id`: Identificador
  - `ts`: Timestamp del evento
  - `actor_user_id`, `actor_email`: Usuario que realizó la acción
  - `actor_es_portal`, `actor_es_admin`: Roles del actor
  - `tabla`: Tabla afectada
  - `operacion`: 'INSERT', 'UPDATE', 'DELETE'
  - `fila_id_text`: ID de la fila afectada
  - `old_row`, `new_row` (jsonb): Datos antes y después

### Funciones y Procedimientos Principales

#### Funciones de Negocio

- **fn_generar_folio()**: Genera folio único para denuncias (formato YYYYMMDD + secuencial)
- **fn_denuncia_reaccionar(denuncia_id, tipo)**: Registra o actualiza reacción a denuncia
- **fn_comentario_reaccionar(comentario_id, tipo)**: Registra o actualiza reacción a comentario
- **fn_delete_comentario_denuncia(comentario_id)**: Elimina comentario (con seguridad)
- **fn_update_comentario_denuncia(comentario_id, contenido)**: Actualiza comentario (con seguridad)

#### Funciones de Gestión de Turnos y Móviles

- **fn_turno_registrar_evento(turno_id, evento_codigo, observacion, actor_user_id, ts)**: Registra evento en turno
- **fn_turnos_autocierre(hora_limite, max_batch)**: Cierra automáticamente turnos pendientes
- **fn_movil_iniciar_uso(movil_id, inspector_id, kilometraje_inicio, ...)**: Inicia uso de móvil
- **fn_movil_cerrar_uso(uso_id, kilometraje_fin, observacion, ...)**: Cierra uso de móvil
- **fn_evento_id(codigo)**: Obtiene ID de evento por código

#### Funciones de Consulta Pública

- **get_denuncias_publicas_recientes()**: Obtiene denuncias públicas recientes (con RLS)
- **get_denuncia_publica_detalle(id)**: Obtiene detalle de denuncia pública (con RLS)
- **get_recent_reports_by_category(ciudadano_id, categoria_publica_id)**: Obtiene reportes recientes de un ciudadano por categoría
- **check_recent_report_by_category(ciudadano_id, categoria_publica_id)**: Verifica si existe reporte reciente

#### Funciones de Seguridad

- **get_auth_user_uuid()**: Obtiene UUID del usuario autenticado
- **is_portal_user(uid)**: Verifica si usuario tiene acceso al portal
- **is_admin(uid)**: Verifica si usuario es administrador
- **fn_audit_log()**: Función trigger para auditoría automática
- **handle_new_auth_user()**: Crea perfil de ciudadano al registrar usuario en Auth

#### Funciones de Notificaciones

- **fn_enqueue_denuncia_status()**: Encola notificación al cambiar estado de denuncia
- **increment_attempts(queue_id)**: Incrementa intentos de envío de notificación

### Triggers Importantes

- **Denuncias**: Generación de folio, historial automático, notificaciones de cambio de estado
- **Asignaciones**: Registro automático de historial y auditoría
- **Turnos**: Aplicación de lógica de eventos (pausas, cierres)
- **Móviles**: Validación de no solapamiento, actualización de estado y kilometraje
- **Comentarios**: Validación de jerarquía, prevención de cambios, establecimiento de usuario
- **Clasificaciones**: Solo una clasificación vigente por denuncia
- **Auditoría**: Múltiples tablas con trigger `t_audit_*` para registro automático

### Índices Importantes

La base de datos tiene índices optimizados en las siguientes tablas y columnas principales:

- **denuncias**: `idx_denuncias_fecha` (fecha_creacion DESC), `idx_denuncias_estado` (estado_id), `idx_denuncias_categoria` (categoria_publica_id), `idx_denuncias_inspector` (inspector_id), `idx_denuncias_cuadrante` (cuadrante_id)
- **asignaciones_inspector**: `idx_asig_por_denuncia` (denuncia_id), índices en inspector_id y asignado_por
- **denuncia_historial**: `idx_historial_denuncia_fecha` (denuncia_id, created_at)
- **inspectores**: Índices en usuario_id y tipo_turno
- **turnos**: `idx_t_inspector_fecha` (inspector_id, fecha), `idx_t_estado_fecha` (estado, fecha)
- **movil_usos**: `idx_usos_movil_interval` (movil_id, inicio_ts, fin_ts), `idx_usos_inspector_inicio` (inspector_id, inicio_ts)
- **comentarios_denuncias**: `idx_comentarios_denuncia_parent_created` (denuncia_id, parent_id, created_at DESC)
- **audit_log**: `idx_audit_ts` (ts DESC), `idx_audit_tabla` (tabla), `idx_audit_operacion` (operacion)

Estos índices están optimizados para consultas de dashboard, reportes y operaciones frecuentes.

### Dashboard

- Los datos se obtienen de una vista materializada optimizada (`dashboard_metricas_v1`) que pre-calcula todas las métricas
- El endpoint `/api/dashboard` consume esta vista para entregar datos al frontend
- La vista se refresca periódicamente mediante función `refresh_dashboard_metricas()`

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

**Estado actual**: El proyecto no tiene infraestructura de testing configurada actualmente. No hay carpetas de tests ni configuración de testing frameworks.

**Recomendaciones para implementación futura**:

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
  export const runtime = "nodejs";
  ```
- Endpoints con RLS pueden usar Edge runtime para mejor performance:
  ```ts
  export const runtime = "edge";
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

**Solución**: Crear archivo `.env.local` en la raíz con las variables necesarias. Contactar a los mantenedores del proyecto o consultar la documentación interna para obtener los valores correctos.

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
  import { UserContext } from "@/context/UserContext";
  import { createClient } from "@/lib/supabase/client";
  ```
- Agrupar imports: externos primero, luego internos
- Ordenar alfabéticamente dentro de cada grupo

### Tipado

- Siempre tipar props de componentes
- Evitar usar `any`; preferir `unknown` si el tipo es desconocido
- Crear interfaces/types en archivos separados si se reutilizan en múltiples lugares

---

Consulta `README-interno.md` para más detalles sobre la configuración de Docker y entornos.
