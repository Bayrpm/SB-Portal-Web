import React from "react";
import clsx from "clsx";

export type Sort = { key: string; dir: "asc" | "desc" };

export type Column<T> = {
  key: string; // clave única (propiedad del dato)
  header: string; // texto del TH
  width?: string; // ej. "w-40", "min-w-[200px]"
  align?: "left" | "center" | "right";
  sortable?: boolean;
  className?: string; // clases extra del TD
  render?: (row: T, rowIndex: number) => React.ReactNode; // celda custom
};

type Props<T> = {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;

  // ordenamiento controlado (opcional)
  sort?: Sort;
  onSortChange?: (next: Sort) => void;

  // paginación controlada
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (p: number) => void;
  onPageSizeChange?: (n: number) => void;

  className?: string;
  rowKey?: (row: T, i: number) => string | number;
  onRowClick?: (row: T) => void;
};

const BRAND = "#0085CA";
const HEADER = "#0B4F9E"; // azul profundo del header

export default function TableComponent<T>({
  columns,
  data,
  loading = false,
  emptyMessage = "Sin resultados.",
  sort,
  onSortChange,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  className,
  rowKey = (_r, i) => i,
  onRowClick,
}: Props<T>) {
  const alignClass = (a?: Column<T>["align"]) =>
    a === "center" ? "text-center" : a === "right" ? "text-right" : "text-left";

  const totalPages =
    page && pageSize && typeof total === "number"
      ? Math.max(1, Math.ceil(total / pageSize))
      : 1;

  return (
    <div
      className={clsx(
        "bg-white rounded-2xl shadow border border-gray-200 overflow-hidden",
        className
      )}
    >
      {/* Header azul redondeado */}
      <div
        className="px-6 pt-3 pb-0"
        style={{
          backgroundColor: HEADER,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }}
      >
        <table className="min-w-full">
          <thead>
            <tr>
              {columns.map((c) => {
                const isActive = sort?.key === c.key;
                const dir = isActive ? sort!.dir : undefined;

                const headerContent =
                  c.sortable && onSortChange ? (
                    <button
                      type="button"
                      className={clsx(
                        "inline-flex items-center gap-2 py-4 text-white/95 hover:text-white",
                        c.align === "center"
                          ? "justify-center"
                          : c.align === "right"
                          ? "justify-end"
                          : "justify-start",
                        "w-full"
                      )}
                      onClick={() =>
                        onSortChange({
                          key: c.key,
                          dir: isActive
                            ? dir === "asc"
                              ? "desc"
                              : "asc"
                            : "asc",
                        })
                      }
                    >
                      <span className="uppercase tracking-wider text-xs font-semibold">
                        {c.header}
                      </span>
                      <svg
                        className={clsx(
                          "h-3.5 w-3.5 transition-transform",
                          isActive ? "opacity-100" : "opacity-50",
                          dir === "desc" && "rotate-180"
                        )}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.2l3.71-2.97a.75.75 0 011.04 1.08l-4.24 3.4a.75.75 0 01-.94 0l-4.24-3.4a.75.75 0 01-.02-1.1z" />
                      </svg>
                    </button>
                  ) : (
                    <div
                      className={clsx(
                        "flex items-center py-4 text-white/95",
                        c.align === "center"
                          ? "justify-center"
                          : c.align === "right"
                          ? "justify-end"
                          : "justify-start"
                      )}
                    >
                      <span className="uppercase tracking-wider text-xs font-semibold">
                        {c.header}
                      </span>
                    </div>
                  );

                return (
                  <th
                    key={c.key}
                    className={clsx(
                      "px-2 first:pl-0 last:pr-0 align-middle",
                      c.width,
                      alignClass(c.align)
                    )}
                  >
                    {headerContent}
                  </th>
                );
              })}
            </tr>
          </thead>
        </table>
      </div>

      {/* Body */}
      <div className="px-6">
        <table className="min-w-full">
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={`sk-${i}`}>
                  {columns.map((c) => (
                    <td key={`sk-${i}-${c.key}`} className="py-4 px-2">
                      <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-10 text-center text-sm text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={rowKey(row, i)}
                  className={clsx(
                    "transition-colors duration-150",
                    "hover:bg-[#E6F4FA]",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={clsx(
                        "py-5 px-2 text-sm text-gray-800 align-middle",
                        alignClass(c.align),
                        c.className
                      )}
                    >
                      <div
                        className={clsx(
                          "flex items-center min-h-[30px]",
                          c.align === "center"
                            ? "justify-center"
                            : c.align === "right"
                            ? "justify-end"
                            : "justify-start"
                        )}
                      >
                        {c.render
                          ? c.render(row, i)
                          : ((row as Record<string, unknown>)[
                              c.key
                            ] as React.ReactNode)}
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Paginación */}
      {page && pageSize && typeof total === "number" && (
        <div className="flex items-center justify-between px-6 py-3 border-t bg-white">
          <div className="text-sm text-gray-600">
            {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} de{" "}
            {total} denuncias
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(Math.max(1, page - 1))}
              disabled={page === 1}
              className="h-9 w-9 rounded-full border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              aria-label="Página anterior"
            >
              <span className="inline-block -translate-y-px">&lt;</span>
            </button>

            <button
              className="h-9 min-w-9 px-3 rounded-full text-white"
              style={{ backgroundColor: BRAND }}
              aria-current="page"
            >
              {page}
            </button>

            <button
              onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="h-9 w-9 rounded-full border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              aria-label="Página siguiente"
            >
              <span className="inline-block -translate-y-px">&gt;</span>
            </button>

            <div className="relative">
              <select
                className="appearance-none h-9 pl-3 pr-8 rounded-full border border-gray-300 text-sm"
                value={pageSize}
                onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              >
                <option value="10">10 / página</option>
                <option value="20">20 / página</option>
                <option value="50">50 / página</option>
              </select>
              <svg
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.2l3.71-2.97a.75.75 0 011.04 1.08l-4.24 3.4a.75.75 0 01-.94 0l-4.24-3.4a.75.75 0 01-.02-1.1z" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
