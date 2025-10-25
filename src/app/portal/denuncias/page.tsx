"use client";

import { useState, useEffect } from "react";
// import Link from "next/link";
import Link from "next/link";
import ButtonComponent from "@/app/components/ButtonComponent";
// import { useRef, useState as useStateReact } from "react";
import ExportButton from "@/app/components/ExportButton";
import SelectComponent from "@/app/components/SelectComponent";
import SearchComponent from "@/app/components/SearchComponent";
import DateRangePicker, { DateRange } from "@/app/components/DateRangePicker";
import TableComponent from "@/app/components/TableComponent";
import router from "next/router";

type Denuncia = {
  folio: string;
  nombre: string;
  categoria: string;
  prioridad: string;
  fecha_creacion: string;
  ubicacion_texto: string;
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
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [prioridadFilter, setPrioridadFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  type Sort = { key: keyof Denuncia | string; dir: "asc" | "desc" };
  const [sort, setSort] = useState<Sort>({ key: "folio", dir: "asc" });
  const [fecha, setFecha] = useState<DateRange>({
    start: undefined,
    end: undefined,
  });
  const [categorias, setCategorias] = useState<string[]>([]);
  const [prioridades, setPrioridades] = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);
    fetch("/api/denuncias")
      .then((res) => res.json())
      .then((data) => {
        setDenuncias(data.denuncias || []);
        setFilteredDenuncias(data.denuncias || []);
        setCategorias(
          Array.from(
            new Set(
              (data.denuncias || []).map((d: Denuncia) => String(d.categoria))
            )
          )
        );
        setPrioridades(
          Array.from(
            new Set(
              (data.denuncias || []).map((d: Denuncia) => String(d.prioridad))
            )
          )
        );
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
          d.folio.toLowerCase().includes(q) ||
          d.nombre.toLowerCase().includes(q)
      );
    }
    // Categoría
    if (categoriaFilter) {
      result = result.filter((d) => d.categoria === categoriaFilter);
    }
    // Prioridad
    if (prioridadFilter) {
      result = result.filter((d) => d.prioridad === prioridadFilter);
    }
    // 📅 Rango de fechas
    if (fecha.start && fecha.end) {
      const s = fecha.start;
      const e = fecha.end;
      result = result.filter((d) => {
        const iso = extractISODate(d.fecha_creacion);
        if (!iso) return false;
        return iso >= s && iso <= e;
      });
    }
    setFilteredDenuncias(result);
    setCurrentPage(1);
  }, [searchTerm, categoriaFilter, prioridadFilter, fecha, denuncias]);

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDenuncias.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  if (loading) {
    return <div className="p-8 text-center">Cargando denuncias...</div>;
  }

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Denuncias</h1>
          <p className="text-sm text-gray-500">
            Gestión de denuncias ciudadanas
          </p>
        </div>
        <ExportButton
          data={filteredDenuncias}
          fileName="denuncias"
          columns={[
            "folio",
            "nombre",
            "categoria",
            "prioridad",
            "fecha_creacion",
            "ubicacion_texto",
          ]}
        />
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
            value={prioridadFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setPrioridadFilter(e.target.value)
            }
            label="Prioridad"
            size="sm"
          >
            <option value="">Todas las prioridades</option>
            {prioridades.map((prioridad) => (
              <option key={prioridad} value={prioridad}>
                {prioridad}
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
            key: "folio",
            header: "Folio",
            width: "10%",
            sortable: true,
            render: (row) => (
              <Link
                href={`/portal/denuncias/${row.folio}`}
                className="font-medium text-blue-600"
              >
                {row.folio}
              </Link>
            ),
          },
          {
            key: "nombre",
            header: "Nombre Ciudadano",
            width: "18%",
            sortable: true,
          },
          {
            key: "categoria",
            header: "Categoría",
            width: "15%",
            sortable: true,
          },
          {
            key: "prioridad",
            header: "Prioridad",
            width: "12%",
            sortable: true,
          },
          {
            key: "fecha_creacion",
            header: "Fecha Creación",
            width: "15%",
            sortable: true,
            render: (row) => {
              // Soporta ISO y otros formatos
              const date = row.fecha_creacion
                ? new Date(row.fecha_creacion)
                : null;
              let formatted = row.fecha_creacion;
              if (date && !isNaN(date.getTime())) {
                const dd = String(date.getDate()).padStart(2, "0");
                const mm = String(date.getMonth() + 1).padStart(2, "0");
                const yyyy = date.getFullYear();
                formatted = `${dd}-${mm}-${yyyy}`;
              }
              return <span>{formatted}</span>;
            },
          },
          {
            key: "ubicacion_texto",
            header: "Ubicación",
            width: "20%",
            sortable: false,
          },
          {
            key: "acciones",
            header: "Acciones",
            width: "10%",
            align: "center",
            render: (row) => (
              <div className="flex gap-2 justify-center">
                <Link href={`/portal/denuncias/${row.folio}`}>
                  <ButtonComponent
                    accion="ver"
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200"
                  >
                    Ver denuncia
                  </ButtonComponent>
                </Link>
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
        onRowClick={(row) => router.push(`/portal/denuncias/${row.folio}`)}
      />
    </div>
  );
}
