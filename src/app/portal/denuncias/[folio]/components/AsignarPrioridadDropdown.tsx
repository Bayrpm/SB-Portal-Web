"use client";

import React, { useEffect, useState, useRef } from "react";
import ButtonComponent from "@/app/components/ButtonComponent";

interface AsignarPrioridadDropdownProps {
  folio: string;
  onAsignar: (prioridad: string) => void;
}

export default function AsignarPrioridadDropdown({
  folio,
  onAsignar,
}: AsignarPrioridadDropdownProps) {
  const [open, setOpen] = useState(false);
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

  async function asignarPrioridad(prioridad: string) {
    await fetch(`/api/denuncias/${folio}/prioridad`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prioridad }),
    });
    onAsignar(prioridad);
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
        Asignar prioridad
      </ButtonComponent>
      {open && (
        <ul
          className="absolute left-0 z-50 mt-0.5 w-36 bg-white border border-gray-200 rounded-lg shadow-2xl py-1 animate-fade-in"
          role="listbox"
        >
          {["Baja", "Media", "Alta"].map((p) => (
            <li
              key={p}
              role="option"
              aria-selected={false}
              className="px-4 py-2 text-xs text-gray-800 cursor-pointer hover:bg-blue-50 transition-colors"
              onClick={() => asignarPrioridad(p)}
            >
              {p}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
