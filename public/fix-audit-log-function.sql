-- ============================================================================
-- FIX: Mejora la captura de información de usuario en auditoría
-- ============================================================================
-- 
-- PROBLEMA ACTUAL:
-- - actor_email NULL o vacío
-- - actor_es_portal y actor_es_admin siempre FALSE o NULL
-- - Muestra "No se encontró usuario registrado" y "Sin rol especificado"
--
-- SOLUCIÓN IMPLEMENTADA:
-- Actualizar fn_audit_log() para capturar correctamente:
-- 1. Email del usuario autenticado (desde auth.users)
-- 2. Si es usuario del portal (verificando en usuarios_portal)
-- 3. Si es administrador (detectando roles que contengan 'admin')
-- 4. Registra CUALQUIER ROL del portal:
--    - Administrador (actor_es_admin = true)
--    - Operador (actor_es_portal = true)
--    - Inspector (actor_es_portal = true)
--    - Cualquier otro rol personalizado (actor_es_portal = true)
--
-- RESULTADO:
-- - Todos los usuarios del portal quedan registrados
-- - Se distingue si es admin o usuario regular del portal
-- - El campo actor_email siempre tendrá valor
-- - El modal de auditoría mostrará nombre del usuario y rol
--
-- ============================================================================

-- Reemplazar la función fn_audit_log con versión mejorada
-- MEJORAS:
-- - Captura email del usuario autenticado
-- - Identifica si es usuario del portal
-- - Registra el rol específico del usuario (Administrador, Operador, etc.)
CREATE OR REPLACE FUNCTION public.fn_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_actor uuid := null;
  v_email text := null;
  v_nombre text := null;
  v_rol text := null;
  v_fila_id text := null;
  v_es_portal boolean := false;
  v_es_admin boolean := false;
begin
  -- Obtener UUID del usuario autenticado
  v_actor := auth.uid();

  -- Obtener email, nombre y rol del usuario autenticado
  if v_actor is not null then
    select email into v_email
    from auth.users
    where id = v_actor;

    -- Obtener nombre del usuario (desde perfiles_ciudadanos)
    select coalesce(nombre || ' ' || apellido, nombre, apellido)
    into v_nombre
    from perfiles_ciudadanos
    where usuario_id = v_actor;

    -- Verificar si es usuario del portal
    select exists (select 1 from usuarios_portal where usuario_id = v_actor)
    into v_es_portal;

    -- Obtener el rol del usuario del portal (si corresponde)
    select rp.nombre
    into v_rol
    from usuarios_portal up
    left join roles_portal rp on up.rol_id = rp.id
    where up.usuario_id = v_actor;

    -- Verificar si es administrador (cualquier rol que contenga 'admin')
    select exists (
      select 1 
      from usuarios_portal up
      join roles_portal rp on up.rol_id = rp.id
      where up.usuario_id = v_actor
      and rp.nombre ilike '%admin%'
    ) into v_es_admin;
  end if;

  -- Generar ID de fila (extrayendo del JSONB)
  if tg_op = 'INSERT' or tg_op = 'UPDATE' then
    v_fila_id := coalesce(
      (to_jsonb(new) ->> 'id'),
      (to_jsonb(new) ->> 'usuario_id'),
      (to_jsonb(new) ->> 'denuncia_id'),
      (to_jsonb(new) ->> 'inspector_id'),
      (to_jsonb(new) ->> 'folio'),
      'N/A'
    );
  elsif tg_op = 'DELETE' then
    v_fila_id := coalesce(
      (to_jsonb(old) ->> 'id'),
      (to_jsonb(old) ->> 'usuario_id'),
      (to_jsonb(old) ->> 'denuncia_id'),
      (to_jsonb(old) ->> 'inspector_id'),
      (to_jsonb(old) ->> 'folio'),
      'N/A'
    );
  end if;

  -- Insertar en audit_log
  insert into audit_log (
    actor_user_id,
    actor_email,
    actor_nombre,
    actor_rol,
    actor_es_portal,
    actor_es_admin,
    tabla,
    operacion,
    fila_id_text,
    old_row,
    new_row
  ) values (
    v_actor,
    v_email,
    v_nombre,
    v_rol,
    v_es_portal,
    v_es_admin,
    tg_table_name,
    tg_op::audit_op,
    v_fila_id,
    case when tg_op = 'DELETE' or tg_op = 'UPDATE' then to_jsonb(old) else null end,
    case when tg_op = 'INSERT' or tg_op = 'UPDATE' then to_jsonb(new) else null end
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$function$;

-- ============================================================================
-- Verificación: Mostrar registros de audit_log con NULL en actor_email
-- ============================================================================
-- Descomenta para revisar cuáles registros tienen problema:
/*
SELECT 
  id,
  ts,
  actor_user_id,
  actor_email,
  actor_es_portal,
  actor_es_admin,
  tabla,
  operacion
FROM audit_log
WHERE actor_email IS NULL
ORDER BY ts DESC
LIMIT 10;
*/

-- ============================================================================
-- FIX ALTERNATIVO: Si los triggers ya ejecutaron sin la función mejorada,
-- puedes actualizar los registros existentes con NULL en actor_email
-- ============================================================================
-- USAR CON CUIDADO: Solo si necesitas corregir histórico
/*
UPDATE audit_log al
SET actor_email = au.email
FROM auth.users au
WHERE al.actor_user_id = au.id
AND al.actor_email IS NULL;

UPDATE audit_log al
SET 
  actor_es_portal = CASE 
    WHEN EXISTS (
      SELECT 1 FROM usuarios_portal WHERE usuario_id = al.actor_user_id
    ) THEN true 
    ELSE false 
  END,
  actor_es_admin = CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM usuarios_portal up
      JOIN roles_portal rp ON up.rol_id = rp.id
      WHERE up.usuario_id = al.actor_user_id
      AND rp.nombre ILIKE '%admin%'
    ) THEN true 
    ELSE false 
  END
WHERE actor_user_id IS NOT NULL;
*/
