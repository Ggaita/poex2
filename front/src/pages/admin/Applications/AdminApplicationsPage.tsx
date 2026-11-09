import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PrivateLayout from "../../../layouts/PrivateLayout";
import {
  clearAuthSession,
  getAuthSession,
  getStoredReviewerName,
  setStoredReviewerName
} from "../../../shared/auth/session";
import type { ApiResponse } from "../../../shared/types/api.types";
import type {
  ApplicationStatus,
  CompanyApplication,
  StatusFilter
} from "./admin-applications.types";
import "./AdminApplicationsPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const statusLabel: Record<ApplicationStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada"
};

const formatDate = (value?: string): string => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
};

type AttachmentFile = {
  title?: string;
  description?: string;
  url?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
};

type ApplicationMessageDetails = {
  address?: string;
  city?: string;
  description?: string;
  representativeRole?: string;
  representativeEmail?: string;
  sector?: string;
  chamberMembership?: string;
  chamberNames?: string;
  product?: string;
  keywords?: string;
  tariffPosition?: string;
  exportDestinations?: string;
  awards?: string;
  certifications?: string;
  links?: {
    logo?: string;
    website?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
    other?: string;
  };
  geo?: {
    latitude?: number | string | null;
    longitude?: number | string | null;
  };
  attachments?: {
    logo?: AttachmentFile | null;
    hasCatalog?: string;
    catalog?: AttachmentFile[];
    hasProductPhotos?: string;
    productPhotos?: AttachmentFile[];
    hasCompanyPhotos?: string;
    companyPhotos?: AttachmentFile[];
  };
};

const parseJsonMessage = (message?: string): ApplicationMessageDetails | null => {
  if (!message) {
    return null;
  }

  try {
    const parsed = JSON.parse(message) as unknown;
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as ApplicationMessageDetails;
    }
    return null;
  } catch {
    return null;
  }
};

const resolveAssetUrl = (url?: string): string | null => {
  if (!url || !url.trim()) {
    return null;
  }
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  const base = API_BASE_URL.replace(/\/$/, "");
  return url.startsWith("/") ? `${base}${url}` : `${base}/${url}`;
};

