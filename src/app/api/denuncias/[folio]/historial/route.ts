import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(_req: Request, context: { params: Promise<{ folio: string }> }) {
    const params = await context.params;
    const supabase = await createClient();

    // Primero obtener el ID de la denuncia desde el folio
    const { data: denuncia, error: denunciaError } = await supabase
        .from('denuncias')
        .select('id')
        .eq('folio', params.folio)
        .single();

    if (denunciaError || !denuncia) {
        return NextResponse.json({ error: 'Denuncia no encontrada' }, { status: 404 });
    }

    // Obtener historial de la denuncia sin joins complicados
    const { data: historial, error } = await supabase
        .from('denuncia_historial')
        .select('id, evento, detalle, created_at, actor_usuario_id')
        .eq('denuncia_id', denuncia.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error al obtener historial:', error);
        return NextResponse.json({ error: 'Error al obtener historial' }, { status: 500 });
    }

    // Obtener información de usuarios_portal para los actores
    const actorIds = (historial || [])
        .map((item: { actor_usuario_id: string | null }) => item.actor_usuario_id)
        .filter((id): id is string => id !== null);

    let usuariosMap = new Map();
    if (actorIds.length > 0) {
        const { data: usuariosPortal } = await supabase
            .from('usuarios_portal')
            .select('usuario_id, nombre')
            .in('usuario_id', actorIds);

        usuariosMap = new Map(
            (usuariosPortal || []).map((u: { usuario_id: string; nombre: string }) =>
                [u.usuario_id, u.nombre]
            )
        );
    }

    // Obtener todos los estados disponibles para mapear IDs a nombres
    const { data: estados } = await supabase
        .from('estados_denuncia')
        .select('id, nombre');

    const estadosMap = new Map(
        (estados || []).map((e: { id: string | number; nombre: string }) =>
            [String(e.id), e.nombre]
        )
    );

    // Obtener todos los inspectores disponibles para mapear IDs a nombres
    const { data: inspectores } = await supabase
        .from('inspectores')
        .select('id, usuario_id, perfiles_ciudadanos(nombre, apellido)');

    type Inspector = {
        id: string | number;
        usuario_id: string;
        perfiles_ciudadanos: Array<{ nombre: string; apellido: string }>;
    };

    const inspectoresMap = new Map(
        (inspectores || []).map((i: Inspector) => {
            const perfil = Array.isArray(i.perfiles_ciudadanos) && i.perfiles_ciudadanos.length > 0
                ? i.perfiles_ciudadanos[0]
                : null;
            const nombreCompleto = perfil
                ? `${perfil.nombre} ${perfil.apellido}`.trim()
                : 'sin nombre';
            console.log(`[INSPECTOR] ID: ${i.id}, Nombre: ${nombreCompleto}, Datos: `, JSON.stringify(i));
            return [String(i.id), nombreCompleto];
        })
    );

    // Formatear historial con descripciones legibles
    const historialFormateado = (historial || []).map((item: {
        id: string;
        evento: string;
        detalle: Record<string, unknown> | null;
        created_at: string;
        actor_usuario_id: string | null;
    }) => {
        let autor = 'Sistema';

        if (item.actor_usuario_id) {
            const nombre = usuariosMap.get(item.actor_usuario_id);
            if (nombre) {
                autor = nombre;
            }
        }

        // Generar descripción legible basada en el evento
        // Usar el evento original si no se mapea
        const descripcion = (function () {
            const evento = (item.evento || '').toLowerCase().trim();

            if (evento.includes('creada') || evento.includes('creado')) {
                const folio = params.folio;
                // Obtener el nombre del estado en lugar del ID
                return `Se creó la denuncia con folio ${folio}`;
            } else if (evento.includes('actualizada') || evento.includes('actualizado')) {
                const camposActualizados = item.detalle?.campos_actualizados || [];
                const camposTexto = Array.isArray(camposActualizados)
                    ? camposActualizados.join(', ')
                    : 'información general';
                return `Se actualizaron los campos: ${camposTexto}`;
            } else if (evento.includes('estado') || evento.includes('cambio')) {
                const estadoAnteriorNombre = item.detalle?.old_estado_nombre || item.detalle?.estado_anterior_nombre || item.detalle?.old_estado || 'inicial';
                const nuevoEstadoNombre = item.detalle?.new_estado_nombre || item.detalle?.nuevo_estado_nombre || item.detalle?.new_estado || 'desconocido';
                return `Se cambió el estado de la denuncia de "${estadoAnteriorNombre}" a "${nuevoEstadoNombre}"`;
            } else if (evento.includes('asignada') || evento.includes('asignado')) {
                // Extraer nombre del inspector del detalle
                let inspectorNombre = 'un inspector';
                if (item.detalle?.inspector && typeof item.detalle.inspector === 'object') {
                    const inspectorObj = item.detalle.inspector as Record<string, unknown>;
                    inspectorNombre = (inspectorObj.nombre as string) || 'un inspector';
                }
                const rol = item.detalle?.rol === 'principal' ? 'inspector principal' : 'inspector acompañante';
                return `Se asignó la denuncia al ${rol} ${inspectorNombre}`;
            } else if (evento.includes('observacion')) {
                const tipoObs = item.detalle?.tipo === 'TERRENO' ? 'inspector' : 'operador';
                const contenido = (item.detalle?.contenido_resumido as string) || (item.detalle?.contenido as string) || 'Observación agregada';
                const contenidoResumido = contenido.substring(0, 100) + (contenido.length > 100 ? '...' : '');
                return `${autor} (${tipoObs}) agregó una observación: "${contenidoResumido}"`;
            } else if (evento.includes('prioridad')) {
                const nuevaPrioridad = (item.detalle?.nueva_prioridad as string) || 'desconocida';
                const prioridadAnterior = (item.detalle?.prioridad_anterior as string) || 'sin especificar';
                return `Se cambió la prioridad de la denuncia de "${prioridadAnterior}" a "${nuevaPrioridad}"`;
            } else if (evento.includes('evidencia')) {
                const tipoEvidencia = item.detalle?.tipo === 'VIDEO' ? 'video' : 'foto';
                const nombreArchivo = (item.detalle?.nombre_archivo as string) || 'archivo';
                return `Se agregó una ${tipoEvidencia} como evidencia: ${nombreArchivo}`;
            } else if (evento.includes('comentario')) {
                const contenido = (item.detalle?.contenido_resumido as string) || (item.detalle?.contenido as string) || 'Comentario agregado';
                const contenidoResumido = contenido.substring(0, 100) + (contenido.length > 100 ? '...' : '');
                return `Se agregó un comentario: "${contenidoResumido}"`;
            }

            return item.evento;
        })();

        let icono = '📝';
        let tipo = 'otro';
        let detallesLeibles: Record<string, unknown> = {};

        // Normalizar evento a minúsculas para comparación
        const eventoLower = (item.evento || '').toLowerCase();

        if (eventoLower.includes('creada') || eventoLower.includes('creado')) {
            const folio = params.folio;
            // Obtener el nombre del estado usando el mapa
            const estadoId = String(item.detalle?.new_estado_id || item.detalle?.estado || item.detalle?.estado_id || '');
            const estadoNombre = estadosMap.get(estadoId) || item.detalle?.estado_nombre || item.detalle?.nombre_estado || 'sin estado';
            detallesLeibles = {
                'Folio': folio,
                'Estado Inicial': estadoNombre
            };
            icono = '✅';
            tipo = 'creacion';
        } else if (eventoLower.includes('actualizada') || eventoLower.includes('actualizado')) {
            const camposActualizados = item.detalle?.campos_actualizados || [];
            const camposTexto = Array.isArray(camposActualizados)
                ? camposActualizados.join(', ')
                : 'información general';
            const nuevosValores = item.detalle?.valores_nuevos;
            detallesLeibles = {
                'Campos Modificados': camposTexto,
            };
            if (nuevosValores && typeof nuevosValores === 'object') {
                detallesLeibles['Nuevos Valores'] = JSON.stringify(nuevosValores);
            }
            icono = '✏️';
            tipo = 'actualizacion';
        } else if (eventoLower.includes('estado') || eventoLower.includes('cambio')) {
            // Obtener nombres de estados usando el mapa
            const oldEstadoId = String(item.detalle?.old_estado_id || item.detalle?.old_estado || '');
            const newEstadoId = String(item.detalle?.new_estado_id || item.detalle?.new_estado || '');
            const estadoAnteriorNombre = estadosMap.get(oldEstadoId) || item.detalle?.old_estado_nombre || item.detalle?.estado_anterior_nombre || 'inicial';
            const nuevoEstadoNombre = estadosMap.get(newEstadoId) || item.detalle?.new_estado_nombre || item.detalle?.nuevo_estado_nombre || 'desconocido';
            detallesLeibles = {
                'Estado Anterior': estadoAnteriorNombre,
                'Nuevo Estado': nuevoEstadoNombre
            };
            icono = '🔄';
            tipo = 'estado';
        } else if (eventoLower.includes('asignada') || eventoLower.includes('asignado')) {
            // Obtener nombre del inspector usando el mapa
            // Intentar obtener del objeto inspector dentro del detalle
            let inspectorNombre = 'sin nombre';
            let inspectorId = '';

            // Primer intento: inspector como objeto con id y nombre
            if (item.detalle?.inspector && typeof item.detalle.inspector === 'object') {
                const inspectorObj = item.detalle.inspector as Record<string, unknown>;
                inspectorNombre = (inspectorObj.nombre as string) || 'sin nombre';
                inspectorId = String(inspectorObj.id || '');
            } else {
                // Segundo intento: inspector_id como número
                inspectorId = String(item.detalle?.inspector_nuevo || item.detalle?.inspector_id || item.detalle?.id_inspector || '');
                inspectorNombre = inspectoresMap.get(inspectorId) || (item.detalle?.inspector_nombre as string) || (item.detalle?.nombre_inspector as string) || 'sin nombre';
            }

            const rolInspector = item.detalle?.rol === 'principal' ? 'Inspector Principal' : item.detalle?.rol === 'acompañante' ? 'Inspector Acompañante' : 'Inspector';
            const fechaAsignacion = (item.detalle?.fecha_derivacion as string) || (item.detalle?.fecha_asignacion as string) || item.created_at;

            console.log(`[ASIGNACION] Inspector ID: ${inspectorId}`);
            console.log(`[ASIGNACION] Inspector Nombre: ${inspectorNombre}`);
            console.log(`[ASIGNACION] Rol: ${rolInspector}`);

            detallesLeibles = {
                'Inspector Asignado': inspectorNombre,
                'Rol': rolInspector,
                'Fecha de Asignación': new Date(fechaAsignacion).toLocaleString('es-CL', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            };
            icono = '👤';
            tipo = 'asignacion';
        } else if (eventoLower.includes('observacion')) {
            const tipoObs = item.detalle?.tipo === 'TERRENO' ? 'inspector' : 'operador';
            const contenido = (item.detalle?.contenido_resumido as string) || (item.detalle?.contenido as string) || 'Observación agregada';
            detallesLeibles = {
                'Tipo de Observación': tipoObs === 'inspector' ? 'En Terreno' : 'De Operador',
                'Autor': autor,
                'Observación Completa': contenido
            };
            icono = '💬';
            tipo = 'observacion';
        } else if (eventoLower.includes('prioridad')) {
            const nuevaPrioridad = (item.detalle?.nueva_prioridad as string) || 'desconocida';
            const prioridadAnterior = (item.detalle?.prioridad_anterior as string) || 'sin especificar';
            detallesLeibles = {
                'Prioridad Anterior': prioridadAnterior,
                'Nueva Prioridad': nuevaPrioridad,
                'Razón': item.detalle?.razon || 'Sin especificar'
            };
            icono = '⚡';
            tipo = 'prioridad';
        } else if (eventoLower.includes('evidencia')) {
            const tipoEvidencia = item.detalle?.tipo === 'VIDEO' ? 'video' : 'foto';
            const nombreArchivo = (item.detalle?.nombre_archivo as string) || 'archivo';
            detallesLeibles = {
                'Tipo de Evidencia': tipoEvidencia.charAt(0).toUpperCase() + tipoEvidencia.slice(1),
                'Nombre del Archivo': nombreArchivo,
                'Subido Por': autor,
                'Hash': item.detalle?.hash || 'No disponible'
            };
            icono = '📸';
            tipo = 'evidencia';
        } else if (eventoLower.includes('comentario')) {
            const contenido = (item.detalle?.contenido_resumido as string) || (item.detalle?.contenido as string) || 'Comentario agregado';
            const esAnonimo = item.detalle?.es_anonimo ? 'Sí' : 'No';
            detallesLeibles = {
                'Autor': esAnonimo === 'Sí' ? 'Ciudadano (Anónimo)' : autor,
                'Contenido': contenido,
                'Es Anónimo': esAnonimo
            };
            icono = '💭';
            tipo = 'comentario';
        } return {
            id: item.id,
            evento: item.evento,
            descripcion: descripcion,
            autor: autor,
            fecha: item.created_at,
            icono: icono,
            tipo: tipo,
            detallesLeibles: detallesLeibles,
            detalle: item.detalle,
        };
    });

    return NextResponse.json({ historial: historialFormateado });
}
