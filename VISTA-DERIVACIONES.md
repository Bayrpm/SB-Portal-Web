# Vista Materializada para Derivaciones

## Resumen

Se ha creado una vista materializada `derivaciones_vista` que precomputa todos los datos necesarios para el endpoint `/api/derivaciones`, reduciendo el tiempo de respuesta de **8 minutos a milisegundos**.

## Cambios Realizados

### 1. Vista Materializada (`public/vista-derivaciones.sql`)

La vista `derivaciones_vista` incluye:

- **folio, titulo**: Identificación de la denuncia
- **categoria, prioridad**: Datos desnormalizados con LEFT JOINs
- **fecha_creacion, ubicacion_texto**: Datos de ubicación
- **inspector_asignado**: Indicador de si tiene inspector asignado
- **tiene_acompanantes**: Precalculado (true si hay más de 1 asignación activa)
- **horas_sin_asignar**: Diferencia en horas desde fecha_creacion
- **vencida_sla**: true si horas_sin_asignar > 48
- **estado_asignacion**: 'sin_asignar' o 'con_inspector' para filtros rápidos

### 2. Actualización del Endpoint (`src/app/api/derivaciones/route.ts`)

- **Antes**: Hacía N+1 queries (una por cada denuncia para acompañantes) + queries por categorías y prioridades = 8 minutos
- **Ahora**: Una única query a la vista materializada = milisegundos

Cambios:

- Simplificado a un único `.select()` contra `derivaciones_vista`
- Filtrados en memoria (ya están todos los datos necesarios)
- Agregado logging con tiempos de ejecución
- Cache headers para optimización de cliente

### 3. Refresh Automático

La vista se refresca automáticamente cuando:

- Cambia una denuncia (INSERT/UPDATE)
- Cambia una asignación de inspector (INSERT/UPDATE/DELETE)

Se usa `REFRESH MATERIALIZED VIEW CONCURRENTLY` para no bloquear lecturas durante el refresh.

## Ejecución

1. **Conectar a Supabase SQL Editor** y ejecutar el contenido de `public/vista-derivaciones.sql`

   O desde CLI:

   ```bash
   supabase db push
   ```

2. **Verificar que la vista se creó**:

   ```sql
   SELECT * FROM derivaciones_vista LIMIT 10;
   ```

3. **Probar el endpoint**:

   ```bash
   # Sin asignar (por defecto)
   curl http://localhost:3000/api/derivaciones

   # Pendiente acompañantes
   curl http://localhost:3000/api/derivaciones?vista=pendiente_acompanantes
   ```

## Optimizaciones Adicionales

El SQL incluye:

- **Índices** en folio, estado_asignacion y vencida_sla para filtros frecuentes
- **GROUP BY optimizado** en la subconsulta de acompañantes
- **EXTRACT(EPOCH)** para cálculo de horas en SQL (más rápido que en JS)
- **LEFT JOINs** para manejar categorías/prioridades NULL

## Rendimiento Esperado

| Métrica             | Antes        | Después                               |
| ------------------- | ------------ | ------------------------------------- |
| Tiempo de respuesta | ~8 minutos   | <100ms                                |
| Queries a BD        | ~1000+ (N+1) | 1                                     |
| Refresco de datos   | N/A          | Cada cambio en denuncias/asignaciones |

## Notas

- Si tienes denuncias muy recientes, puede haber un delay de hasta 1 segundo antes del refresh (por el `pg_sleep(1)`)
- Para un refresh manual: `SELECT refresh_derivaciones_vista();`
- La vista solo incluye datos computables en SQL. Lógica compleja sigue siendo en TypeScript si es necesario.
