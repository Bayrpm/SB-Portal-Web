"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Loader from "./Loader";
import { ChevronRight, ChevronLeft, MapPin } from "lucide-react";
import { useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useRealtimeDenuncias } from "@/hooks/useRealtimeDenuncias";
import { notifyStatusChange, showToast } from "@/lib/utils/toast";

const SAN_BERNARDO_CENTER: [number, number] = [-33.5931, -70.7046];

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
  const [loadingCuadrantes, setLoadingCuadrantes] = useState(false);

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
        setLoadingCuadrantes(false);
        return;
      } catch (error) {
        console.error("Error parseando cache de cuadrantes:", error);
      }
    }

    setLoadingCuadrantes(true);

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
      .finally(() => setLoadingCuadrantes(false));
  }, [visible, onBoundsCalculated]);

  if (!visible || !geojsonData || loadingCuadrantes) return null;

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
  const [selectedDenuncia, setSelectedDenuncia] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const [mostrarCuadrantes, setMostrarCuadrantes] = useState(true);
  const [L, setL] = useState<typeof import("leaflet") | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelRecientesVisible, setPanelRecientesVisible] = useState(false);
  const [recentlyUpdated, setRecentlyUpdated] = useState<Set<string>>(
    new Set()
  );

  // Usar hook de Realtime en lugar de polling
  const { denuncias, loading } = useRealtimeDenuncias({
    onAssignmentChange: (folio, newStatus) => {
      // Marcar como actualizado recientemente para animación
      setRecentlyUpdated((prev) => new Set([...prev, folio]));
      notifyStatusChange(folio, "Pendiente", newStatus);

      // Limpiar marca después de 3 segundos
      setTimeout(() => {
        setRecentlyUpdated((prev) => {
          const updated = new Set(prev);
          updated.delete(folio);
          return updated;
        });
      }, 3000);
    },
    onError: (error) => {
      console.error("Error en Realtime:", error);
      showToast({
        message: "Error sincronizando datos en tiempo real",
        type: "error",
        duration: 3000,
      });
    },
  });

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
    const esActualizado = recentlyUpdated.has(folio);
    return L.divIcon({
      className: esActualizado
        ? "pulse-marker-updated"
        : esReciente
        ? "pulse-marker"
        : "custom-marker",
      html: `
        <div style="
          background-color: ${color};
          width: 25px;
          height: 25px;
          border-radius: 50% 50% 50% 0;
          border: 2px solid ${
            esActualizado ? "#10b981" : esReciente ? "#2563eb" : "white"
          };
          transform: rotate(-45deg);
          box-shadow: 0 2px 5px rgba(0,0,0,0.3)${
            esActualizado
              ? ", 0 0 20px rgba(16, 185, 129, 0.8)"
              : esReciente
              ? ", 0 0 15px rgba(37, 99, 235, 0.6)"
              : ""
          };
          animation: ${esActualizado ? "pulse 0.6s ease-in-out 2" : "none"};
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
      <style>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 2px 5px rgba(0,0,0,0.3), 0 0 20px rgba(16, 185, 129, 0.8);
            transform: rotate(-45deg) scale(1);
          }
          50% {
            box-shadow: 0 2px 5px rgba(0,0,0,0.3), 0 0 30px rgba(16, 185, 129, 1);
            transform: rotate(-45deg) scale(1.1);
          }
        }
      `}</style>
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
              <Popup maxWidth={320} minWidth={280}>
                <div
                  style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
                >
                  {/* Header con folio */}
                  <div
                    style={{
                      background: "linear-gradient(to right, #2563eb, #1d4ed8)",
                      margin: "-15px -20px 12px -20px",
                      padding: "12px 16px",
                      borderRadius: "8px 8px 0 0",
                    }}
                  >
                    <div
                      style={{
                        color: "white",
                        fontWeight: "bold",
                        fontSize: "15px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <svg
                        style={{ width: "18px", height: "18px" }}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Folio: {denuncia.folio}
                    </div>
                  </div>

                  {/* Título */}
                  <h4
                    style={{
                      fontWeight: "600",
                      color: "#111827",
                      fontSize: "14px",
                      marginBottom: "12px",
                      lineHeight: "1.4",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {denuncia.titulo}
                  </h4>

                  {/* Info grid */}
                  <div style={{ marginBottom: "12px" }}>
                    {/* Categoría */}
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginBottom: "10px",
                      }}
                    >
                      <svg
                        style={{
                          width: "16px",
                          height: "16px",
                          color: "#9ca3af",
                          flexShrink: 0,
                          marginTop: "2px",
                        }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            fontSize: "11px",
                            color: "#6b7280",
                            margin: "0 0 2px 0",
                          }}
                        >
                          Categoría
                        </p>
                        <p
                          style={{
                            fontSize: "13px",
                            fontWeight: "500",
                            color: "#111827",
                            margin: 0,
                          }}
                        >
                          {denuncia.categoria}
                        </p>
                      </div>
                    </div>

                    {/* Estado */}
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginBottom: "10px",
                      }}
                    >
                      <svg
                        style={{
                          width: "16px",
                          height: "16px",
                          color: "#9ca3af",
                          flexShrink: 0,
                          marginTop: "2px",
                        }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            fontSize: "11px",
                            color: "#6b7280",
                            margin: "0 0 2px 0",
                          }}
                        >
                          Estado
                        </p>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            backgroundColor: "#f3f4f6",
                            color: "#374151",
                            fontSize: "12px",
                            fontWeight: "500",
                          }}
                        >
                          {denuncia.estado}
                        </span>
                      </div>
                    </div>

                    {/* Prioridad */}
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginBottom: "10px",
                      }}
                    >
                      <svg
                        style={{
                          width: "16px",
                          height: "16px",
                          color: "#9ca3af",
                          flexShrink: 0,
                          marginTop: "2px",
                        }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            fontSize: "11px",
                            color: "#6b7280",
                            margin: "0 0 2px 0",
                          }}
                        >
                          Prioridad
                        </p>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            backgroundColor: denuncia.color,
                            color: "white",
                            fontSize: "12px",
                            fontWeight: "600",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                          }}
                        >
                          {denuncia.prioridad}
                        </span>
                      </div>
                    </div>

                    {/* Ubicación */}
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginBottom: "10px",
                      }}
                    >
                      <svg
                        style={{
                          width: "16px",
                          height: "16px",
                          color: "#9ca3af",
                          flexShrink: 0,
                          marginTop: "2px",
                        }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            fontSize: "11px",
                            color: "#6b7280",
                            margin: "0 0 2px 0",
                          }}
                        >
                          Ubicación
                        </p>
                        <p
                          style={{
                            fontSize: "13px",
                            color: "#111827",
                            margin: 0,
                            lineHeight: "1.4",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {denuncia.ubicacion}
                        </p>
                      </div>
                    </div>

                    {/* Fecha y hora */}
                    <div
                      style={{
                        borderTop: "1px solid #e5e7eb",
                        paddingTop: "8px",
                        marginTop: "8px",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "8px",
                      }}
                    >
                      <div style={{ display: "flex", gap: "6px" }}>
                        <svg
                          style={{
                            width: "14px",
                            height: "14px",
                            color: "#9ca3af",
                            flexShrink: 0,
                            marginTop: "2px",
                          }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <div style={{ flex: 1 }}>
                          <p
                            style={{
                              fontSize: "10px",
                              color: "#6b7280",
                              margin: "0 0 1px 0",
                            }}
                          >
                            Fecha
                          </p>
                          <p
                            style={{
                              fontSize: "12px",
                              fontWeight: "500",
                              color: "#111827",
                              margin: 0,
                            }}
                          >
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

                      <div style={{ display: "flex", gap: "6px" }}>
                        <svg
                          style={{
                            width: "14px",
                            height: "14px",
                            color: "#9ca3af",
                            flexShrink: 0,
                            marginTop: "2px",
                          }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div style={{ flex: 1 }}>
                          <p
                            style={{
                              fontSize: "10px",
                              color: "#6b7280",
                              margin: "0 0 1px 0",
                            }}
                          >
                            Hora
                          </p>
                          <p
                            style={{
                              fontSize: "12px",
                              fontWeight: "500",
                              color: "#111827",
                              margin: 0,
                            }}
                          >
                            {new Date(denuncia.fecha).toLocaleTimeString(
                              "es-CL",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botón */}
                  <a
                    href={`/portal/denuncias/${denuncia.folio}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      width: "100%",
                      background: "linear-gradient(to right, #2563eb, #1d4ed8)",
                      color: "white",
                      padding: "10px 16px",
                      borderRadius: "8px",
                      fontWeight: "600",
                      fontSize: "13px",
                      textDecoration: "none",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      transition: "all 0.2s",
                      margin: "12px -20px -15px -20px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "linear-gradient(to right, #1d4ed8, #1e40af)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 8px rgba(0,0,0,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "linear-gradient(to right, #2563eb, #1d4ed8)";
                      e.currentTarget.style.boxShadow =
                        "0 2px 4px rgba(0,0,0,0.1)";
                    }}
                  >
                    <svg
                      style={{ width: "16px", height: "16px" }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    Ver Detalle Completo
                  </a>
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
                    const esActualizado = recentlyUpdated.has(denuncia.folio);
                    return (
                      <button
                        key={denuncia.folio}
                        onClick={() => flyToDenuncia(denuncia)}
                        className={`w-full p-4 text-left hover:bg-blue-50 transition-all ${
                          selectedDenuncia === denuncia.folio
                            ? "bg-blue-100 border-l-4 border-blue-600"
                            : esActualizado
                            ? "bg-green-50/50 border-l-4 border-green-500"
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

                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span
                                className="px-2 py-0.5 rounded text-white text-xs font-medium"
                                style={{ backgroundColor: denuncia.color }}
                              >
                                {denuncia.prioridad}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  esActualizado
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {esActualizado
                                  ? "✓ Actualizado"
                                  : denuncia.estado}
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
