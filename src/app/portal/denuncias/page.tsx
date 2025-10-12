"use client";

import { useState, useEffect } from "react";
import { Search, Eye, Edit, Download } from "lucide-react";
import Link from "next/link";

type Denuncia = {
  Folio: string;
  Título: string;
  Categoría: string;
  Ubicación: string;
  Contacto: string;
  Estado: string;
  Inspector: string;
  "Fecha Creación": string;
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

  // Lista única de categorías y estados para los filtros
  const [categorias, setCategorias] = useState<string[]>([]);
  const [estados, setEstados] = useState<string[]>([]);

  useEffect(() => {
    fetch("/datos_denuncias.json")
      .then((res) => res.json())
      .then((data) => {
        setDenuncias(data);
        setFilteredDenuncias(data);

        // Extraer categorías y estados únicos
        const uniqueCategorias = [
          ...new Set(data.map((d: Denuncia) => d.Categoría)),
        ] as string[];
        const uniqueEstados = [
          ...new Set(data.map((d: Denuncia) => d.Estado)),
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

  // Aplicar filtros
  useEffect(() => {
    let result = denuncias;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      result = result.filter(
        (d) =>
          d.Folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.Título.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por estado
    if (estadoFilter) {
      result = result.filter((d) => d.Estado === estadoFilter);
    }

    // Filtrar por categoría
    if (categoriaFilter) {
      result = result.filter((d) => d.Categoría === categoriaFilter);
    }

    setFilteredDenuncias(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, estadoFilter, categoriaFilter, denuncias]);

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDenuncias.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredDenuncias.length / itemsPerPage);

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
    const rows = filteredDenuncias.map((d) =>
      Object.values(d)
        .map((value) =>
          typeof value === "string" && value.includes(",")
            ? `"${value}"`
            : value
        )
        .join(",")
    );
    const csvContent = [headers, ...rows].join("\n");

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
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md"
        >
          <Download size={18} />
          Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 max-w-xs">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar por folio, título..."
              className="pl-10 pr-4 py-2 w-full border rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="w-60">
          <select
            className="w-full border rounded-md py-2 px-4 appearance-none"
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
          >
            <option value="">Estado</option>
            {estados.map((estado, index) => (
              <option key={index} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-64">
          <select
            className="w-full border rounded-md py-2 px-4 appearance-none"
            value={categoriaFilter}
            onChange={(e) => setCategoriaFilter(e.target.value)}
          >
            <option value="">Categoría</option>
            {categorias.map((categoria, index) => (
              <option key={index} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-64 flex gap-1">
          <input
            type="date"
            className="border rounded-md py-2 px-4 flex-1"
            placeholder="Fecha inicio"
          />
          <span className="flex items-center">—</span>
          <input
            type="date"
            className="border rounded-md py-2 px-4 flex-1"
            placeholder="Fecha fin"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-md shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Folio
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Título
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ubicación
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contacto
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Inspector
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Creación
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Evidencia
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.map((denuncia, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-blue-600">
                  <Link href={`/portal/denuncias/${denuncia.Folio}`}>
                    {denuncia.Folio}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm">{denuncia.Título}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex flex-col">
                    <span>{denuncia.Categoría}</span>
                    <span className="text-xs text-gray-400">Subcategoría</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">{denuncia.Ubicación}</td>
                <td className="px-4 py-3 text-sm">{denuncia.Contacto}</td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`text-xs py-1 px-2 rounded-full ${getEstadoClass(
                      denuncia.Estado
                    )}`}
                  >
                    {denuncia.Estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{denuncia.Inspector}</td>
                <td className="px-4 py-3 text-sm">
                  {denuncia["Fecha Creación"]}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex justify-center">
                    <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {Math.floor(Math.random() * 3) + 1}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2 justify-center">
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Eye size={18} className="text-gray-500" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Edit size={18} className="text-gray-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-500">
          {indexOfFirstItem + 1}-
          {Math.min(indexOfLastItem, filteredDenuncias.length)} de{" "}
          {filteredDenuncias.length} denuncias
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded border hover:bg-gray-50 disabled:opacity-50"
          >
            &lt;
          </button>

          <span className="flex items-center">
            <button className="px-3 py-1 rounded bg-blue-600 text-white">
              {currentPage}
            </button>
          </span>

          <button
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
            className="p-1 rounded border hover:bg-gray-50 disabled:opacity-50"
          >
            &gt;
          </button>

          <select
            className="border rounded-md py-1 px-2 text-sm"
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
          >
            <option value="10">10 / página</option>
            <option value="20">20 / página</option>
            <option value="50">50 / página</option>
          </select>
        </div>
      </div>
    </div>
  );
}
