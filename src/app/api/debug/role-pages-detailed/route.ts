import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const rolId = searchParams.get("rolId") || "2";

        const supabase = await createClient();

        // Obtener roles_paginas para ese rol
        const { data: rolePaginasRaw, error: e1 } = await supabase
            .from("roles_paginas")
            .select("*")
            .eq("rol_id", rolId);

        console.log(`[DEBUG] roles_paginas raw para rol ${rolId}:`, rolePaginasRaw);

        // Obtener con join
        const { data: rolePaginasWithJoin, error: e2 } = await supabase
            .from("roles_paginas")
            .select(
                `
                rol_id,
                pagina_id,
                paginas (
                  id,
                  nombre,
                  path,
                  activo
                )
              `
            )
            .eq("rol_id", rolId);

        console.log(`[DEBUG] roles_paginas with join para rol ${rolId}:`, rolePaginasWithJoin);

        return NextResponse.json({
            rolId,
            raw: rolePaginasRaw,
            withJoin: rolePaginasWithJoin,
            errors: { e1, e2 },
        });
    } catch (error) {
        console.error("[DEBUG ERROR]:", error);
        return NextResponse.json(
            { error: String(error) },
            { status: 500 }
        );
    }
}
