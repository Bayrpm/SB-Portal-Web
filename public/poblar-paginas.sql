-- Script para poblar la tabla de páginas con las páginas actuales del portal

-- Insertar páginas principales
INSERT INTO public.paginas (nombre, titulo, path, activo) VALUES
('dashboard', 'Dashboard de Gráficos', '/portal/dashboard', true),
('denuncias', 'Gestión de Denuncias', '/portal/denuncias', true),
('derivaciones', 'Derivaciones a Inspectores', '/portal/derivaciones', true),
('mapa', 'Mapa de Denuncias', '/portal/mapa', true),
('usuarios', 'Gestión de Usuarios', '/portal/usuarios', true),
('auditoria', 'Registro de Auditoría', '/portal/auditoria', true);

-- Insertar páginas de catálogos
INSERT INTO public.paginas (nombre, titulo, path, activo) VALUES
('catalogos_inspectores', 'Catálogo de Inspectores', '/portal/catalogos/inspectores', true),
('catalogos_categorias', 'Catálogo de Categorías', '/portal/catalogos/categorias', true),
('catalogos_moviles', 'Catálogo de Móviles', '/portal/catalogos/moviles', true),
('catalogos_paginas', 'Catálogo de Páginas', '/portal/catalogos/paginas', true),
('catalogos_roles', 'Catálogo de Roles', '/portal/catalogos/roles', true);

-- Asignar todas las páginas al rol de Administrador (rol_id = 1)
-- Asumiendo que el rol_id = 1 es Administrador
INSERT INTO public.roles_paginas (rol_id, pagina_id)
SELECT 1, id FROM public.paginas WHERE activo = true;

-- Asignar páginas comunes al rol de Operador (rol_id = 2)
-- Asumiendo que el rol_id = 2 es Operador
INSERT INTO public.roles_paginas (rol_id, pagina_id)
SELECT 2, id FROM public.paginas 
WHERE nombre IN (
    'dashboard',
    'denuncias',
    'derivaciones',
    'mapa',
    'catalogos_inspectores',
    'catalogos_categorias'
) AND activo = true;

-- Nota: Ajusta los rol_id según tu configuración actual de roles_portal
