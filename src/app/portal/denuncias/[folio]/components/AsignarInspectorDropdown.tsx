"use client";

import React, { useEffect, useState, useRef } from "react";
import ButtonComponent from "@/app/components/ButtonComponent";

interface AsignarInspectorDropdownProps {
  folio: string;
  onAsignar: (inspectorNombre: string, inspectorId: string) => void;
  acompanantesActuales?: { id: string; nombre: string }[];
}

export default function AsignarInspectorDropdown({
  folio,
  onAsignar,
  acompanantesActuales = [],
}: AsignarInspectorDropdownProps) {
  const [open, setOpen] = useState(false);
  const [opciones, setOpciones] = useState<{ id: string; nombre: string }[]>(
    []
  );
  const ref = useRef<HTMLDivElement>(null);

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
    // Guardar en la BD con acompañantes actuales
    const acompanantesIds = acompanantesActuales.map((a) => a.id);
    await fetch(`/api/denuncias/${folio}/inspector`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inspector_id: inspectorId,
        acompanantes_ids: acompanantesIds,
      }),
    });
    onAsignar(inspectorNombre, inspectorId);
    setOpen(false);
  }

  return (
    <div className="relative inline-block" ref={ref}>
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
      {open && (
        <ul
          className="absolute left-0 mt-0.5 w-44 bg-white border border-gray-200 rounded-lg shadow-2xl py-1 animate-fade-in z-50"
          role="listbox"
        >
          {opciones.map((p) => (
            <li
              key={p.id}
              role="option"
              aria-selected={false}
              className="px-4 py-2 text-xs text-gray-800 cursor-pointer hover:bg-blue-50 transition-colors"
              onClick={() => asignarInspector(p.id, p.nombre)}
            >
              {p.nombre}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
