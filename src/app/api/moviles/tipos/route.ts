import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET - Obtener todos los tipos de móviles
export async function GET() {
    try {
        const supabase = await createClient();

        const { data: tipos, error } = await supabase
            .from("movil_tipo")
            .select("*")
            .order("nombre", { ascending: true });

        if (error) throw error;

        return NextResponse.json({ tipos: tipos || [] });
    } catch (error) {
        console.error("Error al obtener tipos de móviles:", error);
        return NextResponse.json(
            { error: "Error al obtener tipos de móviles" },
            { status: 500 }
        );
    }
}

// POST - Crear nuevo tipo de móvil
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        const { nombre, descripcion, activo } = body;

        if (!nombre) {
            return NextResponse.json(
                { error: "Nombre es requerido" },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from("movil_tipo")
            .insert({
                nombre,
                descripcion,
                activo: activo !== undefined ? activo : true,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ tipo: data }, { status: 201 });
    } catch (error) {
        console.error("Error al crear tipo de móvil:", error);
        if (error && typeof error === 'object' && 'code' in error && error.code === "23505") {
            return NextResponse.json(
                { error: "El nombre del tipo ya existe" },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { error: "Error al crear tipo de móvil" },
            { status: 500 }
        );
    }
}

// PUT - Actualizar tipo de móvil existente
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        const { id, nombre, descripcion, activo } = body;

        if (!id) {
            return NextResponse.json(
                { error: "ID del tipo es requerido" },
                { status: 400 }
            );
        }

        const updateData: Record<string, unknown> = {};
        if (nombre !== undefined) updateData.nombre = nombre;
        if (descripcion !== undefined) updateData.descripcion = descripcion;
        if (activo !== undefined) updateData.activo = activo;

        const { data, error } = await supabase
            .from("movil_tipo")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ tipo: data });
    } catch (error) {
        console.error("Error al actualizar tipo de móvil:", error);
        if (error && typeof error === 'object' && 'code' in error && error.code === "23505") {
            return NextResponse.json(
                { error: "El nombre del tipo ya existe" },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { error: "Error al actualizar tipo de móvil" },
            { status: 500 }
        );
    }
}
