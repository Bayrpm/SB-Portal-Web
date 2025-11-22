import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Normaliza y valida coordenadas desde React Native Maps / Expo Location
 * para Chile continental, específicamente San Bernardo.
 */
function normalizarCoordenadas(
    coords_x: number,
    coords_y: number
): { lat: number; lng: number } | null {
    if (!coords_x || !coords_y || coords_x === 0 || coords_y === 0) {
        return null;
    }

    const CHILE_LAT_MIN = -56;
    const CHILE_LAT_MAX = -17;
    const CHILE_LNG_MIN = -76;
    const CHILE_LNG_MAX = -66;

    let lat = coords_y;
    let lng = coords_x;

    if (
        coords_x >= CHILE_LAT_MIN &&
        coords_x <= CHILE_LAT_MAX &&
        coords_y >= CHILE_LNG_MIN &&
        coords_y <= CHILE_LNG_MAX
    ) {
        lat = coords_x;
        lng = coords_y;
    }

    if (lat > 0 && lat <= 90) {
        lat = -lat;
    }
    if (lng > 0 && lng <= 180) {
        lng = -lng;
    }

    if (
        lat < CHILE_LAT_MIN ||
        lat > CHILE_LAT_MAX ||
        lng < CHILE_LNG_MIN ||
        lng > CHILE_LNG_MAX
    ) {
        return null;
    }

    const SAN_BERNARDO_LAT_MIN = -33.7;
    const SAN_BERNARDO_LAT_MAX = -33.54;
    const SAN_BERNARDO_LNG_MIN = -70.78;
    const SAN_BERNARDO_LNG_MAX = -70.64;

    const estaDentroSanBernardo =
        lat >= SAN_BERNARDO_LAT_MIN &&
        lat <= SAN_BERNARDO_LAT_MAX &&
        lng >= SAN_BERNARDO_LNG_MIN &&
        lng <= SAN_BERNARDO_LNG_MAX;

    if (!estaDentroSanBernardo) {
        console.warn(
            `Coordenada fuera de San Bernardo pero dentro de Chile: lat=${lat.toFixed(
                4
            )}, lng=${lng.toFixed(4)}`
        );
    }

    return { lat, lng };
}

export async function GET() {
    try {
        const supabase = await createClient();

        // Obtener denuncias con coordenadas
        // Filtra solo denuncias del día de hoy y días anteriores (no futuras)
        const ahora = new Date().toISOString();
        const { data: denuncias, error } = await supabase
            .from("denuncias")
            .select(
                `
        folio,
        titulo,
        coords_x,
        coords_y,
        ubicacion_texto,
        fecha_creacion,
        prioridad_id,
        estado_id,
        categoria_publica_id
      `
            )
            .not("coords_x", "is", null)
            .not("coords_y", "is", null)
            .lte("fecha_creacion", ahora);

        if (error) {
            console.error("Error al obtener coordenadas:", error);
            return NextResponse.json(
                { error: "Error al obtener coordenadas de denuncias" },
                { status: 500 }
            );
        }

        // Obtener IDs únicos para las consultas relacionadas
        const prioridadIds = Array.from(new Set(denuncias?.map((d) => d.prioridad_id).filter(Boolean) || []));
        const estadoIds = Array.from(new Set(denuncias?.map((d) => d.estado_id).filter(Boolean) || []));
        const categoriaIds = Array.from(new Set(denuncias?.map((d) => d.categoria_publica_id).filter(Boolean) || []));

        const coloresPrioridad: Record<string, string> = {
            Baja: "#10b981",
            Media: "#f59e0b",
            Alta: "#ef4444",
            Urgencia: "#7c3aed",
        };

        const [prioridadesRes, estadosRes, categoriasRes] = await Promise.all([
            supabase
                .from("prioridades_denuncia")
                .select("id, nombre")
                .in("id", prioridadIds),
            supabase
                .from("estados_denuncia")
                .select("id, nombre")
                .in("id", estadoIds),
            supabase
                .from("categorias_publicas")
                .select("id, nombre")
                .in("id", categoriaIds),
        ]);

        const prioridadMap = new Map(
            prioridadesRes.data?.map((p) => [
                p.id,
                {
                    nombre: p.nombre,
                    color: coloresPrioridad[p.nombre] || "#808080",
                },
            ]) || []
        );
        const estadoMap = new Map(
            estadosRes.data?.map((e) => [e.id, e.nombre]) || []
        );
        const categoriaMap = new Map(
            categoriasRes.data?.map((c) => [c.id, c.nombre]) || []
        );

        const coordenadas =
            denuncias
                ?.map((denuncia) => {
                    const prioridad = prioridadMap.get(denuncia.prioridad_id);

                    const coords = normalizarCoordenadas(
                        parseFloat(denuncia.coords_x || "0"),
                        parseFloat(denuncia.coords_y || "0")
                    );

                    if (!coords) {
                        return null;
                    }

                    return {
                        folio: denuncia.folio,
                        titulo: denuncia.titulo || "Sin título",
                        lat: coords.lat,
                        lng: coords.lng,
                        ubicacion: denuncia.ubicacion_texto || "Sin ubicación",
                        prioridad: prioridad?.nombre || "Sin prioridad",
                        color: prioridad?.color || "#808080",
                        estado: estadoMap.get(denuncia.estado_id) || "Sin estado",
                        categoria:
                            categoriaMap.get(denuncia.categoria_publica_id) || "Sin categoría",
                        fecha: denuncia.fecha_creacion,
                    };
                })
                .filter((coord) => coord !== null) || [];

        return NextResponse.json({
            coordenadas,
            total: coordenadas.length,
        });
    } catch (error) {
        console.error("Error en API de coordenadas:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
