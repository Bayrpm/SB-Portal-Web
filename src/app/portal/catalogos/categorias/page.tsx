"use client";

import { useState, useEffect } from "react";
import { FolderTree, Tag, Plus, Edit2, ChevronRight } from "lucide-react";
import ButtonComponent from "@/app/components/ButtonComponent";
import TableComponent from "@/app/components/TableComponent";
import ToggleSwitch from "@/app/components/ToggleSwitchComponent";
import SearchComponent from "@/app/components/SearchComponent";
import { withPageProtection } from "@/lib/security/withPageProtection";
import CategoriaPublicaModal, {
  CategoriaPublicaFormData,
} from "./components/CategoriaPublicaModal";
import CategoriaInternaModal, {
  CategoriaInternaFormData,
} from "./components/CategoriaInternaModal";
import Swal from "sweetalert2";

interface CategoriaPublica {
  id: number;
  nombre: string;
  descripcion: string;
  orden: number;
  activo: boolean;
}

interface Familia {
  id: number;
  nombre: string;
  activo: boolean;
}

interface Grupo {
  id: number;
  nombre: string;
  familia_id: number;
  activo: boolean;
  familia?: { id: number; nombre: string };
}

interface Subgrupo {
  id: number;
  nombre: string;
  grupo_id: number;
  activo: boolean;
  grupo?: {
    id: number;
    nombre: string;
    familia?: { id: number; nombre: string };
  };
}

interface Requerimiento {
  id: number;
  nombre: string;
  subgrupo_id: number;
  prioridad: number;
  activo: boolean;
  subgrupo?: {
    id: number;
    nombre: string;
    grupo?: {
      id: number;
      nombre: string;
      familia?: { id: number; nombre: string };
    };
  };
}

