# Generador de Operadores para Portal San Bernardo

Este script automatiza la creación de cuentas de operadores de prueba en el Portal Web de San Bernardo.

## 📋 Descripción

Genera **15 operadores** con:

- ✅ Cuentas verificadas en Supabase Auth
- ✅ Perfiles completos en `usuarios_portal`
- ✅ Emails corporativos siguiendo el estándar `@sanbernardo.gob.cl`
- ✅ Rol de operador asignado automáticamente
- ✅ Credenciales de acceso

## 🔧 Requisitos Previos

1. **Node.js** instalado (v18 o superior)
2. **Variables de entorno** configuradas en `.env.local` (raíz del proyecto):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
   ```
3. **Rol de Operador** existente en la tabla `roles_portal` de Supabase

## 📦 Instalación

Desde la carpeta `Automatizacion/operadores/`, ejecutar:

```bash
npm install
```

## 🚀 Uso

### Ejecutar el script

```bash
npm run generar
```

### Salida esperada

El script creará:

1. **`credenciales_operadores.txt`**: Archivo de texto con las credenciales de acceso
2. **`operadores_generados.json`**: Archivo JSON con datos completos de los operadores

### Ejemplo de salida en consola

```
🚀 Iniciando generación de 15 operadores...

✅ Rol encontrado: Operador (ID: 2)

[1/15] Creando: María González (mgonzalez@sanbernardo.gob.cl)...
   ✅ Creado exitosamente (1/15)

[2/15] Creando: Juan Pérez (jperez@sanbernardo.gob.cl)...
   ✅ Creado exitosamente (2/15)

...

============================================================
📊 RESUMEN DE GENERACIÓN DE OPERADORES
============================================================
✅ Operadores creados exitosamente: 15
❌ Errores: 0
============================================================

✨ Proceso completado!
📄 Credenciales guardadas en: credenciales_operadores.txt
📄 Datos completos guardados en: operadores_generados.json
```

## 📧 Formato de Emails Corporativos

El script usa la misma lógica que `formatEmployeeEmails.ts`:

### Regla de generación:

1. **Primero**: `[inicial][apellido]@sanbernardo.gob.cl`
   - Ejemplo: Juan Pérez → `jperez@sanbernardo.gob.cl`
2. **Si existe**: `[2 letras][apellido]@sanbernardo.gob.cl`
   - Ejemplo: Juan Pérez → `juperez@sanbernardo.gob.cl`
3. **Si también existe**: `[2 letras][apellido][número]@sanbernardo.gob.cl`
   - Ejemplo: Juan Pérez → `juperez2@sanbernardo.gob.cl`

### Características:

- ✅ Elimina tildes y caracteres especiales
- ✅ Omite partículas comunes (de, del, la, las, los, y, etc.)
- ✅ Todo en minúsculas
- ✅ Verifica unicidad contra `auth.users` de Supabase

## 🔑 Formato de Contraseñas

Las contraseñas siguen el formato: **`[Nombre][3 dígitos aleatorios]`**

Ejemplo:

- Nombre: `María`
- Contraseña: `Maria456`

## 📊 Datos Generados

### Perfil en usuarios_portal:

- `usuario_id`: UUID de Supabase Auth (PK, FK a auth.users)
- `rol_id`: ID del rol de operador (FK a roles_portal)
- `activo`: `true` (activo por defecto)
- `created_at`: Timestamp de creación

**Nota**: La tabla `usuarios_portal` NO almacena email ni nombre directamente.

### Datos en Supabase Auth:

- Email verificado automáticamente
- Contraseña encriptada
- User metadata con nombre completo (`full_name`)
- ID único (UUID)

## ⚠️ Importante

- **Seguridad**: Los archivos de credenciales contienen información sensible
- **Producción**: Este script es para **desarrollo/testing** únicamente
- **Cleanup**: Considera eliminar las cuentas de prueba cuando no sean necesarias

## 🛠️ Solución de Problemas

### Error: "No se encontró el rol Operador"

**Solución**: Verificar que existe un rol con nombre similar a "Operador" en `roles_portal`:

```sql
SELECT * FROM roles_portal WHERE nombre ILIKE '%operador%';
```

### Error: "Error en Auth"

**Solución**: Verificar que `SUPABASE_SERVICE_ROLE_KEY` esté correctamente configurado en `.env.local`

### Error: "No se pudo generar un email único"

**Solución**: Revisar si hay conflictos en `auth.users` o limpiar datos de prueba anteriores:

```sql
-- Ver usuarios existentes
SELECT email FROM auth.users ORDER BY created_at DESC LIMIT 20;

-- Eliminar usuarios de prueba (CUIDADO en producción)
DELETE FROM auth.users WHERE email LIKE '%@sanbernardo.gob.cl';
```

## 📝 Archivos Generados

### `credenciales_operadores.txt`

Formato legible para humanos con todas las credenciales:

```
================================================================================
           CREDENCIALES DE OPERADORES - PORTAL SAN BERNARDO
================================================================================
Generado: 14/11/2025 a las 10:30:45
Total de cuentas: 15
Dominio: @sanbernardo.gob.cl
================================================================================

001. María González
     Email:      mgonzalez@sanbernardo.gob.cl
     Contraseña: Maria456
     Rol:        Operador
     ID:         a1b2c3d4-e5f6-7890-abcd-ef1234567890

...
```

### `operadores_generados.json`

Formato JSON con datos estructurados:

```json
{
  "fecha_generacion": "2025-11-14T13:30:45.123Z",
  "total": 15,
  "operadores": [
    {
      "numero": 1,
      "nombreCompleto": "María González",
      "nombre": "María",
      "apellido": "González",
      "email": "mgonzalez@sanbernardo.gob.cl",
      "password": "Maria456",
      "rol": "Operador",
      "usuario_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    }
    ...
  ]
}
```

## 🔄 Relacionado

- [Generador de Inspectores](../inspectores/README.md)
- [Generador de Ciudadanos](../ciudadanos/README.md)
- [Formato de Emails](../../src/lib/emails/employees/formatEmployeeEmails.ts)

## 📄 Licencia

MIT - Portal San Bernardo
