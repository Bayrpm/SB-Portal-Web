# GitHub Labeler Configuration

Este documento explica la configuración del GitHub Labeler para el proyecto Portal Web San Bernardo.

## 🏷️ ¿Qué es GitHub Labeler?

GitHub Labeler es una acción de GitHub que **automáticamente aplica etiquetas (labels) a los Pull Requests** basándose en los archivos que han sido modificados.

## 📁 Archivos de Configuración

### 1. `.github/workflows/label.yml`
Este es el workflow de GitHub Actions que ejecuta el labeler cuando se abre, actualiza o reabre un Pull Request.

**Características:**
- Se ejecuta automáticamente en PRs (opened, synchronize, reopened)
- Usa la versión 5 de `actions/labeler`
- Sincroniza las etiquetas automáticamente (`sync-labels: true`)

### 2. `.github/labeler.yml`
Este archivo contiene las reglas de etiquetado basadas en patrones de archivos.

## 🎯 Etiquetas Automáticas

Las siguientes etiquetas se aplican **automáticamente** basándose en los archivos modificados:

| Etiqueta | Se aplica cuando se modifican archivos en |
|----------|------------------------------------------|
| `documentation` | Archivos `.md`, documentación |
| `web` | Archivos del frontend (src/app, tsx, jsx, css) |
| `api` | Archivos en `src/app/api/**` |
| `components` | Archivos de componentes |
| `dashboard` | Archivos del dashboard |
| `denuncias` | Archivos del módulo de denuncias |
| `usuarios` | Archivos del módulo de usuarios |
| `inspector` | Archivos relacionados con inspectores |
| `admin` | Archivos de administración y catálogos |
| `design` | Archivos CSS, Tailwind, PostCSS |
| `configuration` | Archivos de configuración (*.config.*, .json, Docker) |
| `dependencies` | package.json, package-lock.json |
| `workflows` | Archivos en `.github/workflows/` |
| `testing` | Archivos de pruebas (*.test.*, *.spec.*) |
| `security` | Archivos de seguridad |
| `database` | Archivos de Supabase |
| `email` | Archivos de emails |
| `excel` | Archivos de exportación a Excel |

## 🖐️ Etiquetas Manuales

Las siguientes etiquetas **NO** se pueden aplicar automáticamente y deben ser añadidas manualmente según el contexto:

### Etiquetas de Estado
- `bug` - Para corrección de bugs
- `enhancement` - Para mejoras de funcionalidades existentes
- `feature` - Para nuevas funcionalidades
- `in progress` - Trabajo en progreso
- `ready for review` - Listo para revisión
- `needs testing` - Necesita pruebas
- `blocked` - Bloqueado por algún motivo

### Etiquetas de Gestión
- `help wanted` - Se necesita ayuda
- `question` - Preguntas o discusiones
- `wontfix` - No se va a solucionar
- `duplicate` - Duplicado

### Etiquetas de Contexto
- `móvil` - Para cambios relacionados con la app móvil
- `ciudadano` - Para funcionalidades de cara al ciudadano
- `municipio` - Para funcionalidades específicas del municipio

## 🚀 Cómo Funciona

1. **Abres un Pull Request** → El workflow se activa automáticamente
2. **Labeler analiza** los archivos modificados
3. **Aplica etiquetas** según las reglas en `labeler.yml`
4. **Actualiza las etiquetas** si agregas más commits

## 📝 Cómo Añadir Nuevas Reglas

Para añadir nuevas reglas de etiquetado automático:

1. Edita `.github/labeler.yml`
2. Añade una nueva sección con el nombre de la etiqueta:

```yaml
nombre-etiqueta:
  - changed-files:
    - any-glob-to-any-file: ['ruta/del/archivo/**/*']
```

3. Usa patrones glob para coincidir archivos:
   - `**/*` - Cualquier archivo en cualquier subdirectorio
   - `*.js` - Archivos JavaScript
   - `src/app/**/*.tsx` - Archivos TypeScript React en src/app

## 🔧 Personalización

### Opciones del Workflow

En `.github/workflows/label.yml` puedes configurar:

```yaml
with:
  repo-token: "${{ secrets.GITHUB_TOKEN }}"
  configuration-path: .github/labeler.yml  # Ruta al archivo de config
  sync-labels: true  # Sincronizar etiquetas automáticamente
```

### Tipos de Eventos

El workflow se ejecuta en estos eventos:

```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened]
```

## 📚 Referencias

- [GitHub Labeler Action](https://github.com/actions/labeler)
- [Documentación de GitHub Actions](https://docs.github.com/en/actions)
- [Sintaxis de Glob Patterns](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#filter-pattern-cheat-sheet)

## 💡 Consejos

1. **Revisa las etiquetas aplicadas** - Aunque son automáticas, revisa que sean correctas
2. **Añade etiquetas manuales** - Las etiquetas contextuales (bug, feature, etc.) deben añadirse manualmente
3. **Mantén las reglas actualizadas** - Si agregas nuevos módulos o directorios, actualiza `labeler.yml`
4. **Evita conflictos** - Un PR puede tener múltiples etiquetas si modifica archivos de diferentes áreas

## 🐛 Resolución de Problemas

**El labeler no está aplicando etiquetas:**
1. Verifica que las etiquetas existan en el repositorio
2. Revisa los logs del workflow en la pestaña Actions
3. Asegúrate de que los patrones en `labeler.yml` coincidan con las rutas de archivos

**Las etiquetas no se sincronizan:**
1. Verifica que `sync-labels: true` esté configurado
2. Puede tomar unos segundos en actualizar después de un nuevo commit

**Errores de permisos:**
1. El workflow necesita permisos de `pull-requests: write`
2. Esto ya está configurado en el workflow
