# 📊 Análisis de Auditoría - Portal Web San Bernardo

## 🟢 LO QUE SÍ SE AUDITA (7 Tablas)

### **1. `alertas_oficiales` (Trigger: `t_audit_alertas`)**

- ✅ INSERT - Crear nueva alerta oficial
- ✅ UPDATE - Modificar alerta
- ✅ DELETE - Eliminar alerta
- **Datos capturados**: Título, cuerpo, nivel, denuncia relacionada, cuadrante

---

### **2. `asignaciones_inspector` (Trigger: `t_audit_asign`)**

- ✅ INSERT - Asignar denuncia a inspector
- ✅ UPDATE - Modificar asignación
- ✅ DELETE - Eliminar asignación
- **Datos capturados**: Inspector asignado, denuncia, operador que asignó, fechas

---

### **3. `denuncias` (Trigger: `t_audit_denuncias`)**

- ✅ INSERT - Crear denuncia
- ✅ UPDATE - Modificar denuncia
- ✅ DELETE - Eliminar denuncia
- **Datos capturados**: Folio, estado, prioridad, inspector, ubicación, descripción
- **NOTA**: También tiene otros triggers adicionales (`tg_denuncias_ai`, `tg_denuncias_au`) que afectan historial

---

### **4. `denuncia_evidencias` (Trigger: `t_audit_ev`)**

- ✅ INSERT - Subir foto/video de denuncia
- ✅ UPDATE - Modificar evidencia
- ✅ DELETE - Eliminar evidencia
- **Datos capturados**: Tipo (FOTO/VIDEO), ruta storage, orden, hash

---

### **5. `denuncia_observaciones` (Trigger: `t_audit_obs`)**

- ✅ INSERT - Agregar observación (operador/terreno)
- ✅ UPDATE - Modificar observación
- ✅ DELETE - Eliminar observación
- **Datos capturados**: Tipo de observación, contenido, autor

---

### **6. `usuarios_portal` (Trigger: `t_audit_up`)**

- ✅ INSERT - Crear usuario del portal
- ✅ UPDATE - Modificar usuario (rol, email, estado)
- ✅ DELETE - Eliminar usuario del portal
- **Datos capturados**: Email, rol_id, estado activo/inactivo

---

### **7. `denuncia_clasificaciones` (Trigger: `trg_denuncia_clasif_unica_vigente`)**

- ✅ INSERT - Clasificar denuncia (categorización interna)
- ✅ UPDATE - Cambiar clasificación
- **NOTA**: Solo audita cambios de vigencia, no DELETE explícitos
- **Datos capturados**: Requerimiento, comentario, clasificado_por

---

## 🔴 LO QUE NO SE AUDITA (12+ Tablas Críticas)

### **Gestión de Turnos**

- ❌ `turnos` - Crear/modificar turnos de inspectores (operación crítica)
- ❌ `turnos_planificados` - Planificación de turnos
- ❌ `turnos_excepciones` - Excepciones a turnos
- ❌ `evento_turno_tipo` - Tipos de eventos (PAUSA_INI, PAUSA_FIN, etc.)
- ❌ `eventos_turno` - Eventos durante turno (pausas, cierres)

### **Catálogos Maestros**

- ❌ `turno_tipo` - Definición de tipos de turno (Mañana, Tarde, Noche)
- ❌ `cat_familias` - Familias de categorización interna
- ❌ `cat_grupos` - Grupos de categorización
- ❌ `cat_subgrupos` - Subgrupos de categorización
- ❌ `cat_requerimientos` - Requerimientos (nivel 4 de categorización)
- ❌ `categorias_publicas` - Categorías públicas de denuncias
- ❌ `prioridades_denuncia` - Niveles de prioridad

### **Gestión de Móviles/Vehículos**

- ❌ `moviles` - Crear/modificar vehículos (estado, mantenimiento)
- ❌ `movil_usos` - Registro de uso de vehículos
- ❌ `movil_uso_kilometraje` - Lecturas de kilometraje
- ❌ `movil_tipo` - Tipos de vehículos

