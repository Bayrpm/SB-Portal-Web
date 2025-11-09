# Dashboard con Sidebar de Filtros - Guía de Usuario

## 📊 Descripción General

El nuevo dashboard utiliza un **sistema de sidebar lateral con filtros avanzados** que permite:

- ✅ Filtrar gráficos por categoría
- ⭐ Marcar gráficos como favoritos
- 👁️ Mostrar/ocultar gráficos individuales
- 💾 Guardar configuración personalizada por usuario
- 🔄 Persistencia más allá del cierre de sesión

---

## 🎯 Características Principales

### 1. **Sidebar de Filtros (Panel Lateral)**

- **Ubicación**: Panel izquierdo fijo (siempre visible en desktop)
- **Contenido**:
  - Búsqueda rápida por nombre de gráfico
  - Filtros por categoría (8 categorías disponibles)
  - Checkbox individual para cada gráfico
  - Botón de favorito (estrella) para cada gráfico
  - Acciones rápidas: Mostrar todos, Ocultar todos, Solo favoritos, Resetear

### 2. **Categorías Disponibles**

Los 24 gráficos están organizados en 8 categorías:

| Categoría          | Gráficos | Descripción                                               |
| ------------------ | -------- | --------------------------------------------------------- |
| 📈 **Resumen**     | 3        | Métricas generales, Salud del sistema, Tendencia temporal |
| 🎯 **Denuncias**   | 6        | Prioridades, categorías, crecimiento, patrones            |
| 👷 **Inspectores** | 4        | Carga de trabajo, eficiencia, distribución                |
| ⏱️ **SLA**         | 4        | Cumplimiento, tiempos, embudo, tendencias                 |
| 📍 **Geográfico**  | 1        | Top ubicaciones                                           |
| 🔄 **Comparativo** | 3        | Comparativas entre estados y categorías                   |
| 📅 **Temporal**    | 2        | Análisis año actual vs anterior, proyecciones             |
| 🌟 **Especial**    | 1        | Nube de palabras                                          |

### 3. **Sistema de Favoritos**

- **Marcar favorito**: Click en la estrella ⭐ junto a cualquier gráfico
- **Ver solo favoritos**: Botón "Solo Favoritos" en la parte superior del sidebar
- **Persistencia**: Los favoritos se guardan automáticamente

### 4. **Grid de Gráficos (Área Principal)**

- **Layout responsivo**: Se adapta a diferentes tamaños de pantalla
- **3 tamaños de gráfico**:
  - **Full**: Ocupa todo el ancho (100%)
  - **Medium**: Mitad del ancho en desktop (50%)
  - **Small**: Un tercio del ancho (33%)
- **Indicador de favoritos**: Los gráficos marcados muestran una estrella dorada
- **Smooth scroll**: Navegación suave entre gráficos

---

## 🚀 Cómo Usar

### Filtrar Gráficos por Categoría

1. Abrir el sidebar (siempre visible en desktop, botón hamburguesa en móvil)
2. Click en el nombre de una categoría para expandir/contraer
3. Las categorías muestran un contador: `(visibles/total)`
4. Seleccionar/deseleccionar checkboxes individuales

### Buscar Gráficos

1. Usar el campo de búsqueda en la parte superior del sidebar
2. Escribir el nombre del gráfico (búsqueda en tiempo real)
3. Los resultados se filtran automáticamente

### Marcar Favoritos

1. Click en la estrella ⭐ junto al nombre del gráfico en el sidebar
2. La estrella se vuelve dorada cuando está marcado
3. El gráfico también muestra la estrella en el grid principal

### Ver Solo Favoritos

1. Click en el botón **"Solo Favoritos"** en la parte superior del sidebar
2. El grid mostrará únicamente los gráficos marcados como favoritos
3. Otras opciones rápidas:
   - **Mostrar Todos**: Activa todos los gráficos
   - **Ocultar Todos**: Desactiva todos los gráficos
   - **Resetear Filtros**: Vuelve a la configuración predeterminada

---

## 💾 Persistencia de Configuración

### ¿Qué se Guarda?

La configuración se almacena en `localStorage` con las siguientes claves:

- `dashboard-visible-{nombreUsuario}`: Gráficos visibles
- `dashboard-favorites-{nombreUsuario}`: Gráficos favoritos

### ¿Cuándo se Guarda?

- **Automáticamente** cada vez que:
  - Marcas/desmarcas un checkbox
  - Agregas/quitas un favorito
  - Usas botones de acción rápida

### ¿Cuándo se Borra?

- Al hacer click en **"Resetear Filtros"**
- Al iniciar sesión con un usuario diferente
- Al limpiar el localStorage del navegador

### ¿Sobrevive al Cierre de Sesión?

✅ **SÍ** - La configuración persiste incluso después de:

- Cerrar el navegador
- Cerrar sesión y volver a iniciar con el mismo usuario
- Refrescar la página

---

## 📱 Responsive Design

### Desktop (≥1024px)

- Sidebar fijo a la izquierda (320px de ancho)
- Grid de gráficos ocupa el espacio restante
- Gráficos en columnas (full, medium, small)

