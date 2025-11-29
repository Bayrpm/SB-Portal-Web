-- ============================================================================
-- SCRIPT: Agregar columnas de nombre y rol a audit_log
-- ============================================================================

-- Agregar columnas si no existen
ALTER TABLE public.audit_log
ADD COLUMN IF NOT EXISTS actor_nombre text,
ADD COLUMN IF NOT EXISTS actor_rol text;

-- Crear índices para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_audit_actor_nombre ON public.audit_log(actor_nombre);
CREATE INDEX IF NOT EXISTS idx_audit_actor_rol ON public.audit_log(actor_rol);

-- ============================================================================
-- Verificación: Ver estructura actualizada
-- ============================================================================
-- Descomenta para ver las columnas:
/*
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'audit_log'
ORDER BY ordinal_position;
*/
