import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';


export async function GET(_req: Request, context: { params: Promise<{ folio: string }> }) {
    const params = await context.params;
    const supabase = await createClient();
    
    // Obtener la denuncia con todos los datos relacionados en una sola consulta usando joins
    const { data: denuncia, error } = await supabase
        .from('denuncias')
        .select(`
            *,
            perfiles_ciudadanos!denuncias_ciudadano_id_fkey(nombre, apellido, telefono),
            categorias_publicas!denuncias_categoria_publica_id_fkey(nombre),
            estados_denuncia!denuncias_estado_id_fkey(nombre),
            prioridades_denuncia!denuncias_prioridad_id_fkey(nombre)
        `)
        .eq('folio', params.folio)
        .single();

    if (error || !denuncia) {
        return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
    }

    // Extraer y formatear los datos relacionados
    const ciudadano = denuncia.perfiles_ciudadanos;
    const ciudadanoNombre = ciudadano 
        ? `${ciudadano.nombre || ''} ${ciudadano.apellido || ''}`.trim() 
        : '';
    const ciudadanoTelefono = ciudadano?.telefono || '';
    
    const categoriaNombre = denuncia.categorias_publicas?.nombre || '';
    const estadoNombre = denuncia.estados_denuncia?.nombre || '';
    const prioridadNombre = denuncia.prioridades_denuncia?.nombre || '';

    // Devolver la denuncia con los datos relacionados formateados
    // Omitir las propiedades de relaciones anidadas de la respuesta
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { perfiles_ciudadanos, categorias_publicas, estados_denuncia, prioridades_denuncia, ...denunciaData } = denuncia;

    return NextResponse.json({
        denuncia: {
            ...denunciaData,
            categoria: categoriaNombre,
            estado: estadoNombre,
            prioridad: prioridadNombre,
            ciudadano_nombre: ciudadanoNombre,
            ciudadano_telefono: ciudadanoTelefono,
        },
    });
}
