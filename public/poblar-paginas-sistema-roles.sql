-- Script para poblar páginas iniciales del sistema
-- Ejecutar este script después de crear las tablas paginas y roles_paginas

-- =====================================================
-- INSERTAR PÁGINAS PRINCIPALES
-- =====================================================

-- Dashboard (siempre accesible por defecto en el código)
INSERT INTO paginas (nombre, titulo, path, activo, created_at)
VALUES 
  ('dashboard', 'Dashboard', '/portal/dashboard', true, NOW())
ON CONFLICT (nombre) DO NOTHING;

-- Denuncias
INSERT INTO paginas (nombre, titulo, path, activo, created_at)
VALUES 
  ('denuncias', 'Denuncias', '/portal/denuncias', true, NOW())
ON CONFLICT (nombre) DO NOTHING;

-- Derivaciones
INSERT INTO paginas (nombre, titulo, path, activo, created_at)
VALUES 
  ('derivaciones', 'Derivaciones', '/portal/derivaciones', true, NOW())
ON CONFLICT (nombre) DO NOTHING;

-- Mapa
INSERT INTO paginas (nombre, titulo, path, activo, created_at)
VALUES 
  ('mapa', 'Mapa', '/portal/mapa', true, NOW())
ON CONFLICT (nombre) DO NOTHING;

-- Usuarios
INSERT INTO paginas (nombre, titulo, path, activo, created_at)
VALUES 
  ('usuarios', 'Usuarios', '/portal/usuarios', true, NOW())
ON CONFLICT (nombre) DO NOTHING;

-- Auditoría
INSERT INTO paginas (nombre, titulo, path, activo, created_at)
VALUES 
  ('auditoria', 'Auditoría', '/portal/auditoria', true, NOW())
ON CONFLICT (nombre) DO NOTHING;

-- =====================================================
-- INSERTAR PÁGINAS DE CATÁLOGOS
-- =====================================================

-- Catálogo de Inspectores
INSERT INTO paginas (nombre, titulo, path, activo, created_at)
VALUES 
  ('inspectores', 'Inspectores', '/portal/catalogos/inspectores', true, NOW())
ON CONFLICT (nombre) DO NOTHING;

-- Catálogo de Categorías
INSERT INTO paginas (nombre, titulo, path, activo, created_at)
VALUES 
  ('categorias', 'Categorías', '/portal/catalogos/categorias', true, NOW())
ON CONFLICT (nombre) DO NOTHING;

-- Catálogo de Móviles
INSERT INTO paginas (nombre, titulo, path, activo, created_at)
VALUES 
  ('moviles', 'Móviles', '/portal/catalogos/moviles', true, NOW())
ON CONFLICT (nombre) DO NOTHING;

-- Catálogo de Páginas (solo para administradores)
INSERT INTO paginas (nombre, titulo, path, activo, created_at)
VALUES 
  ('paginas', 'Páginas', '/portal/catalogos/paginas', true, NOW())
ON CONFLICT (nombre) DO NOTHING;

-- Catálogo de Roles (solo para administradores)
INSERT INTO paginas (nombre, titulo, path, activo, created_at)
VALUES 
  ('roles', 'Roles', '/portal/catalogos/roles', true, NOW())
ON CONFLICT (nombre) DO NOTHING;

-- =====================================================
-- ASIGNAR TODAS LAS PÁGINAS AL ROL ADMINISTRADOR (ID=1)
-- =====================================================

-- Obtener el ID del rol Administrador
DO $$
DECLARE
  admin_rol_id INT;
  pagina RECORD;
BEGIN
  -- Buscar el rol de Administrador (asumiendo que tiene id=1 o nombre='Administrador')
  SELECT id INTO admin_rol_id FROM roles_portal WHERE id = 1 LIMIT 1;
  
  IF admin_rol_id IS NULL THEN
    RAISE NOTICE 'No se encontró el rol de Administrador. Por favor, crear primero el rol.';
  ELSE
    -- Asignar todas las páginas activas al administrador
    FOR pagina IN SELECT id FROM paginas WHERE activo = true
    LOOP
      INSERT INTO roles_paginas (rol_id, pagina_id)
      VALUES (admin_rol_id, pagina.id)
      ON CONFLICT (rol_id, pagina_id) DO NOTHING;
    END LOOP;
    
    RAISE NOTICE 'Todas las páginas han sido asignadas al rol Administrador (ID: %)', admin_rol_id;
  END IF;
END $$;

-- =====================================================
-- ASIGNAR PÁGINAS BÁSICAS AL ROL OPERADOR (ID=2)
-- =====================================================

-- Páginas típicas para un operador (sin acceso a configuración)
DO $$
DECLARE
  operador_rol_id INT;
  paginas_operador TEXT[] := ARRAY['denuncias', 'derivaciones', 'mapa', 'usuarios', 'inspectores', 'categorias'];
  pagina_nombre TEXT;
  pagina_id_val UUID;
BEGIN
  -- Buscar el rol de Operador
  SELECT id INTO operador_rol_id FROM roles_portal WHERE id = 2 LIMIT 1;
  
  IF operador_rol_id IS NULL THEN
    RAISE NOTICE 'No se encontró el rol de Operador. Por favor, crear primero el rol.';
  ELSE
    -- Asignar páginas específicas al operador
    FOREACH pagina_nombre IN ARRAY paginas_operador
    LOOP
      SELECT id INTO pagina_id_val FROM paginas WHERE nombre = pagina_nombre AND activo = true;
      
      IF pagina_id_val IS NOT NULL THEN
        INSERT INTO roles_paginas (rol_id, pagina_id)
        VALUES (operador_rol_id, pagina_id_val)
        ON CONFLICT (rol_id, pagina_id) DO NOTHING;
      END IF;
    END LOOP;
    
    RAISE NOTICE 'Páginas básicas han sido asignadas al rol Operador (ID: %)', operador_rol_id;
  END IF;
END $$;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Ver todas las páginas creadas
SELECT 
  id,
  nombre,
  titulo,
  path,
  activo,
  created_at
FROM paginas
ORDER BY 
  CASE 
    WHEN path LIKE '/portal/catalogos/%' THEN 2
    ELSE 1
  END,
  nombre;

-- Ver asignaciones del rol Administrador
SELECT 
  r.nombre as rol,
  p.nombre as pagina_nombre,
  p.titulo,
  p.path
FROM roles_portal r
JOIN roles_paginas rp ON r.id = rp.rol_id
JOIN paginas p ON rp.pagina_id = p.id
WHERE r.id = 1
ORDER BY p.path;

-- Ver asignaciones del rol Operador
SELECT 
  r.nombre as rol,
  p.nombre as pagina_nombre,
  p.titulo,
  p.path
FROM roles_portal r
JOIN roles_paginas rp ON r.id = rp.rol_id
JOIN paginas p ON rp.pagina_id = p.id
WHERE r.id = 2
ORDER BY p.path;
