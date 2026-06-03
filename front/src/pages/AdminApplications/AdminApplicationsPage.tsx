import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PrivateLayout from "../../layouts/PrivateLayout";
import {
  clearAuthSession,
  getAuthSession,
  getStoredReviewerName,
  setStoredReviewerName
} from "../../shared/auth/session";
import type { ApiResponse } from "../../shared/types/api.types";
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

const parseJsonMessage = (message?: string): unknown => {
  if (!message) {
    return null;
  }

  try {
    return JSON.parse(message);
  } catch {
    return null;
  }
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

      const result = (await response.json()) as ApiResponse<CompanyApplication>;

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        setErrorMessage(result.error ?? "No se pudo actualizar el estado.");
        return;
      }
      setStoredReviewerName(reviewer);
      setSelectedApplication(result.data);
      setActionMessage(
        nextStatus === "approved"
          ? "Solicitud aprobada correctamente."
          : "Solicitud rechazada correctamente."
      );
      if (nextStatus === "approved") {
        setRejectionReason("");
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
                      <dt>Tax ID</dt>
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
                      <pre>{JSON.stringify(messageJson, null, 2)}</pre>
                    ) : (
                      <p>{selectedApplication.message ?? "Sin detalle adicional."}</p>
                    )}
                  </section>

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
