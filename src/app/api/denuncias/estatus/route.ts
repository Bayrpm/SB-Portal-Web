import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("estados_denuncia")
            .select("id, nombre, orden")
            .order("orden", { ascending: true });
        if (error) {
            throw new Error(error.message);
        }
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching complaint statuses:", error);
        return NextResponse.error();
    }
}