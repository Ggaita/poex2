import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PrivateLayout from "../../../layouts/PrivateLayout";
import { clearAuthSession, getAuthSession } from "../../../shared/auth/session";
import type { ApiResponse } from "../../../shared/types/api.types";
import type {
  SpecialRequestStatus,
  SpecialRequestStatusFilter,
  SpecialRequestView
} from "./admin-special-requests.types";
import "./AdminSpecialRequestsPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const statusLabel: Record<SpecialRequestStatus, string> = {
  pending: "Pendiente",
  in_review: "En revisión",
  forwarded: "Derivado",
  resolved: "Resuelto",
  rejected: "Rechazado"
};

const kindLabel: Record<SpecialRequestView["kind"], string> = {
  required_product: "Producto necesario",
  special_offer: "Oferta especial",
  info_request: "Solicitud de información"
};

const buildWhatsappUrl = (request: SpecialRequestView): string | null => {
  if (request.whatsappUrl) {
    const base = request.whatsappUrl;
    const text = encodeURIComponent(
      `Hola ${request.requesterName}, te contactamos desde la Agencia por tu solicitud: ${request.requestedProduct}.`
    );
    return `${base}?text=${text}`;
  }
  return null;
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

export default function AdminSpecialRequestsPage() {
  const navigate = useNavigate();
  const selectedIdRef = useRef<number | null>(null);

  const [statusFilter, setStatusFilter] = useState<SpecialRequestStatusFilter>("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [requests, setRequests] = useState<SpecialRequestView[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
const [draftStatus, setDraftStatus] = useState<SpecialRequestStatus>("pending");
  const [draftNotes, setDraftNotes] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [listLoading, setListLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const selectedRequest = useMemo(
    () => requests.find((row) => row.id === selectedId) ?? null,
    [requests, selectedId]
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

  const loadRequests = useCallback(
    async (nextFilter: SpecialRequestStatusFilter, nextSearchTerm: string): Promise<void> => {
      const authHeader = getAuthHeader();
      if (!authHeader) {
        handleUnauthorized();
        return;
      }

      setListLoading(true);
      setErrorMessage("");

      try {
        const params = new URLSearchParams();
        if (nextFilter !== "all") {
          params.set("status", nextFilter);
        }
        if (nextSearchTerm.trim()) {
          params.set("q", nextSearchTerm.trim());
        }

        const queryString = params.toString();
        const response = await fetch(
          `${API_BASE_URL}/api/admin/special-requests${queryString ? `?${queryString}` : ""}`,
          {
            headers: {
              Authorization: authHeader
            }
          }
        );

        const payload = (await response.json()) as ApiResponse<SpecialRequestView[]>;

        if (response.status === 401) {
          handleUnauthorized();
          return;
        }

        if (!response.ok || !payload.success) {
          setRequests([]);
          selectedIdRef.current = null;
          setSelectedId(null);
          setErrorMessage(payload.error ?? "No se pudieron cargar los pedidos especiales.");
          return;
        }

        const rows = Array.isArray(payload.data) ? payload.data : [];
        setRequests(rows);

        const currentSelectedId = selectedIdRef.current;
        const keepCurrent =
          currentSelectedId !== null &&
          rows.some((row) => row.id === currentSelectedId);
        const nextSelectedId = keepCurrent ? currentSelectedId : (rows[0]?.id ?? null);

        selectedIdRef.current = nextSelectedId;
        setSelectedId(nextSelectedId);

        const selected = rows.find((row) => row.id === nextSelectedId) ?? null;
        setDraftStatus(selected?.status ?? "pending");
        setDraftNotes(selected?.adminNotes ?? "");
      } catch {
        setRequests([]);
        selectedIdRef.current = null;
        setSelectedId(null);
        setErrorMessage("No se pudo conectar con el backend de pedidos especiales.");
      } finally {
        setListLoading(false);
      }
    },
    [getAuthHeader, handleUnauthorized]
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadRequests(statusFilter, searchTerm);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadRequests, searchTerm, statusFilter]);

const handleSelectRequest = (request: SpecialRequestView): void => {
    selectedIdRef.current = request.id;
    setSelectedId(request.id);
    setDraftStatus(request.status);
    setDraftNotes(request.adminNotes ?? "");
    setReplySubject(
      request.kind === "info_request"
        ? `Respuesta a tu solicitud: ${request.requestedProduct}`
        : `Seguimiento de tu pedido: ${request.requestedProduct}`
    );
    setReplyBody(
      request.kind === "info_request"
        ? `Gracias por tu interés${request.profile?.companyName ? ` en ${request.profile.companyName}` : ""}.\n\nCompartimos la siguiente información habilitada:\n\n- \n\nQuedamos a disposición.`
        : ""
    );
    setActionMessage("");
    setErrorMessage("");
  };

  const handleSendReplyEmail = async (): Promise<void> => {
    if (!selectedRequest) {
      return;
    }

    if (!replySubject.trim() || !replyBody.trim()) {
      setErrorMessage("Completá asunto y mensaje para responder por email.");
      return;
    }

    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    setIsSendingEmail(true);
    setErrorMessage("");
    setActionMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/special-requests/${selectedRequest.id}/reply-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader
          },
          body: JSON.stringify({
            subject: replySubject.trim(),
            messageBody: replyBody.trim(),
            markResolved: true
          })
        }
      );

      const payload = (await response.json()) as ApiResponse<{
        request: SpecialRequestView;
        delivery: { status: string; mode?: string; reason?: string; error?: string };
      }>;

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !payload.success) {
        setErrorMessage(payload.error ?? "No se pudo enviar/preparar el email.");
        return;
      }

      const delivery = payload.data?.delivery;
      if (delivery?.status === "sent") {
        setActionMessage("Email enviado correctamente al solicitante.");
      } else if (delivery?.status === "prepared") {
        setActionMessage(
          delivery.reason ??
            "Email guardado en outbox. Configurá Outlook/SMTP para envío real."
        );
      } else {
        setErrorMessage(delivery?.error ?? "Falló el envío del email.");
      }

      await loadRequests(statusFilter, searchTerm);
    } catch {
      setErrorMessage("No se pudo conectar para enviar la respuesta por email.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!selectedRequest) {
      return;
    }

    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setActionMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/special-requests/${selectedRequest.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader
          },
          body: JSON.stringify({
            status: draftStatus,
            adminNotes: draftNotes.trim() ? draftNotes.trim() : null
          })
        }
      );
      const payload = (await response.json()) as ApiResponse<SpecialRequestView>;

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !payload.success) {
        setErrorMessage(payload.error ?? "No se pudo actualizar el pedido especial.");
        return;
      }

      setActionMessage("Pedido especial actualizado correctamente.");
      await loadRequests(statusFilter, searchTerm);
    } catch {
      setErrorMessage("No se pudo conectar con el backend para actualizar el pedido.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PrivateLayout>
      <section className="admin-special-requests-page">
        <div className="admin-special-requests-shell">
<header className="admin-special-requests-header">
            <p>Panel de administración</p>
            <h1>Solicitudes de información</h1>
            <small>
              Bandeja de pedidos especiales y solicitudes de información de empresas/productos.
              Podés responder por email (Outlook/SMTP) o contactar por WhatsApp.
            </small>
          </header>

          {errorMessage ? (
            <p className="admin-special-alert admin-special-alert-error" role="alert">
              {errorMessage}
            </p>
          ) : null}
          {actionMessage ? (
            <p className="admin-special-alert admin-special-alert-success" role="status">
              {actionMessage}
            </p>
          ) : null}

          <div className="admin-special-requests-grid">
            <aside className="special-requests-list-card">
              <div className="special-list-toolbar">
                <label>
                  Estado
                  <select
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value as SpecialRequestStatusFilter);
                      setActionMessage("");
                    }}
                  >
                    <option value="all">Todos</option>
                    <option value="pending">Pendientes</option>
                    <option value="in_review">En revisión</option>
                    <option value="forwarded">Derivados</option>
                    <option value="resolved">Resueltos</option>
                    <option value="rejected">Rechazados</option>
                  </select>
                </label>

                <label>
                  Buscar
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Producto, email, empresa..."
                  />
                </label>

                <button
                  type="button"
                  onClick={() => void loadRequests(statusFilter, searchTerm)}
                  disabled={listLoading}
                >
                  {listLoading ? "Actualizando..." : "Recargar"}
                </button>
              </div>

              {listLoading ? (
                <p className="special-list-feedback">Cargando pedidos especiales...</p>
              ) : null}

              {!listLoading && requests.length === 0 ? (
                <p className="special-list-feedback">
                  No hay pedidos para el filtro seleccionado.
                </p>
              ) : null}

              <ul className="special-requests-list">
                {requests.map((request) => (
                  <li key={request.id}>
                    <button
                      type="button"
                      className={
                        selectedId === request.id
                          ? "special-request-item active"
                          : "special-request-item"
                      }
                      onClick={() => handleSelectRequest(request)}
                    >
                      <div className="special-item-row">
                        <strong>{request.requestedProduct}</strong>
                        <span className={`special-status-chip ${request.status}`}>
                          {statusLabel[request.status]}
                        </span>
                      </div>
                      <small>{kindLabel[request.kind]}</small>
                      <small>{request.requesterName}</small>
                      <small>{request.requesterEmail}</small>
                      <small>ID {request.id}</small>
                      <small>Creado: {formatDate(request.createdAt)}</small>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            <section className="special-request-detail-card">
              {!selectedRequest ? (
                <p className="special-detail-feedback">
                  Seleccioná un pedido para ver y gestionar el detalle.
                </p>
              ) : (
                <article className="special-detail-content">
                  <header className="special-detail-header">
                    <h2>{selectedRequest.requestedProduct}</h2>
                    <span className={`special-status-chip ${selectedRequest.status}`}>
                      {statusLabel[selectedRequest.status]}
                    </span>
                  </header>

                  <dl className="special-detail-grid">
                    <div>
                      <dt>ID</dt>
                      <dd>{selectedRequest.id}</dd>
                    </div>
                    <div>
                      <dt>Tipo</dt>
                      <dd>{kindLabel[selectedRequest.kind]}</dd>
                    </div>
                    <div>
                      <dt>Solicitante</dt>
                      <dd>{selectedRequest.requesterName}</dd>
                    </div>
                    <div>
                      <dt>Email</dt>
                      <dd>{selectedRequest.requesterEmail}</dd>
                    </div>
                    <div>
                      <dt>Teléfono</dt>
                      <dd>{selectedRequest.requesterPhone ?? "-"}</dd>
                    </div>
<div>
                      <dt>Empresa solicitante</dt>
                      <dd>{selectedRequest.requesterCompany ?? "-"}</dd>
                    </div>
                    <div>
                      <dt>Empresa consultada</dt>
                      <dd>
                        {selectedRequest.profile ? (
                          <a href={`/empresas/${selectedRequest.profile.id}`} target="_blank" rel="noreferrer">
                            {selectedRequest.profile.companyName}
                          </a>
                        ) : (
                          "-"
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>Producto</dt>
                      <dd>{selectedRequest.productName ?? "-"}</dd>
                    </div>
                    <div>
                      <dt>Búsqueda origen</dt>
                      <dd>{selectedRequest.sourceQuery ?? "-"}</dd>
                    </div>
                    <div>
                      <dt>Última revisión</dt>
                      <dd>{formatDate(selectedRequest.reviewedAt)}</dd>
                    </div>
                    <div>
                      <dt>Revisado por</dt>
                      <dd>{selectedRequest.reviewedByEmail ?? "-"}</dd>
                    </div>
                    <div>
                      <dt>Creado</dt>
                      <dd>{formatDate(selectedRequest.createdAt)}</dd>
                    </div>
                  </dl>

                  <section className="special-detail-section">
                    <h3>Detalle del pedido</h3>
                    <p>{selectedRequest.details ?? "Sin detalle adicional."}</p>
                  </section>

<section className="special-decision-panel">
                    <h3>Gestión administrativa</h3>

                    <div className="special-contact-actions">
                      {buildWhatsappUrl(selectedRequest) ? (
                        <a
                          className="special-whatsapp-button"
                          href={buildWhatsappUrl(selectedRequest) ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Contactar por WhatsApp
                        </a>
                      ) : (
                        <p className="special-contact-hint">
                          Sin teléfono/WhatsApp del solicitante.
                        </p>
                      )}
                      <a
                        className="special-mail-button"
                        href={`mailto:${selectedRequest.requesterEmail}?subject=${encodeURIComponent(
                          replySubject || selectedRequest.requestedProduct
                        )}`}
                      >
                        Abrir email del solicitante
                      </a>
                    </div>

                    <label>
                      Estado
                      <select
                        value={draftStatus}
                        onChange={(event) =>
                          setDraftStatus(event.target.value as SpecialRequestStatus)
                        }
                      >
                        <option value="pending">Pendiente</option>
                        <option value="in_review">En revisión</option>
                        <option value="forwarded">Derivado / contactado</option>
                        <option value="resolved">Resuelto</option>
                        <option value="rejected">Rechazado</option>
                      </select>
                    </label>

                    <label>
                      Notas admin
                      <textarea
                        rows={4}
                        value={draftNotes}
                        onChange={(event) => setDraftNotes(event.target.value)}
                        placeholder="Acciones realizadas, información compartida, seguimiento..."
                      />
                    </label>

                    <button
                      type="button"
                      className="special-save-button"
                      onClick={() => void handleSave()}
                      disabled={isSaving || isSendingEmail}
                    >
                      {isSaving ? "Guardando..." : "Guardar gestión"}
                    </button>

                    <div className="special-reply-panel">
                      <h4>Responder por email (Outlook/SMTP)</h4>
                      <p>
                        Si todavía no hay credenciales SMTP, el mensaje queda en outbox de
                        Comunicaciones como "prepared".
                      </p>
                      <label>
                        Asunto
                        <input
                          type="text"
                          value={replySubject}
                          onChange={(event) => setReplySubject(event.target.value)}
                        />
                      </label>
                      <label>
                        Mensaje para el solicitante
                        <textarea
                          rows={6}
                          value={replyBody}
                          onChange={(event) => setReplyBody(event.target.value)}
                          placeholder="Información habilitada para compartir..."
                        />
                      </label>
                      <button
                        type="button"
                        className="special-email-button"
                        onClick={() => void handleSendReplyEmail()}
                        disabled={isSendingEmail || isSaving}
                      >
                        {isSendingEmail ? "Enviando..." : "Enviar / preparar email"}
                      </button>
                    </div>
                  </section>
                </article>
              )}
            </section>
          </div>
        </div>
      </section>
    </PrivateLayout>
  );
}
