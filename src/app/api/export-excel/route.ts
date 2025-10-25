import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

// Puedes ajustar el tipo según tus datos
export async function POST(req: NextRequest) {
    const { data, columns, title = "Reporte de Datos Exportados", extraInfo = [] } = await req.json();

    // Construir matriz AOA (Array of Arrays)
    const aoa: (string[])[] = [];
    aoa.push([title]);
    aoa.push([`Fecha de generación: ${getTodayString()}`]);
    extraInfo.forEach((line: string) => aoa.push([line]));
    aoa.push([]); // Espacio
    const headerRow = columns.map((col: string) => col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, " "));
    aoa.push(headerRow);
    data.forEach((row: Record<string, unknown>) => {
        aoa.push(
            columns.map((col: string) => {
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
    ws['!cols'] = columns.map(() => ({ wch: 22 }));
    ws['!freeze'] = { xSplit: 0, ySplit: 4 + extraInfo.length };



    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
        status: 200,
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename=export_${getTodayString()}.xlsx`,
        },
    });
}

function getTodayString() {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
}
