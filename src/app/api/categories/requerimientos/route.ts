import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("cat_requerimientos")
            .select(`
                *,
                subgrupo:cat_subgrupos(
                    id, 
                    nombre,
                    grupo:cat_grupos(
                        id,
                        nombre,
                        familia:cat_familias(id, nombre)
                    )
                )
            `)
            .order("nombre", { ascending: true });
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ requerimientos: data });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Error inesperado" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        const { nombre, subgrupo_id, prioridad, activo } = body;

        if (!nombre || !subgrupo_id) {
            return NextResponse.json({ error: "El nombre y subgrupo_id son requeridos" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("cat_requerimientos")
            .insert({ nombre, subgrupo_id, prioridad, activo: activo ?? true })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ requerimiento: data }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Error inesperado" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        const { id, nombre, subgrupo_id, prioridad, activo } = body;

        if (!id) {
            return NextResponse.json({ error: "El ID es requerido" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("cat_requerimientos")
            .update({ nombre, subgrupo_id, prioridad, activo })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ requerimiento: data });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Error inesperado" }, { status: 500 });
    }
}
