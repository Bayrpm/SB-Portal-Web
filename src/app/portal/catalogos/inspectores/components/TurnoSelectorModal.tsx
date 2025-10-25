"use client";

import { useState, useEffect } from "react";
import { Clock, Check } from "lucide-react";
import ButtonComponent from "@/app/components/ButtonComponent";

export interface Turno {
  id: number;
  nombre: string;
  hora_inicio: string;
  hora_termino: string;
}

interface TurnoSelectorModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (turno: Turno) => void;
  selectedTurnoId?: number;
}

export default function TurnoSelectorModal({
  open,
  onClose,
  onSelect,
  selectedTurnoId,
}: TurnoSelectorModalProps) {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | undefined>(
    selectedTurnoId
  );
  const [show, setShow] = useState(open);

  useEffect(() => {
    if (open) {
      setShow(true);
      setSelectedId(selectedTurnoId);
      loadTurnos();
    } else {
      const timeout = setTimeout(() => setShow(false), 250);
      return () => clearTimeout(timeout);
    }
  }, [open, selectedTurnoId]);

  // Función para formatear hora eliminando segundos (15:00:00 -> 15:00)
  const formatTime = (time: string): string => {
    if (!time) return "";
    // Si el formato es HH:MM:SS, tomar solo HH:MM
    return time.substring(0, 5);
  };

  const loadTurnos = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/shifts/inspector");
      if (!response.ok) throw new Error("Error al cargar turnos");
      const data = await response.json();
      setTurnos(data);
    } catch (error) {
      console.error("Error cargando turnos:", error);
      setTurnos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (turno: Turno) => {
    setSelectedId(turno.id);
  };

  const handleConfirm = () => {
    const selectedTurno = turnos.find((t) => t.id === selectedId);
    if (selectedTurno) {
      onSelect(selectedTurno);
      onClose();
    }
  };

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center transition-all duration-300
        ${open ? "opacity-100" : "opacity-0 pointer-events-none"}
      `}
    >
      {/* Backdrop */}
      <div
        className={`
          absolute inset-0
          transition-all duration-300
          ${
            open ? "bg-black/30 backdrop-blur-sm" : "bg-black/0 backdrop-blur-0"
          }
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300
        ${open ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-100">
          <Clock className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">
            Seleccionar Turno
          </h3>
          <button
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
            aria-label="Cerrar"
            type="button"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Cargando turnos...
            </div>
          ) : turnos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay turnos disponibles
            </div>
          ) : (
            turnos.map((turno) => (
              <button
                key={turno.id}
                type="button"
                onClick={() => handleSelect(turno)}
                className={`
                  w-full p-4 rounded-xl border-2 transition-all duration-200 text-left
                  ${
                    selectedId === turno.id
                      ? "border-[#003C96] bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p
                      className={`font-semibold text-base ${
                        selectedId === turno.id
                          ? "text-[#003C96]"
                          : "text-gray-900"
                      }`}
                    >
                      {turno.nombre}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatTime(turno.hora_inicio)} -{" "}
                      {formatTime(turno.hora_termino)}
                    </p>
                  </div>
                  {selectedId === turno.id && (
                    <Check className="w-5 h-5 text-[#003C96] ml-3 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <ButtonComponent
            accion="cancelar"
            type="button"
            onClick={onClose}
            className="px-6 py-2"
          >
            Cancelar
          </ButtonComponent>
          <ButtonComponent
            accion="agregar"
            type="button"
            onClick={handleConfirm}
            disabled={!selectedId}
            className="px-6 py-2 bg-[#003C96] hover:bg-[#0085CA] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Aceptar
          </ButtonComponent>
        </div>
      </div>
    </div>
  );
}
