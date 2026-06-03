import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PrivateLayout from "../../layouts/PrivateLayout";
import { clearAuthSession, getAuthSession } from "../../shared/auth/session";
import type { ApiResponse } from "../../shared/types/api.types";
import type {
  AdminProfileFormState,
  CompanyProfileAdminView,
  CompanyProfileAuditLogView,
  ProfileEditMode,
  ProfileFieldKey
} from "./admin-profiles.types";
import "./AdminProfilesPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const editModeOptions: Array<{ value: ProfileEditMode; label: string }> = [
  { value: "agency", label: "Gestiona Agencia" },
  { value: "company", label: "Gestiona Empresa" },
  { value: "mixed", label: "Gestión Mixta" }
];

const fieldLabels: Record<ProfileFieldKey, string> = {
  companyName: "Nombre empresa",
  contactName: "Contacto",
  contactEmail: "Email",
  phone: "Teléfono",
  taxId: "CUIT / Tax ID",
  description: "Descripción",
  sector: "Sector",
  subSector: "Subsector",
  product: "Producto",
  keywords: "Palabras clave",
  tariffPosition: "Posición arancelaria",
  exportDestinations: "Mercados destino",
  awards: "Premios",
  certifications: "Certificaciones",
  website: "Sitio web",
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  otherLink: "Otro enlace",
  address: "Dirección",
  city: "Ciudad",
  googleMapsEmbed: "Google Maps embed",
  latitude: "Latitud",
  longitude: "Longitud"
};

const visibilityFieldOrder = Object.keys(fieldLabels) as ProfileFieldKey[];

const emptyFormState: AdminProfileFormState = {
  companyName: "",
  contactName: "",
  contactEmail: "",
  phone: "",
  taxId: "",
  description: "",
  sector: "",
  subSector: "",
  product: "",
  keywords: "",
  tariffPosition: "",
  exportDestinations: "",
  awards: "",
  certifications: "",
  website: "",
  facebook: "",
  instagram: "",
  linkedin: "",
  youtube: "",
  otherLink: "",
  address: "",
  city: "",
  googleMapsEmbed: "",
  latitude: "",
  longitude: ""
};

const toFormState = (profile: CompanyProfileAdminView): AdminProfileFormState => {
  return {
    companyName: profile.companyName ?? "",
    contactName: profile.contactName ?? "",
    contactEmail: profile.contactEmail ?? "",
    phone: profile.phone ?? "",
    taxId: profile.taxId ?? "",
    description: profile.description ?? "",
    sector: profile.sector ?? "",
    subSector: profile.subSector ?? "",
    product: profile.product ?? "",
    keywords: profile.keywords ?? "",
    tariffPosition: profile.tariffPosition ?? "",
    exportDestinations: profile.exportDestinations ?? "",
    awards: profile.awards ?? "",
    certifications: profile.certifications ?? "",
    website: profile.website ?? "",
    facebook: profile.facebook ?? "",
    instagram: profile.instagram ?? "",
    linkedin: profile.linkedin ?? "",
    youtube: profile.youtube ?? "",
    otherLink: profile.otherLink ?? "",
    address: profile.address ?? "",
    city: profile.city ?? "",
    googleMapsEmbed: profile.googleMapsEmbed ?? "",
    latitude:
      typeof profile.latitude === "number" && Number.isFinite(profile.latitude)
        ? String(profile.latitude)
        : "",
    longitude:
      typeof profile.longitude === "number" && Number.isFinite(profile.longitude)
        ? String(profile.longitude)
        : ""
  };
};

const trimNullable = (value: string): string | null => {
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
};

