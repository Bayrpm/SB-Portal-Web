# Resumen de Configuración del Labeler

## ✅ Archivos Creados/Modificados

1. **`.github/labeler.yml`** (NUEVO)
   - Archivo de configuración principal con 18 reglas de etiquetado automático
   - Mapea patrones de archivos a etiquetas específicas
   - Incluye comentarios sobre etiquetas que requieren aplicación manual

2. **`.github/workflows/label.yml`** (MODIFICADO)
   - Actualizado de actions/labeler@v4 a @v5
   - Cambiado de `pull_request_target` a `pull_request` con tipos específicos
   - Agregado checkout del repositorio
   - Configurado `sync-labels: true` para sincronización automática
   - Añadidos nombres descriptivos a los steps

3. **`.github/LABELER_README.md`** (NUEVO)
   - Documentación completa en español
   - Explica cómo funciona el sistema
   - Lista todas las etiquetas automáticas y manuales
   - Incluye guía de personalización y troubleshooting

## 🎯 Etiquetas Configuradas (Automáticas)

El labeler aplicará automáticamente estas 18 etiquetas:

1. `documentation` - Archivos Markdown y docs
2. `web` - Frontend general (tsx, jsx, css)
3. `api` - Endpoints del backend/BFF
4. `components` - Componentes reutilizables
5. `dashboard` - Módulo de dashboard
6. `denuncias` - Módulo de denuncias
7. `usuarios` - Módulo de usuarios
8. `inspector` - Funcionalidad de inspectores
9. `admin` - Administración y catálogos
10. `design` - Estilos y diseño
11. `configuration` - Archivos de configuración
12. `dependencies` - package.json/lock
13. `workflows` - GitHub Actions workflows
14. `testing` - Archivos de pruebas
15. `security` - Seguridad
16. `database` - Supabase
17. `email` - Funcionalidad de emails
18. `excel` - Exportación a Excel

## 🖐️ Etiquetas Manuales

Estas etiquetas de `labels.json` NO se pueden automatizar y deben aplicarse manualmente:

- Estado: `bug`, `enhancement`, `feature`, `in progress`, `ready for review`, `needs testing`, `blocked`
- Gestión: `help wanted`, `question`, `wontfix`, `duplicate`
- Contexto: `móvil`, `ciudadano`, `municipio`

## 🚀 Próximos Pasos Recomendados

### 1. Verificar que las etiquetas existan en GitHub

Ejecutar script para crear etiquetas faltantes (si es necesario):

```bash
# Revisar labels.json y crear las etiquetas en GitHub
gh label list  # Ver etiquetas existentes
```

### 2. Probar el Labeler

- Crear un PR de prueba modificando archivos en diferentes áreas
- Verificar que las etiquetas se apliquen correctamente
- Ajustar reglas si es necesario

### 3. Configuraciones Adicionales Opcionales

#### A. Auto-assign Reviewers
Crear `.github/auto_assign.yml` para asignar revisores automáticamente:

```yaml
# Número de revisores a asignar
numberOfReviewers: 2

# Lista de revisores
reviewers:
  - usuario1
  - usuario2
```

#### B. PR Size Labeler
Agregar etiquetas basadas en el tamaño del PR (opcional):

```yaml
# En labeler.yml
size/XS:
  - changed-files:
    - any-glob-to-any-file: ['*']
      count:
        lte: 10

size/S:
  - changed-files:
    - any-glob-to-any-file: ['*']
      count:
        range: [11, 50]
```

#### C. Branch Name Labeler
Crear workflow adicional para etiquetar por nombre de rama:

```yaml
# .github/workflows/label-by-branch.yml
name: Label by Branch
on:
  pull_request:
    types: [opened, reopened]

jobs:
  label:
    runs-on: ubuntu-latest
    steps:
      - name: Add label based on branch
        if: startsWith(github.head_ref, 'feature/')
        run: gh pr edit ${{ github.event.pull_request.number }} --add-label "feature"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

#### D. Issue Templates con Labels
Actualizar `.github/ISSUE_TEMPLATE/` para incluir labels por defecto:

```yaml
labels: ['bug', 'needs testing']
```

### 4. Integración con Project Boards

Configurar automatización para mover PRs en project boards basándose en etiquetas:

```yaml
# .github/workflows/project-automation.yml
name: Project Board Automation
on:
  pull_request:
    types: [labeled]

jobs:
  move-to-column:
    runs-on: ubuntu-latest
    steps:
      - if: contains(github.event.pull_request.labels.*.name, 'ready for review')
        # Mover a columna "In Review"
```

### 5. Notificaciones por Slack/Discord (Opcional)

Configurar notificaciones cuando se apliquen ciertas etiquetas:

```yaml
- name: Slack Notification
  if: contains(github.event.pull_request.labels.*.name, 'needs testing')
  uses: 8398a7/action-slack@v3
  with:
    status: custom
    text: 'PR needs testing: ${{ github.event.pull_request.html_url }}'
```

## 📊 Métricas y Monitoreo

Una vez en producción, puedes:

1. Monitorear cuántos PRs reciben cada etiqueta
2. Identificar áreas del código que cambian con más frecuencia
3. Mejorar la asignación de revisores basándose en etiquetas

## 🔒 Consideraciones de Seguridad

- ✅ El workflow usa `pull_request` en lugar de `pull_request_target` para mayor seguridad
- ✅ Solo tiene permisos de lectura/escritura mínimos necesarios
- ✅ No ejecuta código arbitrario del PR

## 📝 Mantenimiento

Para mantener el labeler actualizado:

1. Revisar mensualmente las etiquetas más/menos usadas
2. Ajustar patrones en `labeler.yml` según evolución del proyecto
3. Agregar nuevas etiquetas cuando se creen nuevos módulos
4. Documentar cambios en LABELER_README.md

## ❓ Preguntas Frecuentes

**¿Puedo tener múltiples etiquetas en un PR?**
Sí, un PR puede tener múltiples etiquetas si modifica archivos de diferentes áreas.

**¿Cómo elimino una etiqueta aplicada incorrectamente?**
Manualmente desde la interfaz de GitHub o usando `gh` CLI.

**¿Se puede etiquetar por contenido del PR?**
No con este labeler, pero se puede usar otro workflow para analizar el título/descripción del PR.

**¿Funciona con forks?**
Sí, pero asegúrate de usar `pull_request` (no `pull_request_target`) para seguridad.

## 🎉 Conclusión

La configuración del labeler está completa y lista para usar. El sistema etiquetará automáticamente los PRs basándose en los archivos modificados, mejorando la organización y triage del proyecto.

---

**Fecha de configuración:** 2025-10-29
**Versión de labeler:** v5
**Estado:** ✅ Listo para producción
