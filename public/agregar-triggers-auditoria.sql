-- ============================================================================
-- AGREGAR TRIGGERS DE AUDITORÍA FALTANTES
-- ============================================================================
-- Basado en AUDITORIA-ANALISIS.md
-- Se agregan triggers para tablas críticas que no tienen auditoría
-- ============================================================================

-- ============================================================================
-- 1. GESTIÓN DE TURNOS (CRÍTICO)
-- ============================================================================

-- Auditar tabla turnos (cambios de estado, inicio/fin de turno)
DROP TRIGGER IF EXISTS t_audit_turnos ON public.turnos;
CREATE TRIGGER t_audit_turnos
AFTER INSERT OR DELETE OR UPDATE ON public.turnos
FOR EACH ROW
EXECUTE FUNCTION public.fn_audit_log();

-- Auditar tabla turnos_planificados
DROP TRIGGER IF EXISTS t_audit_turnos_planificados ON public.turnos_planificados;
CREATE TRIGGER t_audit_turnos_planificados
AFTER INSERT OR DELETE OR UPDATE ON public.turnos_planificados
FOR EACH ROW
EXECUTE FUNCTION public.fn_audit_log();

-- Auditar tabla turnos_excepciones
DROP TRIGGER IF EXISTS t_audit_turnos_excepciones ON public.turnos_excepciones;
CREATE TRIGGER t_audit_turnos_excepciones
AFTER INSERT OR DELETE OR UPDATE ON public.turnos_excepciones
FOR EACH ROW
EXECUTE FUNCTION public.fn_audit_log();

-- ============================================================================
-- 2. GESTIÓN DE INSPECTORES (CRÍTICO)
-- ============================================================================

-- Auditar cambios en inspectores (en_turno, activo, tipo_turno)
DROP TRIGGER IF EXISTS t_audit_inspectores ON public.inspectores;
CREATE TRIGGER t_audit_inspectores
AFTER INSERT OR DELETE OR UPDATE ON public.inspectores
FOR EACH ROW
EXECUTE FUNCTION public.fn_audit_log();

-- ============================================================================
-- 3. CATÁLOGOS MAESTROS (IMPORTANTE)
-- ============================================================================

-- Auditar tipos de turno
DROP TRIGGER IF EXISTS t_audit_turno_tipo ON public.turno_tipo;
CREATE TRIGGER t_audit_turno_tipo
AFTER INSERT OR DELETE OR UPDATE ON public.turno_tipo
FOR EACH ROW
EXECUTE FUNCTION public.fn_audit_log();

-- Auditar categorías públicas
DROP TRIGGER IF EXISTS t_audit_categorias_publicas ON public.categorias_publicas;
CREATE TRIGGER t_audit_categorias_publicas
AFTER INSERT OR DELETE OR UPDATE ON public.categorias_publicas
FOR EACH ROW
EXECUTE FUNCTION public.fn_audit_log();

-- Auditar prioridades de denuncia
DROP TRIGGER IF EXISTS t_audit_prioridades_denuncia ON public.prioridades_denuncia;
CREATE TRIGGER t_audit_prioridades_denuncia
AFTER INSERT OR DELETE OR UPDATE ON public.prioridades_denuncia
FOR EACH ROW
EXECUTE FUNCTION public.fn_audit_log();

-- Auditar roles del portal
DROP TRIGGER IF EXISTS t_audit_roles_portal ON public.roles_portal;
CREATE TRIGGER t_audit_roles_portal
AFTER INSERT OR DELETE OR UPDATE ON public.roles_portal
FOR EACH ROW
EXECUTE FUNCTION public.fn_audit_log();

-- Auditar páginas del sistema
DROP TRIGGER IF EXISTS t_audit_paginas ON public.paginas;
CREATE TRIGGER t_audit_paginas
AFTER INSERT OR DELETE OR UPDATE ON public.paginas
FOR EACH ROW
EXECUTE FUNCTION public.fn_audit_log();

-- Auditar permisos rol-página
DROP TRIGGER IF EXISTS t_audit_roles_paginas ON public.roles_paginas;
CREATE TRIGGER t_audit_roles_paginas
AFTER INSERT OR DELETE OR UPDATE ON public.roles_paginas
FOR EACH ROW
EXECUTE FUNCTION public.fn_audit_log();

-- ============================================================================
-- 4. CATEGORIZACIÓN INTERNA (IMPORTANTE)
-- ============================================================================

