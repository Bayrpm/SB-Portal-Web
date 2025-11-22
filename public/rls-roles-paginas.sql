-- Políticas RLS para las tablas de gestión de roles y páginas

-- ================================
-- TABLA: paginas
-- ================================

-- Habilitar RLS
ALTER TABLE public.paginas ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios del portal pueden leer las páginas
CREATE POLICY "Usuarios del portal pueden leer páginas"
ON public.paginas
FOR SELECT
TO authenticated
USING (true);

-- Política: Los administradores pueden hacer todo
CREATE POLICY "Administradores pueden gestionar páginas"
ON public.paginas
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios_portal
    WHERE usuario_id = auth.uid()
    AND rol_id = 1
    AND activo = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.usuarios_portal
    WHERE usuario_id = auth.uid()
    AND rol_id = 1
    AND activo = true
  )
);

-- ================================
-- TABLA: roles_paginas
-- ================================

-- Habilitar RLS
ALTER TABLE public.roles_paginas ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios del portal pueden leer las asignaciones
CREATE POLICY "Usuarios del portal pueden leer roles_paginas"
ON public.roles_paginas
FOR SELECT
TO authenticated
USING (true);

-- Política: Los administradores pueden gestionar asignaciones
CREATE POLICY "Administradores pueden gestionar roles_paginas"
ON public.roles_paginas
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios_portal
    WHERE usuario_id = auth.uid()
    AND rol_id = 1
    AND activo = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.usuarios_portal
    WHERE usuario_id = auth.uid()
    AND rol_id = 1
    AND activo = true
  )
);

-- ================================
-- ÍNDICES para mejorar rendimiento
-- ================================

-- Índice en paginas por nombre
CREATE INDEX IF NOT EXISTS idx_paginas_nombre ON public.paginas(nombre);

-- Índice en paginas por activo
CREATE INDEX IF NOT EXISTS idx_paginas_activo ON public.paginas(activo);

-- Índice en roles_paginas por rol_id
CREATE INDEX IF NOT EXISTS idx_roles_paginas_rol ON public.roles_paginas(rol_id);

-- Índice en roles_paginas por pagina_id
CREATE INDEX IF NOT EXISTS idx_roles_paginas_pagina ON public.roles_paginas(pagina_id);

-- Índice compuesto para búsquedas rápidas de rol+pagina
CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_paginas_unique ON public.roles_paginas(rol_id, pagina_id);
