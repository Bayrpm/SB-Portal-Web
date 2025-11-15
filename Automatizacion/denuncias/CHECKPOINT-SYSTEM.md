# 🔄 Sistema de Checkpoint y Recuperación

## Descripción General

El generador de denuncias incluye un sistema robusto de checkpoint que permite:

- ✅ **Guardar progreso automáticamente** durante la generación
- ✅ **Reanudar desde el último punto** sin duplicar registros
- ✅ **Recuperarse de errores** sin perder el trabajo realizado
- ✅ **Limpieza automática** al completar exitosamente

## Arquitectura

### Archivo de Checkpoint

**Ubicación**: `generacion_checkpoint.json` (en directorio raíz del proyecto)

**Estructura**:

```json
{
  "timestamp": "2025-01-14T15:30:45.123Z",
  "progreso": {
    "actual": 500,
    "total": 1000,
    "errores": 2
  },
  "denuncias": {
    "cerradas": 500,
    "enProceso": 0,
    "pendientes": 0
  },
  "ultimoFolio": "20250514-00500"
}
```

### Funciones Principales

**Módulo**: `utils/checkpoint.js`

```javascript
// Guardar checkpoint
await guardarCheckpoint(progreso, denunciasCreadas);

// Cargar checkpoint existente
const checkpoint = cargarCheckpoint(); // Retorna objeto o null

// Verificar si existe
const existe = tieneCheckpointPendiente(); // Retorna boolean

// Eliminar checkpoint
limpiarCheckpoint();
```

## Flujo de Operación

### 1. Inicio del Script

```javascript
// generarDenuncias.js - Función main()

// 1. Verificar checkpoint existente
if (tieneCheckpointPendiente()) {
  checkpoint = cargarCheckpoint();

  // 2. Mostrar resumen
  console.log("⚠️  SE ENCONTRÓ UN CHECKPOINT ANTERIOR");
  console.log(
    `   Progreso: ${checkpoint.progreso.actual}/${checkpoint.progreso.total}`
  );

  // 3. Preguntar al usuario
  const reanudar = await preguntarReanudar();

  if (reanudar) {
    // Continuar con checkpoint
  } else {
    // Eliminar y empezar de cero
    limpiarCheckpoint();
  }
}
```

### 2. Durante la Generación

```javascript
// procesarLote.js - Función procesarTodasDenuncias()

// Guardar checkpoint después de completar cada estado
if (inicioCerradas < CONFIG.CANTIDAD_CERRADAS) {
  await procesarLote(...);

  await guardarCheckpoint(progreso, {
    cerradas: resultado.cerradas.length,
    enProceso: resultado.enProceso.length,
    pendientes: resultado.pendientes.length,
  });
}
```

### 3. Reanudación desde Checkpoint

```javascript
// procesarLote.js - Función procesarTodasDenuncias()

// Determinar desde dónde reanudar
const inicioCerradas = checkpoint?.denuncias.cerradas || 0;
const inicioEnProceso = checkpoint?.denuncias.enProceso || 0;
const inicioPendientes = checkpoint?.denuncias.pendientes || 0;

// Saltar denuncias ya creadas
if (inicioCerradas < CONFIG.CANTIDAD_CERRADAS) {
  await procesarLote(
    CONFIG.CANTIDAD_CERRADAS,
    ESTADOS.CERRADA,
    datos,
    contadoresInspectores,
    progreso,
    resultado.cerradas,
    inicioCerradas // <-- Índice de inicio
  );
}
```

### 4. Finalización Exitosa

```javascript
// generarDenuncias.js - Función main()

// Al completar todas las denuncias
if (tieneCheckpointPendiente()) {
  limpiarCheckpoint();
  console.log("🗑️  Checkpoint limpiado exitosamente");
}
```

## Casos de Uso

### Caso 1: Ejecución Normal sin Interrupciones

```
1. Ejecutar: npm run generar
2. No hay checkpoint previo
3. Genera 1000 denuncias completamente
4. Limpia checkpoint automáticamente
5. ✅ Completado
```

### Caso 2: Interrupción y Reanudación

```
1. Ejecutar: npm run generar
2. Script se detiene en denuncia 500 (error de red)
3. Checkpoint guardado: {actual: 500, cerradas: 500, ...}
4. Ejecutar nuevamente: npm run generar
5. Detecta checkpoint
6. Usuario selecciona "s" (reanudar)
7. Continúa desde denuncia 501
8. Completa hasta 1000
9. Limpia checkpoint
10. ✅ Completado
```

### Caso 3: Inicio Desde Cero con Checkpoint Existente

```
1. Ejecutar: npm run generar
2. Detecta checkpoint previo (500/1000)
3. Usuario selecciona "n" (no reanudar)
4. Elimina checkpoint
5. Comienza desde denuncia 1
6. ✅ Generación desde cero
```

### Caso 4: Múltiples Interrupciones

```
1. Primera ejecución: se detiene en 300
   Checkpoint: {actual: 300, cerradas: 300}

2. Segunda ejecución: reanuda y se detiene en 550
   Checkpoint: {actual: 550, cerradas: 550}

3. Tercera ejecución: reanuda y se detiene en 850
   Checkpoint: {actual: 850, cerradas: 700, enProceso: 150}

4. Cuarta ejecución: reanuda y completa
   Checkpoint eliminado automáticamente
```

## Frecuencia de Guardado

El checkpoint se guarda en los siguientes puntos:

