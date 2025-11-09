# 🎛️ Dashboard Interactivo con Widgets Personalizables

## 📊 Descripción General

El Dashboard Interactivo es un sistema avanzado de visualización de datos con **24 widgets personalizables** que permite a los usuarios del Portal Web San Bernardo organizar, redimensionar y personalizar su vista de métricas y análisis.

## ✨ Características Principales

### 🎯 Sistema de Widgets Drag & Drop

- **Arrastrar y Soltar**: Reorganiza los widgets simplemente arrastrándolos
- **Redimensionar**: Ajusta el tamaño de cada widget desde las esquinas
- **Ocultar/Mostrar**: Control total sobre qué widgets ver
- **Expandir/Contraer**: Botones rápidos para maximizar o minimizar widgets
- **Persistencia por Usuario**: Tu configuración se guarda automáticamente y persiste entre sesiones

### 📈 24 Widgets Disponibles

#### 📊 Resumen General (3 widgets)

1. **Métricas Generales**: KPIs principales del sistema
2. **Salud del Sistema**: Indicador compuesto de rendimiento
3. **Tendencia Temporal**: Evolución de denuncias en los últimos 6 meses

#### 📈 Análisis de Denuncias (6 widgets)

4. **Top 5 Categorías**: Las categorías más reportadas
5. **Distribución por Estado**: Estados actuales de las denuncias
6. **Denuncias por Prioridad**: Visualización tipo dona
7. **Categorías vs Prioridad**: Matriz de categorías y prioridades
8. **Tasa de Crecimiento**: Cambio porcentual mes a mes
9. **Patrón Día/Hora**: Mapa de calor de reportes por horario

#### 👥 Inspectores (4 widgets)

10. **Carga de Trabajo**: Denuncias asignadas por inspector
11. **Eficiencia de Inspectores**: Análisis de cantidad vs tiempo
12. **Top 10 Más Activos**: Inspectores con más denuncias resueltas
13. **Distribución por Turno**: Inspectores por turno de trabajo

#### ⏱️ Tiempos y SLA (4 widgets)

14. **Cumplimiento SLA**: Indicador de cumplimiento de 48 horas
15. **Tiempo por Estado**: Duración promedio en cada estado
16. **Embudo de Conversión**: Flujo de denuncias por estado
17. **Tendencia Tiempo Respuesta**: Evolución del tiempo de asignación

#### 📍 Geográfico (1 widget)

18. **Top 10 Ubicaciones**: Lugares con más reportes

#### 🔍 Análisis Comparativo (3 widgets)

19. **Asignadas vs Sin Asignar**: Por categoría
20. **Evolución de Estados**: Cambios en el tiempo
21. **Tasa de Resolución**: Porcentaje resuelto por categoría

#### 📅 Temporal Avanzado (2 widgets)

22. **Comparativa Anual**: Año actual vs anterior
23. **Proyección de Denuncias**: Predicción basada en tendencia

#### ✨ Especiales (1 widget)

24. **Palabras Más Frecuentes**: Nube de palabras de títulos

## 🎮 Guía de Uso

### Modo Vista (Por Defecto)

- Los widgets están en posiciones fijas
- Solo visualización de datos
- Scroll normal por el dashboard

### Modo Edición

1. Click en el botón **"✏️ Editar Dashboard"** en la barra superior
2. El botón cambiará a **"💾 Modo Edición Activo"**
3. Ahora puedes:
   - **Arrastrar**: Haz click y mantén presionado en el header del widget
   - **Redimensionar**: Arrastra desde la esquina inferior derecha
   - **Expandir**: Click en el icono 📏 para ocupar ancho completo
   - **Contraer**: Click en el icono 📐 para volver al tamaño original
   - **Ocultar**: Click en la X roja para ocultar el widget

### Restaurar Widgets Ocultos

- Los widgets ocultos aparecen en la sección "Widgets Ocultos" en la barra superior
- Click en cualquier widget oculto para mostrarlo nuevamente

### Restaurar Configuración

- Click en el botón **"🔄 Restaurar"** para volver a la disposición por defecto
- Esto restaura tamaños y posiciones originales de todos los widgets

## 💾 Persistencia de Datos

### Configuración por Usuario

- La configuración se guarda en `localStorage` con el formato: `dashboard-layout-{nombreUsuario}`
- Los widgets ocultos se guardan en: `dashboard-hidden-{nombreUsuario}`
- **NO se borra** con el vencimiento de sesión (12 horas)
- **SI se borra** cuando se cierra sesión con otro usuario

### Ejemplo de Persistencia

