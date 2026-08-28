import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PrivateLayout from "../../../layouts/PrivateLayout";
import ImageField from "../../../shared/components/ImageField/ImageField";
import { clearAuthSession, getAuthSession } from "../../../shared/auth/session";
import type { ApiResponse } from "../../../shared/types/api.types";
import type {
  InvestmentInquiryStatus,
  InvestmentInquiryView,
  InvestmentOpportunityDetailView,
  InvestmentOpportunityStatus,
  InvestmentOpportunityType
} from "../../../shared/types/investment-opportunity.types";
import {
  opportunityStatusLabel,
  opportunityStatusOptions,
  opportunityTypeLabel,
  opportunityTypeOptions
} from "../../../shared/types/investment-opportunity.types";
import "./AdminInvestmentOpportunitiesPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

type TabKey = "opportunities" | "inquiries";

type AssetDraft = {
  kind: "gallery" | "document";
  url: string;
  label: string;
};

type OpportunityForm = {
  title: string;
  shortDescription: string;
  fullDescription: string;
  sector: string;
  locality: string;
  type: InvestmentOpportunityType;
  status: InvestmentOpportunityStatus;
  estimatedInvestment: string;
  mainImageUrl: string;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  slug: string;
  gallery: AssetDraft[];
  documents: AssetDraft[];
};

const emptyForm = (): OpportunityForm => ({
  title: "",
  shortDescription: "",
  fullDescription: "",
  sector: "",
  locality: "",
  type: "inversiones",
  status: "licitacion_vigente",
  estimatedInvestment: "",
  mainImageUrl: "",
  isFeatured: false,
  isPublished: false,
  sortOrder: 0,
  slug: "",
  gallery: [],
  documents: []
});

const fromOpportunity = (row: InvestmentOpportunityDetailView): OpportunityForm => ({
  title: row.title,
  shortDescription: row.shortDescription ?? "",
  fullDescription: row.fullDescription,
  sector: row.sector,
  locality: row.locality,
  type: row.type,
  status: row.status,
  estimatedInvestment: row.estimatedInvestment ?? "",
  mainImageUrl: row.mainImageUrl,
  isFeatured: row.isFeatured,
  isPublished: row.isPublished,
  sortOrder: row.sortOrder,
  slug: row.slug,
  gallery: row.gallery.map((asset) => ({
    kind: "gallery",
    url: asset.url,
    label: asset.label ?? ""
  })),
  documents: row.documents.map((asset) => ({
    kind: "document",
    url: asset.url,
    label: asset.label ?? ""
  }))
});

const inquiryStatusLabel: Record<InvestmentInquiryStatus, string> = {
  pending: "Pendiente",
  in_review: "En revisión",
  resolved: "Resuelta",
  rejected: "Rechazada"
};

export default function AdminInvestmentOpportunitiesPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("opportunities");
  const [items, setItems] = useState<InvestmentOpportunityDetailView[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<OpportunityForm>(emptyForm());
  const [searchTerm, setSearchTerm] = useState("");
  const [listLoading, setListLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const [inquiries, setInquiries] = useState<InvestmentInquiryView[]>([]);
  const [inquiryFilter, setInquiryFilter] = useState<InvestmentInquiryStatus | "all">("pending");
  const [selectedInquiryId, setSelectedInquiryId] = useState<number | null>(null);
  const [inquiryNotes, setInquiryNotes] = useState("");
  const [inquiryStatus, setInquiryStatus] = useState<InvestmentInquiryStatus>("pending");
  const [inquiriesLoading, setInquiriesLoading] = useState(false);

  const selected = useMemo(
    () => items.find((row) => row.id === selectedId) ?? null,
    [items, selectedId]
  );
  const selectedInquiry = useMemo(
    () => inquiries.find((row) => row.id === selectedInquiryId) ?? null,
    [inquiries, selectedInquiryId]
  );

  const handleUnauthorized = useCallback(() => {
    clearAuthSession();
    navigate("/login", { replace: true });
  }, [navigate]);

  const getAuthHeader = useCallback((): string | null => {
    const token = getAuthSession()?.token;
    return token ? `Bearer ${token}` : null;
  }, []);

  const loadOpportunities = useCallback(async (): Promise<void> => {
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
        `${API_BASE_URL}/api/admin/investment-opportunities${query ? `?${query}` : ""}`,
        { headers: { Authorization: authHeader } }
      );
      const payload = (await response.json()) as ApiResponse<InvestmentOpportunityDetailView[]>;

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !payload.success) {
        setItems([]);
        setErrorMessage(payload.error ?? "No se pudieron cargar las oportunidades.");
        return;
      }

      const rows = Array.isArray(payload.data) ? payload.data : [];
      setItems(rows);
      if (selectedId !== null && !rows.some((row) => row.id === selectedId)) {
        setSelectedId(rows[0]?.id ?? null);
        setForm(rows[0] ? fromOpportunity(rows[0]) : emptyForm());
      }
    } catch {
      setItems([]);
      setErrorMessage("No se pudo conectar con el backend de oportunidades.");
    } finally {
      setListLoading(false);
    }
  }, [getAuthHeader, handleUnauthorized, searchTerm, selectedId]);

  const loadInquiries = useCallback(async (): Promise<void> => {
    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    setInquiriesLoading(true);
    try {
      const params = new URLSearchParams();
      if (inquiryFilter !== "all") params.set("status", inquiryFilter);
      const query = params.toString();
      const response = await fetch(
        `${API_BASE_URL}/api/admin/investment-opportunities/inquiries${query ? `?${query}` : ""}`,
        { headers: { Authorization: authHeader } }
      );
      const payload = (await response.json()) as ApiResponse<InvestmentInquiryView[]>;

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !payload.success) {
        setInquiries([]);
        setErrorMessage(payload.error ?? "No se pudieron cargar las consultas.");
        return;
      }

      const rows = Array.isArray(payload.data) ? payload.data : [];
      setInquiries(rows);
      const next = rows.find((row) => row.id === selectedInquiryId) ?? rows[0] ?? null;
      setSelectedInquiryId(next?.id ?? null);
      setInquiryStatus(next?.status ?? "pending");
      setInquiryNotes(next?.adminNotes ?? "");
    } catch {
      setInquiries([]);
      setErrorMessage("No se pudo conectar con el backend de consultas.");
    } finally {
      setInquiriesLoading(false);
    }
  }, [getAuthHeader, handleUnauthorized, inquiryFilter, selectedInquiryId]);

  useEffect(() => {
    if (tab === "opportunities") {
      void loadOpportunities();
    } else {
      void loadInquiries();
    }
  }, [loadInquiries, loadOpportunities, tab]);

  const updateForm = <K extends keyof OpportunityForm>(key: K, value: OpportunityForm[K]) => {
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

  const handleSelect = (row: InvestmentOpportunityDetailView) => {
    setSelectedId(row.id);
    setForm(fromOpportunity(row));
    setActionMessage("");
    setErrorMessage("");
  };

  const buildPayload = () => ({
    title: form.title.trim(),
    shortDescription: form.shortDescription.trim() || null,
    fullDescription: form.fullDescription.trim(),
    sector: form.sector.trim(),
    locality: form.locality.trim(),
    type: form.type,
    status: form.status,
    estimatedInvestment: form.estimatedInvestment.trim() || null,
    mainImageUrl: form.mainImageUrl.trim(),
    isFeatured: form.isFeatured,
    isPublished: form.isPublished,
    sortOrder: Number(form.sortOrder) || 0,
    slug: form.slug.trim() || null,
    assets: [
      ...form.gallery
        .filter((asset) => asset.url.trim())
        .map((asset, index) => ({
          kind: "gallery" as const,
          url: asset.url.trim(),
          label: asset.label.trim() || null,
          sortOrder: index
        })),
      ...form.documents
        .filter((asset) => asset.url.trim())
        .map((asset, index) => ({
          kind: "document" as const,
          url: asset.url.trim(),
          label: asset.label.trim() || null,
          sortOrder: index
        }))
    ]
  });

  const handleSave = async (): Promise<void> => {
    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    if (
      !form.title.trim() ||
      !form.fullDescription.trim() ||
      !form.sector.trim() ||
      !form.locality.trim() ||
      !form.mainImageUrl.trim()
    ) {
      setErrorMessage("Completá título, descripción completa, sector, localidad e imagen principal.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setActionMessage("");

    try {
      const isEdit = selectedId !== null;
      const response = await fetch(
        isEdit
          ? `${API_BASE_URL}/api/admin/investment-opportunities/${selectedId}`
          : `${API_BASE_URL}/api/admin/investment-opportunities`,
        {
          method: isEdit ? "PATCH" : "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(buildPayload())
        }
      );
      const payload = (await response.json()) as ApiResponse<InvestmentOpportunityDetailView>;

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !payload.success || !payload.data) {
        setErrorMessage(payload.error ?? "No se pudo guardar la oportunidad.");
        return;
      }

      setActionMessage(isEdit ? "Oportunidad actualizada." : "Oportunidad creada.");
      setSelectedId(payload.data.id);
      setForm(fromOpportunity(payload.data));
      await loadOpportunities();
    } catch {
      setErrorMessage("No se pudo conectar para guardar la oportunidad.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (selectedId === null) return;
    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }
    if (!window.confirm("¿Eliminar esta oportunidad?")) return;

    setIsSaving(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/investment-opportunities/${selectedId}`,
        {
          method: "DELETE",
          headers: { Authorization: authHeader }
        }
      );
      const payload = (await response.json()) as ApiResponse<unknown>;
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok || !payload.success) {
        setErrorMessage(payload.error ?? "No se pudo eliminar.");
        return;
      }
      setSelectedId(null);
      setForm(emptyForm());
      setActionMessage("Oportunidad eliminada.");
      await loadOpportunities();
    } catch {
      setErrorMessage("No se pudo conectar para eliminar.");
    } finally {
      setIsSaving(false);
    }
  };

  const uploadDocument = async (file: File): Promise<string | null> => {
    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return null;
    }
    const body = new FormData();
    body.append("file", file);
    const response = await fetch(`${API_BASE_URL}/api/uploads/opportunity-document`, {
      method: "POST",
      headers: { Authorization: authHeader },
      body
    });
    const payload = (await response.json()) as ApiResponse<{ url: string }>;
    if (!response.ok || !payload.success || !payload.data?.url) {
      setErrorMessage(payload.error ?? "No se pudo subir el documento.");
      return null;
    }
    return payload.data.url;
  };

  const handleSaveInquiry = async (): Promise<void> => {
    if (!selectedInquiry) return;
    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/investment-opportunities/inquiries/${selectedInquiry.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            status: inquiryStatus,
            adminNotes: inquiryNotes.trim() || null
          })
        }
      );
      const payload = (await response.json()) as ApiResponse<InvestmentInquiryView>;
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok || !payload.success) {
        setErrorMessage(payload.error ?? "No se pudo actualizar la consulta.");
        return;
      }
      setActionMessage("Consulta actualizada.");
      await loadInquiries();
    } catch {
      setErrorMessage("No se pudo conectar para actualizar la consulta.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PrivateLayout>
      <section className="admin-investment-opportunities-page">
        <div className="admin-investment-opportunities-shell">
          <header className="admin-investment-opportunities-header">
            <p>Administración</p>
            <h1>Oportunidades de inversión</h1>
            <small>
              Cargá, editá, publicá y destacá oportunidades del micrositio. También gestioná las
              consultas recibidas.
            </small>
          </header>

          <div className="admin-investment-opportunities-tabs">
            <button
              type="button"
              className={tab === "opportunities" ? "active" : ""}
              onClick={() => setTab("opportunities")}
            >
              Oportunidades
            </button>
            <button
              type="button"
              className={tab === "inquiries" ? "active" : ""}
              onClick={() => setTab("inquiries")}
            >
              Consultas
            </button>
          </div>

          {errorMessage ? <p className="admin-investment-alert admin-investment-alert-error">{errorMessage}</p> : null}
          {actionMessage ? <p className="admin-investment-alert admin-investment-alert-success">{actionMessage}</p> : null}

          {tab === "opportunities" ? (
            <div className="admin-investment-opportunities-grid">
              <aside className="admin-investment-list-card">
                <div className="admin-investment-actions" >
                  <button type="button" onClick={handleNew}>
                    Nueva oportunidad
                  </button>
                </div>
                <label>
                  Buscar
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Título, localidad, sector..."
                  />
                </label>
                <div className="admin-investment-list" >
                  {listLoading ? <p className="admin-investment-meta">Cargando...</p> : null}
                  {!listLoading && items.length === 0 ? (
                    <p className="admin-investment-meta">No hay oportunidades todavía.</p>
                  ) : null}
                  {items.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      className={`admin-investment-list-item${selectedId === row.id ? " active" : ""}`}
                      onClick={() => handleSelect(row)}
                    >
                      <strong>{row.title}</strong>
                      <span>
                        {opportunityTypeLabel[row.type]} · {opportunityStatusLabel[row.status]}
                      </span>
                      <span>
                        {row.isPublished ? "Publicada" : "Borrador"}
                        {row.isFeatured ? " · Destacada" : ""} · orden {row.sortOrder}
                      </span>
                    </button>
                  ))}
                </div>
              </aside>

              <div className="admin-investment-form-card">
                <form
                  className="admin-investment-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleSave();
                  }}
                >
                  <div className="admin-investment-form-grid">
                    <label>
                      Título *
                      <input
                        value={form.title}
                        onChange={(event) => updateForm("title", event.target.value)}
                        required
                      />
                    </label>
                    <label>
                      Slug (opcional)
                      <input
                        value={form.slug}
                        onChange={(event) => updateForm("slug", event.target.value)}
                        placeholder="se genera solo si lo dejás vacío"
                      />
                    </label>
                  </div>

                  <label>
                    Descripción corta
                    <textarea
                      value={form.shortDescription}
                      onChange={(event) => updateForm("shortDescription", event.target.value)}
                    />
                  </label>

                  <label>
                    Descripción completa *
                    <textarea
                      value={form.fullDescription}
                      onChange={(event) => updateForm("fullDescription", event.target.value)}
                      required
                    />
                  </label>

                  <div className="admin-investment-form-grid">
                    <label>
                      Sector *
                      <input
                        value={form.sector}
                        onChange={(event) => updateForm("sector", event.target.value)}
                        required
                      />
                    </label>
                    <label>
                      Localidad *
                      <input
                        value={form.locality}
                        onChange={(event) => updateForm("locality", event.target.value)}
                        required
                      />
                    </label>
                    <label>
                      Tipo *
                      <select
                        value={form.type}
                        onChange={(event) =>
                          updateForm("type", event.target.value as InvestmentOpportunityType)
                        }
                      >
                        {opportunityTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Estado *
                      <select
                        value={form.status}
                        onChange={(event) =>
                          updateForm("status", event.target.value as InvestmentOpportunityStatus)
                        }
                      >
                        {opportunityStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Inversión estimada
                      <input
                        value={form.estimatedInvestment}
                        onChange={(event) => updateForm("estimatedInvestment", event.target.value)}
                      />
                    </label>
                    <label>
                      Orden
                      <input
                        type="number"
                        value={form.sortOrder}
                        onChange={(event) =>
                          updateForm("sortOrder", Number.parseInt(event.target.value, 10) || 0)
                        }
                      />
                    </label>
                  </div>

                  <ImageField
                    label="Imagen principal *"
                    value={form.mainImageUrl}
                    onChange={(next) => updateForm("mainImageUrl", next)}
                    kind="opportunity-image"
                    helpText="Subí JPG/PNG/WEBP (máx. 5 MB) o pegá una URL."
                  />

                  <div className="admin-investment-checks">
                    <label>
                      <input
                        type="checkbox"
                        checked={form.isPublished}
                        onChange={(event) => updateForm("isPublished", event.target.checked)}
                      />
                      Publicada
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={form.isFeatured}
                        onChange={(event) => updateForm("isFeatured", event.target.checked)}
                      />
                      Destacada
                    </label>
                  </div>

                  <div className="admin-investment-assets">
                    <strong>Galería</strong>
                    {form.gallery.map((asset, index) => (
                      <div key={`g-${index}`} className="admin-investment-asset-row">
                        <input
                          value={asset.label}
                          placeholder="Etiqueta"
                          onChange={(event) => {
                            const next = [...form.gallery];
                            next[index] = { ...asset, label: event.target.value };
                            updateForm("gallery", next);
                          }}
                        />
                        <input
                          value={asset.url}
                          placeholder="URL imagen"
                          onChange={(event) => {
                            const next = [...form.gallery];
                            next[index] = { ...asset, url: event.target.value };
                            updateForm("gallery", next);
                          }}
                        />
                        <button
                          type="button"
                          className="admin-investment-btn admin-investment-btn-ghost"
                          onClick={() =>
                            updateForm(
                              "gallery",
                              form.gallery.filter((_, i) => i !== index)
                            )
                          }
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="admin-investment-btn admin-investment-btn-ghost"
                      onClick={() =>
                        updateForm("gallery", [
                          ...form.gallery,
                          { kind: "gallery", url: "", label: "" }
                        ])
                      }
                    >
                      Agregar imagen de galería
                    </button>
                  </div>

                  <div className="admin-investment-assets">
                    <strong>Documentos</strong>
                    {form.documents.map((asset, index) => (
                      <div key={`d-${index}`} className="admin-investment-asset-row">
                        <input
                          value={asset.label}
                          placeholder="Nombre del documento"
                          onChange={(event) => {
                            const next = [...form.documents];
                            next[index] = { ...asset, label: event.target.value };
                            updateForm("documents", next);
                          }}
                        />
                        <input
                          value={asset.url}
                          placeholder="URL documento"
                          onChange={(event) => {
                            const next = [...form.documents];
                            next[index] = { ...asset, url: event.target.value };
                            updateForm("documents", next);
                          }}
                        />
                        <button
                          type="button"
                          className="admin-investment-btn admin-investment-btn-ghost"
                          onClick={() =>
                            updateForm(
                              "documents",
                              form.documents.filter((_, i) => i !== index)
                            )
                          }
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
                    <label className="admin-investment-btn admin-investment-btn-ghost" style={{ width: "fit-content" }}>
                      Subir documento
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        hidden
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          if (!file) return;
                          void (async () => {
                            const url = await uploadDocument(file);
                            if (!url) return;
                            updateForm("documents", [
                              ...form.documents,
                              { kind: "document", url, label: file.name }
                            ]);
                          })();
                        }}
                      />
                    </label>
                  </div>

                  <div className="admin-investment-actions">
                    <button type="submit" disabled={isSaving}>
                      {isSaving ? "Guardando..." : selectedId ? "Guardar cambios" : "Crear oportunidad"}
                    </button>
                    {selectedId ? (
                      <button type="button" className="admin-investment-btn-danger" onClick={() => void handleDelete()}>
                        Eliminar
                      </button>
                    ) : null}
                    {selected ? (
                      <a
                        className="admin-investment-btn admin-investment-btn-ghost"
                        href={`/oportunidades-de-inversion/${selected.slug}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ver pública
                      </a>
                    ) : null}
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="admin-investment-opportunities-grid">
              <aside className="admin-investment-list-card">
                <label>
                  Estado
                  <select
                    value={inquiryFilter}
                    onChange={(event) =>
                      setInquiryFilter(event.target.value as InvestmentInquiryStatus | "all")
                    }
                  >
                    <option value="all">Todos</option>
                    <option value="pending">Pendiente</option>
                    <option value="in_review">En revisión</option>
                    <option value="resolved">Resuelta</option>
                    <option value="rejected">Rechazada</option>
                  </select>
                </label>
                <div className="admin-investment-list" >
                  {inquiriesLoading ? <p className="admin-investment-meta">Cargando...</p> : null}
                  {!inquiriesLoading && inquiries.length === 0 ? (
                    <p className="admin-investment-meta">No hay consultas.</p>
                  ) : null}
                  {inquiries.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      className={`admin-investment-list-item${selectedInquiryId === row.id ? " active" : ""}`}
                      onClick={() => {
                        setSelectedInquiryId(row.id);
                        setInquiryStatus(row.status);
                        setInquiryNotes(row.adminNotes ?? "");
                        setActionMessage("");
                      }}
                    >
                      <strong>{row.requesterName}</strong>
                      <span>{row.opportunityTitle}</span>
                      <span>
                        {inquiryStatusLabel[row.status]} · {row.requesterEmail}
                      </span>
                    </button>
                  ))}
                </div>
              </aside>

              <div className="admin-investment-form-card">
                {selectedInquiry ? (
                  <div className="admin-investment-form">
                    <h2 style={{ margin: 0 }}>{selectedInquiry.opportunityTitle}</h2>
                    <p className="admin-investment-meta">
                      {selectedInquiry.requesterName} · {selectedInquiry.requesterEmail}
                      {selectedInquiry.requesterPhone ? ` · ${selectedInquiry.requesterPhone}` : ""}
                    </p>
                    <p>{selectedInquiry.message}</p>
                    <label>
                      Estado
                      <select
                        value={inquiryStatus}
                        onChange={(event) =>
                          setInquiryStatus(event.target.value as InvestmentInquiryStatus)
                        }
                      >
                        <option value="pending">Pendiente</option>
                        <option value="in_review">En revisión</option>
                        <option value="resolved">Resuelta</option>
                        <option value="rejected">Rechazada</option>
                      </select>
                    </label>
                    <label>
                      Notas internas
                      <textarea
                        value={inquiryNotes}
                        onChange={(event) => setInquiryNotes(event.target.value)}
                      />
                    </label>
                    <div className="admin-investment-actions">
                      <button type="button" disabled={isSaving} onClick={() => void handleSaveInquiry()}>
                        {isSaving ? "Guardando..." : "Guardar consulta"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="admin-investment-meta">Seleccioná una consulta.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </PrivateLayout>
  );
}
