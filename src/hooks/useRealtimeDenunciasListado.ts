import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface DenunciaListado {
    folio: string;
    nombre: string;
    titulo: string;
    categoria: string;
    prioridad: string;
    fecha_creacion: string;
    ubicacion_texto: string;
}

export function useRealtimeDenunciasListado() {
    const [denuncias, setDenuncias] = useState<DenunciaListado[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchDenuncias = useCallback(async () => {
        try {
            const response = await fetch("/api/denuncias");
            if (!response.ok) throw new Error("Error fetching denuncias");
            const data = await response.json();
            setDenuncias(data.denuncias || []);
        } catch (error) {
            console.error("Error cargando denuncias:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDenuncias();

        // Listener para cambios en denuncias
        const denunciasChannel = supabase
            .channel("denuncias-listado-changes")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "denuncias",
                },
                () => {
                    // Recargar al detectar cambios
                    fetchDenuncias();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(denunciasChannel);
        };
    }, [fetchDenuncias, supabase]);

    return { denuncias, loading, refetch: fetchDenuncias };
}
