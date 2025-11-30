"use client";

import React, { useEffect, useState, useRef } from "react";
import ButtonComponent from "@/app/components/ButtonComponent";
import Swal from "sweetalert2";

interface AsignarInspectorDropdownProps {
  folio: string;
  onAsignar: (inspectorNombre: string, inspectorId: string) => void;
  onCancelar?: () => void;
  acompanantesActuales?: { id: string; nombre: string }[];
  forceOpen?: boolean;
  inspectorActualId?: string | null;
  inspectorActualNombre?: string | null;
}

export default function AsignarInspectorDropdown({
  folio,
  onAsignar,
  onCancelar,
  acompanantesActuales = [],
  forceOpen = false,
  inspectorActualId = null,
  inspectorActualNombre = null,
}: AsignarInspectorDropdownProps) {
  const [open, setOpen] = useState(forceOpen);
  const [opciones, setOpciones] = useState<{ id: string; nombre: string }[]>(
    []
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(forceOpen);
  }, [forceOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Cargar opciones desde la API de inspectores
  useEffect(() => {
    fetch("/api/inspectors/derivations")
      .then((res) => res.json())
      .then((data) => setOpciones(data.inspectores || []));
  }, []);

  async function asignarInspector(
    inspectorId: string,
    inspectorNombre: string
  ) {
    // Mostrar confirmación
    const result = await Swal.fire({
      title: "¿Asignar inspector?",
      html: `<p>¿Estás seguro de que deseas asignar a <strong>${inspectorNombre}</strong> como inspector principal de esta denuncia?</p>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, asignar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#003C96",
      cancelButtonColor: "#6B7280",
    });

    if (!result.isConfirmed) {
      setOpen(false);
      onCancelar?.();
      return;
    }

    // Guardar en la BD con acompañantes actuales
    const acompanantesIds = acompanantesActuales.map((a) => a.id);
    try {
      const response = await fetch(`/api/denuncias/${folio}/inspector`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inspector_id: inspectorId,
          acompanantes_ids: acompanantesIds,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`);
      }

      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: `${inspectorNombre} ha sido asignado como inspector principal`,
        confirmButtonColor: "#003C96",
        timer: 2000,
      });

      onAsignar(inspectorNombre, inspectorId);
      setOpen(false);
    } catch (error) {
      console.error("Error al asignar inspector:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo asignar el inspector",
        confirmButtonColor: "#003C96",
      });
      setOpen(false);
      onCancelar?.();
    }
  }

  return (
    <div className="relative inline-block" ref={ref}>
      {forceOpen && inspectorActualNombre ? (
        <div className="inline-block px-2 py-0.5 rounded text-xs font-medium border bg-gray-100 text-gray-700 border-gray-200">
          {inspectorActualNombre}
        </div>
      ) : (
        <ButtonComponent
          accion="fantasma"
          size="sm"
          className="!px-2 !py-1 text-xs border border-gray-300 bg-white hover:bg-blue-50 shadow-sm"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          Asignar inspector
        </ButtonComponent>
      )}
      {open && (
        <ul
          className="absolute left-0 mt-0.5 w-44 bg-white border border-gray-200 rounded-lg shadow-2xl py-1 animate-fade-in z-50"
          role="listbox"
        >
          {opciones.map((p) => (
            <li
              key={p.id}
              role="option"
              aria-selected={p.id === inspectorActualId}
              className={`px-4 py-2 text-xs text-gray-800 cursor-pointer hover:bg-blue-50 transition-colors ${
                p.id === inspectorActualId
                  ? "bg-blue-50 font-semibold border-l-4 border-l-blue-600"
                  : ""
              }`}
              onClick={() => asignarInspector(p.id, p.nombre)}
            >
              {p.nombre}
              {p.id === inspectorActualId && " ✓"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
