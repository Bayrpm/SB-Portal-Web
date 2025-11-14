import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("cat_grupos")
            .select(`
                *,
                familia:cat_familias(id, nombre)
            `)
            .order("nombre", { ascending: true });
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ grupos: data });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Error inesperado" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        const { nombre, familia_id, activo } = body;

        if (!nombre || !familia_id) {
            return NextResponse.json({ error: "El nombre y familia_id son requeridos" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("cat_grupos")
            .insert({ nombre, familia_id, activo: activo ?? true })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ grupo: data }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Error inesperado" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        const { id, nombre, familia_id, activo } = body;

        if (!id) {
            return NextResponse.json({ error: "El ID es requerido" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("cat_grupos")
            .update({ nombre, familia_id, activo })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ grupo: data });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Error inesperado" }, { status: 500 });
    }
}
