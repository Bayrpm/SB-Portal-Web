import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET: Obtener todas las páginas
export async function GET() {
    try {
        const supabase = await createClient();

        const { data: paginas, error } = await supabase
            .from("paginas")
            .select("*")
            .order("nombre");

        if (error) {
            console.error("Error obteniendo páginas:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ paginas: paginas || [] });
    } catch (e) {
        console.error("Error general:", e);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

// POST: Crear una nueva página
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        const { nombre, titulo, path, activo = true } = body;

        if (!nombre || !titulo || !path) {
            return NextResponse.json({ error: "nombre, titulo y path son requeridos" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("paginas")
            .insert({ nombre, titulo, path, activo })
            .select()
            .single();

        if (error) {
            console.error("Error creando página:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ pagina: data }, { status: 201 });
    } catch (e) {
        console.error("Error general:", e);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

// PUT: Actualizar una página existente
export async function PUT(request: Request) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        const { id, nombre, titulo, path, activo } = body;

        if (!id || !nombre || !titulo || !path) {
            return NextResponse.json({ error: "id, nombre, titulo y path son requeridos" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("paginas")
            .update({ nombre, titulo, path, activo })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Error actualizando página:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ pagina: data });
    } catch (e) {
        console.error("Error general:", e);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

// DELETE: Eliminar una página
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID de la página es requerido" }, { status: 400 });
        }

        // Eliminar relaciones con roles
        await supabase
            .from("roles_paginas")
            .delete()
            .eq("pagina_id", id);

        // Eliminar la página
        const { error } = await supabase
            .from("paginas")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Error eliminando página:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Error general:", e);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
