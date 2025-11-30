import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface HistorialItem {
    id: string;
    evento: string;
    descripcion: string;
    detallesLeibles: Record<string, unknown>;
    detalle: Record<string, unknown> | null;
    fecha: string;
    autor: string;
    icono: string;
    tipo: string;
}

interface Observacion {
    id: string;
    tipo: string;
    contenido: string;
    fecha: string;
    creado_por: string;
    cargo: string;
}

interface UseRealtimeDenunciaDetalleOptions {
    onDenunciaUpdate?: () => void;
}

export function useRealtimeDenunciaDetalle(
    folio: string,
    options: UseRealtimeDenunciaDetalleOptions = {}
) {
    const [historial, setHistorial] = useState<HistorialItem[]>([]);
    const [observaciones, setObservaciones] = useState<Observacion[]>([]);
    const [loadingHistorial, setLoadingHistorial] = useState(true);
    const supabase = createClient();

    const fetchHistorial = useCallback(async () => {
        try {
            setLoadingHistorial(true);
            const response = await fetch(`/api/denuncias/${folio}/historial`);
            if (!response.ok) throw new Error("Error fetching historial");
            const data = await response.json();
            setHistorial(data.historial || []);
        } catch (error) {
            console.error("Error cargando historial:", error);
        } finally {
            setLoadingHistorial(false);
        }
    }, [folio]);

    const fetchObservaciones = useCallback(async () => {
        try {
            const response = await fetch(`/api/denuncias/${folio}/observaciones`);
            if (!response.ok) throw new Error("Error fetching observaciones");
            const data = await response.json();
            setObservaciones(data.observaciones || []);
        } catch (error) {
            console.error("Error cargando observaciones:", error);
        }
    }, [folio]);

    useEffect(() => {
        fetchHistorial();
        fetchObservaciones();

        // Listener SOLO para cambios en el estado de la denuncia
        const denunciasChannel = supabase
            .channel(`detalle-denuncia-estado-${folio}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "denuncias",
                    filter: `folio=eq.${folio}`,
                },
                async (payload) => {
                    // Solo ejecutar callback si cambió el estado_id
                    const estadoAnterior = payload.old?.estado_id;
                    const estadoNuevo = payload.new?.estado_id;

                    if (estadoAnterior !== estadoNuevo) {
                        console.log("Cambio de estado detectado:", { estadoAnterior, estadoNuevo });
                        options.onDenunciaUpdate?.();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(denunciasChannel);
        };
    }, [folio, fetchHistorial, fetchObservaciones, supabase, options]);

    return {
        historial,
        observaciones,
        loadingHistorial,
        refetchHistorial: fetchHistorial,
        refetchObservaciones: fetchObservaciones,
    };
}
