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

    // Obtener evidencias de la denuncia con información del creador
    const { data: evidencias, error } = await supabase
        .from('denuncia_evidencias')
        .select(`
            id,
            tipo,
            storage_path,
            orden,
            created_at,
            created_by,
            perfiles_ciudadanos!denuncia_evidencias_created_by_fkey (
                nombre,
                apellido
            ),
            usuarios_portal!denuncia_evidencias_created_by_fkey (
                nombre
            )
        `)
        .eq('denuncia_id', denuncia.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error al obtener evidencias:', error);
        return NextResponse.json({ error: 'Error al obtener evidencias' }, { status: 500 });
    }

    // Formatear las evidencias con URLs firmadas
    const evidenciasFormateadas = await Promise.all(
        (evidencias || []).map(async (ev) => {
            // Obtener URL firmada del archivo (válida por 1 hora)
            const { data: urlData } = await supabase.storage
                .from('evidencias')
                .createSignedUrl(ev.storage_path, 3600);

            // Determinar quién subió la evidencia
            let subidoPor = 'Usuario desconocido';
            let tipoUsuario = 'desconocido';

            if (ev.perfiles_ciudadanos && Array.isArray(ev.perfiles_ciudadanos) && ev.perfiles_ciudadanos.length > 0) {
                const perfil = ev.perfiles_ciudadanos[0];
                subidoPor = `${perfil.nombre} ${perfil.apellido}`;
                tipoUsuario = 'ciudadano';
            } else if (ev.usuarios_portal && Array.isArray(ev.usuarios_portal) && ev.usuarios_portal.length > 0) {
                const usuario = ev.usuarios_portal[0];
                subidoPor = usuario.nombre;
                tipoUsuario = 'operador/inspector';
            }

            return {
                id: ev.id,
                tipo: ev.tipo,
                url: urlData?.signedUrl || null,
                orden: ev.orden,
                fecha_subida: ev.created_at,
                subido_por: subidoPor,
                tipo_usuario: tipoUsuario,
            };
        })
    );

    return NextResponse.json({ evidencias: evidenciasFormateadas });
}