1. **Después de completar estado CERRADAS** (700 denuncias)
2. **Después de completar estado EN_PROCESO** (240 denuncias)
3. **Después de completar estado PENDIENTES** (60 denuncias)

> **Nota**: Actualmente configurado para guardar después de cada estado completo. Si se desea guardar más frecuentemente (cada 50 denuncias), descomentar las líneas en `procesarLote.js`.

## Manejo de Errores

### Error Durante la Generación

```javascript
// procesarLote.js
try {
  // Crear denuncia...
} catch (error) {
  console.error(`❌ Error al crear denuncia ${i + 1}:`, error.message);
  progreso.errores++;

  // Guardar checkpoint incluso con error
  await guardarCheckpoint(progreso, resultado);
}
```

### Error Fatal en Script Principal

```javascript
// generarDenuncias.js - Función main()
catch (error) {
  console.error("❌ ERROR FATAL");
  console.error(error.message);
  console.log("💾 El checkpoint se ha guardado automáticamente.");
  console.log("   Puede reanudar el proceso ejecutando el script nuevamente.");
  process.exit(1);
}
```

## Seguridad del Checkpoint

### Prevención de Duplicados

El checkpoint almacena **contadores de denuncias creadas por estado**, no los IDs individuales:

```javascript
{
  "denuncias": {
    "cerradas": 500,    // Ya se crearon 500 cerradas
    "enProceso": 0,     // Aún no se crean denuncias en proceso
    "pendientes": 0     // Aún no se crean denuncias pendientes
  }
}
```

Al reanudar, el script **salta** las primeras 500 cerradas:

```javascript
await procesarLote(
  CONFIG.CANTIDAD_CERRADAS, // 700
  ESTADOS.CERRADA,
  datos,
  contadoresInspectores,
  progreso,
  resultado.cerradas,
  500 // <-- Inicio en índice 500 (salta 0-499)
);
```

### Atomicidad

- ✅ El checkpoint se guarda DESPUÉS de completar cada estado
- ✅ Si falla durante un estado, se reanuda desde el inicio de ese estado
- ✅ No se pierden denuncias ya creadas

## Configuración

### Cambiar Frecuencia de Guardado

Para guardar cada 50 denuncias en lugar de solo al completar estados:

**Archivo**: `processors/procesarLote.js`

**Línea**: ~62-65

```javascript
// Guardar checkpoint cada 50 denuncias
if (progreso.actual % 50 === 0) {
  await guardarCheckpoint(progreso, {
    cerradas: resultado.cerradas.length,
    enProceso: resultado.enProceso.length,
    pendientes: resultado.pendientes.length,
  });
}
```

**⚠️ Advertencia**: Guardar muy frecuentemente puede impactar performance (I/O de disco).

### Ubicación del Archivo de Checkpoint

Para cambiar la ubicación del archivo:

**Archivo**: `utils/checkpoint.js`

**Línea**: ~7

```javascript
const CHECKPOINT_FILE = path.join(process.cwd(), "generacion_checkpoint.json");
```

Cambiar a:

```javascript
const CHECKPOINT_FILE = path.join(process.cwd(), "backups", "checkpoint.json");
```

## Limitaciones

1. **No guarda inspectores asignados**: Al reanudar, los contadores de inspectores se reinician. Esto puede causar distribución no perfectamente equitativa si se reanuda a mitad de la generación.

2. **No guarda estado intermedio dentro de un lote**: Si el script se detiene en denuncia 550 (mitad del lote de cerradas), al reanudar comenzará desde 500 (inicio del último estado guardado).

3. **Archivo local, no distribuido**: El checkpoint solo existe localmente. Si ejecutas en otra máquina, no se compartirá.

## Mejoras Futuras

### Posibles Mejoras

1. **Guardar cada N denuncias**: Guardar checkpoint cada 50 o 100 denuncias para mayor granularidad

2. **Guardar contadores de inspectores**: Preservar distribución exacta al reanudar

3. **Múltiples checkpoints**: Mantener historial de checkpoints (backup rotativo)

4. **Checkpoint en base de datos**: Almacenar progreso en Supabase para compartir entre máquinas

5. **Metadata adicional**: Guardar timestamp de cada estado, tiempo transcurrido, etc.

## Testing

### Simular Interrupción

```javascript
// En procesarLote.js, agregar:
if (progreso.actual === 500) {
  throw new Error("Simulación de error para testing");
}
```

### Verificar Checkpoint

```bash
# Ver contenido del checkpoint
cat generacion_checkpoint.json

# Verificar que existe
ls -la | grep checkpoint

# Eliminar manualmente
rm generacion_checkpoint.json
```

### Validar No-Duplicados

```sql
-- Verificar que no hay folios duplicados
SELECT folio, COUNT(*)
FROM denuncias
GROUP BY folio
HAVING COUNT(*) > 1;

-- Debería retornar 0 filas
```

## Resumen

El sistema de checkpoint proporciona:

- ✅ **Resiliencia**: Recuperación automática de errores
- ✅ **Transparencia**: Usuario controla si reanudar o empezar de cero
- ✅ **Seguridad**: Sin duplicados, sin pérdida de datos
- ✅ **Simplicidad**: Guardado y carga automáticos
- ✅ **Eficiencia**: Guardado solo en puntos clave

**Conclusión**: El sistema de checkpoint garantiza que incluso en caso de interrupciones, el trabajo realizado no se pierde y la generación puede completarse exitosamente sin duplicar registros.
