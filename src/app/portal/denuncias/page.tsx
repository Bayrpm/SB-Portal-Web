"use client";

import { useState, useEffect } from "react";
import { Eye, Edit } from "lucide-react";
import Link from "next/link";
import ButtonComponent from "@/app/components/ButtonComponent";
import SelectComponent from "@/app/components/SelectComponent";
import SearchComponent from "@/app/components/SearchComponent";
import DateRangePicker, { DateRange } from "@/app/components/DateRangePicker";
import TableComponent from "@/app/components/TableComponent";
import router from "next/router";

type Denuncia = {
  Folio: string;
  Título: string;
  Categoría: string;
  Ubicación: string;
  Contacto: string;
  Estado: string;
  Inspector: string;
  "Fecha Creación": string; // debe contener fecha (ISO o dd/mm/yyyy; opcionalmente con hora)
};

// ---- Helpers fecha ----
// Extrae "YYYY-MM-DD" desde un string (soporta ISO o dd/mm/yyyy)
const extractISODate = (s: string): string | null => {
  // intenta ISO directo (YYYY-MM-DD)
  const iso = s.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  if (iso) return iso;
  // intenta dd/mm/yyyy
  const dmy = s.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (dmy) {
    const [, dd, mm, yyyy] = dmy;
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
};

export default function DenunciasPage() {
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [filteredDenuncias, setFilteredDenuncias] = useState<Denuncia[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  type Sort = { key: keyof Denuncia | string; dir: "asc" | "desc" };
  const [sort, setSort] = useState<Sort>({ key: "Folio", dir: "asc" });

  // 📅 Rango de fechas
  const [fecha, setFecha] = useState<DateRange>({
    start: undefined,
    end: undefined,
  });

  // Listas únicas para selects
  const [categorias, setCategorias] = useState<string[]>([]);
  const [estados, setEstados] = useState<string[]>([]);

  useEffect(() => {
    fetch("/datos_denuncias.json")
      .then((res) => res.json())
      .then((data: Denuncia[]) => {
        setDenuncias(data);
        setFilteredDenuncias(data);

        const uniqueCategorias = [
          ...new Set(data.map((d) => d.Categoría)),
        ] as string[];
        const uniqueEstados = [
          ...new Set(data.map((d) => d.Estado)),
        ] as string[];

        setCategorias(uniqueCategorias);
        setEstados(uniqueEstados);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error cargando denuncias:", error);
        setLoading(false);
      });
  }, []);

  // Filtros (texto, estado, categoría, fecha)
  useEffect(() => {
    let result = denuncias;

    // Texto
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (d) =>
          d.Folio.toLowerCase().includes(q) ||
          d.Título.toLowerCase().includes(q)
      );
    }

    // Estado
    if (estadoFilter) {
      result = result.filter((d) => d.Estado === estadoFilter);
    }

    // Categoría
    if (categoriaFilter) {
      result = result.filter((d) => d.Categoría === categoriaFilter);
    }

    // 📅 Rango de fechas (si "Fecha Creación" contiene una fecha)
    if (fecha.start && fecha.end) {
      const s = fecha.start;
      const e = fecha.end;
      result = result.filter((d) => {
        const iso = extractISODate(d["Fecha Creación"]);
        if (!iso) return false;
        return iso >= s && iso <= e;
      });
    }

    setFilteredDenuncias(result);
    setCurrentPage(1); // reset de página al cambiar filtros
  }, [searchTerm, estadoFilter, categoriaFilter, fecha, denuncias]);

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDenuncias.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  // Estado de color
  const getEstadoClass = (estado: string) => {
    switch (estado.toLowerCase()) {
      case "pendiente":
        return "bg-amber-100 text-amber-800 border border-amber-200";
      case "en curso":
      case "en proceso":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "cerrada":
        return "bg-green-100 text-green-800 border border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  // Exportar a CSV
  const exportToCSV = () => {
    if (!denuncias || denuncias.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }
    const headers = Object.keys(denuncias[0]).join(",");
    const rows = filteredDenuncias
      .map((d) =>
        Object.values(d)
          .map((value) =>
            typeof value === "string" && value.includes(",")
              ? `"${value}"`
              : value
          )
          .join(",")
      )
      .join("\n");
    const csvContent = [headers, rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `denuncias_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando denuncias...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Denuncias</h1>
          <p className="text-sm text-gray-500">
            Gestión de denuncias ciudadanas
          </p>
        </div>
        <ButtonComponent accion="descargar" autoLoading onConfirm={exportToCSV}>
          Exportar CSV
        </ButtonComponent>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row md:items-start gap-4 mb-6">
        <div className="flex-1 max-w-xs">
          <div className="w-full">
            <SearchComponent
              label="Buscar"
              aria-label="Buscar"
              placeholder="Buscar por folio, título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm("")}
              allowClear
              size="sm"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="w-60">
          <SelectComponent
            value={estadoFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setEstadoFilter(e.target.value)
            }
            label="Estado"
            size="sm"
          >
            <option value="">Todos los estados</option>
            {Array.from(new Set(estados)).map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </SelectComponent>
        </div>

        <div className="w-full md:w-64">
          <SelectComponent
            value={categoriaFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setCategoriaFilter(e.target.value)
            }
            label="Categoría"
            size="sm"
          >
            <option value="">Todas las categorías</option>
            {Array.from(new Set(categorias)).map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </SelectComponent>
        </div>

        {/* 📅 Reemplazo: DateRangePicker */}
        <div className="w-full md:w-64">
          <DateRangePicker
            label="Fecha"
            value={fecha}
            onChange={setFecha}
            size="sm"
            placeholderStart="Fecha inicio"
            placeholderEnd="Fecha fin"
            // min="2025-01-01"
            // max="2025-12-31"
          />
        </div>
      </div>

      {/* Tabla */}
      <TableComponent
        columns={[
          {
            key: "Folio",
            header: "Folio",
            sortable: true,
            render: (row) => (
              <Link
                href={`/portal/denuncias/${row.Folio}`}
                className="font-medium text-blue-600"
              >
                {row.Folio}
              </Link>
            ),
          },
          {
            key: "Título",
            header: "Título",
            sortable: true,
          },
          {
            key: "Categoría",
            header: "Categoría",
            render: (row) => (
              <div className="flex flex-col">
                <span>{row.Categoría}</span>
                <span className="text-xs text-gray-400">Subcategoría</span>
              </div>
            ),
          },
          {
            key: "Ubicación",
            header: "Ubicación",
          },
          {
            key: "Contacto",
            header: "Contacto",
          },
          {
            key: "Estado",
            header: "Estado",
            render: (row) => (
              <span
                className={`text-xs py-1 px-2 rounded-full ${getEstadoClass(
                  row.Estado
                )}`}
              >
                {row.Estado}
              </span>
            ),
          },
          {
            key: "Inspector",
            header: "Inspector",
          },
          {
            key: "Fecha Creación",
            header: "Fecha",
          },
          {
            key: "Evidencia",
            header: "Evidencia",
            align: "center",
            render: () => (
              <div className="flex justify-center">
                <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {Math.floor(Math.random() * 3) + 1}
                </span>
              </div>
            ),
          },
          {
            key: "acciones",
            header: "Acciones",
            align: "center",
            render: () => (
              <div className="flex gap-2 justify-center">
                <button className="p-1 hover:bg-gray-100 rounded">
                  <Eye size={18} className="text-gray-500" />
                </button>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <Edit size={18} className="text-gray-500" />
                </button>
              </div>
            ),
          },
        ]}
        data={currentItems}
        loading={loading}
        emptyMessage="No se encontraron denuncias"
        sort={sort}
        onSortChange={setSort}
        page={currentPage}
        pageSize={itemsPerPage}
        total={filteredDenuncias.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={setItemsPerPage}
        onRowClick={(row) => router.push(`/portal/denuncias/${row.Folio}`)}
      />
    </div>
  );
}
