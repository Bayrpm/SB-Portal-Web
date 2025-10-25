import XLSX from "xlsx";

type RowData = Record<string, string | number | boolean | null | undefined>;

export interface ExcelExportOptions {
    data: RowData[];
    columns: string[];
    title?: string;
    fileName?: string;
    extraInfo?: string[]; // líneas adicionales (ej: filtros, usuario, etc)
}

/**
 * Genera un workbook de Excel con formato profesional, título, fecha, info extra y tabla estilizada.
 */
export function createStyledWorkbook({ data, columns, title = "Reporte de Datos Exportados", extraInfo = [] }: ExcelExportOptions) {
    // Construir matriz AOA (Array of Arrays)
    const aoa: (string[])[] = [];
    aoa.push([title]);
    aoa.push([`Fecha de generación: ${getTodayString()}`]);
    extraInfo.forEach(line => aoa.push([line]));
    aoa.push([]); // Espacio
    // Encabezados bonitos
    const headerRow = columns.map(col => col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, " "));
    aoa.push(headerRow);
    data.forEach(row => {
        aoa.push(
            columns.map(col => {
                const value = row[col];
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
                return value as string;
            })
        );
    });
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    // Ajustar ancho de columnas
    ws['!cols'] = columns.map(() => ({ wch: 22 }));
    // Congelar encabezado
    ws['!freeze'] = { xSplit: 0, ySplit: 4 + extraInfo.length };

    // --- Estilos avanzados con xlsx-style ---
    // Azul institucional: #004F9E, gris claro: #F3F4F6
    // Títulos
    ws['A1'].s = {
        font: { bold: true, sz: 16, color: { rgb: '004F9E' } },
        alignment: { horizontal: 'left', vertical: 'center' }
    };
    ws['A2'].s = {
        font: { italic: true, sz: 10, color: { rgb: '666666' } },
        alignment: { horizontal: 'left', vertical: 'center' }
    };
    // Encabezados de tabla
    const headerRowIdx = 4 + extraInfo.length + 1; // 1-based
    for (let c = 0; c < columns.length; c++) {
        const colLetter = XLSX.utils.encode_col(c);
        const cellRef = `${colLetter}${headerRowIdx}`;
        ws[cellRef].s = {
            fill: { fgColor: { rgb: '004F9E' } },
            font: { bold: true, color: { rgb: 'FFFFFF' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
                top: { style: 'thin', color: { rgb: '004F9E' } },
                bottom: { style: 'thin', color: { rgb: '004F9E' } },
                left: { style: 'thin', color: { rgb: '004F9E' } },
                right: { style: 'thin', color: { rgb: '004F9E' } },
            },
        };
    }
    // Filas alternas con fondo gris claro
    for (let r = headerRowIdx + 1; r < aoa.length + 1; r++) {
        if ((r - headerRowIdx) % 2 === 1) {
            for (let c = 0; c < columns.length; c++) {
                const colLetter = XLSX.utils.encode_col(c);
                const cellRef = `${colLetter}${r}`;
                if (ws[cellRef]) {
                    ws[cellRef].s = {
                        fill: { fgColor: { rgb: 'F3F4F6' } },
                        border: {
                            top: { style: 'thin', color: { rgb: 'CCCCCC' } },
                            bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
                            left: { style: 'thin', color: { rgb: 'CCCCCC' } },
                            right: { style: 'thin', color: { rgb: 'CCCCCC' } },
                        },
                    };
                }
            }
        }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    return wb;
}

function getTodayString() {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
}
