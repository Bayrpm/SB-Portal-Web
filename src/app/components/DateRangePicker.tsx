// DateRangePicker.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

type Size = "sm" | "md" | "lg";

export type DateRange = {
  start?: string; // "YYYY-MM-DD"
  end?: string; // "YYYY-MM-DD"
};

type Props = {
  label?: string;
  value?: DateRange;
  defaultValue?: DateRange;
  onChange?: (range: DateRange) => void;
  size?: Size;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholderStart?: string;
  placeholderEnd?: string;
  min?: string;
  max?: string;
  autoApply?: boolean;
};

const esMonths = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];
const esWeekdays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
const parseISO = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
};
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth() + n, 1);

function getMonthMatrix(base: Date) {
  const first = startOfMonth(base);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const grid: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    grid.push(d);
  }
  return grid;
}
function inRange(d: Date, start?: string, end?: string) {
  if (!start || !end) return false;
  const x = toISO(d);
  return x > start && x < end;
}
function isDisabled(d: Date, min?: string, max?: string) {
  if (min && toISO(d) < min) return true;
  if (max && toISO(d) > max) return true;
  return false;
}

export default function DateRangePicker({
  label,
  value,
  defaultValue,
  onChange,
  size = "md",
  required,
  disabled,
  className,
  placeholderStart = "Fecha inicio",
  placeholderEnd = "Fecha fin",
  min,
  max,
  autoApply = true,
}: Props) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<DateRange>(defaultValue ?? {});
  const current = isControlled ? (value as DateRange) : internal;

  const [open, setOpen] = useState(false);
  const [temp, setTemp] = useState<DateRange>(current);
  const [hoverDay, setHoverDay] = useState<string | undefined>(undefined);
  const rootRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [alignRight, setAlignRight] = useState(false); // ← auto-alineación

  const initialView = useMemo(() => {
    if (current.start) return startOfMonth(parseISO(current.start));
    return startOfMonth(new Date());
  }, [current.start]);
  const [viewStart, setViewStart] = useState<Date>(initialView);

  useEffect(() => {
    if (open) {
      setTemp(current);
      setHoverDay(undefined);
      setViewStart(initialView);
      // calcular alineación para evitar overflow a la derecha
      requestAnimationFrame(() => {
        const root = rootRef.current;
        const pop = popRef.current;
        if (!root || !pop) return;
        const rRect = root.getBoundingClientRect();
        const pWidth = Math.min(620, window.innerWidth * 0.95);
        const willOverflow = rRect.left + pWidth > window.innerWidth - 8; // 8px margen
        setAlignRight(willOverflow);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Cerrar al click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // auto-apply
  useEffect(() => {
    if (!autoApply) return;
    if (temp.start && temp.end) applyAndClose(temp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temp.start, temp.end, autoApply]);

  function apply(next: DateRange) {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  }
  function applyAndClose(next: DateRange) {
    apply(next);
    setOpen(false);
  }
  function clear() {
    const empty = { start: undefined, end: undefined };
    if (!isControlled) setInternal(empty);
    setTemp(empty);
    onChange?.(empty);
  }
  function pick(dayISO: string) {
    const { start, end } = temp;
    if (!start || (start && end)) {
      setTemp({ start: dayISO, end: undefined });
    } else if (start && !end) {
      if (dayISO < start) setTemp({ start: dayISO, end: start });
      else setTemp({ start, end: dayISO });
    }
  }

  const sizeClasses =
    size === "sm"
      ? "text-sm h-10 py-2 px-4" // ← igual que Select/Search sm
      : size === "lg"
      ? "text-base h-12 py-3 px-4"
      : "text-sm h-[44px] py-2.5 px-4"; // md

  const pillClasses = clsx(
    "w-full rounded-lg border outline-none bg-white text-gray-900", // ← rounded-lg
    "[color-scheme:light]",
    "transition-all duration-200 ease-in-out shadow-sm focus-within:shadow-md",
    "border-gray-300",
    "focus-within:ring-2 focus-within:ring-[#0085CA] focus-within:border-[#0085CA]",
    "disabled:opacity-60 disabled:cursor-not-allowed"
  );

  const previewStart = temp.start;
  const previewEnd =
    temp.end ??
    (previewStart && hoverDay && hoverDay > previewStart
      ? hoverDay
      : undefined);

  const DayCell: React.FC<{ date: Date; monthBase: Date }> = ({
    date,
    monthBase,
  }) => {
    const iso = toISO(date);
    const isOtherMonth = date.getMonth() !== monthBase.getMonth();
    const isStart = previewStart === iso;
    const isEnd = previewEnd === iso && !!previewEnd;
    const isBetween =
      !isStart && !isEnd && inRange(date, previewStart, previewEnd);
    const disabledDay = isDisabled(date, min, max);

    return (
      <button
        type="button"
        onClick={() => !disabledDay && pick(iso)}
        onMouseEnter={() => setHoverDay(iso)}
        disabled={disabledDay}
        className={clsx(
          "relative mx-auto my-0.5 flex h-8 w-8 items-center justify-center rounded-full",
          "transition-colors",
          isOtherMonth && "text-gray-300",
          disabledDay && "text-gray-300 cursor-not-allowed",
          isBetween && "bg-[#E6F4FA]",
          isStart || isEnd
            ? "bg-[#0085CA] text-white"
            : !disabledDay && "hover:bg-gray-100"
        )}
        aria-label={iso}
      >
        <span className="text-sm">{date.getDate()}</span>
        {(isStart || isBetween) && (
          <span className="absolute left-0 right-1/2 top-1/2 -translate-y-1/2 h-5 bg-[#E6F4FA] -z-10 rounded-l-full" />
        )}
        {(isEnd || isBetween) && (
          <span className="absolute left-1/2 right-0 top-1/2 -translate-y-1/2 h-5 bg-[#E6F4FA] -z-10 rounded-r-full" />
        )}
        {(isStart || isEnd) && (
          <span className="absolute inset-0 ring-2 ring-white rounded-full pointer-events-none" />
        )}
      </button>
    );
  };

  return (
    // IMPORTANTE: el wrapper ahora es relative para anclar el popover
    <div
      ref={rootRef}
      className={clsx("relative flex flex-col gap-1", className)}
    >
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={clsx(
          "relative flex items-center justify-between gap-2",
          pillClasses,
          sizeClasses // ← aquí
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 w-full">
          <svg
            className="h-4 w-4 text-[#0085CA]"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1z" />
            <path d="M18 8H2v8a2 2 0 002 2h12a2 2 0 002-2V8z" />
          </svg>
          <span className="truncate text-gray-900">
            {current.start ?? placeholderStart}
          </span>
          <span className="text-gray-400">—</span>
          <span className="truncate text-gray-900">
            {current.end ?? placeholderEnd}
          </span>
        </div>
        <svg
          className={clsx(
            "h-4 w-4 text-[#0085CA] transition-transform",
            open && "rotate-180"
          )}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.2l3.71-2.97a.75.75 0 011.04 1.08l-4.24 3.4a.75.75 0 01-.94 0l-4.24-3.4a.75.75 0 01-.02-1.1z" />
        </svg>
      </button>

      {open && (
        <div
          ref={popRef}
          role="dialog"
          aria-label="Selector de rango de fechas"
          // top-full = justo debajo; left-0 por defecto, o right-0 si no hay espacio a la derecha
          className={clsx(
            "absolute top-full mt-2 z-50 w-[min(620px,95vw)] rounded-2xl border border-gray-200 bg-white shadow-xl",
            alignRight ? "right-0" : "left-0"
          )}
        >
          {/* Header navegación */}
          <div className="flex items-center justify-between px-3 pt-3">
            <div className="flex gap-1">
              <button
                type="button"
                aria-label="Retroceder 2 meses"
                className="h-8 w-8 rounded-full hover:bg-gray-100"
                onClick={() => setViewStart(addMonths(viewStart, -2))}
              >
                «
              </button>
              <button
                type="button"
                aria-label="Retroceder 1 mes"
                className="h-8 w-8 rounded-full hover:bg-gray-100"
                onClick={() => setViewStart(addMonths(viewStart, -1))}
              >
                ‹
              </button>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                aria-label="Avanzar 1 mes"
                className="h-8 w-8 rounded-full hover:bg-gray-100"
                onClick={() => setViewStart(addMonths(viewStart, 1))}
              >
                ›
              </button>
              <button
                type="button"
                aria-label="Avanzar 2 meses"
                className="h-8 w-8 rounded-full hover:bg-gray-100"
                onClick={() => setViewStart(addMonths(viewStart, 2))}
              >
                »
              </button>
            </div>
          </div>

          {/* Cuerpo: dos meses */}
          <div className="grid grid-cols-2 gap-3 p-3 pt-1">
            {/* Mes izquierdo */}
            <div>
              <div className="text-center font-medium text-gray-800 mb-2">
                {esMonths[viewStart.getMonth()]} {viewStart.getFullYear()}
              </div>
              <div className="grid grid-cols-7 text-xs text-gray-500 mb-1">
                {esWeekdays.map((d) => (
                  <div
                    key={`wL-${d}`}
                    className="h-6 flex items-center justify-center"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {getMonthMatrix(viewStart).map((d, i) => (
                  <DayCell key={`L-${i}`} date={d} monthBase={viewStart} />
                ))}
              </div>
            </div>

            {/* Mes derecho */}
            <div>
              <div className="text-center font-medium text-gray-800 mb-2">
                {esMonths[addMonths(viewStart, 1).getMonth()]}{" "}
                {addMonths(viewStart, 1).getFullYear()}
              </div>
              <div className="grid grid-cols-7 text-xs text-gray-500 mb-1">
                {esWeekdays.map((d) => (
                  <div
                    key={`wR-${d}`}
                    className="h-6 flex items-center justify-center"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {getMonthMatrix(addMonths(viewStart, 1)).map((d, i) => (
                  <DayCell
                    key={`R-${i}`}
                    date={d}
                    monthBase={addMonths(viewStart, 1)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 border-t border-gray-100 p-3">
            <div className="text-xs text-gray-500">
              {temp.start && temp.end
                ? `Seleccionado: ${temp.start} — ${temp.end}`
                : "Selecciona un rango"}
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
                disabled={!temp.start || !temp.end}
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
