-- Vista materializada para optimizar el endpoint de derivaciones
-- Precalcula todo lo necesario: joins, categorías, prioridades, acompañantes y SLA

CREATE MATERIALIZED VIEW derivaciones_vista AS
WITH denuncias_con_info AS (
    -- Base: todas las denuncias con sus datos principales
    SELECT
        d.id,
        d.folio,
        d.titulo,
        d.fecha_creacion,
        d.ubicacion_texto,
        d.inspector_id,
        d.categoria_publica_id,
        d.prioridad_id,
        cp.nombre AS categoria,
        pd.nombre AS prioridad,
        EXTRACT(EPOCH FROM (NOW() - d.fecha_creacion)) / 3600 AS horas_sin_asignar,
        CASE WHEN d.inspector_id IS NULL THEN 'sin_asignar' 
             ELSE 'con_inspector' END AS estado_asignacion
    FROM denuncias d
    LEFT JOIN categorias_publicas cp ON d.categoria_publica_id = cp.id
    LEFT JOIN prioridades_denuncia pd ON d.prioridad_id = pd.id
),
acompanantes_count AS (
    -- Contar asignaciones activas por denuncia
    SELECT
        dci.id,
        dci.folio,
        dci.titulo,
        dci.fecha_creacion,
        dci.ubicacion_texto,
        dci.inspector_id,
        dci.categoria,
        dci.prioridad,
        dci.horas_sin_asignar,
        dci.estado_asignacion,
        COALESCE(COUNT(ai.id), 0) AS total_asignaciones,
        -- tiene_acompanantes = true si hay más de 1 asignación (inspector principal + acompañantes)
        -- o si no hay inspector asignado, false
        CASE 
            WHEN dci.inspector_id IS NULL THEN false
            WHEN COUNT(ai.id) > 1 THEN true
            ELSE false
        END AS tiene_acompanantes
    FROM denuncias_con_info dci
    LEFT JOIN asignaciones_inspector ai ON dci.id = ai.denuncia_id 
        AND ai.fecha_termino IS NULL
    GROUP BY dci.id, dci.folio, dci.titulo, dci.fecha_creacion, dci.ubicacion_texto,
             dci.inspector_id, dci.categoria, dci.prioridad, dci.horas_sin_asignar, dci.estado_asignacion
)
SELECT
    id,
    folio,
    titulo,
    categoria,
    prioridad,
    fecha_creacion,
    ubicacion_texto,
    CASE WHEN inspector_id IS NOT NULL THEN 'Asignado' ELSE NULL END AS inspector_asignado,
    tiene_acompanantes,
    horas_sin_asignar,
    CASE WHEN horas_sin_asignar > 48 THEN true ELSE false END AS vencida_sla,
    estado_asignacion,
    NOW() AS vista_actualizada_en
FROM acompanantes_count
ORDER BY fecha_creacion ASC;

-- Índices para la vista
CREATE INDEX idx_derivaciones_vista_folio ON derivaciones_vista (folio);
CREATE INDEX idx_derivaciones_vista_estado ON derivaciones_vista (estado_asignacion);
CREATE INDEX idx_derivaciones_vista_vencida_sla ON derivaciones_vista (vencida_sla);

-- Función para refrescar la vista materializada
CREATE OR REPLACE FUNCTION refresh_derivaciones_vista()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY derivaciones_vista;
END;
$$ LANGUAGE plpgsql;

-- Trigger para refrescar automáticamente cuando cambian denuncias o asignaciones
CREATE OR REPLACE FUNCTION trg_refresh_derivaciones_on_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Ejecutar la actualización de manera asíncrona con un pequeño delay
    PERFORM pg_sleep(1); -- Espera 1 segundo para agrupar cambios
    PERFORM refresh_derivaciones_vista();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers en denuncias
DROP TRIGGER IF EXISTS trg_refresh_derivaciones_on_denuncias_update ON denuncias;
CREATE TRIGGER trg_refresh_derivaciones_on_denuncias_update
AFTER INSERT OR UPDATE ON denuncias
FOR EACH STATEMENT
EXECUTE FUNCTION trg_refresh_derivaciones_on_change();

-- Triggers en asignaciones_inspector
DROP TRIGGER IF EXISTS trg_refresh_derivaciones_on_asignaciones ON asignaciones_inspector;
CREATE TRIGGER trg_refresh_derivaciones_on_asignaciones
AFTER INSERT OR UPDATE OR DELETE ON asignaciones_inspector
FOR EACH STATEMENT
EXECUTE FUNCTION trg_refresh_derivaciones_on_change();
