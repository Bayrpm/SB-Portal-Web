"use client";

import { useEffect, useState } from "react";
import ButtonComponent from "@/app/components/ButtonComponent";

interface AuditoriaDetalleModalProps {
  isOpen: boolean;
  onClose: () => void;
  registro: {
    id: number;
    ts: string;
    actor_email: string;
    actor_nombre?: string | null;
    actor_rol?: string | null;
    actor_es_portal: boolean;
    actor_es_admin: boolean;
    tabla: string;
    operacion: string;
    fila_id_text: string;
    old_row: Record<string, unknown> | null;
    new_row: Record<string, unknown> | null;
  } | null;
}

export default function AuditoriaDetalleModal({
  isOpen,
  onClose,
  registro,
}: AuditoriaDetalleModalProps) {
  const [show, setShow] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
    } else {
      const timeout = setTimeout(() => setShow(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  if (!show || !registro) return null;

  const getOperacionColor = (op: string) => {
    switch (op) {
      case "INSERT":
        return "bg-green-100 text-green-800";
      case "UPDATE":
        return "bg-blue-100 text-blue-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderDiff = () => {
    if (registro.operacion === "INSERT" && registro.new_row) {
      return (
        <div className="space-y-3">
          <h3 className="font-semibold text-green-700 text-sm">
            Datos creados:
          </h3>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200 space-y-2">
            {Object.entries(registro.new_row).map(([key, value]) => (
              <div key={key} className="flex items-start gap-2 py-1">
                <span className="font-medium text-gray-700 min-w-fit">
                  {key}:
                </span>
                <span className="text-green-800 font-mono text-sm break-all flex-1">
                  {value === null ? (
                    <em className="text-gray-500">null</em>
                  ) : (
                    JSON.stringify(value)
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (registro.operacion === "DELETE" && registro.old_row) {
      return (
        <div className="space-y-3">
          <h3 className="font-semibold text-red-700 text-sm">
            Datos eliminados:
          </h3>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200 space-y-2">
            {Object.entries(registro.old_row).map(([key, value]) => (
              <div key={key} className="flex items-start gap-2 py-1">
                <span className="font-medium text-gray-700 min-w-fit">
                  {key}:
                </span>
                <span className="text-red-800 font-mono text-sm break-all flex-1 line-through">
                  {value === null ? (
                    <em className="text-gray-500">null</em>
                  ) : (
                    JSON.stringify(value)
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (
      registro.operacion === "UPDATE" &&
      registro.old_row &&
      registro.new_row
    ) {
      const allKeys = new Set([
        ...Object.keys(registro.old_row),
        ...Object.keys(registro.new_row),
      ]);

      const changes: Array<{
        key: string;
        oldValue: unknown;
        newValue: unknown;
        changed: boolean;
      }> = [];

      allKeys.forEach((key) => {
        const oldValue = registro.old_row?.[key];
        const newValue = registro.new_row?.[key];
        const changed = JSON.stringify(oldValue) !== JSON.stringify(newValue);
        changes.push({ key, oldValue, newValue, changed });
      });

      const changedFields = changes.filter((c) => c.changed);
      const unchangedFields = changes.filter((c) => !c.changed);

      return (
        <div className="space-y-4">
          {changedFields.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-blue-700 text-sm">
                Campos modificados ({changedFields.length}):
              </h3>
              <div className="space-y-2">
                {changedFields.map(({ key, oldValue, newValue }) => (
                  <div
                    key={key}
                    className="bg-blue-50 rounded-lg p-3 border border-blue-200"
                  >
                    <div className="font-medium text-gray-900 text-sm mb-2">
                      {key}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-red-50 rounded p-2 border border-red-200">
                        <div className="text-xs text-red-600 font-semibold mb-1">
                          Antes:
                        </div>
                        <div className="text-sm text-red-800 font-mono break-all">
                          {oldValue === null ? (
                            <em className="text-gray-500">null</em>
                          ) : (
                            JSON.stringify(oldValue)
                          )}
                        </div>
                      </div>
                      <div className="bg-green-50 rounded p-2 border border-green-200">
                        <div className="text-xs text-green-600 font-semibold mb-1">
                          Después:
                        </div>
                        <div className="text-sm text-green-800 font-mono break-all">
                          {newValue === null ? (
                            <em className="text-gray-500">null</em>
                          ) : (
                            JSON.stringify(newValue)
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {unchangedFields.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer font-semibold text-gray-600 hover:text-gray-800 text-sm py-2">
                ▸ Campos sin cambios ({unchangedFields.length})
              </summary>
              <div className="mt-2 bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2">
                {unchangedFields.map(({ key, oldValue }) => (
                  <div key={key} className="flex items-start gap-2 py-1">
                    <span className="font-medium text-gray-700 min-w-fit text-sm">
                      {key}:
                    </span>
                    <span className="text-gray-600 font-mono text-sm break-all flex-1">
                      {oldValue === null ? (
                        <em className="text-gray-500">null</em>
                      ) : (
                        JSON.stringify(oldValue)
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      );
    }

    return (
      <div className="text-center text-gray-500 py-6">
        No hay datos disponibles para mostrar
      </div>
    );
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`absolute inset-0 transition-all duration-200 ${
          isOpen ? "bg-black/30 backdrop-blur-sm" : "bg-black/0 backdrop-blur-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl transform transition-all duration-200 ${
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
        } flex flex-col max-h-[85vh]`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Detalle de Auditoría
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              ID #{registro.id} •{" "}
              {new Date(registro.ts).toLocaleString("es-CL")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
            type="button"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-4 overflow-y-auto flex-1 space-y-6">
          {/* Información general */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-xs font-semibold text-gray-600 uppercase">
                  Tabla
                </span>
                <div className="font-mono text-sm text-gray-900 mt-1">
                  {registro.tabla}
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-600 uppercase">
                  Operación
                </span>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getOperacionColor(
                      registro.operacion
                    )}`}
                  >
                    {registro.operacion}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-600 uppercase">
                  Usuario
                </span>
                <div className="mt-1">
                  {registro.actor_nombre ? (
                    <>
                      <div className="font-medium text-gray-900">
                        {registro.actor_nombre}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {registro.actor_email}
                      </div>
                    </>
                  ) : registro.actor_email ? (
                    <div className="font-medium text-gray-900">
                      {registro.actor_email}
                    </div>
                  ) : (
                    <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                      No se encontró usuario registrado
                    </div>
                  )}
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-600 uppercase">
                  Rol
                </span>
                <div className="mt-1">
                  {registro.actor_rol ? (
                    <div className="font-medium text-gray-900">
                      {registro.actor_rol}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      Sin rol especificado
                    </div>
                  )}
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-600 uppercase">
                  ID de Fila
                </span>
                <div className="font-mono text-sm text-gray-900 mt-1">
                  {registro.fila_id_text || "N/A"}
                </div>
              </div>
              <div className="md:col-span-2">
                <span className="text-xs font-semibold text-gray-600 uppercase block mb-1">
                  Rol del Usuario
                </span>
                <div className="flex gap-2">
                  {registro.actor_es_admin && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                      Administrador
                    </span>
                  )}
                  {registro.actor_es_portal && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      Portal
                    </span>
                  )}
                  {!registro.actor_es_admin && !registro.actor_es_portal && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                      Sin rol especificado
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Diferencias */}
          <div>{renderDiff()}</div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-8 py-6 border-t border-gray-200">
          <ButtonComponent accion="ver" onClick={onClose}>
            Cerrar
          </ButtonComponent>
        </div>
      </div>
    </div>
  );
}