### Tablet (768px - 1023px)

- Sidebar colapsable con botón toggle
- Grid ocupa todo el ancho cuando sidebar está oculto
- Gráficos se adaptan a 1-2 columnas

### Móvil (<768px)

- Sidebar en overlay (se sobrepone al contenido)
- Grid de 1 columna
- Todos los gráficos a ancho completo

---

## 🎨 Personalización Visual

### Indicadores de Estado

- ✅ **Checkbox activo**: Azul con checkmark
- ⭐ **Favorito**: Estrella dorada (#FFD700)
- 📊 **Gráfico visible**: Borde normal
- 🌟 **Gráfico favorito visible**: Estrella en la esquina superior derecha

### Colores de Categorías

Cada categoría tiene un color distintivo en el sidebar:

- Resumen: Azul
- Denuncias: Verde
- Inspectores: Púrpura
- SLA: Naranja
- Etc.

---

## 🔧 Troubleshooting

### Los filtros no se guardan

**Solución**: Verificar que el navegador permita localStorage. Algunos modos de navegación privada bloquean esto.

### El sidebar no aparece en móvil

**Solución**: Buscar el botón de menú (hamburguesa) en la esquina superior izquierda.

### Los gráficos no se ocultan al desmarcar

**Solución**: Refrescar la página. Si persiste, abrir DevTools y verificar errores en consola.

### La configuración se resetea al cambiar de usuario

**Comportamiento esperado**: Cada usuario tiene su propia configuración personalizada.

---

## 🆚 Diferencias con el Sistema Anterior (Widgets)

| Característica  | Widgets (Anterior) | Sidebar (Actual)             |
| --------------- | ------------------ | ---------------------------- |
| **Drag & Drop** | ✅ Sí              | ❌ No                        |
| **Resize**      | ✅ Sí              | ❌ No (tamaños predefinidos) |
| **Filtros**     | ❌ No              | ✅ Sí (por categoría)        |
| **Favoritos**   | ❌ No              | ✅ Sí                        |
| **Búsqueda**    | ❌ No              | ✅ Sí                        |
| **Simplicidad** | ⚠️ Complejo        | ✅ Intuitivo                 |
| **Performance** | ⚠️ Pesado          | ✅ Liviano                   |
| **Mobile**      | ⚠️ Limitado        | ✅ Optimizado                |

---

## 📊 Lista Completa de Gráficos

### Resumen (3)

1. ✅ Métricas Generales - KPIs principales del sistema
2. 🏥 Salud del Sistema - Indicadores de rendimiento
3. 📈 Tendencia Temporal - Últimos 6 meses

### Denuncias (6)

4. 🎯 Top 5 Categorías - Categorías más reportadas
5. 📊 Distribución por Estado - Estados actuales
6. 🍩 Denuncias por Prioridad - Gráfico de dona
7. 📊 Categorías vs Prioridad - Comparativa apilada
8. 📈 Tasa de Crecimiento - Crecimiento mensual
9. 🔥 Patrón Día/Hora - Heatmap de actividad

### Inspectores (4)

10. 👷 Carga de Trabajo - Denuncias por inspector
11. ⚡ Eficiencia de Inspectores - Cantidad vs tiempo
12. 🏆 Top 10 Más Activos - Ranking de inspectores
13. 🔄 Distribución por Turno - Asignación por turnos

### SLA (4)

14. ⏱️ Cumplimiento SLA - Gauge de cumplimiento
15. ⏰ Tiempo por Estado - Permanencia promedio
16. 📉 Embudo de Conversión - Estados a lo largo del proceso
17. 📈 Tendencia Tiempo Respuesta - Evolución mensual

### Geográfico (1)

18. 📍 Top 10 Ubicaciones - Zonas con más denuncias

### Comparativo (3)

19. 🔄 Asignadas vs Sin Asignar - Por categoría
20. 📊 Evolución de Estados - Tendencia mensual
21. ✅ Tasa de Resolución - Eficiencia por categoría

### Temporal (2)

22. 📅 Comparativa Anual - Año actual vs anterior
23. 🔮 Proyección de Denuncias - Predicción futura

### Especial (1)

24. ☁️ Palabras Más Frecuentes - Word cloud de descripciones

---

## 🔮 Futuras Mejoras

Posibles funcionalidades a implementar:

- [ ] Exportar configuración para compartir con otros usuarios
- [ ] Temas de color (claro/oscuro)
- [ ] Layouts predefinidos por rol
- [ ] Filtros de fecha global para todos los gráficos
- [ ] Exportación de gráficos individuales a imagen/PDF
- [ ] Actualizaciones en tiempo real
- [ ] Notificaciones de alertas en gráficos críticos
- [ ] Comparativas personalizadas

---

## 📞 Soporte

Para reportar problemas o sugerir mejoras, contacta al equipo de desarrollo o abre un issue en el repositorio del proyecto.

---

**Versión**: 2.0  
**Última actualización**: 9 de noviembre de 2025  
**Sistema anterior**: Widgets con react-grid-layout (deprecado)