const parseNullableNumber = (value: string): number | null => {
  const cleaned = value.trim();
  if (!cleaned) {
    return null;
  }

  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const toStatusLabel = (profile: CompanyProfileAdminView): string => {
  return profile.isPublished ? "Publicado" : "No publicado";
};

export default function AdminProfilesPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<CompanyProfileAdminView[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<CompanyProfileAdminView | null>(null);
  const [auditRows, setAuditRows] = useState<CompanyProfileAuditLogView[]>([]);
  const [formState, setFormState] = useState<AdminProfileFormState>(emptyFormState);
  const [query, setQuery] = useState("");
  const [isListLoading, setIsListLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSavingData, setIsSavingData] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const visibleFieldsCount = useMemo(() => {
    if (!selectedProfile) {
      return 0;
    }

    return Object.values(selectedProfile.visibility).filter(Boolean).length;
  }, [selectedProfile]);

  const handleUnauthorized = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  const getAuthHeader = (): string | null => {
    const token = getAuthSession()?.token;
    return token ? `Bearer ${token}` : null;
  };

  const loadProfiles = async (nextQuery?: string): Promise<void> => {
    setIsListLoading(true);
    setErrorMessage("");

    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    const search = nextQuery?.trim()
      ? `?q=${encodeURIComponent(nextQuery.trim())}`
      : "";

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/profiles${search}`, {
        headers: { Authorization: authHeader }
      });
      const result = (await response.json()) as ApiResponse<CompanyProfileAdminView[]>;

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !result.success) {
        setProfiles([]);
        setSelectedId(null);
        setSelectedProfile(null);
        setErrorMessage(result.error ?? "No se pudieron cargar los perfiles.");
        return;
      }

      const rows = Array.isArray(result.data) ? result.data : [];
      setProfiles(rows);

      const keepSelected = selectedId !== null && rows.some((row) => row.id === selectedId);
      const nextSelectedId = keepSelected ? selectedId : (rows[0]?.id ?? null);
      setSelectedId(nextSelectedId);

      if (nextSelectedId === null) {
        setSelectedProfile(null);
        setAuditRows([]);
        setFormState(emptyFormState);
      }
    } catch {
      setProfiles([]);
      setSelectedId(null);
      setSelectedProfile(null);
      setAuditRows([]);
      setErrorMessage("No se pudo conectar con el backend para cargar perfiles.");
    } finally {
      setIsListLoading(false);
    }
  };

  const loadProfileDetail = async (profileId: number): Promise<void> => {
    setIsDetailLoading(true);
    setErrorMessage("");

    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    try {
      const [detailResponse, auditResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/profiles/${profileId}`, {
          headers: { Authorization: authHeader }
        }),
        fetch(`${API_BASE_URL}/api/admin/profiles/${profileId}/audit?limit=80`, {
          headers: { Authorization: authHeader }
        })
      ]);

      const detailResult = (await detailResponse.json()) as ApiResponse<CompanyProfileAdminView>;
      const auditResult = (await auditResponse.json()) as ApiResponse<
        CompanyProfileAuditLogView[]
      >;

      if (detailResponse.status === 401 || auditResponse.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!detailResponse.ok || !detailResult.success) {
        setSelectedProfile(null);
        setAuditRows([]);
        setErrorMessage(detailResult.error ?? "No se pudo cargar el perfil.");
        return;
      }

      setSelectedProfile(detailResult.data);
      setFormState(toFormState(detailResult.data));
      setAuditRows(Array.isArray(auditResult.data) ? auditResult.data : []);
    } catch {
      setSelectedProfile(null);
      setAuditRows([]);
      setErrorMessage("No se pudo conectar con el backend para cargar el detalle.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (selectedId === null) {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProfileDetail(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const handleFormChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value
    }));
    setErrorMessage("");
    setInfoMessage("");
  };

  const handleSaveData = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!selectedProfile) {
      return;
    }

    if (
      !formState.companyName.trim() ||
      !formState.contactName.trim() ||
      !formState.contactEmail.trim()
    ) {
      setErrorMessage("Completá nombre de empresa, contacto y email.");
      return;
    }

    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    setIsSavingData(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const payload = {
        companyName: formState.companyName.trim(),
        contactName: formState.contactName.trim(),
        contactEmail: formState.contactEmail.trim(),
        phone: trimNullable(formState.phone),
        taxId: trimNullable(formState.taxId),
        description: trimNullable(formState.description),
        sector: trimNullable(formState.sector),
        subSector: trimNullable(formState.subSector),
        product: trimNullable(formState.product),
        keywords: trimNullable(formState.keywords),
        tariffPosition: trimNullable(formState.tariffPosition),
        exportDestinations: trimNullable(formState.exportDestinations),
        awards: trimNullable(formState.awards),
        certifications: trimNullable(formState.certifications),
        website: trimNullable(formState.website),
        facebook: trimNullable(formState.facebook),
        instagram: trimNullable(formState.instagram),
        linkedin: trimNullable(formState.linkedin),
        youtube: trimNullable(formState.youtube),
        otherLink: trimNullable(formState.otherLink),
        address: trimNullable(formState.address),
        city: trimNullable(formState.city),
        googleMapsEmbed: trimNullable(formState.googleMapsEmbed),
        latitude: parseNullableNumber(formState.latitude),
        longitude: parseNullableNumber(formState.longitude)
      };

      const response = await fetch(
        `${API_BASE_URL}/api/admin/profiles/${selectedProfile.id}/data`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader
          },
          body: JSON.stringify(payload)
        }
      );

      const result = (await response.json()) as ApiResponse<CompanyProfileAdminView>;

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !result.success) {
        setErrorMessage(result.error ?? "No se pudo guardar el perfil.");
        return;
      }

      setSelectedProfile(result.data);
      setFormState(toFormState(result.data));
      setInfoMessage("Datos del perfil actualizados.");
      await loadProfiles(query);
      await loadProfileDetail(result.data.id);
    } catch {
      setErrorMessage("No se pudo conectar con el backend para guardar.");
    } finally {
      setIsSavingData(false);
    }
  };

  const handleSaveSettings = async (): Promise<void> => {
    if (!selectedProfile) {
      return;
    }

    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    setIsSavingSettings(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/profiles/${selectedProfile.id}/settings`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader
          },
          body: JSON.stringify({
            editMode: selectedProfile.editMode,
            isPublished: selectedProfile.isPublished
          })
        }
      );
      const result = (await response.json()) as ApiResponse<CompanyProfileAdminView>;

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !result.success) {
        setErrorMessage(result.error ?? "No se pudo guardar la configuración.");
        return;
      }

      setSelectedProfile(result.data);
      setInfoMessage("Configuración de publicación/edición actualizada.");
      await loadProfiles(query);
      await loadProfileDetail(result.data.id);
    } catch {
      setErrorMessage("No se pudo conectar con el backend para guardar configuración.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleToggleVisibility = async (
    fieldKey: ProfileFieldKey,
    nextVisible: boolean
  ): Promise<void> => {
    if (!selectedProfile) {
      return;
    }

    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    setErrorMessage("");
    setInfoMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/profiles/${selectedProfile.id}/visibility`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader
          },
          body: JSON.stringify({
            fieldKey,
            isVisible: nextVisible
          })
        }
      );
      const result = (await response.json()) as ApiResponse<CompanyProfileAdminView>;

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !result.success) {
        setErrorMessage(result.error ?? "No se pudo actualizar visibilidad.");
        return;
      }

      setSelectedProfile(result.data);
      setInfoMessage(`Visibilidad actualizada: ${fieldLabels[fieldKey]}.`);
      await loadProfileDetail(result.data.id);
    } catch {
      setErrorMessage("No se pudo conectar con el backend para actualizar visibilidad.");
    }
  };

  return (
    <PrivateLayout>
      <section className="admin-profiles-page">
        <div className="admin-profiles-shell">
          <header className="admin-profiles-header">
            <p>Perfiles de empresas</p>
            <h1>Gestión de ficha, visibilidad y auditoría</h1>
            <small>
              Configurá qué puede editar la empresa y qué campos se publican sin exponer
              datos ocultos.
            </small>
          </header>

          {errorMessage ? <p className="admin-profiles-feedback error">{errorMessage}</p> : null}
          {infoMessage ? <p className="admin-profiles-feedback info">{infoMessage}</p> : null}

          <div className="admin-profiles-grid">
            <aside className="profiles-list-card">
              <div className="profiles-list-toolbar">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar por empresa/sector/producto"
                />
                <button
                  type="button"
                  onClick={() => void loadProfiles(query)}
                  disabled={isListLoading}
                >
                  {isListLoading ? "Cargando..." : "Buscar"}
                </button>
              </div>

              {isListLoading ? <p className="list-feedback">Cargando perfiles...</p> : null}

              {!isListLoading && profiles.length === 0 ? (
                <p className="list-feedback">No hay perfiles disponibles.</p>
              ) : null}

              <ul className="profiles-list">
                {profiles.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(row.id)}
                      className={selectedId === row.id ? "profile-row active" : "profile-row"}
                    >
                      <strong>{row.companyName}</strong>
                      <small>{row.contactEmail}</small>
                      <small>{toStatusLabel(row)}</small>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            <section className="profile-detail-card">
              {isDetailLoading ? (
                <p className="detail-feedback">Cargando detalle del perfil...</p>
              ) : null}

              {!isDetailLoading && !selectedProfile ? (
                <p className="detail-feedback">
                  Seleccioná un perfil para editar datos, publicación y visibilidad.
                </p>
              ) : null}

              {!isDetailLoading && selectedProfile ? (
                <div className="profile-detail-content">
                  <header className="profile-detail-header">
                    <h2>{selectedProfile.companyName}</h2>
                    <small>
                      {toStatusLabel(selectedProfile)} · {visibleFieldsCount} campos visibles
                    </small>
                  </header>

                  <section className="settings-card">
                    <h3>Configuración general</h3>
                    <div className="settings-grid">
                      <label>
                        Modo de edición
                        <select
                          value={selectedProfile.editMode}
                          onChange={(event) =>
                            setSelectedProfile((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    editMode: event.target.value as ProfileEditMode
                                  }
                                : prev
                            )
                          }
                        >
                          {editModeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="settings-publish">
                        <input
                          type="checkbox"
                          checked={selectedProfile.isPublished}
                          onChange={(event) =>
                            setSelectedProfile((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    isPublished: event.target.checked
                                  }
                                : prev
                            )
                          }
                        />
                        <span>Perfil publicado</span>
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleSaveSettings()}
                      disabled={isSavingSettings}
                    >
                      {isSavingSettings ? "Guardando..." : "Guardar configuración"}
                    </button>
                  </section>

                  <form className="admin-profile-form" onSubmit={handleSaveData}>
                    <section className="settings-card">
                      <h3>Datos del perfil</h3>
                      <div className="form-grid">
                        <label>
                          Nombre empresa *
                          <input
                            name="companyName"
                            value={formState.companyName}
                            onChange={handleFormChange}
                          />
                        </label>
                        <label>
                          Contacto *
                          <input
                            name="contactName"
                            value={formState.contactName}
                            onChange={handleFormChange}
                          />
                        </label>
                        <label>
                          Email *
                          <input
                            name="contactEmail"
                            value={formState.contactEmail}
                            onChange={handleFormChange}
                          />
                        </label>
                        <label>
                          Teléfono
                          <input
                            name="phone"
                            value={formState.phone}
                            onChange={handleFormChange}
                          />
                        </label>
                        <label>
                          Sector
                          <input
                            name="sector"
                            value={formState.sector}
                            onChange={handleFormChange}
                          />
                        </label>
                        <label>
                          Subsector
                          <input
                            name="subSector"
                            value={formState.subSector}
                            onChange={handleFormChange}
                          />
                        </label>
                        <label>
                          Producto
                          <input
                            name="product"
                            value={formState.product}
                            onChange={handleFormChange}
                          />
                        </label>
                        <label>
                          Keywords
                          <input
                            name="keywords"
                            value={formState.keywords}
                            onChange={handleFormChange}
                          />
                        </label>
                        <label>
                          Ciudad
                          <input
                            name="city"
                            value={formState.city}
                            onChange={handleFormChange}
                          />
                        </label>
                        <label>
                          Dirección
                          <input
                            name="address"
                            value={formState.address}
                            onChange={handleFormChange}
                          />
                        </label>
                        <label>
                          Latitud
                          <input
                            name="latitude"
                            value={formState.latitude}
                            onChange={handleFormChange}
                          />
                        </label>
                        <label>
                          Longitud
                          <input
                            name="longitude"
                            value={formState.longitude}
                            onChange={handleFormChange}
                          />
                        </label>
                        <label className="full">
                          Descripción
                          <textarea
                            rows={3}
                            name="description"
                            value={formState.description}
                            onChange={handleFormChange}
                          />
                        </label>
                      </div>
                      <button type="submit" disabled={isSavingData}>
                        {isSavingData ? "Guardando..." : "Guardar datos"}
                      </button>
                    </section>
                  </form>

                  <section className="settings-card">
                    <h3>Visibilidad por campo</h3>
                    <div className="visibility-grid">
                      {visibilityFieldOrder.map((fieldKey) => (
                        <label key={fieldKey}>
                          <input
                            type="checkbox"
                            checked={selectedProfile.visibility[fieldKey]}
                            onChange={(event) =>
                              void handleToggleVisibility(fieldKey, event.target.checked)
                            }
                          />
                          <span>{fieldLabels[fieldKey]}</span>
                        </label>
                      ))}
                    </div>
                  </section>

                  <section className="settings-card">
                    <h3>Auditoría</h3>
                    {auditRows.length === 0 ? (
                      <p className="audit-empty">Sin eventos registrados para este perfil.</p>
                    ) : (
                      <ul className="audit-list">
                        {auditRows.map((row) => (
                          <li key={row.id}>
                            <div>
                              <strong>{row.action}</strong>
                              <small>{new Date(row.createdAt).toLocaleString("es-AR")}</small>
                            </div>
                            <p>
                              {row.fieldKey ? `Campo: ${row.fieldKey} · ` : ""}
                              {row.oldValue ? `Antes: ${row.oldValue}` : ""}
                              {row.oldValue && row.newValue ? " → " : ""}
                              {row.newValue ? `Ahora: ${row.newValue}` : ""}
                            </p>
                            <small>{row.actorEmail ?? "Sistema"}</small>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </section>
    </PrivateLayout>
  );
}
