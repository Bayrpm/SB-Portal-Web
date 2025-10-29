import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';


export async function GET(_req: Request, context: { params: Promise<{ folio: string }> }) {
    const params = await context.params;
    const supabase = await createClient();
    // Obtener la denuncia
    const { data: denuncia, error } = await supabase
        .from('denuncias')
        .select('*')
        .eq('folio', params.folio)
        .single();

    if (error || !denuncia) {
        return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
    }

    // Buscar información del ciudadano usando ciudadano_id
    let ciudadanoNombre = '';
    let ciudadanoTelefono = '';
    if (denuncia.ciudadano_id) {
        const { data: ciudadano } = await supabase
            .from('perfiles_ciudadanos')
            .select('nombre, apellido, telefono')
            .eq('usuario_id', denuncia.ciudadano_id)
            .single();
        if (ciudadano) {
            ciudadanoNombre = `${ciudadano.nombre || ''} ${ciudadano.apellido || ''}`.trim();
            ciudadanoTelefono = ciudadano.telefono || '';
        }
    }

    // Buscar la categoría usando categoria_publica_id
    let categoriaNombre = '';
    if (denuncia.categoria_publica_id) {
        const { data: categoria } = await supabase
            .from('categorias_publicas')
            .select('nombre')
            .eq('id', denuncia.categoria_publica_id)
            .single();
        categoriaNombre = categoria?.nombre || '';
    }

    // Buscar el estado usando estado_id
    let estadoNombre = '';
    if (denuncia.estado_id) {
        const { data: estado } = await supabase
            .from('estados_denuncia')
            .select('nombre')
            .eq('id', denuncia.estado_id)
            .single();
        estadoNombre = estado?.nombre || '';
    }

    // Buscar el nombre de la prioridad usando prioridad_id
    let prioridadNombre = '';
    if (denuncia.prioridad_id) {
        const { data: prioridad } = await supabase
            .from('prioridades_denuncia')
            .select('nombre')
            .eq('id', denuncia.prioridad_id)
            .single();
        prioridadNombre = prioridad?.nombre || '';
    }

    // Devolver la denuncia con el nombre de la categoría, estado, prioridad, ciudadano y teléfono
    return NextResponse.json({
        denuncia: {
            ...denuncia,
            categoria: categoriaNombre,
            estado: estadoNombre,
            prioridad: prioridadNombre,
            ciudadano_nombre: ciudadanoNombre,
            ciudadano_telefono: ciudadanoTelefono,
        },
    });
}
