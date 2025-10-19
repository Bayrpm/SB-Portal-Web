import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("roles_portal")
            .select("id, nombre")

        if (error) {
            console.error("Error Supabase:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const roles = data?.map(rol => ({
            id: rol.id,
            nombre: rol.nombre
        })) || [];

        return NextResponse.json({ roles });
    } catch (e) {
        console.error("Error general:", e);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}