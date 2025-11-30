import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { checkPageAccess } from '@/lib/security/checkPageAccess';

export async function GET(_req: Request, context: { params: Promise<{ folio: string }> }) {
    const params = await context.params;
    const supabase = await createClient();

    // Verificar autenticación y autorización
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const hasAccess = await checkPageAccess(supabase, user.id, "/portal/denuncias");
    if (!hasAccess) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Primero obtener el ID de la denuncia desde el folio
    const { data: denuncia, error: denunciaError } = await supabase
        .from('denuncias')
        .select('id')
        .eq('folio', params.folio)
        .single();

    if (denunciaError || !denuncia) {
        return NextResponse.json({ error: 'Denuncia no encontrada' }, { status: 404 });
    }

    // Obtener observaciones sin joins complicados
    const { data: observaciones, error } = await supabase
        .from('denuncia_observaciones')
        .select('id, tipo, contenido, created_at, creado_por')
        .eq('denuncia_id', denuncia.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error al obtener observaciones:', error);
        return NextResponse.json({ error: 'Error al obtener observaciones' }, { status: 500 });
    }

    
    

    // Obtener información de usuarios_portal para los creadores
    const creadorIds = (observaciones || [])
        .map((obs: { creado_por: string | null }) => obs.creado_por)
        .filter((id): id is string => id !== null);

    let usuariosMap = new Map();

    if (creadorIds.length > 0) {
        // Obtener usuarios con sus roles
        const { data: usuariosPortal } = await supabase
            .from('usuarios_portal')
            .select('usuario_id, nombre, rol_id, roles_portal(nombre)')
            .in('usuario_id', creadorIds);

        
        

        usuariosMap = new Map(
            (usuariosPortal || []).map((u: Record<string, unknown>) => {
                const rolNombre = Array.isArray(u.roles_portal) && u.roles_portal.length > 0
                    ? u.roles_portal[0].nombre
                    : 'Desconocido';
                
                return [u.usuario_id, { nombre: u.nombre, rol_id: u.rol_id, rol_nombre: rolNombre }];
            })
        );
    }

    // Obtener información de inspectores para todos los creadores
    // (tanto para tipo TERRENO como para tener datos de respaldo)
    let inspectoresMap = new Map();

    if (creadorIds.length > 0) {
        

        const { data: inspectores } = await supabase
            .from('inspectores')
            .select('usuario_id, perfiles_ciudadanos(nombre, apellido)')
            .in('usuario_id', creadorIds);

        

        inspectoresMap = new Map(
            (inspectores || []).map((i: Record<string, unknown>) => {
                const perfil = i.perfiles_ciudadanos as { nombre: string; apellido: string } | null;
                const nombreCompleto = perfil
                    ? `${perfil.nombre} ${perfil.apellido}`.trim()
                    : null;
                
                return [i.usuario_id, nombreCompleto];
            })
        );
    }    // Formatear observaciones
    const observacionesFormateadas = (observaciones || []).map((obs: {
        id: string;
        tipo: string;
        contenido: string;
        created_at: string;
        creado_por: string | null;
    }) => {
        let cargo = 'Desconocido';
        let nombre = 'Usuario desconocido';

        
        

        if (obs.creado_por) {
            // Obtener información del usuario desde el mapa
            const usuarioInfo = usuariosMap.get(obs.creado_por);
            

            if (obs.tipo === 'TERRENO') {
                // Es un inspector, obtener su nombre del mapa de inspectores
                const nombreInspector = inspectoresMap.get(obs.creado_por);
                nombre = nombreInspector || 'Inspector desconocido';
                cargo = 'Inspector';

                
            } else if (obs.tipo === 'OPERADOR') {
                // Es un operador/administrador
                if (usuarioInfo) {
                    // Obtener de usuarios_portal si existe
                    nombre = usuarioInfo.nombre;
                    cargo = usuarioInfo.rol_nombre || 'Desconocido';
                    
                } else {
                    // Fallback a inspectores si no está en usuarios_portal
                    const nombreInspector = inspectoresMap.get(obs.creado_por);
                    if (nombreInspector) {
                        nombre = nombreInspector;
                        cargo = 'Operador/Inspector';
                        
                    } else {
                        
                    }
                }
            }
        }

        return {
            id: obs.id,
            tipo: obs.tipo,
            contenido: obs.contenido,
            fecha: obs.created_at,
            creado_por: nombre,
            cargo: cargo,
        };
    });

    return NextResponse.json({ observaciones: observacionesFormateadas });
}
