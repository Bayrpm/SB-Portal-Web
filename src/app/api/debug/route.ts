export const runtime = 'nodejs';

import { NextResponse } from "next/server";

export async function GET() {
    try {
        // Verificamos las variables de entorno sin mostrar valores completos por seguridad
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const anonKeyExists = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const serviceRoleExists = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

        // Probamos a hacer un fetch simple a la URL de Supabase
        let fetchResult = "No se pudo conectar";
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
                }
            });

            clearTimeout(timeoutId);
            fetchResult = `Status: ${response.status} ${response.statusText}`;
        } catch (error) {
            fetchResult = `Error: ${error instanceof Error ? `${error.name}: ${error.message}` : String(error)}`;
        }

        return NextResponse.json({
            supabase: {
                url: supabaseUrl ? supabaseUrl.substring(0, 15) + '...' : 'No definido',
                anonKeyExists,
                serviceRoleExists,
                fetchResult
            },
            serverInfo: {
                nodeVersion: process.version,
                platform: process.platform
            }
        });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}