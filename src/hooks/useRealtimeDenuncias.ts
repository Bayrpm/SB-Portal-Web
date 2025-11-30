import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

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

interface DenunciaDB {
    id: string;
    folio: string;
    estado_id: number;
    prioridad_id: number | null;
    [key: string]: unknown;
}

interface AsignacionDB {
    id: number;
    denuncia_id: string;
    inspector_id: number;
    [key: string]: unknown;
}

interface UseRealtimeDenunciasOptions {
    onDenunciasUpdate?: (denuncias: Denuncia[]) => void;
    onAssignmentChange?: (denunciaFolio: string, newStatus: string) => void;
    onError?: (error: Error) => void;
}

export function useRealtimeDenuncias(options: UseRealtimeDenunciasOptions = {}) {
    const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
    const [loading, setLoading] = useState(true);
    const channelsRef = useRef<RealtimeChannel[]>([]);
    const supabaseRef = useRef(createClient());

    // Cargar denuncias iniciales
    const fetchDenuncias = useCallback(async () => {
        try {
            const response = await fetch("/api/denuncias/coordenadas");
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            const coords = data.coordenadas || [];
            setDenuncias(coords);
            options.onDenunciasUpdate?.(coords);
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error("Error cargando denuncias:", err);
            options.onError?.(err);
        } finally {
            setLoading(false);
        }
    }, [options]);

    // Actualizar una denuncia específica en el estado
    const updateDenuncia = useCallback((folio: string, updates: Partial<Denuncia>) => {
        setDenuncias((prevDenuncias) => {
            const updated = prevDenuncias.map((d) =>
                d.folio === folio ? { ...d, ...updates } : d
            );
            options.onDenunciasUpdate?.(updated);
            return updated;
        });
    }, [options]);

    // Configurar suscripciones a Realtime
    useEffect(() => {
        fetchDenuncias();

        const supabase = supabaseRef.current;

        // Canal para cambios en tabla denuncias
        const denunciasChannel = supabase
            .channel("denuncias-changes")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "denuncias",
                },
                (payload) => {
                    

                    if (payload.eventType === "UPDATE") {
                        const newData = payload.new as DenunciaDB;
                        if (newData.folio) {
                            // Recargar denuncias para obtener coordenadas actualizadas
                            fetchDenuncias();

                            // Notificar cambio de estado
                            const oldData = payload.old as DenunciaDB;
                            if (oldData?.estado_id !== newData.estado_id) {
                                const estadoMap: Record<number, string> = {
                                    1: "Pendiente",
                                    2: "En Atención",
                                    3: "Cerrada",
                                };
                                const nuevoEstado = estadoMap[newData.estado_id] || "Desconocido";
                                options.onAssignmentChange?.(newData.folio, nuevoEstado);
                            }
                        }
                    } else if (payload.eventType === "INSERT") {
                        // Nueva denuncia agregada
                        fetchDenuncias();
                    }
                }
            )
            .subscribe();

        // Canal para cambios en asignaciones
        const asignacionesChannel = supabase
            .channel("asignaciones-changes")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "asignaciones_inspector",
                },
                (payload) => {
                    
                    const newAssignment = payload.new as AsignacionDB;

                    if (newAssignment.denuncia_id) {
                        // Recargar denuncias para reflejar cambio de estado
                        fetchDenuncias();

                        // Buscar el folio de la denuncia
                        setDenuncias((prevDenuncias) => {
                            const denuncia = prevDenuncias.find(
                                (d) => d.folio.includes(newAssignment.denuncia_id)
                            );
                            if (denuncia) {
                                options.onAssignmentChange?.(denuncia.folio, "En Atención");
                            }
                            return prevDenuncias;
                        });
                    }
                }
            )
            .subscribe();

        channelsRef.current = [denunciasChannel, asignacionesChannel];

        // Cleanup
        return () => {
            channelsRef.current.forEach((channel) => {
                supabase.removeChannel(channel);
            });
            channelsRef.current = [];
        };
    }, [fetchDenuncias, options]);

    return { denuncias, loading, updateDenuncia, refetch: fetchDenuncias };
}
