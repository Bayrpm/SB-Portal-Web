"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Users, ArrowLeft, Check } from "lucide-react";
import Swal from "sweetalert2";

interface Inspector {
  id: string;
  nombre: string;
  carga_actual: number;
}

function AsignarMasivoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const folios = searchParams.get("folios")?.split(",") || [];

  const [inspectores, setInspectores] = useState<Inspector[]>([]);
  const [inspectorSeleccionado, setInspectorSeleccionado] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarInspectores();
  }, []);

  const cargarInspectores = async () => {
    try {
      const response = await fetch("/api/inspectors/derivations");
      const data = await response.json();

      // Cargar carga actual de cada inspector
      const inspectoresConCarga = await Promise.all(
        (data.inspectores || []).map(
          async (inspector: { id: string; nombre: string }) => {
            const cargaResponse = await fetch(
              `/api/inspectors/${inspector.id}/carga`
            );
            const cargaData = await cargaResponse.json();
            return {
              id: inspector.id,
              nombre: inspector.nombre,
              carga_actual: cargaData.carga_actual || 0,
            };
          }
        )
      );

      // Ordenar por carga (menor a mayor)
      setInspectores(
        inspectoresConCarga.sort((a, b) => a.carga_actual - b.carga_actual)
      );
    } catch (error) {
      console.error("Error al cargar inspectores:", error);
    } finally {
      setLoading(false);
    }
  };

  const asignarMasivo = async () => {
    if (!inspectorSeleccionado) {
      Swal.fire("Error", "Debes seleccionar un inspector", "error");
      return;
    }

    setGuardando(true);

    try {
      const response = await fetch("/api/derivaciones/asignar-masivo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folios,
          inspector_id: inspectorSeleccionado,
        }),
      });

      if (!response.ok) throw new Error("Error al asignar");

      await Swal.fire({
        title: "¡Éxito!",
        text: `Se asignaron ${folios.length} denuncias correctamente`,
        icon: "success",
      });

      router.push("/portal/derivaciones");
    } catch (error) {
      console.error("Error al asignar masivo:", error);
      Swal.fire("Error", "No se pudieron asignar las denuncias", "error");
    } finally {
      setGuardando(false);
    }
  };

  const getCargaColor = (carga: number) => {
    if (carga < 5) return "bg-green-100 text-green-800 border-green-200";
    if (carga < 10) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-full">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Asignación Masiva
            </h1>
            <p className="text-sm text-gray-600">
              {folios.length} denuncia{folios.length !== 1 ? "s" : ""}{" "}
              seleccionada{folios.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Selecciona un inspector
          </h2>

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Cargando inspectores...
            </div>
          ) : (
            <div className="space-y-2">
              {inspectores.map((inspector) => (
                <div
                  key={inspector.id}
                  onClick={() => setInspectorSeleccionado(inspector.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    inspectorSeleccionado === inspector.id
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                      : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          inspectorSeleccionado === inspector.id
                            ? "border-blue-600 bg-blue-600"
                            : "border-gray-300"
                        }`}
                      >
                        {inspectorSeleccionado === inspector.id && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="font-medium text-gray-900">
                        {inspector.nombre}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        Carga actual:
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${getCargaColor(
                          inspector.carga_actual
                        )}`}
                      >
                        {inspector.carga_actual} caso
                        {inspector.carga_actual !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={asignarMasivo}
            disabled={!inspectorSeleccionado || guardando}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {guardando ? "Asignando..." : "Asignar denuncias"}
          </button>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AsignarMasivoPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center py-8 text-gray-500">
              Cargando asignación masiva...
            </div>
          </div>
        </div>
      }
    >
      <AsignarMasivoContent />
    </Suspense>
  );
}
