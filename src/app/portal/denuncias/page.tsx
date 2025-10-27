"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ButtonComponent from "@/app/components/ButtonComponent";
import ExportButton from "@/app/components/ExportButton";
import SelectComponent from "@/app/components/SelectComponent";
import SearchComponent from "@/app/components/SearchComponent";
import DateRangePicker, { DateRange } from "@/app/components/DateRangePicker";
import TableComponent from "@/app/components/TableComponent";

type Denuncia = {
  folio: string;
  nombre: string;
  titulo: string;
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

const prioridadColor: Record<string, string> = {
  Baja: "bg-green-100 text-green-800 border border-green-200", // id 1
  Media: "bg-yellow-200 text-yellow-900 border border-yellow-300", // id 2
  Alta: "bg-orange-300 text-orange-900 border border-orange-400", // id 3
  Urgencia: "bg-red-600 text-white border border-red-700", // id 4
};

export default function DenunciasPage() {
  const router = useRouter();
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
  const [categorias, setCategorias] = useState<
    { id: number; nombre: string }[]
  >([]);
  const [prioridades, setPrioridades] = useState<
    { id: number; nombre: string; orden: number }[]
  >([]);

  useEffect(() => {
    setLoading(true);
    fetch("/api/denuncias")
      .then((res) => res.json())
      .then((data) => {
        setDenuncias(data.denuncias || []);
        setFilteredDenuncias(data.denuncias || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error cargando denuncias:", error);
        setLoading(false);
      });
  }, []);

  // Nuevo: cargar categorías desde el endpoint dinámico
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategorias(data.categorias || []);
      })
      .catch(() => setCategorias([]));
  }, []);

  // Nuevo: cargar prioridades desde el endpoint dinámico
  useEffect(() => {
    fetch("/api/denuncias/demo/prioridad")
      .then((res) => res.json())
      .then((data) => {
        setPrioridades(data.prioridades || []);
      })
      .catch(() => setPrioridades([]));
  }, []);

  // Filtros (texto, prioridad, categoría, fecha) y ordenamiento
  useEffect(() => {
    let result = denuncias;
    // Filtro de texto (folio, nombre, título, ubicación)
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (d) =>
          d.folio.toLowerCase().includes(q) ||
          d.nombre.toLowerCase().includes(q) ||
          d.titulo.toLowerCase().includes(q) ||
          (d.ubicacion_texto || "").toLowerCase().includes(q)
      );
    }
    // Filtro de prioridad
    if (prioridadFilter) {
      result = result.filter((d) => d.prioridad === prioridadFilter);
    }
    // Filtro de categoría
    if (categoriaFilter) {
      result = result.filter((d) => d.categoria === categoriaFilter);
    }
    // Filtro de rango de fechas
    if (fecha.start && fecha.end) {
      const s = fecha.start;
      const e = fecha.end;
      result = result.filter((d) => {
        const iso = extractISODate(d.fecha_creacion);
        if (!iso) return false;
        return iso >= s && iso <= e;
      });
    }
    // Ordenamiento
    if (sort.key === "folio") {
      result = [...result].sort((a, b) => {
        if (sort.dir === "asc") {
          return a.folio.localeCompare(b.folio);
        } else {
          return b.folio.localeCompare(a.folio);
        }
      });
    } else if (sort.key === "fecha_creacion") {
      result = [...result].sort((a, b) => {
        const dateA = new Date(a.fecha_creacion).getTime();
        const dateB = new Date(b.fecha_creacion).getTime();
        if (sort.dir === "asc") {
          return dateA - dateB;
        } else {
          return dateB - dateA;
        }
      });
    }
    setFilteredDenuncias(result);
    setCurrentPage(1);
  }, [searchTerm, prioridadFilter, categoriaFilter, fecha, denuncias, sort]);

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
            {prioridades.map((p) => (
              <option key={p.id} value={p.nombre}>
                {p.nombre}
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
            {categorias.map((c) => (
              <option key={c.id} value={c.nombre}>
                {c.nombre}
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
            width: "15%",
            sortable: true,
          },
          {
            key: "titulo",
            header: "Título",
            width: "18%",
            sortable: true,
            render: (row) => <span>{row.titulo || ""}</span>,
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
            render: (row) =>
              row.prioridad ? (
                <span
                  className={`inline-block px-3 py-1 rounded text-xs font-semibold border ${
                    prioridadColor[row.prioridad] ||
                    "bg-gray-100 text-gray-700 border border-gray-200"
                  }`}
                >
                  {row.prioridad}
                </span>
              ) : (
                <span className="text-gray-400">Sin prioridad</span>
              ),
          },
          {
            key: "fecha_creacion",
            header: "Fecha Creación",
            width: "15%",
            sortable: true,
            render: (row) => {
              const date = row.fecha_creacion
                ? new Date(row.fecha_creacion)
                : null;
              if (date && !isNaN(date.getTime())) {
                const dd = String(date.getDate()).padStart(2, "0");
                const mm = String(date.getMonth() + 1).padStart(2, "0");
                const yyyy = date.getFullYear();
                const hh = String(date.getHours()).padStart(2, "0");
                const min = String(date.getMinutes()).padStart(2, "0");
                return <span>{`${dd}-${mm}-${yyyy} ${hh}:${min}`}</span>;
              }
              return <span>{row.fecha_creacion}</span>;
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
