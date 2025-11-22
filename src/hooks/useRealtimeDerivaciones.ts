import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface DenunciaDerivacion {
    folio: string;
    titulo: string;
    categoria: string;
    prioridad: string;
    fecha_creacion: string;
    ubicacion_texto: string;
    inspector_asignado: string | null;
    tiene_acompanantes: boolean;
    horas_sin_asignar: number;
}

interface DerivacionStats {
    sin_asignar: number;
    pendiente_acompanantes: number;
    vencidas_sla: number;
}

export function useRealtimeDerivaciones(vista: "sin_asignar" | "pendiente_acompanantes" | "todas") {
    const [denuncias, setDenuncias] = useState<DenunciaDerivacion[]>([]);
    const [stats, setStats] = useState<DerivacionStats>({
        sin_asignar: 0,
        pendiente_acompanantes: 0,
        vencidas_sla: 0,
    });
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchDerivaciones = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/derivaciones?vista=${vista}`);
            if (!response.ok) throw new Error("Error fetching derivaciones");
            const data = await response.json();
            setDenuncias(data.denuncias || []);
            setStats(
                data.stats || {
                    sin_asignar: 0,
                    pendiente_acompanantes: 0,
                    vencidas_sla: 0,
                }
            );
        } catch (error) {
            console.error("Error cargando derivaciones:", error);
        } finally {
            setLoading(false);
        }
    }, [vista]);

    useEffect(() => {
        fetchDerivaciones();

        // Listeners para cambios en denuncias y asignaciones
        const denunciasChannel = supabase
            .channel("derivaciones-denuncias-changes")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "denuncias",
                },
                () => {
                    fetchDerivaciones();
                }
            )
            .subscribe();

        const asignacionesChannel = supabase
            .channel("derivaciones-asignaciones-changes")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "asignaciones_inspector",
                },
                () => {
                    fetchDerivaciones();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(denunciasChannel);
            supabase.removeChannel(asignacionesChannel);
        };
    }, [fetchDerivaciones, supabase]);

    return { denuncias, stats, loading, refetch: fetchDerivaciones };
}
