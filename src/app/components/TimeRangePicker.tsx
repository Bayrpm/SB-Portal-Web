import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

type Size = "sm" | "md" | "lg";

export type TimeRange = {
  start?: string; // "HH:MM"
  end?: string; // "HH:MM"
};

type TimeRangePickerProps = {
  label?: string;
  value?: TimeRange; // controlado
  defaultValue?: TimeRange; // no controlado
  onChange?: (range: TimeRange) => void; // se dispara en "Aplicar" o al elegir ambos extremos (auto-apply)
  stepMinutes?: number; // default 15
  size?: Size; // sm|md|lg (default md)
  placeholderStart?: string; // "Hora inicio"
  placeholderEnd?: string; // "Hora fin"
  required?: boolean;
  disabled?: boolean;
  className?: string; // para el wrapper exterior
  /** si true, permite fin < inicio (rango overnight). default: false */
  allowOvernight?: boolean;
  /** si true, aplica automáticamente al seleccionar start y end */
  autoApply?: boolean;
};

function pad(n: number) {
  return n.toString().padStart(2, "0");
}
function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function isValidHHMM(s?: string) {
  if (!s) return false;
  const m = s.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  return !!m;
}

export default function TimeRangePicker({
  label,
  value,
  defaultValue,
  onChange,
  stepMinutes = 15,
  size = "md",
  placeholderStart = "Hora inicio",
  placeholderEnd = "Hora fin",
  required,
  disabled,
  className,
  allowOvernight = false,
  autoApply = true,
}: TimeRangePickerProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<TimeRange>(defaultValue ?? {});
  const current = isControlled ? value! : internal;

  const [open, setOpen] = useState(false);
  const [temp, setTemp] = useState<TimeRange>(current);
  const rootRef = useRef<HTMLDivElement>(null);

  // generar slots de tiempo
  const options = useMemo(() => {
    const out: string[] = [];
    for (let m = 0; m < 24 * 60; m += stepMinutes) {
      const h = Math.floor(m / 60);
      const mm = m % 60;
      out.push(`${pad(h)}:${pad(mm)}`);
    }
    return out;
  }, [stepMinutes]);

  // cerrar al click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // al abrir, copiar al temp
  useEffect(() => {
    if (open) setTemp(current);
  }, [open]); // eslint-disable-line

  // validación básica
  const invalidRange =
    temp.start &&
    temp.end &&
    !allowOvernight &&
    isValidHHMM(temp.start) &&
    isValidHHMM(temp.end) &&
    toMinutes(temp.end) < toMinutes(temp.start);

  const fieldHeight = size === "sm" ? "h-9" : size === "lg" ? "h-12" : "h-10";

  const pillClasses = clsx(
    "w-full rounded-xl border outline-none bg-white text-gray-900",
    "[color-scheme:light]",
    "transition-all duration-200 ease-in-out shadow-sm focus-within:shadow-md",
    "border-gray-300",
    "focus-within:ring-2 focus-within:ring-[#0085CA] focus-within:border-[#0085CA]",
    "disabled:opacity-60 disabled:cursor-not-allowed"
  );

  function applyAndClose(next: TimeRange) {
    if (!isControlled) setInternal(next);
    onChange?.(next);
    setOpen(false);
  }

  function clear() {
    const empty = { start: undefined, end: undefined };
    if (!isControlled) setInternal(empty);
    onChange?.(empty);
    setTemp(empty);
  }

  // auto-apply si corresponde
  useEffect(() => {
    if (!autoApply) return;
    if (temp.start && temp.end && !invalidRange) {
      applyAndClose(temp);
    }
  }, [temp.start, temp.end, autoApply, invalidRange]); // eslint-disable-line

  return (
    <div ref={rootRef} className={clsx("flex flex-col gap-1", className)}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
      )}

      {/* Input visible */}
      <button
        type="button"
        className={clsx(
          "relative flex items-center gap-2 justify-between",
          pillClasses,
          fieldHeight,
          disabled && "pointer-events-none"
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((o) => !o)}
      >
        <div className="flex items-center gap-2 w-full">
          {/* clock icon */}
          <svg
            className="h-4 w-4 text-gray-500"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-12a.75.75 0 00-1.5 0v4.25c0 .199.079.39.22.53l2.5 2.5a.75.75 0 101.06-1.06l-2.28-2.28V6z"
              clipRule="evenodd"
            />
          </svg>

          <span className="truncate text-gray-900">
            {current.start ?? placeholderStart}
          </span>

          <span className="text-gray-400">—</span>

          <span className="truncate text-gray-900">
            {current.end ?? placeholderEnd}
          </span>
        </div>

        {/* chevron */}
        <svg
          className={clsx(
            "h-4 w-4 text-[#0085CA] transition-transform",
            open && "rotate-180"
          )}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.2l3.71-2.97a.75.75 0 011.04 1.08l-4.24 3.4a.75.75 0 01-.94 0l-4.24-3.4a.75.75 0 01-.02-1.1z" />
        </svg>
      </button>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Selector de rango horario"
          className="absolute z-50 mt-2 w-[min(520px,95vw)] rounded-2xl border border-gray-200 bg-white shadow-xl"
        >
          <div className="grid grid-cols-2 divide-x divide-gray-100">
            {/* Lista inicio */}
            <div className="p-3">
              <p className="text-xs font-medium text-gray-500 mb-2">
                Hora inicio
              </p>
              <ul className="max-h-60 overflow-auto pr-1">
                {options.map((t) => {
                  const active = temp.start === t;
                  return (
                    <li key={`s-${t}`}>
                      <button
                        type="button"
                        onClick={() => setTemp((r) => ({ ...r, start: t }))}
                        className={clsx(
                          "w-full text-left rounded-md px-3 py-2",
                          active
                            ? "bg-[#E6F4FA] text-[#0085CA] font-medium"
                            : "hover:bg-gray-50"
                        )}
                      >
                        {t}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Lista fin */}
            <div className="p-3">
              <p className="text-xs font-medium text-gray-500 mb-2">Hora fin</p>
              <ul className="max-h-60 overflow-auto pr-1">
                {options.map((t) => {
                  const active = temp.end === t;
                  // si no permitimos overnight, podemos suavemente deshabilitar opciones < start
                  const disabledEnd =
                    !allowOvernight &&
                    temp.start &&
                    isValidHHMM(temp.start) &&
                    toMinutes(t) < toMinutes(temp.start);
                  return (
                    <li key={`e-${t}`}>
                      <button
                        type="button"
                        disabled={!!disabledEnd}
                        onClick={() => setTemp((r) => ({ ...r, end: t }))}
                        className={clsx(
                          "w-full text-left rounded-md px-3 py-2",
                          active
                            ? "bg-[#E6F4FA] text-[#0085CA] font-medium"
                            : disabledEnd
                            ? "text-gray-300 cursor-not-allowed"
                            : "hover:bg-gray-50"
                        )}
                      >
                        {t}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* footer */}
          <div className="flex items-center justify-between gap-2 border-t border-gray-100 p-3">
            <div className="text-xs">
              {invalidRange ? (
                <span className="text-red-600">
                  La hora fin debe ser mayor o igual a la hora inicio.
                </span>
              ) : (
                <span className="text-gray-500">
                  Paso: {stepMinutes} min
                  {allowOvernight && " · se permite pasar de medianoche"}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={clear}
                className="text-sm px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                Limpiar
              </button>
              <button
                type="button"
                disabled={!temp.start || !temp.end || invalidRange || disabled}
                onClick={() => applyAndClose(temp)}
                className={clsx(
                  "text-sm px-3 py-2 rounded-lg",
                  "bg-[#0085CA] text-white hover:opacity-95",
                  "disabled:opacity-40 disabled:cursor-not-allowed"
                )}
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
