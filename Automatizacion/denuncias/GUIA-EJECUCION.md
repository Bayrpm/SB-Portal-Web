# Guía de Ejecución Rápida

## 📋 Checklist Pre-Ejecución

Antes de ejecutar el generador, verifica:

- [ ] Node.js instalado (v18 o superior)
- [ ] Credenciales de Supabase disponibles
- [ ] Al menos 50 ciudadanos en la BD
- [ ] Al menos 20 inspectores activos en la BD
- [ ] Al menos 15 operadores activos en la BD

## 🚀 Pasos de Instalación y Ejecución

### 1. Instalar Dependencias

```bash
cd Automatizacion/denuncias
npm install
```

### 2. Configurar Variables de Entorno

```bash
# Crear archivo .env desde la plantilla
cp .env.example .env
```

Editar `.env` con tus credenciales:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
```

### 3. Verificar Conexión (Opcional pero Recomendado)

```bash
npm test
```

Deberías ver:

```
✅ Conexión exitosa!

📊 Datos disponibles:
   - Ciudadanos: 50
   - Inspectores: 20
   - Operadores: 15

✅ Todo listo para generar denuncias!
```

### 4. Ejecutar Generador

```bash
npm run generar
```

## 🔄 Sistema de Checkpoint

El generador incluye un sistema automático de recuperación ante interrupciones:

### ¿Qué hace el checkpoint?

- ✅ **Guarda progreso automáticamente** cada 50 denuncias
- ✅ **Guarda después de completar cada estado** (Cerradas, En Proceso, Pendientes)
- ✅ **Permite reanudar** sin duplicar registros
- ✅ **Se limpia automáticamente** al completar exitosamente

### Si el script se interrumpe...

Al volver a ejecutar `npm run generar`, verás:

```
⚠️  SE ENCONTRÓ UN CHECKPOINT ANTERIOR
────────────────────────────────────────────────────────────────
   Fecha: 14/1/2025, 15:30:45
   Progreso: 500/1000 denuncias
   - Cerradas: 500/700
   - En Proceso: 0/240
   - Pendientes: 0/60
   Errores: 2
   Último folio: 20250514-00500
────────────────────────────────────────────────────────────────

¿Desea reanudar desde el checkpoint anterior? (s/n):
```

**Opciones**:

- **s**: Continúa desde denuncia 501 (sin duplicar)
- **n**: Borra checkpoint y comienza desde cero

### Eliminación Manual del Checkpoint

Si necesitas eliminar el checkpoint manualmente:

```bash
# Windows PowerShell
del generacion_checkpoint.json

# Linux/Mac
rm generacion_checkpoint.json
```

## ⏱️ Tiempo Estimado

Con delays configurados (100ms entre denuncias):

- **~5-6 minutos** para 1000 denuncias completas
- **~18 requests/segundo** (muy seguro para Supabase)
- **~16,000 registros totales** generados

**Breakdown**:

- Cerradas (700): ~3.5 minutos
- En Proceso (240): ~1.2 minutos
- Pendientes (60): ~0.3 minutos

Sin delays (solo para testing):

- Cambiar `DELAY_ENTRE_DENUNCIAS` a `0` en `config/configuracion.js`
- **⚠️ No recomendado**: puede saturar Supabase

## 📊 Salida Esperada

Durante la ejecución verás:

```
════════════════════════════════════════════════════════════════
  GENERADOR DE DENUNCIAS - PORTAL WEB SAN BERNARDO
════════════════════════════════════════════════════════════════

📋 Configuración:
   Total denuncias: 1000
   - Cerradas: 700
   - En Proceso: 240
   - Pendientes: 60
   Delay entre denuncias: 50ms
   Delay entre lotes: 1000ms

📥 Cargando datos desde Supabase...

✓ Cargados 50 ciudadanos
✓ Cargados 20 inspectores
✓ Cargados 15 operadores

✓ Datos cargados correctamente
   - 50 ciudadanos
   - 20 inspectores
   - 15 operadores

📝 Generando denuncias...

🔵 Creando 700 denuncias CERRADAS...
   Progreso: 350/1000 (35.0%) - Folio: 20251114-00350
```

Al finalizar:

```
════════════════════════════════════════════════════════════════
  ✅ GENERACIÓN COMPLETADA
════════════════════════════════════════════════════════════════

📊 Estadísticas:
   Total generadas: 1000
   Errores: 0
   Duración: 12m 34s

📄 Reportes generados:
   - D:\Repositorios\SB-Portal-Web\Automatizacion\denuncias\denuncias_generadas_reporte.txt
   - D:\Repositorios\SB-Portal-Web\Automatizacion\denuncias\denuncias_generadas_reporte.json

