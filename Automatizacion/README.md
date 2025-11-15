# Scripts de Automatización - Portal San Bernardo

Este directorio contiene scripts para automatizar tareas de generación de datos de prueba y otros procesos.

## 📁 Estructura

```
Automatizacion/
├── ciudadanos/          # Scripts para generar cuentas de ciudadanos
│   ├── generarCiudadanos.js
│   ├── package.json
│   ├── credenciales_ciudadanos.txt (generado)
│   └── ciudadanos_generados.json (generado)
├── inspectores/         # Scripts para generar cuentas de inspectores
│   ├── generarInspectores.js
│   ├── package.json
│   ├── credenciales_inspectores.txt (generado)
│   └── inspectores_generados.json (generado)
└── README.md
```

## 🚀 Uso

### Generar Ciudadanos

Este script genera 50 cuentas de ciudadanos con datos aleatorios usando Faker.

#### 1. Instalar dependencias

```bash
cd Automatizacion/ciudadanos
npm install
```

#### 2. Configurar variables de entorno

Asegúrate de tener un archivo `.env.local` en la raíz del proyecto con:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

#### 3. Ejecutar el script

```bash
npm run generar
```

O directamente:

```bash
node generarCiudadanos.js
```

### Generar Inspectores

Este script genera 20 cuentas de inspectores con datos aleatorios y emails corporativos.

#### 1. Instalar dependencias

```bash
cd Automatizacion/ciudadanos
npm install
```

#### 2. Configurar variables de entorno

Asegúrate de tener un archivo `.env.local` en la raíz del proyecto con:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

#### 3. Ejecutar el script

```bash
npm run generar
```

O directamente:

```bash
node generarCiudadanos.js
```

### 📄 Archivos Generados

#### Ciudadanos

- **`credenciales_ciudadanos.txt`**: Archivo de texto legible con las credenciales de todos los ciudadanos generados
- **`ciudadanos_generados.json`**: Archivo JSON con datos completos para uso programático

#### Inspectores

- **`credenciales_inspectores.txt`**: Archivo de texto legible con las credenciales de todos los inspectores generados
- **`inspectores_generados.json`**: Archivo JSON con datos completos para uso programático

### ⚙️ Características de los Scripts

#### Script de Ciudadanos

- ✅ Genera 50 ciudadanos con datos aleatorios (nombre, apellido, teléfono)
- ✅ Usa dominio `@demo.sanbernardo.cl`
- ✅ Contraseñas con formato: `[Nombre][3 dígitos aleatorios]`
- ✅ Cuentas pre-verificadas (email_confirm: true)
- ✅ Respeta triggers de Supabase para creación de perfiles
- ✅ Delay de 1 segundo entre peticiones para no saturar Supabase
- ✅ Manejo de errores robusto
- ✅ Logs detallados de progreso
- ✅ Genera archivos TXT y JSON con credenciales

#### Script de Inspectores

- ✅ Genera 20 inspectores con datos aleatorios
- ✅ Emails corporativos: `[inicial(es)][apellido]@sanbernardo.cl`
- ✅ Genera email único automáticamente (1 inicial, 2 iniciales, o sufijo numérico)
- ✅ Contraseñas con formato: `[Nombre][3 dígitos aleatorios]`
- ✅ Asigna turno aleatorio de los tipos disponibles en BD
- ✅ Crea registro en tabla `inspectores` automáticamente
- ✅ Teléfono formato chileno: `+56 9 XXXX XXXX`
- ✅ Delay de 1.5 segundos entre creaciones
- ✅ Rollback automático en caso de error
- ✅ Genera archivos TXT y JSON con credenciales

### 🔒 Seguridad

**IMPORTANTE**: Los archivos generados contienen contraseñas en texto plano.

- ⚠️ NO los incluyas en control de versiones (están en `.gitignore`)
- ⚠️ NO los compartas públicamente
- ⚠️ Úsalos solo en entornos de desarrollo/testing

### 📊 Datos Generados

#### Cada ciudadano incluye:

- Nombre y apellido aleatorios (español)
- Email: `nombre.apellido[numero]@demo.sanbernardo.cl`
- Contraseña: `[Nombre][3 dígitos]` (ej: `Juan123`)
- Teléfono: +569 + 8 dígitos aleatorios
- UUID de usuario en Supabase
- Perfil completo en `perfiles_ciudadanos`

#### Cada inspector incluye:

- Nombre y apellido aleatorios (español)
- Email corporativo: `[inicial(es)][apellido]@sanbernardo.cl` (ej: `jperez@sanbernardo.cl`)
- Contraseña: `[Nombre][3 dígitos]` (ej: `Juan456`)
- Teléfono: `+56 9 XXXX XXXX` (formato chileno)
- Turno asignado aleatoriamente
- UUID de usuario en Supabase
- Perfil en `perfiles_ciudadanos`
- Registro en tabla `inspectores` con turno activo

### 🛠️ Troubleshooting

**Error: "Missing Supabase credentials"**

- Verifica que `.env.local` existe en la raíz del proyecto
- Confirma que `SUPABASE_SERVICE_ROLE_KEY` está configurado

**Error: "Rate limit exceeded"**

- El script usa delays de 1 segundo entre peticiones
- Si aun así falla, aumenta el delay en la línea `await delay(1000);`

**Trigger no crea perfil automáticamente**

- Verifica que el trigger `handle_new_auth_user` está activo en Supabase
- El script espera 500ms para que el trigger ejecute antes de actualizar

## 📝 Notas

- El script usa `@faker-js/faker` con locale español para generar datos realistas
- Todos los usuarios se crean con `email_confirm: true` para evitar proceso de verificación
- El script es idempotente: si un email ya existe, registra el error y continúa
