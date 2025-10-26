"use client";

import { useRef, useState } from "react";
import ButtonComponent from "./ButtonComponent";
type RowData = Record<string, string | number | boolean | null | undefined>;

interface ExportButtonProps {
  data: RowData[];
  fileName?: string;
  columns?: string[];
  disabled?: boolean;
}

function getTodayString() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export default function ExportButton({
  data,
  fileName = "export",
  columns,
  disabled,
}: ExportButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  // Exportar a Excel (XLSX) usando API Route para estilos avanzados
  const exportToExcel = async () => {
    if (!data || data.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }
    const exportCols = columns || Object.keys(data[0]);
    const payload = {
      data,
      columns: exportCols,
      title: "Reporte de Datos Exportados",
      extraInfo: [],
    };
    const res = await fetch("/api/export-excel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      alert("Error generando el archivo Excel");
      return;
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}_${getTodayString()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);
  };

  // Exportar a CSV
  const exportToCSV = () => {
    if (!data || data.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }
    const exportCols = columns || Object.keys(data[0]);
    const title = "Reporte de Datos Exportados";
    const headers = exportCols
      .map(
        (col) => col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, " ")
      )
      .join(",");
    const rows = data
      .map((d) =>
        exportCols
          .map((col) => {
            const value = d[col];
            if (value === undefined || value === null) return "";
            if (typeof value === "boolean") return value ? "Sí" : "No";
            if (
              col.toLowerCase().includes("fecha") &&
              typeof value === "string"
            ) {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                const dd = String(date.getDate()).padStart(2, "0");
                const mm = String(date.getMonth() + 1).padStart(2, "0");
                const yyyy = date.getFullYear();
                return `${dd}-${mm}-${yyyy}`;
              }
            }
            return typeof value === "string" && value.includes(",")
              ? `"${value}"`
              : value;
          })
          .join(",")
      )
      .join("\n");
    const csvContent = [title, "", headers, rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}_${getTodayString()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // (Eliminada la versión duplicada de exportToExcel)

  // Exportar a PDF (tabla profesional)
  const exportToPDF = async () => {
    if (!data || data.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }
    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;
    const exportCols = columns || Object.keys(data[0]);
    const title = "Reporte de Datos Exportados";
    const doc = new jsPDF();
    // Título y fecha
    doc.setFontSize(16);
    doc.text(title, 14, 18);
    doc.setFontSize(10);
    doc.text(`Fecha de generación: ${getTodayString()}`, 14, 25);
    // Tabla
    const headers = [
      exportCols.map(
        (col) => col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, " ")
      ),
    ];
    const rows = data.map((d) =>
      exportCols.map((col) => {
        const value = d[col];
        if (value === undefined || value === null) return "";
        if (typeof value === "boolean") return value ? "Sí" : "No";
        if (col.toLowerCase().includes("fecha") && typeof value === "string") {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            const dd = String(date.getDate()).padStart(2, "0");
            const mm = String(date.getMonth() + 1).padStart(2, "0");
            const yyyy = date.getFullYear();
            return `${dd}-${mm}-${yyyy}`;
          }
        }
        return value;
      })
    );
    autoTable(doc, {
      head: headers,
      body: rows,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: {
        fillColor: [0, 79, 158],
        textColor: 255,
        fontStyle: "bold",
      },
      margin: { top: 30 },
      theme: "grid",
      didDrawPage: (data) => {
        // Pie de página
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(
          `Página ${data.pageNumber} de ${pageCount}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      },
    });
    doc.save(`${fileName}_${getTodayString()}.pdf`);
  };

  return (
    <div className="relative" ref={menuRef}>
      <ButtonComponent
        accion="descargar"
        onClick={() => setShowMenu((v) => !v)}
        disabled={disabled}
      >
        Exportar
      </ButtonComponent>
      {showMenu && (
        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <button
            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
            onClick={() => {
              setShowMenu(false);
              exportToCSV();
            }}
          >
            Exportar CSV
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
            onClick={() => {
              setShowMenu(false);
              exportToExcel();
            }}
          >
            Exportar Excel
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
            onClick={() => {
              setShowMenu(false);
              exportToPDF();
            }}
          >
            Exportar PDF
          </button>
        </div>
      )}
    </div>
  );
}