════════════════════════════════════════════════════════════════
```

## 🔍 Verificación de Resultados

### Opción 1: Ver Reporte TXT

```bash
cat denuncias_generadas_reporte.txt
```

### Opción 2: Ver Reporte JSON

```bash
cat denuncias_generadas_reporte.json
```

### Opción 3: Consultar BD

```sql
-- Ver total de denuncias generadas
SELECT COUNT(*) FROM denuncias;

-- Ver distribución por estado
SELECT estado_id, COUNT(*)
FROM denuncias
GROUP BY estado_id
ORDER BY estado_id;

-- Ver distribución por categoría
SELECT categoria_publica_id, COUNT(*)
FROM denuncias
GROUP BY categoria_publica_id
ORDER BY categoria_publica_id;

-- Ver distribución por inspector
SELECT inspector_id, COUNT(*)
FROM denuncias
WHERE inspector_id IS NOT NULL
GROUP BY inspector_id
ORDER BY COUNT(*) DESC;
```

## ❌ Solución de Problemas

### Error: "Faltan variables de entorno"

**Causa**: Archivo `.env` no existe o está incompleto

**Solución**:

```bash
cp .env.example .env
# Editar .env con tus credenciales
```

> ⚠️ **IMPORTANTE**: NO uses prefijo `NEXT_PUBLIC_` (este es un script Node.js, no Next.js)

### Script se interrumpió a mitad de ejecución

**Causa**: Error de red, falta de memoria, interrupción manual (Ctrl+C)

**Solución**:

1. Vuelve a ejecutar `npm run generar`
2. Selecciona `s` cuando pregunte si deseas reanudar
3. El script continuará desde donde quedó

### Quiero empezar desde cero aunque exista checkpoint

**Solución**:

```bash
# Opción 1: Responder "n" al prompt
npm run generar
# ¿Desea reanudar desde el checkpoint anterior? (s/n): n

# Opción 2: Eliminar checkpoint manualmente
del generacion_checkpoint.json  # Windows
rm generacion_checkpoint.json   # Linux/Mac
```

### Error: "No hay ciudadanos/inspectores/operadores"

**Causa**: Las tablas están vacías

**Solución**: Ejecutar primero los scripts de generación de usuarios:

```bash
cd ../ciudadanos && npm install && npm run generar
cd ../inspectores && npm install && npm run generar
cd ../operadores && npm install && npm run generar
```

### Error: "Error al insertar en Supabase"

**Causa**: Problemas de conectividad o permisos

**Solución**:

1. Verificar que el `SUPABASE_SERVICE_ROLE_KEY` sea correcto
2. Verificar conectividad a internet
3. Revisar políticas RLS en Supabase

### Error: "Rate limit exceeded"

**Causa**: Demasiadas peticiones a Supabase

**Solución**: Aumentar delays en `config/configuracion.js`:

```javascript
DELAY_ENTRE_DENUNCIAS: 100, // Aumentar de 50ms a 100ms
```

## 🎯 Personalización

### Cambiar Cantidades

Editar `config/configuracion.js`:

```javascript
export const CONFIG = {
  TOTAL_DENUNCIAS: 500, // Cambiar de 1000 a 500
  CANTIDAD_CERRADAS: 350, // 70%
  CANTIDAD_EN_PROCESO: 120, // 24%
  CANTIDAD_PENDIENTES: 30, // 6%
  // ...
};
```

### Cambiar Distribución de Categorías

Editar `config/configuracion.js`:

```javascript
export const PESOS_CATEGORIAS = {
  1: 0.2, // Emergencias: 20% (aumentar de 15%)
  2: 0.15, // Violencia: 15% (disminuir de 20%)
  // ...
};
```

### Desactivar Delays (Más Rápido)

Editar `config/configuracion.js`:

```javascript
export const CONFIG = {
  // ...
  DELAY_ENTRE_DENUNCIAS: 0, // Sin delay
  DELAY_ENTRE_LOTES: 0, // Sin delay
};
```

## 📌 Notas Importantes

1. El script usa `SUPABASE_SERVICE_ROLE_KEY` que **bypasea RLS**
2. Las denuncias se generan con fechas entre Mayo 2025 y Diciembre 15, 2025
3. Los folios se generan automáticamente en formato `YYYYMMDD-XXXXX`
4. La distribución de inspectores es equitativa (todos tendrán aprox. la misma cantidad)
5. Los reportes se sobrescriben en cada ejecución

## 🔄 Re-ejecutar

Si necesitas generar más denuncias:

1. El script generará nuevas denuncias (no duplica)
2. Los folios serán únicos y secuenciales
3. Los reportes se actualizarán con los nuevos totales

Para limpiar y empezar de cero:

```sql
-- ⚠️ CUIDADO: Esto elimina TODAS las denuncias
DELETE FROM denuncia_reacciones;
DELETE FROM comentario_reacciones;
DELETE FROM comentarios_denuncias;
DELETE FROM denuncia_observaciones;
DELETE FROM asignaciones_inspector;
DELETE FROM denuncias;
```
