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

    // Obtener evidencias de la denuncia
    const { data: evidencias, error } = await supabase
        .from('denuncia_evidencias')
        .select(`
            id,
            tipo,
            storage_path,
            orden,
            created_at,
            created_by
        `)
        .eq('denuncia_id', denuncia.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error al obtener evidencias:', error);
        return NextResponse.json({ error: 'Error al obtener evidencias' }, { status: 500 });
    }

    // Obtener perfiles de los creadores (batch query)
    let perfiles: Record<string, { nombre: string; apellido: string }> = {};
    if (evidencias && evidencias.length > 0) {
        const creadorIds = [...new Set(evidencias.map(ev => ev.created_by).filter(Boolean))];
        if (creadorIds.length > 0) {
            const { data: perfilesData } = await supabase
                .from('perfiles_ciudadanos')
                .select('usuario_id, nombre, apellido')
                .in('usuario_id', creadorIds);

            if (perfilesData) {
                perfiles = Object.fromEntries(
                    perfilesData.map(p => [p.usuario_id, { nombre: p.nombre || '', apellido: p.apellido || '' }])
                );
            }
        }
    }

    // Formatear las evidencias con URLs firmadas
    const evidenciasFormateadas = await Promise.all(
        (evidencias || []).map(async (ev) => {
            // Obtener URL firmada del archivo (válida por 1 hora)
            const { data: urlData } = await supabase.storage
                .from('evidencias')
                .createSignedUrl(ev.storage_path, 3600);

            // Obtener información del creador
            let subidoPor = 'Usuario desconocido';
            if (ev.created_by && perfiles[ev.created_by]) {
                const perfil = perfiles[ev.created_by];
                subidoPor = `${perfil.nombre} ${perfil.apellido}`.trim() || 'Usuario desconocido';
            }

            return {
                id: ev.id,
                tipo: ev.tipo,
                url: urlData?.signedUrl || null,
                orden: ev.orden,
                fecha_subida: ev.created_at,
                subido_por: subidoPor,
            };
        })
    );

    return NextResponse.json({ evidencias: evidenciasFormateadas });
}
