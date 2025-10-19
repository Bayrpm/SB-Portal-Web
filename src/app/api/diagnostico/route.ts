export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
    try {
        // Recuperar los parámetros de consulta para el diagnóstico
        const url = new URL(req.url);
        const test = url.searchParams.get("test") || "health";
        const timeoutParam = url.searchParams.get("timeout");
        const timeout = timeoutParam ? parseInt(timeoutParam, 10) : 5000;

        // Diagnóstico básico de variables
        const diagnostics: {
            env: {
                url: string;
                anonKey: string;
                serviceRole: string;
            };
            network: {
                supabaseReachable: string;
                supabaseTest: string;
            };
            test: string;
            runtime: {
                node: string;
                platform: string;
                timestamp: string;
            };
            testResult?: {
                success: boolean;
                error: string | null;
                data: string | null;
            };
        } = {
            env: {
                url: maskSecret(process.env.NEXT_PUBLIC_SUPABASE_URL || "no definido"),
                anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Definida (longitud: " + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length + ")" : "No definida",
                serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY ? "Definida (longitud: " + process.env.SUPABASE_SERVICE_ROLE_KEY.length + ")" : "No definida"
            },
            network: {
                supabaseReachable: "Pendiente...",
                supabaseTest: "Pendiente..."
            },
            test: test,
            runtime: {
                node: process.version,
                platform: process.platform,
                timestamp: new Date().toISOString()
            }
        };

        // Test de conectividad HTTP simple
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + "/auth/v1/health", {
                signal: controller.signal,
                headers: {
                    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
                }
            });

            clearTimeout(timeoutId);
            diagnostics.network.supabaseReachable = `OK (status: ${response.status})`;

            // Intentar leer el cuerpo
            try {
                await response.json();
                diagnostics.network.supabaseTest = `OK (data recibida)`;
            } catch (error) {
                diagnostics.network.supabaseTest = `Parcial (no se pudo leer el cuerpo: ${error instanceof Error ? error.message : String(error)})`;
            }
        } catch (error) {
            diagnostics.network.supabaseReachable = `Error: ${error instanceof Error ? error.message : String(error)}`;
            diagnostics.network.supabaseTest = "Fallido (no hay conectividad)";
        }

        // Test específico solicitado
        if (test === "auth") {
            try {
                const { data, error } = await supabaseAdmin.auth.getUser("00000000-0000-0000-0000-000000000000");
                diagnostics.testResult = {
                    success: !error,
                    error: error ? error.message : null,
                    data: data ? "Datos recibidos" : "Sin datos"
                };
            } catch (error) {
                diagnostics.testResult = {
                    success: false,
                    error: `Excepción: ${error instanceof Error ? error.message : String(error)}`,
                    data: null
                };
            }
        }
        else if (test === "db") {
            try {
                const { data, error } = await supabaseAdmin.from("roles").select("*").limit(1);
                diagnostics.testResult = {
                    success: !error,
                    error: error ? error.message : null,
                    data: data ? `Recibidos ${data.length} registros` : "Sin datos"
                };
            } catch (error) {
                diagnostics.testResult = {
                    success: false,
                    error: `Excepción: ${error instanceof Error ? error.message : String(error)}`,
                    data: null
                };
            }
        }

        return NextResponse.json(diagnostics);
    } catch (error) {
        return NextResponse.json({
            error: "Error en diagnóstico",
            message: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

// Función para enmascarar información sensible
function maskSecret(value: string): string {
    if (!value || value === "no definido") return value;
    if (value.includes("://")) {
        // Es una URL, mantener el dominio pero enmascarar el resto
        const urlParts = value.split("://");
        const protocol = urlParts[0];
        const domainAndPath = urlParts[1].split("/");
        return `${protocol}://${domainAndPath[0]}/***`;
    }
    // Para otros secretos, mostrar solo los primeros y últimos caracteres
    if (value.length <= 8) return "***";
    return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
}