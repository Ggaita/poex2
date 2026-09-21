import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PrivateLayout from "../../../layouts/PrivateLayout";
import { clearAuthSession, getAuthSession } from "../../../shared/auth/session";
import type { ApiResponse } from "../../../shared/types/api.types";
import "./AdminIndustrialParksPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

type IndustrialParkAdminView = {
  id: number;
  slug: string;
  name: string;
  administration?: string;
  progressStatus: string;
  locality: string;
  department?: string;
  yearCreated?: number;
  surfaceHa?: number;
  measuredPlots?: number;
  settledCompanies?: string;
  infrastructure?: string;
  renpiStatus?: string;
  observations?: string;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

type ParkForm = {
  name: string;
  administration: string;
  progressStatus: string;
  locality: string;
  department: string;
  yearCreated: string;
  surfaceHa: string;
  measuredPlots: string;
  settledCompanies: string;
  infrastructure: string;
  renpiStatus: string;
  observations: string;
  sortOrder: string;
  isPublished: boolean;
  slug: string;
};

const emptyForm = (): ParkForm => ({
  name: "",
  administration: "Municipal",
  progressStatus: "En desarrollo",
  locality: "",
  department: "",
  yearCreated: "",
  surfaceHa: "",
  measuredPlots: "",
  settledCompanies: "",
  infrastructure: "",
  renpiStatus: "",
  observations: "",
  sortOrder: "0",
  isPublished: false,
  slug: ""
});

const fromPark = (row: IndustrialParkAdminView): ParkForm => ({
  name: row.name,
  administration: row.administration ?? "",
  progressStatus: row.progressStatus,
  locality: row.locality,
  department: row.department ?? "",
  yearCreated: row.yearCreated != null ? String(row.yearCreated) : "",
  surfaceHa: row.surfaceHa != null ? String(row.surfaceHa) : "",
  measuredPlots: row.measuredPlots != null ? String(row.measuredPlots) : "",
  settledCompanies: row.settledCompanies ?? "",
  infrastructure: row.infrastructure ?? "",
  renpiStatus: row.renpiStatus ?? "",
  observations: row.observations ?? "",
  sortOrder: String(row.sortOrder ?? 0),
  isPublished: row.isPublished,
  slug: row.slug
});

const toNumberOrNull = (value: string): number | null => {
  const cleaned = value.trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

export default function AdminIndustrialParksPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<IndustrialParkAdminView[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<ParkForm>(emptyForm());
  const [searchTerm, setSearchTerm] = useState("");
  const [listLoading, setListLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const selected = useMemo(
    () => items.find((row) => row.id === selectedId) ?? null,
    [items, selectedId]
  );

  const handleUnauthorized = useCallback(() => {
    clearAuthSession();
    navigate("/login", { replace: true });
  }, [navigate]);

  const getAuthHeader = useCallback((): string | null => {
    const token = getAuthSession()?.token;
    return token ? `Bearer ${token}` : null;
  }, []);

  const loadParks = useCallback(async (): Promise<void> => {
    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    setListLoading(true);
    setErrorMessage("");
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set("q", searchTerm.trim());
      const query = params.toString();
      const response = await fetch(
        `${API_BASE_URL}/api/admin/industrial-parks${query ? `?${query}` : ""}`,
        { headers: { Authorization: authHeader } }
      );
      const payload = (await response.json()) as ApiResponse<IndustrialParkAdminView[]>;

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok || !payload.success) {
        setItems([]);
        setErrorMessage(payload.error ?? "No se pudieron cargar los parques.");
        return;
      }

      const rows = Array.isArray(payload.data) ? payload.data : [];
      setItems(rows);
      if (selectedId !== null && !rows.some((row) => row.id === selectedId)) {
        setSelectedId(rows[0]?.id ?? null);
        setForm(rows[0] ? fromPark(rows[0]) : emptyForm());
      }
    } catch {
      setItems([]);
      setErrorMessage("No se pudo conectar con el backend de parques.");
    } finally {
      setListLoading(false);
    }
  }, [getAuthHeader, handleUnauthorized, searchTerm, selectedId]);

  useEffect(() => {
    void loadParks();
  }, [loadParks]);

  const updateForm = <K extends keyof ParkForm>(key: K, value: ParkForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setActionMessage("");
    setErrorMessage("");
  };

  const handleNew = () => {
    setSelectedId(null);
    setForm(emptyForm());
    setActionMessage("");
    setErrorMessage("");
  };

  const handleSelect = (row: IndustrialParkAdminView) => {
    setSelectedId(row.id);
    setForm(fromPark(row));
    setActionMessage("");
    setErrorMessage("");
  };

  const handleSave = async (): Promise<void> => {
    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    if (!form.name.trim() || !form.locality.trim()) {
      setErrorMessage("Nombre y localidad son obligatorios.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setActionMessage("");

    const body = {
      name: form.name.trim(),
      administration: form.administration.trim() || null,
      progressStatus: form.progressStatus.trim() || "Sin dato",
      locality: form.locality.trim(),
      department: form.department.trim() || null,
      yearCreated: toNumberOrNull(form.yearCreated),
      surfaceHa: toNumberOrNull(form.surfaceHa),
      measuredPlots: toNumberOrNull(form.measuredPlots),
      settledCompanies: form.settledCompanies.trim() || null,
      infrastructure: form.infrastructure.trim() || null,
      renpiStatus: form.renpiStatus.trim() || null,
      observations: form.observations.trim() || null,
      sortOrder: Math.trunc(toNumberOrNull(form.sortOrder) ?? 0),
      isPublished: form.isPublished,
      slug: form.slug.trim() || null
    };

    try {
      const isEdit = selectedId !== null;
      const response = await fetch(
        isEdit
          ? `${API_BASE_URL}/api/admin/industrial-parks/${selectedId}`
          : `${API_BASE_URL}/api/admin/industrial-parks`,
        {
          method: isEdit ? "PATCH" : "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        }
      );
      const payload = (await response.json()) as ApiResponse<IndustrialParkAdminView>;

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok || !payload.success || !payload.data) {
        setErrorMessage(payload.error ?? "No se pudo guardar el parque.");
        return;
      }

      setActionMessage(isEdit ? "Parque actualizado." : "Parque creado.");
      setSelectedId(payload.data.id);
      setForm(fromPark(payload.data));
      await loadParks();
    } catch {
      setErrorMessage("No se pudo conectar para guardar el parque.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (selectedId === null) return;
    if (!window.confirm("¿Eliminar este parque industrial?")) return;

    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/industrial-parks/${selectedId}`, {
        method: "DELETE",
        headers: { Authorization: authHeader }
      });
      const payload = (await response.json()) as ApiResponse<unknown>;
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok || !payload.success) {
        setErrorMessage(payload.error ?? "No se pudo eliminar.");
        return;
      }
      setActionMessage("Parque eliminado.");
      setSelectedId(null);
      setForm(emptyForm());
      await loadParks();
    } catch {
      setErrorMessage("No se pudo conectar para eliminar.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PrivateLayout>
      <section className="admin-parks-page">
        <div className="admin-parks-shell">
          <header className="admin-parks-header">
            <div>
              <p>Administración</p>
              <h1>Parques industriales</h1>
              <small>CRUD de parques/áreas industriales del catálogo público.</small>
            </div>
            <button type="button" className="admin-parks-btn" onClick={handleNew}>
              Nuevo parque
            </button>
          </header>

          {errorMessage ? <p className="admin-parks-alert">{errorMessage}</p> : null}
          {actionMessage ? <p className="admin-parks-ok">{actionMessage}</p> : null}

          <div className="admin-parks-layout">
            <aside className="admin-parks-list">
              <label>
                Buscar
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Nombre, localidad..."
                />
              </label>
              {listLoading ? <p className="admin-parks-muted">Cargando...</p> : null}
              <ul>
                {items.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      className={selectedId === row.id ? "active" : ""}
                      onClick={() => handleSelect(row)}
                    >
                      <strong>{row.name}</strong>
                      <span>
                        {row.locality} · {row.progressStatus}
                      </span>
                      <em>{row.isPublished ? "Publicado" : "Borrador"}</em>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            <form
              className="admin-parks-form"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSave();
              }}
            >
              <header>
                <h2>{selected ? `Editar #${selected.id}` : "Nuevo parque"}</h2>
                {selected ? <small>Slug: {selected.slug}</small> : null}
              </header>

              <div className="admin-parks-grid">
                <label>
                  Nombre *
                  <input value={form.name} onChange={(e) => updateForm("name", e.target.value)} />
                </label>
                <label>
                  Localidad *
                  <input
                    value={form.locality}
                    onChange={(e) => updateForm("locality", e.target.value)}
                  />
                </label>
                <label>
                  Departamento
                  <input
                    value={form.department}
                    onChange={(e) => updateForm("department", e.target.value)}
                  />
                </label>
                <label>
                  Administración
                  <input
                    value={form.administration}
                    onChange={(e) => updateForm("administration", e.target.value)}
                    placeholder="Municipal / Provincial / Privada"
                  />
                </label>
                <label>
                  Estado de avance
                  <input
                    value={form.progressStatus}
                    onChange={(e) => updateForm("progressStatus", e.target.value)}
                    placeholder="En actividad / En desarrollo..."
                  />
                </label>
                <label>
                  Estado ReNPI
                  <input
                    value={form.renpiStatus}
                    onChange={(e) => updateForm("renpiStatus", e.target.value)}
                  />
                </label>
                <label>
                  Año de creación
                  <input
                    value={form.yearCreated}
                    onChange={(e) => updateForm("yearCreated", e.target.value)}
                    inputMode="numeric"
                  />
                </label>
                <label>
                  Superficie (ha)
                  <input
                    value={form.surfaceHa}
                    onChange={(e) => updateForm("surfaceHa", e.target.value)}
                    inputMode="decimal"
                  />
                </label>
                <label>
                  Parcelas mensuradas
                  <input
                    value={form.measuredPlots}
                    onChange={(e) => updateForm("measuredPlots", e.target.value)}
                    inputMode="numeric"
                  />
                </label>
                <label>
                  Orden
                  <input
                    value={form.sortOrder}
                    onChange={(e) => updateForm("sortOrder", e.target.value)}
                    inputMode="numeric"
                  />
                </label>
                <label>
                  Slug (opcional)
                  <input value={form.slug} onChange={(e) => updateForm("slug", e.target.value)} />
                </label>
                <label className="admin-parks-check">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => updateForm("isPublished", e.target.checked)}
                  />
                  Publicado
                </label>
              </div>

              <label>
                Empresas radicadas
                <textarea
                  rows={2}
                  value={form.settledCompanies}
                  onChange={(e) => updateForm("settledCompanies", e.target.value)}
                />
              </label>
              <label>
                Obras de infraestructura
                <textarea
                  rows={3}
                  value={form.infrastructure}
                  onChange={(e) => updateForm("infrastructure", e.target.value)}
                />
              </label>
              <label>
                Observaciones
                <textarea
                  rows={3}
                  value={form.observations}
                  onChange={(e) => updateForm("observations", e.target.value)}
                />
              </label>

              <div className="admin-parks-actions">
                <button type="submit" className="admin-parks-btn" disabled={isSaving}>
                  {isSaving ? "Guardando..." : selectedId ? "Guardar cambios" : "Crear parque"}
                </button>
                {selectedId !== null ? (
                  <button
                    type="button"
                    className="admin-parks-btn danger"
                    onClick={() => void handleDelete()}
                    disabled={isSaving}
                  >
                    Eliminar
                  </button>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      </section>
    </PrivateLayout>
  );
}