const formatFileSize = (size?: number): string => {
  if (typeof size !== "number" || !Number.isFinite(size)) {
    return "";
  }
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const isImageAttachment = (item: AttachmentFile): boolean => {
  if (item.mimeType?.startsWith("image/")) {
    return true;
  }
  const name = item.originalName ?? item.url ?? "";
  return /\.(jpe?g|png|webp)$/i.test(name);
};

export default function AdminApplicationsPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [applications, setApplications] = useState<CompanyApplication[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selectedIdRef = useRef<number | null>(null);
  const [selectedApplication, setSelectedApplication] =
    useState<CompanyApplication | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [issuedAccess, setIssuedAccess] = useState<{
    loginEmail: string;
    temporaryPassword?: string;
    passwordWasChosenByApplicant: boolean;
  } | null>(null);
  const [copyFeedback, setCopyFeedback] = useState("");
  const [reviewedBy] = useState(() => {
    return (
      getStoredReviewerName() ??
      getAuthSession()?.displayName ??
      "Administrador POEX"
    );
  });
  const [rejectionReason, setRejectionReason] = useState("");
  const authenticatedReviewer = getAuthSession()?.displayName ?? reviewedBy;

  const messageJson = useMemo(
    () => parseJsonMessage(selectedApplication?.message),
    [selectedApplication?.message]
  );

  const handleUnauthorized = useCallback(() => {
    clearAuthSession();
    navigate("/login", { replace: true });
  }, [navigate]);

  const getAuthHeader = useCallback((): string | null => {
    const token = getAuthSession()?.token;
    if (!token) {
      return null;
    }

    return `Bearer ${token}`;
  }, []);

  const loadApplicationDetail = useCallback(
    async (id: number): Promise<void> => {
      const authHeader = getAuthHeader();
      if (!authHeader) {
        handleUnauthorized();
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/applications/${id}`, {
          headers: {
            Authorization: authHeader
          }
        });
        const result = (await response.json()) as ApiResponse<CompanyApplication>;

        if (response.status === 401) {
          handleUnauthorized();
          return;
        }

        if (!response.ok) {
          setSelectedApplication(null);
          setErrorMessage(result.error ?? "No se pudo cargar el detalle de la solicitud.");
          return;
        }

        setSelectedApplication(result.data);
      } catch {
        setSelectedApplication(null);
        setErrorMessage("No se pudo conectar con el backend para cargar el detalle.");
      } finally {
        setDetailLoading(false);
      }
    },
    [getAuthHeader, handleUnauthorized]
  );

  const loadApplications = useCallback(
    async (filter: StatusFilter): Promise<void> => {
      const authHeader = getAuthHeader();
      if (!authHeader) {
        handleUnauthorized();
        return;
      }

      try {
        const query = filter === "all" ? "" : `?status=${filter}`;
        const response = await fetch(`${API_BASE_URL}/api/admin/applications${query}`, {
          headers: {
            Authorization: authHeader
          }
        });
        const result = (await response.json()) as ApiResponse<CompanyApplication[]>;

        if (response.status === 401) {
          handleUnauthorized();
          return;
        }

        if (!response.ok) {
          setApplications([]);
          selectedIdRef.current = null;
          setSelectedId(null);
          setSelectedApplication(null);
          setDetailLoading(false);
          setErrorMessage(result.error ?? "No se pudieron cargar las solicitudes.");
          return;
        }

        const rows = Array.isArray(result.data) ? result.data : [];
        setApplications(rows);

        const currentSelectedId = selectedIdRef.current;
        const keepCurrent =
          currentSelectedId !== null && rows.some((item) => item.id === currentSelectedId);
        const nextSelectedId = keepCurrent ? currentSelectedId : (rows[0]?.id ?? null);

        selectedIdRef.current = nextSelectedId;
        setSelectedId(nextSelectedId);

        if (nextSelectedId === null) {
          setSelectedApplication(null);
          setDetailLoading(false);
          return;
        }

        setSelectedApplication(null);
        setDetailLoading(true);
        void loadApplicationDetail(nextSelectedId);
      } catch {
        setApplications([]);
        selectedIdRef.current = null;
        setSelectedId(null);
        setSelectedApplication(null);
        setDetailLoading(false);
        setErrorMessage("No se pudo conectar con el backend para cargar solicitudes.");
      } finally {
        setListLoading(false);
      }
    },
    [getAuthHeader, handleUnauthorized, loadApplicationDetail]
  );

  const handleUpdateStatus = async (
    nextStatus: Exclude<ApplicationStatus, "pending">
  ): Promise<void> => {
    if (!selectedApplication || selectedApplication.status !== "pending") {
      return;
    }

    const reviewer = authenticatedReviewer.trim();
    if (!reviewer) {
      setErrorMessage("No se pudo identificar el usuario autenticado para revisar.");
      return;
    }

    if (nextStatus === "rejected" && !rejectionReason.trim()) {
      setErrorMessage("Para rechazar, indicá un motivo.");
      return;
    }

    setIsUpdatingStatus(true);
    setErrorMessage("");
    setActionMessage("");

    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      setIsUpdatingStatus(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/applications/${selectedApplication.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader
          },
          body: JSON.stringify({
            status: nextStatus,
            rejectionReason:
              nextStatus === "rejected" ? rejectionReason.trim() : undefined
          })
        }
      );

      const result = (await response.json()) as ApiResponse<{
        application: CompanyApplication;
        access?: {
          loginEmail: string;
          temporaryPassword?: string;
          passwordWasChosenByApplicant: boolean;
        };
      }>;

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !result.data?.application) {
        setErrorMessage(result.error ?? "No se pudo actualizar el estado.");
        return;
      }
      setStoredReviewerName(reviewer);
      setSelectedApplication(result.data.application);
      if (nextStatus === "approved") {
        setIssuedAccess(result.data.access ?? null);
        setCopyFeedback("");
        setRejectionReason("");
        setActionMessage(
          result.data.access?.temporaryPassword
            ? "Solicitud aprobada. Copiá la clave generada abajo si vas a enviarla manualmente."
            : result.data.access?.passwordWasChosenByApplicant
              ? "Solicitud aprobada. El solicitante eligió su propia contraseña (no se puede ver)."
              : "Solicitud aprobada correctamente."
        );
      } else {
        setIssuedAccess(null);
        setActionMessage("Solicitud rechazada correctamente.");
      }
      await loadApplications(statusFilter);
    } catch {
      setErrorMessage("No se pudo conectar con el backend para actualizar el estado.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadApplications(statusFilter);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadApplications, statusFilter]);

  return (
    <PrivateLayout>
      <section className="admin-applications-page">
        <div className="admin-shell">
          <header className="admin-header">
            <p>Panel de administración</p>
            <h1>Gestión de solicitudes de registro</h1>
            <small>
              Revisá solicitudes pendientes y ejecutá el flujo de aprobación o rechazo.
            </small>
          </header>

          {errorMessage ? (
            <p className="admin-alert admin-alert-error" role="alert">
              {errorMessage}
            </p>
          ) : null}
          {actionMessage ? (
            <p className="admin-alert admin-alert-success" role="status">
              {actionMessage}
            </p>
          ) : null}

          <div className="admin-grid">
            <aside className="applications-list-card">
              <div className="list-toolbar">
                <label>
                  Estado
                  <select
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value as StatusFilter);
                      setErrorMessage("");
                      setSelectedApplication(null);
                      setDetailLoading(false);
                      setListLoading(true);
                      setActionMessage("");
                      setIssuedAccess(null);
                      setCopyFeedback("");
                    }}
                  >
                    <option value="all">Todos</option>
                    <option value="pending">Pendientes</option>
                    <option value="approved">Aprobadas</option>
                    <option value="rejected">Rechazadas</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage("");
                    setSelectedApplication(null);
                    setDetailLoading(false);
                    setListLoading(true);
                    setActionMessage("");
                    setIssuedAccess(null);
                    setCopyFeedback("");
                    void loadApplications(statusFilter);
                  }}
                  disabled={listLoading}
                >
                  {listLoading ? "Actualizando..." : "Recargar"}
                </button>
              </div>

              {listLoading ? <p className="list-feedback">Cargando solicitudes...</p> : null}

              {!listLoading && applications.length === 0 ? (
                <p className="list-feedback">No hay solicitudes para el filtro seleccionado.</p>
              ) : null}

              <ul className="applications-list">
                {applications.map((application) => (
                  <li key={application.id}>
                    <button
                      type="button"
                      className={
                        selectedId === application.id
                          ? "application-item active"
                          : "application-item"
                      }
                      onClick={() => {
                        selectedIdRef.current = application.id;
                        setSelectedId(application.id);
                        setErrorMessage("");
                        setSelectedApplication(null);
                        setDetailLoading(true);
                        setActionMessage("");
                        setIssuedAccess(null);
                        setCopyFeedback("");
                        void loadApplicationDetail(application.id);
                      }}
                    >
                      <div className="item-row">
                        <strong>{application.companyName}</strong>
                        <span className={`status-chip ${application.status}`}>
                          {statusLabel[application.status]}
                        </span>
                      </div>
                      <small>{application.contactName}</small>
                      <small>{application.email}</small>
                      <small>ID {application.id}</small>
                      <small>Alta: {formatDate(application.createdAt)}</small>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            <section className="application-detail-card">
              {detailLoading ? (
                <p className="detail-feedback">Cargando detalle de solicitud...</p>
              ) : null}

              {!detailLoading && !selectedApplication ? (
                <p className="detail-feedback">
                  Seleccioná una solicitud para ver su detalle.
                </p>
              ) : null}

              {!detailLoading && selectedApplication ? (
                <article className="detail-content">
                  <header className="detail-header">
                    <h2>{selectedApplication.companyName}</h2>
                    <span className={`status-chip ${selectedApplication.status}`}>
                      {statusLabel[selectedApplication.status]}
                    </span>
                  </header>

                  <dl className="detail-grid">
                    <div>
                      <dt>ID solicitud</dt>
                      <dd>{selectedApplication.id}</dd>
                    </div>
                    <div>
                      <dt>Contacto</dt>
                      <dd>{selectedApplication.contactName}</dd>
                    </div>
                    <div>
                      <dt>Email</dt>
                      <dd>{selectedApplication.email}</dd>
                    </div>
                    <div>
                      <dt>Teléfono</dt>
                      <dd>{selectedApplication.phone ?? "-"}</dd>
                    </div>
                  <div>
                      <dt>CUIT / Tax ID</dt>
                      <dd>{selectedApplication.taxId ?? "-"}</dd>
                    </div>
                    <div>
                      <dt>Creada</dt>
                      <dd>{formatDate(selectedApplication.createdAt)}</dd>
                    </div>
                    <div>
                      <dt>Revisada</dt>
                      <dd>{formatDate(selectedApplication.reviewedAt)}</dd>
                    </div>
                    <div>
                      <dt>Revisado por</dt>
                      <dd>{selectedApplication.reviewedBy ?? "-"}</dd>
                    </div>
                  </dl>

                  <section className="detail-section">
                    <h3>Información enviada</h3>
                    {messageJson ? (
                      <div className="application-details">
                        <dl className="detail-grid compact">
                          <div>
                            <dt>Sector</dt>
                            <dd>{messageJson.sector || "-"}</dd>
                          </div>
                          <div>
                            <dt>Producto</dt>
                            <dd>{messageJson.product || "-"}</dd>
                          </div>
                          <div>
                            <dt>Localidad</dt>
                            <dd>{messageJson.city || "-"}</dd>
                          </div>
                          <div>
                            <dt>Domicilio</dt>
                            <dd>{messageJson.address || "-"}</dd>
                          </div>
                          <div>
                            <dt>Cargo representante</dt>
                            <dd>{messageJson.representativeRole || "-"}</dd>
                          </div>
                          <div>
                            <dt>Email representante</dt>
                            <dd>{messageJson.representativeEmail || "-"}</dd>
                          </div>
                          <div>
                            <dt>Cámara</dt>
                            <dd>
                              {messageJson.chamberMembership === "si"
                                ? messageJson.chamberNames || "Sí"
                                : messageJson.chamberMembership === "no"
                                  ? "No"
                                  : "-"}
                            </dd>
                          </div>
                          <div>
                            <dt>Geo</dt>
                            <dd>
                              {messageJson.geo?.latitude != null &&
                              messageJson.geo?.longitude != null
                                ? `${messageJson.geo.latitude}, ${messageJson.geo.longitude}`
                                : "-"}
                            </dd>
                          </div>
                        </dl>

                        {messageJson.description ? (
                          <p className="detail-description">{messageJson.description}</p>
                        ) : null}

                        <div className="detail-chips">
                          {messageJson.keywords ? (
                            <span>Keywords: {messageJson.keywords}</span>
                          ) : null}
                          {messageJson.tariffPosition ? (
                            <span>Arancel: {messageJson.tariffPosition}</span>
                          ) : null}
                          {messageJson.exportDestinations ? (
                            <span>Exporta a: {messageJson.exportDestinations}</span>
                          ) : null}
                          {messageJson.awards ? <span>Premios: {messageJson.awards}</span> : null}
                          {messageJson.certifications ? (
                            <span>Certificaciones: {messageJson.certifications}</span>
                          ) : null}
                        </div>

                        {messageJson.links ? (
                          <ul className="detail-links">
                            {Object.entries(messageJson.links)
                              .filter(
                                ([key, value]) =>
                                  key !== "logo" &&
                                  typeof value === "string" &&
                                  value.trim().length > 0
                              )
                              .map(([key, value]) => (
                                <li key={key}>
                                  <a
                                    href={String(value)}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {key}
                                  </a>
                                </li>
                              ))}
                          </ul>
                        ) : null}

                        <div className="attachments-block">
                          <h4>Adjuntos</h4>
                          {!messageJson.attachments?.logo &&
                          !(messageJson.attachments?.catalog?.length) &&
                          !(messageJson.attachments?.productPhotos?.length) &&
                          !(messageJson.attachments?.companyPhotos?.length) ? (
                            <p className="detail-feedback">Sin archivos adjuntos.</p>
                          ) : null}

                          {messageJson.attachments?.logo?.url ? (
                            <div className="attachment-group">
                              <strong>Logo</strong>
                              <div className="attachment-grid">
                                <a
                                  className="attachment-card"
                                  href={
                                    resolveAssetUrl(messageJson.attachments.logo.url) ?? "#"
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {isImageAttachment(messageJson.attachments.logo) ? (
                                    <img
                                      src={
                                        resolveAssetUrl(messageJson.attachments.logo.url) ??
                                        ""
                                      }
                                      alt="Logo adjunto"
                                    />
                                  ) : null}
                                  <span>
                                    {messageJson.attachments.logo.originalName || "logo"}
                                  </span>
                                  <small>
                                    {formatFileSize(messageJson.attachments.logo.size)}
                                  </small>
                                </a>
                              </div>
                            </div>
                          ) : null}

                          {(messageJson.attachments?.catalog?.length ?? 0) > 0 ? (
                            <div className="attachment-group">
                              <strong>Catálogos</strong>
                              <div className="attachment-grid">
                                {messageJson.attachments?.catalog?.map((item, index) => {
                                  const href = resolveAssetUrl(item.url);
                                  if (!href) {
                                    return null;
                                  }
                                  return (
                                    <a
                                      key={`${item.url}-${index}`}
                                      className="attachment-card"
                                      href={href}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      <span>{item.title || item.originalName || `PDF ${index + 1}`}</span>
                                      <small>{formatFileSize(item.size)}</small>
                                    </a>
                                  );
                                })}
                              </div>
                            </div>
                          ) : null}

                          {(messageJson.attachments?.productPhotos?.length ?? 0) > 0 ? (
                            <div className="attachment-group">
                              <strong>Fotos de producto</strong>
                              <div className="attachment-grid">
                                {messageJson.attachments?.productPhotos?.map((item, index) => {
                                  const href = resolveAssetUrl(item.url);
                                  if (!href) {
                                    return null;
                                  }
                                  return (
                                    <a
                                      key={`${item.url}-${index}`}
                                      className="attachment-card"
                                      href={href}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      {isImageAttachment(item) ? (
                                        <img src={href} alt={item.description || "Producto"} />
                                      ) : null}
                                      <span>
                                        {item.description || item.originalName || `Foto ${index + 1}`}
                                      </span>
                                      <small>{formatFileSize(item.size)}</small>
                                    </a>
                                  );
                                })}
                              </div>
                            </div>
                          ) : null}

                          {(messageJson.attachments?.companyPhotos?.length ?? 0) > 0 ? (
                            <div className="attachment-group">
                              <strong>Fotos de empresa</strong>
                              <div className="attachment-grid">
                                {messageJson.attachments?.companyPhotos?.map((item, index) => {
                                  const href = resolveAssetUrl(item.url);
                                  if (!href) {
                                    return null;
                                  }
                                  return (
                                    <a
                                      key={`${item.url}-${index}`}
                                      className="attachment-card"
                                      href={href}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      {isImageAttachment(item) ? (
                                        <img src={href} alt={item.originalName || "Empresa"} />
                                      ) : null}
                                      <span>{item.originalName || `Foto ${index + 1}`}</span>
                                      <small>{formatFileSize(item.size)}</small>
                                    </a>
                                  );
                                })}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <p>{selectedApplication.message ?? "Sin detalle adicional."}</p>
                    )}
                  </section>

                  {issuedAccess && selectedApplication.status === "approved" ? (
                    <section className="access-credentials-panel" role="status">
                      <h3>Acceso empresa generado</h3>
                      <p className="access-credentials-help">
                        {issuedAccess.temporaryPassword
                          ? "Copiá estos datos para enviarlos vos (WhatsApp/mail). La clave solo se muestra ahora; después solo podés regenerarla en Perfiles."
                          : issuedAccess.passwordWasChosenByApplicant
                            ? "El solicitante definió su contraseña al inscribirse. No se puede ver esa clave (solo hash). Si no la recuerda, regenerala en Perfiles."
                            : "No hay clave temporal para mostrar. Podés crear/resetear acceso desde Perfiles."}
                      </p>
                      <dl className="access-credentials-grid">
                        <div>
                          <dt>Email de login</dt>
                          <dd>
                            <code>{issuedAccess.loginEmail}</code>
                          </dd>
                        </div>
                        {issuedAccess.temporaryPassword ? (
                          <div>
                            <dt>Contraseña temporal</dt>
                            <dd>
                              <code className="access-password-value">
                                {issuedAccess.temporaryPassword}
                              </code>
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                      {issuedAccess.temporaryPassword ? (
                        <div className="access-credentials-actions">
                          <button
                            type="button"
                            className="btn-copy-access"
                            onClick={() => {
                              const text = [
                                `Email: ${issuedAccess.loginEmail}`,
                                `Contraseña: ${issuedAccess.temporaryPassword}`
                              ].join("\n");
                              void navigator.clipboard
                                ?.writeText(text)
                                .then(() => setCopyFeedback("Credenciales copiadas."))
                                .catch(() =>
                                  setCopyFeedback("No se pudo copiar; seleccioná el texto a mano.")
                                );
                            }}
                          >
                            Copiar email + contraseña
                          </button>
                          <button
                            type="button"
                            className="btn-copy-access secondary"
                            onClick={() => {
                              void navigator.clipboard
                                ?.writeText(issuedAccess.temporaryPassword ?? "")
                                .then(() => setCopyFeedback("Contraseña copiada."))
                                .catch(() =>
                                  setCopyFeedback("No se pudo copiar; seleccioná el texto a mano.")
                                );
                            }}
                          >
                            Copiar solo contraseña
                          </button>
                        </div>
                      ) : null}
                      {copyFeedback ? (
                        <small className="access-copy-feedback">{copyFeedback}</small>
                      ) : null}
                    </section>
                  ) : null}

                  {selectedApplication.status === "pending" ? (
                    <section className="decision-panel">
                      <h3>Resolver solicitud</h3>
                      <label>
                        Revisado por (sesión)
                        <input
                          type="text"
                          value={authenticatedReviewer}
                          readOnly
                        />
                      </label>

                      <label>
                        Motivo de rechazo
                        <textarea
                          value={rejectionReason}
                          onChange={(event) => setRejectionReason(event.target.value)}
                          rows={3}
                          placeholder="Opcional para aprobar, obligatorio para rechazar"
                        />
                      </label>

                      <div className="decision-actions">
                        <button
                          type="button"
                          className="btn-approve"
                          disabled={isUpdatingStatus}
                          onClick={() => void handleUpdateStatus("approved")}
                        >
                          {isUpdatingStatus ? "Procesando..." : "Aprobar"}
                        </button>
                        <button
                          type="button"
                          className="btn-reject"
                          disabled={isUpdatingStatus}
                          onClick={() => void handleUpdateStatus("rejected")}
                        >
                          {isUpdatingStatus ? "Procesando..." : "Rechazar"}
                        </button>
                      </div>
                    </section>
                  ) : null}

                  {selectedApplication.status === "rejected" &&
                  selectedApplication.rejectionReason ? (
                    <section className="detail-section">
                      <h3>Motivo de rechazo</h3>
                      <p>{selectedApplication.rejectionReason}</p>
                    </section>
                  ) : null}
                </article>
              ) : null}
            </section>
          </div>
        </div>
      </section>
    </PrivateLayout>
  );
}
