"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Loader from "./Loader";
import { ChevronRight, ChevronLeft, MapPin } from "lucide-react";
import { useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const SAN_BERNARDO_CENTER: [number, number] = [-33.592, -70.704];

const SAN_BERNARDO_MAX_BOUNDS: [[number, number], [number, number]] = [
  [-33.7, -70.8],
  [-33.52, -70.6],
];

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false, loading: () => <Loader text="Cargando mapa..." /> }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});
const GeoJSON = dynamic(
  () => import("react-leaflet").then((mod) => mod.GeoJSON),
  { ssr: false }
);

import type { Map as LeafletMap } from "leaflet";

function MapController({
  onMapReady,
}: {
  onMapReady: (map: LeafletMap) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (map) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  return null;
}

function CuadrantesLayer({
  visible,
  onBoundsCalculated,
}: {
  visible: boolean;
  onBoundsCalculated?: (bounds: import("leaflet").LatLngBounds | null) => void;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [geojsonData, setGeojsonData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      setGeojsonData(null);
      if (onBoundsCalculated) {
        onBoundsCalculated(null);
      }
      return;
    }

    // Intentar cargar desde localStorage
    const cachedCuadrantes = localStorage.getItem("cuadrantes_cache");
    if (cachedCuadrantes) {
      try {
        const data = JSON.parse(cachedCuadrantes);
        setGeojsonData(data);

        if (data.features && data.features.length > 0 && onBoundsCalculated) {
          import("leaflet").then((leaflet) => {
            const L = leaflet.default;
            const bounds = L.geoJSON(data).getBounds();
            onBoundsCalculated(bounds);
          });
        }
        setLoading(false);
        return;
      } catch (error) {
        console.error("Error parseando cache de cuadrantes:", error);
      }
    }

    setLoading(true);

    fetch("/api/cuadrantes")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        // Guardar en localStorage
        try {
          localStorage.setItem("cuadrantes_cache", JSON.stringify(data));
        } catch (error) {
          console.warn("No se pudo guardar cuadrantes en cache:", error);
        }

        setGeojsonData(data);

        if (data.features && data.features.length > 0 && onBoundsCalculated) {
          // Importar dinámicamente leaflet para calcular bounds
          import("leaflet").then((leaflet) => {
            const L = leaflet.default;
            const bounds = L.geoJSON(data).getBounds();
            onBoundsCalculated(bounds);
          });
        }
      })
      .catch((error) => console.error("Error cargando cuadrantes:", error))
      .finally(() => setLoading(false));
  }, [visible, onBoundsCalculated]);

  if (!visible || !geojsonData || loading) return null;

  return (
    <>
      <GeoJSON
        data={geojsonData}
        style={(feature) => ({
          color: feature?.properties?.color || "#003C96",
          weight: 2.5,
          opacity: 0.9,
          fillColor: feature?.properties?.color || "#003C96",
          fillOpacity: 0.25,
        })}
        onEachFeature={(feature, layer) => {
          if (feature.properties) {
            const { cuadrante, COMUNA, REGION } = feature.properties;
            layer.bindPopup(`
            <div class="text-sm">
              <h3 class="font-bold text-lg mb-2">Cuadrante ${
                cuadrante || "N/A"
              }</h3>
              ${COMUNA ? `<p><strong>Comuna:</strong> ${COMUNA}</p>` : ""}
              ${REGION ? `<p><strong>Región:</strong> ${REGION}</p>` : ""}
            </div>
          `);
          }
        }}
      />
      <GeoJSON
        data={geojsonData}
        style={() => ({
          color: "#003C96",
          weight: 4,
          opacity: 1,
          fillOpacity: 0,
        })}
        interactive={false}
      />
    </>
  );
}

interface Denuncia {
  folio: string;
  titulo: string;
  lat: number;
  lng: number;
  ubicacion: string;
  prioridad: string;
  color: string;
  estado: string;
  categoria: string;
  fecha: string;
}

