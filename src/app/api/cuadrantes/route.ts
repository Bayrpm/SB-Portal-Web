import { NextResponse } from "next/server";

export const runtime = "nodejs";

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

        const geojson = await response.json();

        if (geojson.features) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            geojson.features = geojson.features.map((feature: any, index: number) => {
                const cuadranteNum =
                    feature.properties?.cuadrante ||
                    feature.properties?.CUADRANTE ||
                    feature.properties?.id ||
                    ((index % 10) + 1).toString();

                return {
                    ...feature,
                    properties: {
                        ...feature.properties,
                        color: COLORES_CUADRANTES[cuadranteNum] || "#808080",
                        cuadrante: cuadranteNum,
                    },
                };
            });
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
