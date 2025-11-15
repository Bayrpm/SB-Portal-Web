# Generador de Denuncias - Portal Web San Bernardo

Generador automatizado de 1000 denuncias con datos realistas usando arquitectura modular.

## 📋 Características

- **1000 denuncias** distribuidas en 3 estados:

  - 700 Cerradas (Mayo-Noviembre 2025)
  - 240 En Proceso (Diciembre 1-15, 2025)
  - 60 Pendientes (Diciembre 1-15, 2025)

- **8 categorías reales** con plantillas específicas
- **Distribución equitativa** entre 20 inspectores
- **Datos realistas**: títulos, descripciones, observaciones, comentarios y reacciones
- **Arquitectura modular** para fácil mantenimiento

## 🏗️ Estructura Modular

```
denuncias/
├── config/
│   └── configuracion.js          # Configuración central
├── data/
│   ├── categorias.js              # Plantillas por categoría
│   ├── direcciones.js             # Direcciones de San Bernardo
│   └── estados.js                 # Estados de denuncias
├── utils/
│   ├── helpers.js                 # Funciones auxiliares
│   ├── selectors.js               # Algoritmos de selección
│   ├── generators.js              # Generadores de datos
│   └── checkpoint.js              # Sistema de checkpoint/reanudación
├── loaders/
│   └── cargarDatos.js             # Carga desde Supabase
├── creators/
│   ├── crearDenuncia.js           # Crea denuncia base
│   ├── asignarInspectores.js      # Asigna inspectores
│   ├── agregarObservaciones.js    # Agrega observaciones
│   ├── agregarComentarios.js      # Agrega comentarios
│   └── agregarReacciones.js       # Agrega reacciones
├── processors/
│   └── procesarLote.js            # Procesamiento por lotes
├── reports/
│   └── generarReportes.js         # Generación de reportes
└── generarDenuncias.js            # Script principal
```

## 🚀 Instalación

1. **Navegar al directorio**:

   ```bash
   cd Automatizacion/denuncias
   ```

2. **Instalar dependencias**:

   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:

   ```bash
   cp .env.example .env
   ```

   Editar `.env` con tus credenciales de Supabase:

   ```env
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
   ```

## ▶️ Uso

Ejecutar el generador:

```bash
npm run generar
```

El script:

1. **Verifica si existe checkpoint**: Si el script se interrumpió previamente, pregunta si deseas reanudar
2. Carga datos desde Supabase (ciudadanos, inspectores, operadores)
3. Genera 1000 denuncias en 3 lotes (cerradas, en proceso, pendientes)
4. Asigna inspectores equitativamente
5. Agrega observaciones, comentarios y reacciones
6. Genera reportes TXT y JSON
7. Limpia checkpoint al completar exitosamente

### 🔄 Sistema de Checkpoint y Reanudación

El generador incluye un sistema automático de recuperación ante errores:

- **Guardado automático**: El progreso se guarda cada 50 denuncias y después de completar cada estado
- **Reanudación inteligente**: Si el script falla o se interrumpe, al volver a ejecutarlo te pregunta si deseas continuar desde donde quedó
- **Sin duplicados**: Al reanudar, el script salta las denuncias ya creadas
- **Limpieza automática**: El checkpoint se elimina automáticamente al completar exitosamente

**Ejemplo de uso**:

```bash
# Primera ejecución (se interrumpe en la denuncia 500)
npm run generar
# ... se detiene por error ...

# Segunda ejecución (detecta checkpoint)
npm run generar
# ⚠️  SE ENCONTRÓ UN CHECKPOINT ANTERIOR
#    Progreso: 500/1000 denuncias
#    - Cerradas: 500/700
#    ...
# ¿Desea reanudar desde el checkpoint anterior? (s/n): s
# ✅ Reanudando desde checkpoint anterior...
# ... continúa desde denuncia 501 ...
```

## 📊 Reportes Generados

Al finalizar, se crean 2 archivos en el directorio actual:

- **`denuncias_generadas_reporte.txt`**: Reporte legible con estadísticas
- **`denuncias_generadas_reporte.json`**: Datos estructurados para análisis

## ⚙️ Configuración

Editar `config/configuracion.js` para ajustar:

- **Fechas**: Rangos para denuncias pasadas y futuras
- **Cantidades**: Total y distribución por estado
- **Delays**: Tiempos entre operaciones
- **Pesos**: Distribución de categorías y prioridades

## 📝 Datos Generados

Cada denuncia incluye:

- ✅ Título y descripción según categoría
- ✅ Ubicación (coordenadas y dirección)
- ✅ Fechas (creación, inicio atención, cierre)
- ✅ Estado, categoría y prioridad
- ✅ Asignación a inspector
- ✅ Observaciones de operador e inspector
- ✅ Comentarios de ciudadanos (0-4)
- ✅ Reacciones a denuncias (0-8)
- ✅ Reacciones a comentarios (0-5)

## ⏱️ Duración Estimada

Con delays configurados (100ms entre denuncias):

- **~5-6 minutos** para generar las 1000 denuncias completas
- **~18 requests/segundo** (muy seguro para Supabase)
- **~16,000 registros totales** (denuncias + asignaciones + observaciones + comentarios + reacciones)

### Breakdown por Estado:

- **Cerradas (700)**: ~3.5 minutos
- **En Proceso (240)**: ~1.2 minutos
- **Pendientes (60)**: ~0.3 minutos

Sin delays (solo para testing):

- Cambiar `DELAY_ENTRE_DENUNCIAS` a `0` en configuración
- **⚠️ No recomendado**: puede saturar Supabase

## 🔍 Validaciones

Antes de ejecutar, asegúrate de tener en Supabase:

- ✅ Al menos 50 ciudadanos en `perfiles_ciudadanos`
- ✅ Al menos 20 inspectores activos en `inspectores`
- ✅ Al menos 15 operadores activos en `usuarios_portal`

## 🛠️ Troubleshooting

**Error: Fallan variables de entorno**

- Verifica que `.env` existe y tiene `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`
- **NO uses** prefijo `NEXT_PUBLIC_` en estas variables (este es un script Node.js, no Next.js)

**Error: No hay ciudadanos/inspectores/operadores**

- Ejecuta primero los scripts en `/Automatizacion/ciudadanos`, `/inspectores` y `/operadores`
- Verifica que los usuarios estén activos en la base de datos

**Error: Rate limit / Saturación de Supabase**

- Aumenta `DELAY_ENTRE_DENUNCIAS` en `config/configuracion.js`
- Valor recomendado: 100ms (actual)

**Script se interrumpió a mitad de ejecución**

- ✅ **No te preocupes**: El checkpoint se guardó automáticamente
- Vuelve a ejecutar `npm run generar`
- Selecciona `s` cuando pregunte si deseas reanudar
- El script continuará desde donde quedó sin duplicar registros

**Quiero empezar desde cero aunque exista checkpoint**

- Ejecuta `npm run generar`
- Selecciona `n` cuando pregunte si deseas reanudar
- El checkpoint se eliminará y comenzará desde cero

**Archivo checkpoint quedó corrupto**

- Elimina manualmente: `rm generacion_checkpoint.json` (Linux/Mac) o `del generacion_checkpoint.json` (Windows)
- Vuelve a ejecutar el script

## 📦 Dependencias

- **@faker-js/faker** `^8.4.1`: Generación de datos falsos en español
- **@supabase/supabase-js** `^2.39.7`: Cliente de Supabase
- **dotenv** `^16.4.1`: Variables de entorno

## 📄 Licencia

MIT - Portal Web San Bernardo
