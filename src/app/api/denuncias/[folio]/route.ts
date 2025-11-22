import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { formatFullName } from '@/lib/utils/formatName';
import { logger } from '@/lib/validation/utils/logger';

export const runtime = 'nodejs';

// Cache simple en memoria para evitar consultas repetidas
const denunciaCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function getCacheKey(folio: string): string {
    return `denuncia:${folio}`;
}

function getCachedData(folio: string): unknown | null {
    const cached = denunciaCache.get(getCacheKey(folio));
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        logger.info('Cache hit for denuncia', { folio });
        return cached.data;
    }
    return null;
}

function setCacheData(folio: string, data: unknown): void {
    denunciaCache.set(getCacheKey(folio), { data, timestamp: Date.now() });
}

export async function GET(_req: Request, context: { params: Promise<{ folio: string }> }) {
    const startTime = Date.now();
    const params = await context.params;
    const { folio } = params;

    try {
        // Verificar caché primero
        const cached = getCachedData(folio);
        if (cached) {
            return NextResponse.json({ denuncia: cached }, {
                headers: {
                    'X-Cache': 'HIT',
                    'X-Response-Time': `${Date.now() - startTime}ms`,
                }
            });
        }

        const supabase = await createClient();

        // Obtener hora actual para validar que la denuncia no sea futura
        const ahora = new Date().toISOString();

        // Consulta optimizada: trae TODA la información en una sola llamada
        // Filtra solo denuncias del día de hoy y días anteriores (no futuras)
        const { data: denuncia, error } = await supabase
            .from('denuncias')
            .select(`
                id,
                folio,
                titulo,
                descripcion,
                fecha_creacion,
                ubicacion_texto,
                anonimo,
                consentir_publicacion,
                ciudadano_id,
                categoria_publica_id,
                estado_id,
                prioridad_id,
                inspector_id,
                ciudadano:perfiles_ciudadanos!denuncias_ciudadano_id_fkey (nombre, apellido, telefono),
                categoria:categorias_publicas (nombre),
                estado:estados_denuncia (nombre),
                prioridad:prioridades_denuncia (nombre),
                inspector:inspectores!denuncias_inspector_id_fkey (
                    id,
                    usuario_id,
                    perfiles_ciudadanos (nombre, apellido)
                )
            `)
            .eq('folio', folio)
            .lte('fecha_creacion', ahora)
            .single();

        const queryTime = Date.now() - startTime;

        if (error || !denuncia) {
            logger.warn('Denuncia not found', { folio, error });
            return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
        }

        // Extraer datos anidados (Supabase retorna arrays aunque sea 1:1)
        const ciudadano = Array.isArray(denuncia.ciudadano) ? denuncia.ciudadano[0] : denuncia.ciudadano;
        const categoria = Array.isArray(denuncia.categoria) ? denuncia.categoria[0] : denuncia.categoria;
        const estado = Array.isArray(denuncia.estado) ? denuncia.estado[0] : denuncia.estado;
        const prioridad = Array.isArray(denuncia.prioridad) ? denuncia.prioridad[0] : denuncia.prioridad;
        const inspector = Array.isArray(denuncia.inspector) ? denuncia.inspector[0] : denuncia.inspector;
        const inspectorPerfilRaw = inspector?.perfiles_ciudadanos;
        const inspectorPerfil = Array.isArray(inspectorPerfilRaw)
            ? inspectorPerfilRaw[0]
            : inspectorPerfilRaw;

        // Formatear respuesta
        const respuesta = {
            ...denuncia,
            categoria: categoria?.nombre || '',
            estado: estado?.nombre || '',
            prioridad: prioridad?.nombre || '',
            inspector_asignado: inspectorPerfil && inspectorPerfil.nombre
                ? formatFullName(inspectorPerfil.nombre, inspectorPerfil.apellido)
                : '',
            ciudadano_nombre: ciudadano ? formatFullName(ciudadano.nombre, ciudadano.apellido) : '',
            ciudadano_telefono: ciudadano?.telefono || '',
        };

        // Guardar en caché
        setCacheData(folio, respuesta);

        // Logging de rendimiento
        const totalTime = Date.now() - startTime;
        logger.info('Denuncia detail retrieved', {
            folio,
            queryTime,
            totalTime,
            cached: false,
        });

        return NextResponse.json({ denuncia: respuesta }, {
            headers: {
                'X-Cache': 'MISS',
                'X-Query-Time': `${queryTime}ms`,
                'X-Response-Time': `${totalTime}ms`,
                'Cache-Control': 'private, max-age=300', // Cache por 5 minutos en el cliente
            }
        });
    } catch (error) {
        logger.error('Error en GET /api/denuncias/[folio]', error instanceof Error ? error : undefined);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error inesperado' },
            { status: 500 }
        );
    }
}
