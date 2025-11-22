import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST: Asignar una página a un rol
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        const { rol_id, pagina_id } = body;

        if (!rol_id || !pagina_id) {
            return NextResponse.json({ error: "rol_id y pagina_id son requeridos" }, { status: 400 });
        }

        // Verificar si ya existe la asignación
        const { data: existing } = await supabase
            .from("roles_paginas")
            .select("id")
            .eq("rol_id", rol_id)
            .eq("pagina_id", pagina_id)
            .single();

        if (existing) {
            return NextResponse.json({ error: "Esta página ya está asignada al rol" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("roles_paginas")
            .insert({ rol_id, pagina_id })
            .select()
            .single();

        if (error) {
            console.error("Error asignando página al rol:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (e) {
        console.error("Error general:", e);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

// DELETE: Quitar una página de un rol
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const rol_id = searchParams.get("rol_id");
        const pagina_id = searchParams.get("pagina_id");

        if (!rol_id || !pagina_id) {
            return NextResponse.json({ error: "rol_id y pagina_id son requeridos" }, { status: 400 });
        }

        const { error } = await supabase
            .from("roles_paginas")
            .delete()
            .eq("rol_id", rol_id)
            .eq("pagina_id", pagina_id);

        if (error) {
            console.error("Error quitando página del rol:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Error general:", e);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
