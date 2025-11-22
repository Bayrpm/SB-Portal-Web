import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();

        // Obtener toda la información sobre roles_paginas
        const { data: rolePaginasData } = await supabase
            .from("roles_paginas")
            .select("rol_id, pagina_id, paginas(id, nombre, path, activo)");

        const { data: rolesData } = await supabase
            .from("roles_portal")
            .select("id, nombre");

        const { data: paginasData } = await supabase
            .from("paginas")
            .select("id, nombre, path, activo");

        return NextResponse.json({
            roles: rolesData,
            paginas: paginasData,
            roles_paginas: rolePaginasData,
        });
    } catch (error) {
        console.error("Error en debug:", error);
        return NextResponse.json(
            { error: "Error al obtener datos" },
            { status: 500 }
        );
    }
}
