"use client";

import { useState, useEffect, useMemo } from "react";
import TableComponent from "@/app/components/TableComponent";
import ButtonComponent from "@/app/components/ButtonComponent";
import SearchComponent from "@/app/components/SearchComponent";
import SelectComponent from "@/app/components/SelectComponent";
import Link from "next/link";

interface Derivacion {
  id: string;
  denuncia_id: string;
  inspector_id: string;
  estado: string;
  fecha_derivacion: string;
  fecha_inicio?: string | null;
  fecha_termino?: string | null;
  observaciones: { fecha: string; autor: string; texto: string }[];
}

interface Inspector {
  id: string;
  nombre: string;
}

interface Denuncia {
  folio: string;
  titulo: string;
}

interface DerivacionRow {
  folio: string;
  titulo: string;
  inspector: string;
  fecha_derivacion: string;
  fecha_inicio: string | null;
  fecha_termino: string | null;
  estado: string;
  observaciones_count: number;
  denuncia_id: string;
}

export default function DerivacionesPage() {
  const [derivaciones, setDerivaciones] = useState<Derivacion[]>([]);
  const [inspectores, setInspectores] = useState<Inspector[]>([]);
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [loading, setLoading] = useState(true);
  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [inspectorFilter, setInspectorFilter] = useState("");

  // Cargar datos desde los JSON públicos
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch("/datos_san_bernardo.json");
        const data = await res.json();
        setDerivaciones(data.derivaciones || []);
        setInspectores(data.inspectores || []);
        setDenuncias(
          (data.denuncias || []).map(
            (d: { folio: string; titulo: string }) => ({
              folio: d.folio,
              titulo: d.titulo,
            })
          )
        );
      } catch {
        setDerivaciones([]);
        setInspectores([]);
        setDenuncias([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Mapeo de datos para la tabla
  const rows: DerivacionRow[] = useMemo(() => {
    return derivaciones.map((d) => {
      const inspector =
        inspectores.find((i) => i.id === d.inspector_id)?.nombre || "-";
      const denuncia = denuncias.find(
        (den) =>
          den.folio === d.denuncia_id || den.folio === d.denuncia_id?.toString()
      );
      return {
        folio: d.denuncia_id,
        titulo: denuncia?.titulo || "-",
        inspector,
        fecha_derivacion: d.fecha_derivacion,
        fecha_inicio: d.fecha_inicio || null,
        fecha_termino: d.fecha_termino || null,
        estado: d.estado,
        observaciones_count: d.observaciones?.length || 0,
        denuncia_id: d.denuncia_id,
      };
    });
  }, [derivaciones, inspectores, denuncias]);

  // Filtros y búsqueda
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch =
        searchTerm === "" ||
        row.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.titulo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEstado = estadoFilter === "" || row.estado === estadoFilter;
      const matchesInspector =
        inspectorFilter === "" || row.inspector === inspectorFilter;
      return matchesSearch && matchesEstado && matchesInspector;
    });
  }, [rows, searchTerm, estadoFilter, inspectorFilter]);

  return (
    <div className="w-full py-8 px-4">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Derivaciones</h1>
          <p className="text-sm text-gray-600">
            Gestión de derivaciones de denuncias a inspectores
          </p>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-xl border border-gray-200 shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchComponent
            placeholder="Buscar por folio o título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm("")}
          />
          <SelectComponent
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            placeholder="Todos los estados"
          >
            <option value="">Todos los estados</option>
            {[...new Set(rows.map((r) => r.estado))].map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </SelectComponent>
          <SelectComponent
            value={inspectorFilter}
            onChange={(e) => setInspectorFilter(e.target.value)}
            placeholder="Todos los inspectores"
          >
            <option value="">Todos los inspectores</option>
            {[...new Set(rows.map((r) => r.inspector))].map((inspector) => (
              <option key={inspector} value={inspector}>
                {inspector}
              </option>
            ))}
          </SelectComponent>
        </div>
        {(searchTerm || estadoFilter || inspectorFilter) && (
          <div className="mt-3 text-sm text-gray-600">
            Mostrando {filteredRows.length} de {rows.length} derivaciones
          </div>
        )}
      </div>

      {/* Tabla de derivaciones */}
      <div className="bg-white rounded-xl border border-gray-200 shadow p-2">
        <TableComponent<DerivacionRow>
          columns={[
            {
              key: "folio",
              header: "Folio",
              width: "10%",
              render: (row) => (
                <span className="font-semibold text-blue-700">{row.folio}</span>
              ),
            },
            {
              key: "titulo",
              header: "Título",
              width: "20%",
              render: (row) => <span>{row.titulo}</span>,
            },
            {
              key: "inspector",
              header: "Inspector",
              width: "18%",
              render: (row) => <span>{row.inspector}</span>,
            },
            {
              key: "fecha_derivacion",
              header: "Fecha derivación",
              width: "13%",
              render: (row) => {
                const date = row.fecha_derivacion
                  ? new Date(row.fecha_derivacion)
                  : null;
                let formatted = row.fecha_derivacion;
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
              key: "fecha_inicio",
              header: "Fecha inicio",
              width: "13%",
              render: (row) => {
                if (!row.fecha_inicio)
                  return <span className="text-gray-400 italic">-</span>;
                const date = new Date(row.fecha_inicio);
                if (isNaN(date.getTime()))
                  return <span>{row.fecha_inicio}</span>;
                const dd = String(date.getDate()).padStart(2, "0");
                const mm = String(date.getMonth() + 1).padStart(2, "0");
                const yyyy = date.getFullYear();
                return <span>{`${dd}-${mm}-${yyyy}`}</span>;
              },
            },
            {
              key: "fecha_termino",
              header: "Fecha término",
              width: "13%",
              render: (row) => {
                if (!row.fecha_termino)
                  return <span className="text-gray-400 italic">-</span>;
                const date = new Date(row.fecha_termino);
                if (isNaN(date.getTime()))
                  return <span>{row.fecha_termino}</span>;
                const dd = String(date.getDate()).padStart(2, "0");
                const mm = String(date.getMonth() + 1).padStart(2, "0");
                const yyyy = date.getFullYear();
                return <span>{`${dd}-${mm}-${yyyy}`}</span>;
              },
            },
            {
              key: "estado",
              header: "Estado",
              width: "10%",
              render: (row) => {
                let color = "bg-gray-100 text-gray-700";
                if (row.estado.toLowerCase() === "pendiente") {
                  color =
                    "bg-yellow-100 text-yellow-800 border border-yellow-200";
                } else if (row.estado.toLowerCase().includes("proceso")) {
                  color = "bg-blue-100 text-blue-700 border border-blue-200";
                } else if (row.estado.toLowerCase().includes("finaliz")) {
                  color = "bg-green-100 text-green-700 border border-green-200";
                }
                return (
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${color}`}
                  >
                    {row.estado}
                  </span>
                );
              },
            },
            {
              key: "observaciones_count",
              header: "Observaciones",
              width: "10%",
              align: "center",
              render: (row) => (
                <span className="inline-flex items-center justify-center font-semibold text-gray-700 bg-gray-100 rounded-full px-2 py-1 text-xs">
                  {row.observaciones_count}
                </span>
              ),
            },
            {
              key: "acciones",
              header: "Acciones",
              width: "12%",
              align: "center",
              render: (row) => (
                <Link href={`/portal/denuncias/${row.folio}`}>
                  <ButtonComponent
                    accion="ver"
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200"
                  >
                    Ver denuncia
                  </ButtonComponent>
                </Link>
              ),
            },
          ]}
          data={filteredRows}
          loading={loading}
          emptyMessage={
            loading
              ? "Cargando derivaciones..."
              : "No hay derivaciones registradas"
          }
        />
      </div>
    </div>
  );
}