### **Otros**

- ❌ `inspectores` - Datos de inspectores (tipo_turno, en_turno, activo)
- ❌ `perfiles_ciudadanos` - Perfiles de ciudadanos que reportan
- ❌ `roles_portal` - Definición de roles
- ❌ `paginas` - Páginas del sistema
- ❌ `roles_paginas` - Permisos rol-página
- ❌ `cuadrantes` - Definición de cuadrantes geográficos
- ❌ `push_status_queue` - Cola de notificaciones push
- ❌ `notificaciones_enviadas` - Notificaciones enviadas
- ❌ `tokens_push` - Tokens de dispositivos para push

---

## 📋 Resumen de Cobertura

| Aspecto             | Auditado | No Auditado       | Importancia |
| ------------------- | -------- | ----------------- | ----------- |
| **Denuncias**       | ✅ Sí    | ❌ Historial      | 🔴 CRÍTICA  |
| **Usuarios Portal** | ✅ Sí    | ❌ Cambios de rol | 🔴 CRÍTICA  |
| **Asignaciones**    | ✅ Sí    | ❌ Modificaciones | 🟡 ALTA     |
| **Turnos**          | ❌ No    | ❌ Todo           | 🔴 CRÍTICA  |
| **Catálogos**       | ❌ No    | ❌ Todo           | 🟡 MEDIA    |
| **Móviles**         | ❌ No    | ❌ Todo           | 🟡 MEDIA    |

---

## 🎯 Recomendaciones

### **PRIORITARIO (Implementar Inmediatamente)**

1. **Auditar `turnos`** - Cambios de estado de turno es crítico
2. **Auditar `inspectores`** - Cambios en `en_turno`, `activo`, `tipo_turno`

### **IMPORTANTE**

4. **Auditar `categorias_publicas`** - Cambios en catálogo público
5. **Auditar `turno_tipo`** - Cambios en definición de turnos
6. **Auditar `roles_portal`** - Cambios en estructura de permisos

### **OPCIONAL**

7. **Auditar `moviles`** - Menos crítico, pero útil

---

## 🔧 Acciones No Auditadas Pero Relevantes

| Acción                      | Tabla                          | Impacto     | Estado         |
| --------------------------- | ------------------------------ | ----------- | -------------- |
| Inspector entra en turno    | `inspectores.en_turno = true`  | 🔴 CRÍTICO  | ❌ No auditado |
| Inspector sale de turno     | `inspectores.en_turno = false` | 🔴 CRÍTICO  | ❌ No auditado |
| Crear tipo de turno         | `turno_tipo`                   | 🟡 ALTO     | ❌ No auditado |
| Modificar categoría pública | `categorias_publicas`          | 🟡 ALTO     | ❌ No auditado |
| Asignar rol a usuario       | `usuarios_portal.rol_id`       | ✅ AUDITADO | ✅ Auditado    |
| Registrar kilometraje       | `movil_uso_kilometraje`        | 🟢 BAJO     | ❌ No auditado |

---

## 📝 Consultas Útiles para Verificar

### Ver todos los registros auditados de un usuario

```sql
SELECT * FROM audit_log
WHERE actor_email = 'usuario@sanbernardo.gob.cl'
ORDER BY ts DESC LIMIT 100;
```

### Ver cambios en denuncias

```sql
SELECT * FROM audit_log
WHERE tabla = 'denuncias'
AND operacion = 'UPDATE'
ORDER BY ts DESC LIMIT 50;
```

### Ver quién modificó usuarios

```sql
SELECT ts, actor_email, operacion, new_row
FROM audit_log
WHERE tabla = 'usuarios_portal'
ORDER BY ts DESC;
```

### Ver tablas sin auditoría en una operación

```sql
SELECT DISTINCT tabla FROM audit_log WHERE tabla NOT IN (
  'alertas_oficiales',
  'asignaciones_inspector',
  'denuncias',
  'denuncia_evidencias',
  'denuncia_observaciones',
  'usuarios_portal',
  'denuncia_clasificaciones'
);
```
