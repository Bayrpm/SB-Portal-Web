import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface GeoJSONFeature {
    type: string;
    geometry: {
        type: string;
        coordinates: number[][][] | number[][];
    };
    properties: Record<string, unknown>;
}

interface GeoJSONFeatureCollection {
    type: string;
    features: GeoJSONFeature[];
}

const COLORES_CUADRANTES: Record<string, string> = {
    "1": "#FF6B6B",
    "2": "#4ECDC4",
    "3": "#45B7D1",
    "4": "#FFA07A",
    "5": "#98D8C8",
    "6": "#F7DC6F",
    "7": "#BB8FCE",
    "8": "#85C1E2",
    "9": "#F8B88B",
    "10": "#ABEBC6",
};

const WFS_URL =
    "https://www.geoportal.cl/geoserver/Plan_Cuadrante/ows?" +
    "service=WFS&" +
    "version=1.0.0&" +
    "request=GetFeature&" +
    "typeName=Plan%20Cuadrante&" +
    "outputFormat=application/json&" +
    "srsName=EPSG:4326";

export async function GET() {
    try {
        const response = await fetch(WFS_URL);

        if (!response.ok) {
            return NextResponse.json(
                { error: "Error al obtener cuadrantes del servidor" },
                { status: response.status }
            );
        }

        const geojson = await response.json() as GeoJSONFeatureCollection;

        if (geojson.features) {
            // Filtrar solo cuadrantes de San Bernardo
            // Se asume que existe una propiedad comuna o similar
            // Si no existe, se puede usar un bounding box aproximado
            const SAN_BERNARDO = ["San Bernardo", "SAN BERNARDO"];
            const bboxSB = {
                minX: -70.75, // aproximado
                maxX: -70.65,
                minY: -33.65,
                maxY: -33.52
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let sbFeatures = geojson.features.filter((feature: any) => {
                const props = feature.properties || {};
                // Filtro por nombre de comuna si existe
                if (props.comuna && SAN_BERNARDO.includes(String(props.comuna).trim())) {
                    return true;
                }
                // Si no hay comuna, filtro por bbox (centroide del polígono)
                if (feature.geometry && feature.geometry.type === "Polygon") {
                    // Calcular centroide simple
                    const coords = (feature.geometry.coordinates as number[][][])[0];
                    const xs = coords.map((c: number[]) => c[0]);
                    const ys = coords.map((c: number[]) => c[1]);
                    const cx = xs.reduce((a: number, b: number) => a + b, 0) / xs.length;
                    const cy = ys.reduce((a: number, b: number) => a + b, 0) / ys.length;
                    if (cx >= bboxSB.minX && cx <= bboxSB.maxX && cy >= bboxSB.minY && cy <= bboxSB.maxY) {
                        return true;
                    }
                }
                return false;
            });

            // Agregar solo 1 cuadrante extra de los bordes (el primero fuera de San Bernardo)
            const extraFeature = geojson.features.find((feature: GeoJSONFeature) => {
                if (sbFeatures.includes(feature)) return false;
                // Mismo criterio inverso
                const props = feature.properties || {};
                if (props.comuna && SAN_BERNARDO.includes(String(props.comuna).trim())) {
                    return false;
                }
                if (feature.geometry && feature.geometry.type === "Polygon") {
                    const coords = (feature.geometry.coordinates as number[][][])[0];
                    const xs = coords.map((c: number[]) => c[0]);
                    const ys = coords.map((c: number[]) => c[1]);
                    const cx = xs.reduce((a: number, b: number) => a + b, 0) / xs.length;
                    const cy = ys.reduce((a: number, b: number) => a + b, 0) / ys.length;
                    if (cx < bboxSB.minX || cx > bboxSB.maxX || cy < bboxSB.minY || cy > bboxSB.maxY) {
                        return true;
                    }
                }
                return false;
            });
            // Si hay cuadrante extra, recortar su geometría (solo mostrar 10% de los puntos)
            let extraFeatureId = null;
            if (extraFeature) {
                // Recortar polígono: solo 10% de los puntos
                if (extraFeature.geometry && extraFeature.geometry.type === "Polygon") {
                    const coords = (extraFeature.geometry.coordinates as number[][][])[0];
                    const n = Math.max(4, Math.ceil(coords.length * 0.1)); // al menos 4 puntos para polígono válido
                    const recortado = coords.slice(0, n);
                    // Cerrar el polígono
                    if (recortado.length > 2 && (recortado[0][0] !== recortado[recortado.length - 1][0] || recortado[0][1] !== recortado[recortado.length - 1][1])) {
                        recortado.push(recortado[0]);
                    }
                    extraFeature.geometry = {
                        ...extraFeature.geometry,
                        coordinates: [recortado]
                    };
                }
                extraFeatureId = extraFeature.properties?.id || extraFeature.properties?.cuadrante || extraFeature.properties?.CUADRANTE;
                sbFeatures.push(extraFeature);
            }

            // Mapear colores y cuadrante
            sbFeatures = sbFeatures.map((feature: GeoJSONFeature, index: number) => {
                const cuadranteNum = String(
                    feature.properties?.cuadrante ||
                    feature.properties?.CUADRANTE ||
                    feature.properties?.id ||
                    ((index % 10) + 1)
                );

                // Si es el cuadrante extra, marcarlo
                const esExtra = extraFeatureId && (
                    feature.properties?.id === extraFeatureId ||
                    feature.properties?.cuadrante === extraFeatureId ||
                    feature.properties?.CUADRANTE === extraFeatureId
                );

                return {
                    ...feature,
                    properties: {
                        ...feature.properties,
                        color: COLORES_CUADRANTES[cuadranteNum] || "#808080",
                        cuadrante: cuadranteNum,
                        esExtra: !!esExtra
                    },
                };
            });
            geojson.features = sbFeatures;
        }

        return NextResponse.json(geojson);
    } catch (error) {
        console.error("Error obteniendo cuadrantes:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