-- Auditar familias de categorización
DROP TRIGGER IF EXISTS t_audit_cat_familias ON public.cat_familias;
CREATE TRIGGER t_audit_cat_familias
AFTER INSERT OR DELETE OR UPDATE ON public.cat_familias
FOR EACH ROW
EXECUTE FUNCTION public.fn_audit_log();

-- Auditar grupos de categorización
DROP TRIGGER IF EXISTS t_audit_cat_grupos ON public.cat_grupos;
CREATE TRIGGER t_audit_cat_grupos
AFTER INSERT OR DELETE OR UPDATE ON public.cat_grupos
FOR EACH ROW
EXECUTE FUNCTION public.fn_audit_log();

-- Auditar subgrupos de categorización
DROP TRIGGER IF EXISTS t_audit_cat_subgrupos ON public.cat_subgrupos;
CREATE TRIGGER t_audit_cat_subgrupos
AFTER INSERT OR DELETE OR UPDATE ON public.cat_subgrupos
FOR EACH ROW
EXECUTE FUNCTION public.fn_audit_log();

-- Auditar requerimientos de categorización
DROP TRIGGER IF EXISTS t_audit_cat_requerimientos ON public.cat_requerimientos;
CREATE TRIGGER t_audit_cat_requerimientos
AFTER INSERT OR DELETE OR UPDATE ON public.cat_requerimientos
FOR EACH ROW
EXECUTE FUNCTION public.fn_audit_log();

-- Auditar mapeo público de requerimientos
DROP TRIGGER IF EXISTS t_audit_cat_req_mapeo_publico ON public.cat_req_mapeo_publico;
CREATE TRIGGER t_audit_cat_req_mapeo_publico
AFTER INSERT OR DELETE OR UPDATE ON public.cat_req_mapeo_publico
FOR EACH ROW
EXECUTE FUNCTION public.fn_audit_log();

-- ============================================================================
-- 5. GESTIÓN DE MÓVILES (OPCIONAL)
-- ============================================================================

-- Auditar móviles
DROP TRIGGER IF EXISTS t_audit_moviles ON public.moviles;
CREATE TRIGGER t_audit_moviles
AFTER INSERT OR DELETE OR UPDATE ON public.moviles
FOR EACH ROW
EXECUTE FUNCTION public.fn_audit_log();

-- Auditar tipos de móviles
DROP TRIGGER IF EXISTS t_audit_movil_tipo ON public.movil_tipo;
CREATE TRIGGER t_audit_movil_tipo
AFTER INSERT OR DELETE OR UPDATE ON public.movil_tipo
FOR EACH ROW
EXECUTE FUNCTION public.fn_audit_log();

-- Auditar usos de móviles
DROP TRIGGER IF EXISTS t_audit_movil_usos ON public.movil_usos;
CREATE TRIGGER t_audit_movil_usos
AFTER INSERT OR DELETE OR UPDATE ON public.movil_usos
FOR EACH ROW
EXECUTE FUNCTION public.fn_audit_log();

-- Auditar kilometraje de móviles
DROP TRIGGER IF EXISTS t_audit_movil_uso_kilometraje ON public.movil_uso_kilometraje;
CREATE TRIGGER t_audit_movil_uso_kilometraje
AFTER INSERT OR DELETE OR UPDATE ON public.movil_uso_kilometraje
FOR EACH ROW
EXECUTE FUNCTION public.fn_audit_log();

-- ============================================================================
-- 6. PERFILES DE USUARIOS
-- ============================================================================

-- Auditar perfiles de ciudadanos
DROP TRIGGER IF EXISTS t_audit_perfiles_ciudadanos ON public.perfiles_ciudadanos;
CREATE TRIGGER t_audit_perfiles_ciudadanos
AFTER INSERT OR DELETE OR UPDATE ON public.perfiles_ciudadanos
FOR EACH ROW
EXECUTE FUNCTION public.fn_audit_log();

-- ============================================================================
-- VERIFICACIÓN: Ver triggers activos de auditoría
-- ============================================================================

-- Consulta para ver todos los triggers de auditoría activos
/*
SELECT 
  schemaname,
  tablename,
  triggername
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND t.tgenabled = 'O'
  AND triggername LIKE 't_audit_%'
ORDER BY tablename, triggername;
*/

-- ============================================================================
-- NOTAS:
-- ============================================================================
-- - Se excluyeron tablas de comentarios/reacciones según tu solicitud
-- - Se agregaron triggers para todas las tablas críticas e importantes
-- - Todos usan fn_audit_log() que debe estar actualizada (fix-audit-log-function.sql)
-- ============================================================================
