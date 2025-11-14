import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET - Obtener todos los móviles
export async function GET() {
    try {
        const supabase = await createClient();

        const { data: moviles, error } = await supabase
            .from("moviles")
            .select(
                `
        *,
        tipo:movil_tipo(id, nombre)
      `
            )
            .order("id", { ascending: true });

        if (error) throw error;

        return NextResponse.json({ moviles: moviles || [] });
    } catch (error) {
        console.error("Error al obtener móviles:", error);
        return NextResponse.json(
            { error: "Error al obtener móviles" },
            { status: 500 }
        );
    }
}

// POST - Crear nuevo móvil
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        const { patente, tipo_id, marca, modelo, anio, kilometraje_actual, estado, activo } = body;

        if (!patente || !tipo_id) {
            return NextResponse.json(
                { error: "Patente y tipo de móvil son requeridos" },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from("moviles")
            .insert({
                patente: patente.toUpperCase(),
                tipo_id,
                marca,
                modelo,
                anio,
                kilometraje_actual: kilometraje_actual || 0,
                estado: estado || "DISPONIBLE",
                activo: activo !== undefined ? activo : true,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ movil: data }, { status: 201 });
    } catch (error) {
        console.error("Error al crear móvil:", error);
        if (error && typeof error === 'object' && 'code' in error && error.code === "23505") {
            return NextResponse.json(
                { error: "La patente ya existe" },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { error: "Error al crear móvil" },
            { status: 500 }
        );
    }
}

// PUT - Actualizar móvil existente
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        const { id, patente, tipo_id, marca, modelo, anio, kilometraje_actual, estado, activo } = body;

        if (!id) {
            return NextResponse.json(
                { error: "ID del móvil es requerido" },
                { status: 400 }
            );
        }

        const updateData: Record<string, unknown> = {};
        if (patente !== undefined) updateData.patente = patente.toUpperCase();
        if (tipo_id !== undefined) updateData.tipo_id = tipo_id;
        if (marca !== undefined) updateData.marca = marca;
        if (modelo !== undefined) updateData.modelo = modelo;
        if (anio !== undefined) updateData.anio = anio;
        if (kilometraje_actual !== undefined) updateData.kilometraje_actual = kilometraje_actual;
        if (estado !== undefined) updateData.estado = estado;
        if (activo !== undefined) updateData.activo = activo;

        const { data, error } = await supabase
            .from("moviles")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ movil: data });
    } catch (error) {
        console.error("Error al actualizar móvil:", error);
        if (error && typeof error === 'object' && 'code' in error && error.code === "23505") {
            return NextResponse.json(
                { error: "La patente ya existe" },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { error: "Error al actualizar móvil" },
            { status: 500 }
        );
    }
}