interface MapaDenunciasProps {
  style?: React.CSSProperties;
  className?: string;
  height?: number | string;
  selectedEstados?: string[];
  onEstadosYConteos?: (
    estados: string[],
    conteos: { Urgencia: number; Alta: number; Media: number; Baja: number }
  ) => void;
  dateRange?: { start?: string; end?: string };
}

export default function MapaDenuncias({
  style,
  className,
  height = 600,
  selectedEstados = ["Pendiente"],
  onEstadosYConteos,
  dateRange,
}: MapaDenunciasProps) {
  const [isClient, setIsClient] = useState(false);
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [loading, setLoading] = useState(true);

  // Denuncias más recientes en estado pendiente (últimas 24 horas)
  const ahora = new Date();
  const hace24Horas = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
  const pendientesRecientes = denuncias
    .filter((d) => {
      const fechaDenuncia = new Date(d.fecha);
      return d.estado === "Pendiente" && fechaDenuncia >= hace24Horas;
    })
    .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0))
    .slice(0, 5);
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelRecientesVisible, setPanelRecientesVisible] = useState(false);
  const [selectedDenuncia, setSelectedDenuncia] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const [mostrarCuadrantes, setMostrarCuadrantes] = useState(true);
  const [L, setL] = useState<typeof import("leaflet") | null>(null);
  // Filtro de estados
  // Obtener estados únicos de las denuncias
  const estadosUnicos = Array.from(
    new Set(denuncias.map((d) => d.estado))
  ).sort();

  // Filtrar denuncias según estados seleccionados y rango de fechas
  // Filtrar y ordenar denuncias: descendente por fecha
  const denunciasFiltradas = denuncias
    .filter((d) => {
      const estadoOk = selectedEstados.includes(d.estado);
      let fechaOk = true;
      if (dateRange?.start) {
        fechaOk = fechaOk && d.fecha >= dateRange.start;
      }
      if (dateRange?.end) {
        fechaOk = fechaOk && d.fecha <= dateRange.end;
      }
      return estadoOk && fechaOk;
    })
    .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0));

  // Calcular conteos de prioridad para las denuncias filtradas
  const conteosPrioridad = {
    Urgencia: denunciasFiltradas.filter((d) => d.prioridad === "Urgencia")
      .length,
    Alta: denunciasFiltradas.filter((d) => d.prioridad === "Alta").length,
    Media: denunciasFiltradas.filter((d) => d.prioridad === "Media").length,
    Baja: denunciasFiltradas.filter((d) => d.prioridad === "Baja").length,
  };

  // Comunicar estados únicos y conteos al padre
  useEffect(() => {
    if (onEstadosYConteos) {
      onEstadosYConteos(estadosUnicos, conteosPrioridad);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(estadosUnicos), JSON.stringify(conteosPrioridad)]);

  const center: [number, number] = SAN_BERNARDO_CENTER;

  const handleBoundsCalculated = (
    bounds: import("leaflet").LatLngBounds | null
  ) => {
    if (bounds && mapInstance) {
      mapInstance.setMaxBounds(bounds.pad(0.1));
    }
  };

  const flyToDenuncia = (denuncia: Denuncia) => {
    if (mapInstance) {
      mapInstance.flyTo([denuncia.lat, denuncia.lng], 17, {
        duration: 1.5,
      });
      setSelectedDenuncia(denuncia.folio);
      setTimeout(() => setSelectedDenuncia(null), 3000);
    }
  };

  // Verificar si una denuncia está en las recientes
  const isReciente = (folio: string) => {
    return pendientesRecientes.some((d) => d.folio === folio);
  };

  // Crear icono personalizado según prioridad
  const createCustomIcon = (color: string, folio: string) => {
    if (!L) return null;
    const esReciente = isReciente(folio);
    return L.divIcon({
      className: esReciente ? "pulse-marker" : "custom-marker",
      html: `
        <div style="
          background-color: ${color};
          width: 25px;
          height: 25px;
          border-radius: 50% 50% 50% 0;
          border: 2px solid ${esReciente ? "#2563eb" : "white"};
          transform: rotate(-45deg);
          box-shadow: 0 2px 5px rgba(0,0,0,0.3)${
            esReciente ? ", 0 0 15px rgba(37, 99, 235, 0.6)" : ""
          };
        ">
          <div style="
            width: 10px;
            height: 10px;
            background-color: white;
            border-radius: 50%;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(45deg);
          "></div>
        </div>
      `,
      iconSize: [25, 25],
      iconAnchor: [12, 24],
      popupAnchor: [0, -24],
    });
  };

  useEffect(() => {
    setIsClient(true);

    // Importar Leaflet dinámicamente en el cliente
    import("leaflet").then((leaflet) => {
      const leafletLib = leaflet.default;
      setL(leafletLib);

      // Configurar iconos de Leaflet
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (leafletLib.Icon.Default.prototype as any)._getIconUrl;
      leafletLib.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
    });

    fetch("/api/denuncias/coordenadas")
      .then((res) => res.json())
      .then((data) => {
        setDenuncias(data.coordenadas || []);
      })
      .catch((error) => {
        console.error("Error cargando coordenadas:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (!isClient) {
    return (
      <div
        className={`w-full relative bg-gray-100 flex items-center justify-center ${
          className || ""
        }`}
        style={{
          height: typeof height === "number" ? `${height}px` : height,
          borderRadius: 8,
          overflow: "hidden",
          ...style,
        }}
      >
        <Loader text="Inicializando mapa..." />
      </div>
    );
  }

  // Si no hay L (Leaflet cargado), tampoco renderizar el mapa
  if (!L) {
    return (
      <div
        className={`w-full relative bg-gray-100 flex items-center justify-center ${
          className || ""
        }`}
        style={{
          height: typeof height === "number" ? `${height}px` : height,
          borderRadius: 8,
          overflow: "hidden",
          ...style,
        }}
      >
        <Loader text="Cargando Leaflet..." />
      </div>
    );
  }

  return (
    <div
      className={`w-full relative ${className || ""}`}
      style={{
        height: typeof height === "number" ? `${height}px` : height,
        borderRadius: 8,
        overflow: "hidden",
        ...style,
      }}
    >
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        scrollWheelZoom={true}
        maxBounds={SAN_BERNARDO_MAX_BOUNDS}
        maxBoundsViscosity={1.0}
        minZoom={12}
      >
        <MapController onMapReady={setMapInstance} />
        <CuadrantesLayer
          visible={mostrarCuadrantes}
          onBoundsCalculated={handleBoundsCalculated}
        />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {!loading &&
          denunciasFiltradas.length > 0 &&
          denunciasFiltradas.map((denuncia) => (
            <Marker
              key={denuncia.folio}
              position={[denuncia.lat, denuncia.lng]}
              icon={
                createCustomIcon(denuncia.color, denuncia.folio) ?? undefined
              }
            >
              <Popup>
                <div className="min-w-[200px]">
                  <h3 className="font-bold text-lg mb-2">
                    Folio: {denuncia.folio}
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Categoría:</strong> {denuncia.categoria}
                    </p>
                    <p>
                      <strong>Prioridad:</strong>{" "}
                      <span
                        className="px-2 py-1 rounded text-white text-xs"
                        style={{ backgroundColor: denuncia.color }}
                      >
                        {denuncia.prioridad}
                      </span>
                    </p>
                    <p>
                      <strong>Estado:</strong> {denuncia.estado}
                    </p>
                    <p>
                      <strong>Ubicación:</strong> {denuncia.ubicacion}
                    </p>
                    <p className="text-gray-500 text-xs mt-2">
                      {new Date(denuncia.fecha).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      {/* Control de capa de cuadrantes */}
      <div className="absolute bottom-6 left-6 z-[1000] flex flex-col gap-3">
        <button
          onClick={() => setMostrarCuadrantes(!mostrarCuadrantes)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg border transition-all ${
            mostrarCuadrantes
              ? "bg-blue-600 text-white border-blue-700 hover:bg-blue-700"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
          title={
            mostrarCuadrantes
              ? "Ocultar cuadrantes"
              : "Mostrar cuadrantes de San Bernardo"
          }
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <span className="text-sm font-medium">
            {mostrarCuadrantes ? "Cuadrantes activos" : "Mostrar cuadrantes"}
          </span>
        </button>

        {/* Panel de denuncias recientes - solo visible cuando el panel general está cerrado */}
        {!panelOpen &&
          panelRecientesVisible &&
          pendientesRecientes.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-sm">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-700">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Denuncias Recientes (24h)
                </h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  {pendientesRecientes.length} pendiente
                  {pendientesRecientes.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {pendientesRecientes.map((d) => (
                  <button
                    key={d.folio}
                    onClick={() => flyToDenuncia(d)}
                    className="w-full p-3 text-left hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      {/* Marcador de color */}
                      <div
                        className="w-5 h-5 rounded-full border-2 border-blue-400 shadow-md flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: d.color }}
                      ></div>

                      {/* Información */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-xs line-clamp-1">
                          {d.titulo}
                        </h4>
                        <p className="text-xs text-gray-600 line-clamp-1 mt-0.5">
                          {d.categoria}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="px-1.5 py-0.5 rounded text-white text-xs font-medium"
                            style={{ backgroundColor: d.color }}
                          >
                            {d.prioridad}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                          📍 {d.ubicacion}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(d.fecha).toLocaleString("es-CL", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
      </div>

      {/* Panel lateral con listado de denuncias */}
      <div
        className={`absolute top-0 right-0 h-full bg-white shadow-2xl z-[1000] transition-all duration-300 ${
          panelOpen ? "w-96" : "w-0"
        }`}
        style={{ borderLeft: "1px solid #e5e7eb" }}
      >
        {/* Botón toggle */}
        <button
          onClick={() => {
            setPanelOpen(!panelOpen);
            if (panelOpen) {
              setPanelRecientesVisible(true);
            } else {
              setPanelRecientesVisible(false);
            }
          }}
          className="absolute -left-10 top-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-l-lg shadow-lg p-2 transition-colors z-[1001]"
          title={panelOpen ? "Cerrar panel" : "Abrir panel"}
        >
          {panelOpen ? (
            <ChevronRight className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {/* Contenido del panel */}
        {panelOpen && (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Denuncias en el Mapa
              </h3>
              <p className="text-sm text-blue-100 mt-1">
                {loading
                  ? "Cargando..."
                  : `${denunciasFiltradas.length} denuncia${
                      denunciasFiltradas.length !== 1 ? "s" : ""
                    } encontrada${denunciasFiltradas.length !== 1 ? "s" : ""}`}
              </p>
            </div>

            {/* Lista de denuncias */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader text="Cargando denuncias..." />
                </div>
              ) : denunciasFiltradas.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <p className="text-sm">No hay denuncias con coordenadas</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {denunciasFiltradas.map((denuncia, index) => {
                    const esReciente = isReciente(denuncia.folio);
                    return (
                      <button
                        key={denuncia.folio}
                        onClick={() => flyToDenuncia(denuncia)}
                        className={`w-full p-4 text-left hover:bg-blue-50 transition-colors ${
                          selectedDenuncia === denuncia.folio
                            ? "bg-blue-100 border-l-4 border-blue-600"
                            : esReciente
                            ? "border-l-4 border-blue-400 bg-blue-50/30"
                            : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Marcador de color */}
                          <div
                            className="w-6 h-6 rounded-full border-2 border-white shadow-md flex-shrink-0 mt-1"
                            style={{ backgroundColor: denuncia.color }}
                          ></div>

                          {/* Información */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">
                                {denuncia.titulo}
                              </h4>
                              <span className="text-xs text-gray-500">
                                #{index + 1}
                              </span>
                            </div>

                            <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                              {denuncia.categoria}
                            </p>

                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className="px-2 py-0.5 rounded text-white text-xs font-medium"
                                style={{ backgroundColor: denuncia.color }}
                              >
                                {denuncia.prioridad}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">
                                {denuncia.estado}
                              </span>
                            </div>

                            <p className="text-xs text-gray-500 line-clamp-2">
                              📍 {denuncia.ubicacion}
                            </p>

                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(denuncia.fecha).toLocaleDateString(
                                "es-CL",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