```
Usuario: bayron_admin
- Configuración guardada en: localStorage['dashboard-layout-bayron_admin']
- Widgets ocultos en: localStorage['dashboard-hidden-bayron_admin']

Usuario: inspector_juan
- Configuración guardada en: localStorage['dashboard-layout-inspector_juan']
- Widgets ocultos en: localStorage['dashboard-hidden-inspector_juan']
```

Cada usuario mantiene su propia configuración independiente.

## 🔧 Configuración de Widgets

### Tamaños Predeterminados

Los widgets tienen tamaños base en una cuadrícula de **12 columnas**:

- **Ancho Pequeño**: 4 columnas (w: 4)
- **Ancho Medio**: 6 columnas (w: 6)
- **Ancho Grande**: 12 columnas (w: 12)

**Altura** se mide en unidades de 50px:

- h: 3 = 150px
- h: 6 = 300px
- h: 9 = 450px

### Tamaños Mínimos

Cada widget tiene restricciones mínimas para mantener legibilidad:

- Texto/KPIs: mínimo 4x3
- Gráficos simples: mínimo 4x5
- Gráficos complejos: mínimo 6x6

## 🎨 Categorías de Widgets

Los widgets están organizados en **8 categorías**:

1. **Resumen**: Métricas generales y salud del sistema
2. **Denuncias**: Análisis detallado de reportes
3. **Inspectores**: Desempeño y carga de trabajo
4. **SLA**: Tiempos y cumplimiento de acuerdos
5. **Geográfico**: Análisis por ubicación
6. **Comparativo**: Comparaciones y evoluciones
7. **Temporal**: Proyecciones y comparativas anuales
8. **Especial**: Visualizaciones únicas como word cloud

## 📱 Responsividad

- El dashboard se adapta automáticamente a diferentes tamaños de pantalla
- En dispositivos móviles, los widgets se apilan verticalmente
- Se recomienda usar en pantallas de al menos 1024px de ancho para mejor experiencia

## 🚀 Performance

### Optimizaciones Implementadas

- **Lazy Loading**: Los widgets solo se renderizan cuando son visibles
- **Memoización**: Los gráficos no se re-renderizan innecesariamente
- **Virtualización**: El grid usa virtualización para mejor performance

### Recomendaciones

- Mantener máximo 15-20 widgets visibles simultáneamente
- Ocultar widgets que no uses frecuentemente
- Los datos se cargan una sola vez al inicio

## 🔐 Seguridad

- La configuración se guarda **solo en el navegador del usuario**
- No se envía información de configuración al servidor
- Los datos de los gráficos vienen del endpoint `/api/dashboard` que valida permisos

## 🐛 Troubleshooting

### Los widgets no se mueven

- **Solución**: Asegúrate de estar en Modo Edición (botón azul "💾 Modo Edición Activo")

### La configuración no se guarda

- **Solución**: Verifica que tu navegador permita localStorage
- Revisa la consola del navegador por errores

### Los widgets se ven cortados

- **Solución**: Aumenta el tamaño del widget o usa el botón de expandir

### No veo algunos widgets

- **Solución**: Revisa la sección "Widgets Ocultos" en la barra superior

## 📊 Endpoint de Datos

El dashboard consume el endpoint `/api/dashboard` que proporciona:

- 27 tipos diferentes de métricas y análisis
- Datos en tiempo real desde Supabase
- Agregaciones y cálculos del lado del servidor
- Optimizado para minimizar consultas a la base de datos

## 🎯 Mejores Prácticas

1. **Organiza por Prioridad**: Coloca los widgets más importantes arriba
2. **Agrupa por Categoría**: Mantén widgets relacionados juntos
3. **Usa el Espacio Sabiamente**: No todos los widgets necesitan ser grandes
4. **Oculta lo Innecesario**: Reduce el scroll ocultando widgets que no uses
5. **Experimenta**: Prueba diferentes disposiciones hasta encontrar tu ideal

## 🔄 Actualizaciones Futuras

Funcionalidades planificadas:

- [ ] Exportar configuración de dashboard
- [ ] Compartir configuración entre usuarios
- [ ] Temas de color personalizables
- [ ] Widgets personalizados por rol
- [ ] Alertas y notificaciones en widgets
- [ ] Filtros de fecha globales
- [ ] Comparación de múltiples períodos

## 📞 Soporte

Para problemas o sugerencias relacionadas con el dashboard:

- Reporta issues en el repositorio
- Contacta al equipo de desarrollo
- Revisa la documentación técnica en `/docs`

---

**Desarrollado para el Portal Web San Bernardo** 🏛️