function CategoriasPage() {
  const [activeTab, setActiveTab] = useState<"publicas" | "internas">(
    "publicas"
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados para categorías públicas
  const [categoriasPublicas, setCategoriasPublicas] = useState<
    CategoriaPublica[]
  >([]);
  const [modalPublicaOpen, setModalPublicaOpen] = useState(false);
  const [selectedPublica, setSelectedPublica] =
    useState<CategoriaPublica | null>(null);
  const [loadingPublicas, setLoadingPublicas] = useState(false);

  // Estados para categorías internas
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [subgrupos, setSubgrupos] = useState<Subgrupo[]>([]);
  const [requerimientos, setRequerimientos] = useState<Requerimiento[]>([]);
  const [prioridades, setPrioridades] = useState<
    { id: number; nombre: string }[]
  >([]);
  const [selectedFamilia, setSelectedFamilia] = useState<number | null>(null);
  const [selectedGrupo, setSelectedGrupo] = useState<number | null>(null);
  const [selectedSubgrupo, setSelectedSubgrupo] = useState<number | null>(null);

  const [modalInternaOpen, setModalInternaOpen] = useState(false);
  const [modalInternaType, setModalInternaType] = useState<
    "familia" | "grupo" | "subgrupo" | "requerimiento"
  >("familia");
  const [selectedInterna, setSelectedInterna] =
    useState<CategoriaInternaFormData | null>(null);

  useEffect(() => {
    if (activeTab === "publicas") {
      fetchCategoriasPublicas();
    } else {
      fetchCategoriasInternas();
    }
  }, [activeTab]);

  // Fetch categorías públicas
  const fetchCategoriasPublicas = async () => {
    try {
      setLoadingPublicas(true);
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Error al obtener categorías públicas");
      const data = await res.json();
      setCategoriasPublicas(data.categorias || []);
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar las categorías públicas",
        confirmButtonColor: "#003C96",
      });
    } finally {
      setLoadingPublicas(false);
    }
  };

  // Fetch categorías internas
  const fetchCategoriasInternas = async () => {
    try {
      const [famRes, gruRes, subRes, reqRes, priRes] = await Promise.all([
        fetch("/api/categories/familias"),
        fetch("/api/categories/grupos"),
        fetch("/api/categories/subgrupos"),
        fetch("/api/categories/requerimientos"),
        fetch("/api/prioridades"),
      ]);

      const [famData, gruData, subData, reqData, priData] = await Promise.all([
        famRes.json(),
        gruRes.json(),
        subRes.json(),
        reqRes.json(),
        priRes.json(),
      ]);

      setFamilias(famData.familias || []);
      setGrupos(gruData.grupos || []);
      setSubgrupos(subData.subgrupos || []);
      setRequerimientos(reqData.requerimientos || []);
      setPrioridades(priData.prioridades || []);
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar las categorías internas",
        confirmButtonColor: "#003C96",
      });
    }
  };

  // Handlers para categorías públicas
  const handleCreatePublica = () => {
    setSelectedPublica(null);
    setModalPublicaOpen(true);
  };

  const handleEditPublica = (id: number) => {
    const cat = categoriasPublicas.find((c) => c.id === id);
    if (cat) {
      setSelectedPublica(cat);
      setModalPublicaOpen(true);
    }
  };

  const handleSubmitPublica = async (data: CategoriaPublicaFormData) => {
    try {
      const url = "/api/categories";
      const method = data.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Error al guardar categoría");

      await Swal.fire({
        icon: "success",
        title: "Éxito",
        text: `Categoría ${data.id ? "actualizada" : "creada"} correctamente`,
        confirmButtonColor: "#003C96",
        timer: 2000,
      });

      fetchCategoriasPublicas();
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  const handleTogglePublica = async (id: number, newStatus: boolean) => {
    try {
      const cat = categoriasPublicas.find((c) => c.id === id);
      if (!cat) return;

      const res = await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...cat, activo: newStatus }),
      });

      if (!res.ok) throw new Error("Error al actualizar estado");

      setCategoriasPublicas((prev) =>
        prev.map((c) => (c.id === id ? { ...c, activo: newStatus } : c))
      );
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar el estado",
        confirmButtonColor: "#003C96",
      });
    }
  };

  // Handlers para categorías internas
  const handleCreateInterna = (
    type: "familia" | "grupo" | "subgrupo" | "requerimiento"
  ) => {
    setModalInternaType(type);
    setSelectedInterna(null);
    setModalInternaOpen(true);
  };

  const handleEditInterna = (
    type: "familia" | "grupo" | "subgrupo" | "requerimiento",
    id: number
  ) => {
    let data: CategoriaInternaFormData | null = null;

    if (type === "familia") {
      const fam = familias.find((f) => f.id === id);
      if (fam) data = { ...fam };
    } else if (type === "grupo") {
      const grp = grupos.find((g) => g.id === id);
      if (grp) data = { ...grp };
    } else if (type === "subgrupo") {
      const sub = subgrupos.find((s) => s.id === id);
      if (sub) {
        const grupo = grupos.find((g) => g.id === sub.grupo_id);
        data = {
          ...sub,
          familia_id: grupo?.familia_id,
        };
      }
    } else if (type === "requerimiento") {
      const req = requerimientos.find((r) => r.id === id);
      if (req) {
        const subgrupo = subgrupos.find((s) => s.id === req.subgrupo_id);
        const grupo = subgrupo
          ? grupos.find((g) => g.id === subgrupo.grupo_id)
          : null;
        data = {
          ...req,
          grupo_id: subgrupo?.grupo_id,
          familia_id: grupo?.familia_id,
        };
      }
    }

    if (data) {
      setModalInternaType(type);
      setSelectedInterna(data);
      setModalInternaOpen(true);
    }
  };

  const handleSubmitInterna = async (data: CategoriaInternaFormData) => {
    try {
      let url = "";
      let bodyData = {};

      if (modalInternaType === "familia") {
        url = "/api/categories/familias";
        bodyData = { id: data.id, nombre: data.nombre, activo: data.activo };
      } else if (modalInternaType === "grupo") {
        url = "/api/categories/grupos";
        bodyData = {
          id: data.id,
          nombre: data.nombre,
          familia_id: data.familia_id,
          activo: data.activo,
        };
      } else if (modalInternaType === "subgrupo") {
        url = "/api/categories/subgrupos";
        bodyData = {
          id: data.id,
          nombre: data.nombre,
          grupo_id: data.grupo_id,
          activo: data.activo,
        };
      } else if (modalInternaType === "requerimiento") {
        url = "/api/categories/requerimientos";
        bodyData = {
          id: data.id,
          nombre: data.nombre,
          subgrupo_id: data.subgrupo_id,
          prioridad: data.prioridad,
          activo: data.activo,
        };
      }

      const method = data.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) throw new Error("Error al guardar categoría");

      await Swal.fire({
        icon: "success",
        title: "Éxito",
        text: `${
          modalInternaType.charAt(0).toUpperCase() + modalInternaType.slice(1)
        } ${data.id ? "actualizada" : "creada"} correctamente`,
        confirmButtonColor: "#003C96",
        timer: 2000,
      });

      fetchCategoriasInternas();
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  const handleToggleInterna = async (
    type: "familia" | "grupo" | "subgrupo" | "requerimiento",
    id: number,
    newStatus: boolean
  ) => {
    try {
      let item = null;
      let url = "";

      if (type === "familia") {
        item = familias.find((f) => f.id === id);
        url = "/api/categories/familias";
      } else if (type === "grupo") {
        item = grupos.find((g) => g.id === id);
        url = "/api/categories/grupos";
      } else if (type === "subgrupo") {
        item = subgrupos.find((s) => s.id === id);
        url = "/api/categories/subgrupos";
      } else if (type === "requerimiento") {
        item = requerimientos.find((r) => r.id === id);
        url = "/api/categories/requerimientos";
      }

      if (!item) return;

      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, activo: newStatus }),
      });

      if (!res.ok) throw new Error("Error al actualizar estado");

      if (type === "familia") {
        setFamilias((prev) =>
          prev.map((f) => (f.id === id ? { ...f, activo: newStatus } : f))
        );
      } else if (type === "grupo") {
        setGrupos((prev) =>
          prev.map((g) => (g.id === id ? { ...g, activo: newStatus } : g))
        );
      } else if (type === "subgrupo") {
        setSubgrupos((prev) =>
          prev.map((s) => (s.id === id ? { ...s, activo: newStatus } : s))
        );
      } else if (type === "requerimiento") {
        setRequerimientos((prev) =>
          prev.map((r) => (r.id === id ? { ...r, activo: newStatus } : r))
        );
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar el estado",
        confirmButtonColor: "#003C96",
      });
    }
  };

  // Filtrar datos
  const filteredPublicas = categoriasPublicas.filter((cat) =>
    cat.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFamilias = familias.filter((fam) =>
    fam.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const gruposFiltrados = selectedFamilia
    ? grupos.filter((g) => g.familia_id === selectedFamilia)
    : grupos;

  const subgruposFiltrados = selectedGrupo
    ? subgrupos.filter((s) => s.grupo_id === selectedGrupo)
    : subgrupos;

  const requerimientosFiltrados = selectedSubgrupo
    ? requerimientos.filter((r) => r.subgrupo_id === selectedSubgrupo)
    : requerimientos;

  return (
    <div className="w-full min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FolderTree className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Catálogo de Categorías
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Gestiona las categorías públicas e internas del sistema
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("publicas")}
              className={`px-4 py-3 font-medium text-sm transition-all ${
                activeTab === "publicas"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Categorías Públicas (Ciudadanos)
              </div>
            </button>
            <button
              onClick={() => setActiveTab("internas")}
              className={`px-4 py-3 font-medium text-sm transition-all ${
                activeTab === "internas"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <FolderTree className="w-4 h-4" />
                Categorías Internas (Operadores)
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 p-6">
        {activeTab === "publicas" ? (
          <div className="bg-white rounded-lg shadow-sm">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between gap-4">
                <SearchComponent
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar categorías..."
                  className="flex-1 max-w-md"
                />
                <ButtonComponent
                  accion="agregar"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={handleCreatePublica}
                >
                  Nueva Categoría
                </ButtonComponent>
              </div>
            </div>

            {/* Tabla */}
            <TableComponent
              data={filteredPublicas}
              columns={[
                {
                  key: "orden",
                  header: "Orden",
                  width: "80px",
                  render: (row) => (
                    <span className="text-sm text-gray-600">{row.orden}</span>
                  ),
                },
                {
                  key: "nombre",
                  header: "Nombre",
                  render: (row) => (
                    <span className="font-medium text-gray-900">
                      {row.nombre}
                    </span>
                  ),
                },
                {
                  key: "descripcion",
                  header: "Descripción",
                  render: (row) => (
                    <span className="text-sm text-gray-600">
                      {row.descripcion || "-"}
                    </span>
                  ),
                },
                {
                  key: "activo",
                  header: "Estado",
                  width: "120px",
                  align: "center",
                  render: (row) => (
                    <ToggleSwitch
                      isActive={row.activo}
                      onChange={(enabled) =>
                        handleTogglePublica(row.id, enabled)
                      }
                    />
                  ),
                },
                {
                  key: "actions",
                  header: "Acciones",
                  width: "120px",
                  align: "center",
                  render: (row) => (
                    <button
                      onClick={() => handleEditPublica(row.id)}
                      className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  ),
                },
              ]}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              loading={loadingPublicas}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Familias */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Familias</h3>
                  <ButtonComponent
                    accion="agregar"
                    size="sm"
                    leftIcon={<Plus className="w-3 h-3" />}
                    onClick={() => handleCreateInterna("familia")}
                  >
                    Nueva
                  </ButtonComponent>
                </div>
              </div>
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {filteredFamilias.map((fam) => (
                  <div
                    key={fam.id}
                    className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedFamilia === fam.id ? "bg-blue-50" : ""
                    }`}
                    onClick={() => {
                      if (selectedFamilia === fam.id) {
                        // Deseleccionar familia y limpiar hijos
                        setSelectedFamilia(null);
                        setSelectedGrupo(null);
                        setSelectedSubgrupo(null);
                      } else {
                        setSelectedFamilia(fam.id);
                        setSelectedGrupo(null);
                        setSelectedSubgrupo(null);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <ChevronRight
                          className={`w-4 h-4 flex-shrink-0 transition-transform ${
                            selectedFamilia === fam.id ? "rotate-90" : ""
                          }`}
                        />
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {fam.nombre}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ToggleSwitch
                          isActive={fam.activo}
                          onChange={(enabled) =>
                            handleToggleInterna("familia", fam.id, enabled)
                          }
                          size="sm"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditInterna("familia", fam.id);
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grupos */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-green-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Grupos</h3>
                  <ButtonComponent
                    accion="agregar"
                    size="sm"
                    leftIcon={<Plus className="w-3 h-3" />}
                    onClick={() => handleCreateInterna("grupo")}
                    disabled={!selectedFamilia}
                  >
                    Nuevo
                  </ButtonComponent>
                </div>
              </div>
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {gruposFiltrados.map((grp) => (
                  <div
                    key={grp.id}
                    className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedGrupo === grp.id ? "bg-green-50" : ""
                    }`}
                    onClick={() => {
                      if (selectedGrupo === grp.id) {
                        setSelectedGrupo(null);
                        setSelectedSubgrupo(null);
                      } else {
                        setSelectedGrupo(grp.id);
                        setSelectedSubgrupo(null);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <ChevronRight
                          className={`w-4 h-4 flex-shrink-0 transition-transform ${
                            selectedGrupo === grp.id ? "rotate-90" : ""
                          }`}
                        />
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {grp.nombre}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ToggleSwitch
                          isActive={grp.activo}
                          onChange={(enabled) =>
                            handleToggleInterna("grupo", grp.id, enabled)
                          }
                          size="sm"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditInterna("grupo", grp.id);
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subgrupos */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-yellow-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Subgrupos</h3>
                  <ButtonComponent
                    accion="agregar"
                    size="sm"
                    leftIcon={<Plus className="w-3 h-3" />}
                    onClick={() => handleCreateInterna("subgrupo")}
                    disabled={!selectedGrupo}
                  >
                    Nuevo
                  </ButtonComponent>
                </div>
              </div>
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {subgruposFiltrados.map((sub) => (
                  <div
                    key={sub.id}
                    className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedSubgrupo === sub.id ? "bg-yellow-50" : ""
                    }`}
                    onClick={() => {
                      if (selectedSubgrupo === sub.id) {
                        setSelectedSubgrupo(null);
                      } else {
                        setSelectedSubgrupo(sub.id);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <ChevronRight
                          className={`w-4 h-4 flex-shrink-0 transition-transform ${
                            selectedSubgrupo === sub.id ? "rotate-90" : ""
                          }`}
                        />
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {sub.nombre}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ToggleSwitch
                          isActive={sub.activo}
                          onChange={(enabled) =>
                            handleToggleInterna("subgrupo", sub.id, enabled)
                          }
                          size="sm"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditInterna("subgrupo", sub.id);
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Requerimientos */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    Requerimientos
                  </h3>
                  <ButtonComponent
                    accion="agregar"
                    size="sm"
                    leftIcon={<Plus className="w-3 h-3" />}
                    onClick={() => handleCreateInterna("requerimiento")}
                    disabled={!selectedSubgrupo}
                  >
                    Nuevo
                  </ButtonComponent>
                </div>
              </div>
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {requerimientosFiltrados.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 block truncate">
                          {req.nombre}
                        </span>
                        {req.prioridad !== undefined && (
                          <span className="text-xs text-gray-500">
                            Prioridad:{" "}
                            {prioridades.find((p) => p.id === req.prioridad)
                              ?.nombre || req.prioridad}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <ToggleSwitch
                          isActive={req.activo}
                          onChange={(enabled) =>
                            handleToggleInterna(
                              "requerimiento",
                              req.id,
                              enabled
                            )
                          }
                          size="sm"
                        />
                        <button
                          onClick={() =>
                            handleEditInterna("requerimiento", req.id)
                          }
                          className="text-blue-600 hover:text-blue-800 p-1.5 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      <CategoriaPublicaModal
        isOpen={modalPublicaOpen}
        onClose={() => {
          setModalPublicaOpen(false);
          setSelectedPublica(null);
        }}
        onSubmit={handleSubmitPublica}
        initialData={selectedPublica}
        title={
          selectedPublica
            ? "Editar Categoría Pública"
            : "Nueva Categoría Pública"
        }
      />

      <CategoriaInternaModal
        isOpen={modalInternaOpen}
        onClose={() => {
          setModalInternaOpen(false);
          setSelectedInterna(null);
        }}
        onSubmit={handleSubmitInterna}
        initialData={selectedInterna}
        title={
          selectedInterna
            ? `Editar ${
                modalInternaType.charAt(0).toUpperCase() +
                modalInternaType.slice(1)
              }`
            : `Nuevo ${
                modalInternaType.charAt(0).toUpperCase() +
                modalInternaType.slice(1)
              }`
        }
        type={modalInternaType}
        familias={familias}
        grupos={grupos}
        subgrupos={subgrupos}
        selectedFamiliaId={selectedFamilia || undefined}
        selectedGrupoId={selectedGrupo || undefined}
      />
    </div>
  );
}

export default withPageProtection(CategoriasPage);
