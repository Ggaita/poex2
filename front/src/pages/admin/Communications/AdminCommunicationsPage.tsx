import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PrivateLayout from "../../../layouts/PrivateLayout";
import { clearAuthSession, getAuthSession } from "../../../shared/auth/session";
import type { ApiResponse } from "../../../shared/types/api.types";
import type {
  CommunicationRecipientsCatalog,
  EmailOutboxEntryView,
  EmailTemplateKey,
  EmailTemplateView,
  ManualNotificationInput,
  ManualNotificationResult,
  NotificationTargetMode,
  RecipientCompanyOption
} from "./admin-communications.types";
import "./AdminCommunicationsPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const templateOrder: EmailTemplateKey[] = [
  "application_received",
  "application_approved",
  "product_review_status_changed",
  "general_information"
];

const formatDate = (value?: string): string => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(parsed);
};

type TemplateDraft = {
  subjectTemplate: string;
  bodyTemplate: string;
  isActive: boolean;
};

const emptyRecipientsCatalog: CommunicationRecipientsCatalog = {
  recipients: [],
  groups: []
};

export default function AdminCommunicationsPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<EmailTemplateView[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [selectedTemplateKey, setSelectedTemplateKey] =
    useState<EmailTemplateKey>("application_received");
  const [templateDraft, setTemplateDraft] = useState<TemplateDraft>({
    subjectTemplate: "",
    bodyTemplate: "",
    isActive: true
  });
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const [recipientsCatalog, setRecipientsCatalog] = useState<CommunicationRecipientsCatalog>(
    emptyRecipientsCatalog
  );
  const [recipientsLoading, setRecipientsLoading] = useState(true);
  const [recipientSearch, setRecipientSearch] = useState("");

  const [outboxEntries, setOutboxEntries] = useState<EmailOutboxEntryView[]>([]);
  const [outboxLoading, setOutboxLoading] = useState(true);

  const [manualTemplateKey, setManualTemplateKey] =
    useState<EmailTemplateKey>("general_information");
  const [targetMode, setTargetMode] = useState<NotificationTargetMode>("all");
  const [selectedGroupValues, setSelectedGroupValues] = useState<string[]>([]);
  const [selectedProfileIds, setSelectedProfileIds] = useState<number[]>([]);
  const [messageTitle, setMessageTitle] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [isPreparingManual, setIsPreparingManual] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

  const loadTemplates = useCallback(async (): Promise<void> => {
    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/communications/templates`, {
        headers: {
          Authorization: authHeader
        }
      });
      const result = (await response.json()) as ApiResponse<EmailTemplateView[]>;

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        setTemplates([]);
        setErrorMessage(result.error ?? "No se pudieron cargar las plantillas.");
        return;
      }

      const rows = Array.isArray(result.data) ? result.data : [];
      setTemplates(rows);
      const selected =
        rows.find((template) => template.key === selectedTemplateKey) ?? rows[0];
      if (selected) {
        setSelectedTemplateKey(selected.key);
        setTemplateDraft({
          subjectTemplate: selected.subjectTemplate,
          bodyTemplate: selected.bodyTemplate,
          isActive: selected.isActive
        });
      }
    } catch {
      setTemplates([]);
      setErrorMessage("No se pudo conectar con el backend para cargar plantillas.");
    } finally {
      setTemplatesLoading(false);
    }
  }, [getAuthHeader, handleUnauthorized, selectedTemplateKey]);

  const loadRecipients = useCallback(async (): Promise<void> => {
    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/communications/recipients`, {
        headers: {
          Authorization: authHeader
        }
      });
      const result = (await response.json()) as ApiResponse<CommunicationRecipientsCatalog>;

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        setRecipientsCatalog(emptyRecipientsCatalog);
        setErrorMessage(result.error ?? "No se pudieron cargar destinatarios.");
        return;
      }

      const recipients = Array.isArray(result.data?.recipients)
        ? result.data.recipients
        : [];
      const groups = Array.isArray(result.data?.groups) ? result.data.groups : [];
      setRecipientsCatalog({
        recipients,
        groups
      });
    } catch {
      setRecipientsCatalog(emptyRecipientsCatalog);
      setErrorMessage("No se pudo conectar con el backend para cargar destinatarios.");
    } finally {
      setRecipientsLoading(false);
    }
  }, [getAuthHeader, handleUnauthorized]);

  const loadOutbox = useCallback(async (): Promise<void> => {
    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/communications/outbox?limit=60`,
        {
          headers: {
            Authorization: authHeader
          }
        }
      );
      const result = (await response.json()) as ApiResponse<EmailOutboxEntryView[]>;

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        setOutboxEntries([]);
        setErrorMessage(result.error ?? "No se pudo cargar la bandeja de correos.");
        return;
      }

      setOutboxEntries(Array.isArray(result.data) ? result.data : []);
    } catch {
      setOutboxEntries([]);
      setErrorMessage("No se pudo conectar con el backend para cargar la bandeja.");
    } finally {
      setOutboxLoading(false);
    }
  }, [getAuthHeader, handleUnauthorized]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadTemplates();
      void loadRecipients();
      void loadOutbox();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadOutbox, loadRecipients, loadTemplates]);

  const orderedTemplates = useMemo(() => {
    const rankByKey = new Map(templateOrder.map((key, index) => [key, index]));
    return [...templates].sort((left, right) => {
      const leftRank = rankByKey.get(left.key) ?? Number.MAX_SAFE_INTEGER;
      const rightRank = rankByKey.get(right.key) ?? Number.MAX_SAFE_INTEGER;
      return leftRank - rightRank;
    });
  }, [templates]);


  const activeTemplates = useMemo(
    () => orderedTemplates.filter((template) => template.isActive),
    [orderedTemplates]
  );
  const selectedTemplate = useMemo(() => {
    return (
      orderedTemplates.find((template) => template.key === selectedTemplateKey) ??
      orderedTemplates[0]
    );
  }, [orderedTemplates, selectedTemplateKey]);

  const effectiveManualTemplateKey = useMemo(() => {
    if (activeTemplates.length === 0) {
      return manualTemplateKey;
    }

    const exists = activeTemplates.some(
      (template) => template.key === manualTemplateKey
    );
    if (exists) {
      return manualTemplateKey;
    }

    return (
      activeTemplates.find((template) => template.key === "general_information")?.key ??
      activeTemplates[0].key
    );
  }, [activeTemplates, manualTemplateKey]);

  const filteredRecipients = useMemo(() => {
    const term = recipientSearch.trim().toLowerCase();
    if (!term) {
      return recipientsCatalog.recipients;
    }

    return recipientsCatalog.recipients.filter((recipient) => {
      const sector = recipient.sector ?? "";
      const contactName = recipient.contactName ?? "";
      const combined =
        `${recipient.companyName} ${contactName} ${recipient.contactEmail} ${sector}`.toLowerCase();
      return combined.includes(term);
    });
  }, [recipientsCatalog.recipients, recipientSearch]);

  const selectedRecipientCount = useMemo(() => {
    const selected = new Set(selectedProfileIds);
    return recipientsCatalog.recipients.filter((item) => selected.has(item.profileId))
      .length;
  }, [recipientsCatalog.recipients, selectedProfileIds]);

  const toggleProfile = (profileId: number): void => {
    setSelectedProfileIds((current) =>
      current.includes(profileId)
        ? current.filter((id) => id !== profileId)
        : [...current, profileId]
    );
  };

  const toggleGroup = (value: string): void => {
    setSelectedGroupValues((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  const handleSaveTemplate = async (): Promise<void> => {
    if (!selectedTemplate) {
      return;
    }

    const subjectTemplate = templateDraft.subjectTemplate.trim();
    const bodyTemplate = templateDraft.bodyTemplate.trim();

    if (!subjectTemplate || !bodyTemplate) {
      setErrorMessage("Asunto y cuerpo son obligatorios para guardar la plantilla.");
      setSuccessMessage("");
      return;
    }

    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    setIsSavingTemplate(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/communications/templates/${selectedTemplate.key}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader
          },
          body: JSON.stringify({
            subjectTemplate,
            bodyTemplate,
            isActive: templateDraft.isActive
          })
        }
      );
      const result = (await response.json()) as ApiResponse<EmailTemplateView>;

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        setErrorMessage(result.error ?? "No se pudo guardar la plantilla.");
        return;
      }

      if (result.data) {
        setTemplates((current) =>
          current.map((template) =>
            template.key === result.data.key ? result.data : template
          )
        );
      }
      setSuccessMessage("Plantilla actualizada correctamente.");
    } catch {
      setErrorMessage("No se pudo conectar con el backend para guardar la plantilla.");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const buildManualNotificationPayload = (): ManualNotificationInput | null => {
    const payload: ManualNotificationInput = {
      templateKey: effectiveManualTemplateKey,
      targetMode
    };

    if (targetMode === "group") {
      if (selectedGroupValues.length === 0) {
        setErrorMessage("Seleccioná al menos un grupo para preparar notificaciones.");
        return null;
      }
      payload.groupBy = "sector";
      payload.groupValues = selectedGroupValues;
    }

    if (targetMode === "selected") {
      if (selectedProfileIds.length === 0) {
        setErrorMessage("Seleccioná al menos una empresa destinataria.");
        return null;
      }
      payload.profileIds = selectedProfileIds;
    }

    if (messageTitle.trim()) {
      payload.messageTitle = messageTitle.trim();
    }
    if (messageBody.trim()) {
      payload.messageBody = messageBody.trim();
    }

    if (effectiveManualTemplateKey === "general_information") {
      if (!payload.messageTitle || !payload.messageBody) {
        setErrorMessage(
          "Para la plantilla de notificación general debés completar título y mensaje."
        );
        return null;
      }
    }

    return payload;
  };

  const handlePrepareManualNotifications = async (): Promise<void> => {
    const payload = buildManualNotificationPayload();
    if (!payload) {
      setSuccessMessage("");
      return;
    }

    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    setIsPreparingManual(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/communications/notifications/manual`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader
          },
          body: JSON.stringify(payload)
        }
      );
      const result = (await response.json()) as ApiResponse<ManualNotificationResult>;

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        setErrorMessage(result.error ?? "No se pudieron preparar las notificaciones.");
        return;
      }

      const createdCount = result.data?.createdCount ?? 0;
      setSuccessMessage(`Se prepararon ${createdCount} correos en bandeja.`);
      await loadOutbox();
    } catch {
      setErrorMessage("No se pudo conectar con el backend para preparar notificaciones.");
    } finally {
      setIsPreparingManual(false);
    }
  };

  const labelRecipient = (recipient: RecipientCompanyOption): string => {
    const contact = recipient.contactName?.trim();
    return contact && contact.length > 0
      ? `${recipient.companyName} · ${contact}`
      : recipient.companyName;
  };

  return (
    <PrivateLayout>
      <section className="admin-communications-page">
        <div className="admin-communications-shell">
          <header className="admin-communications-header">
            <p>Panel de administración</p>
            <h1>Comunicaciones y correos preparados</h1>
            <small>
              Editá plantillas, segmentá destinatarios y dejá correos listos en bandeja de salida.
            </small>
          </header>

          {errorMessage ? (
            <p className="communications-alert communications-alert-error" role="alert">
              {errorMessage}
            </p>
          ) : null}
          {successMessage ? (
            <p className="communications-alert communications-alert-success" role="status">
              {successMessage}
            </p>
          ) : null}

          <div className="admin-communications-grid">
            <section className="communications-card template-list-card">
              <h2>Plantillas disponibles</h2>
              {templatesLoading ? (
                <p className="card-feedback">Cargando plantillas...</p>
              ) : null}
              {!templatesLoading && orderedTemplates.length === 0 ? (
                <p className="card-feedback">No hay plantillas configuradas.</p>
              ) : null}
              <ul className="template-list">
                {orderedTemplates.map((template) => (
                  <li key={template.key}>
                    <button
                      type="button"
                      className={
                        template.key === selectedTemplateKey
                          ? "template-button active"
                          : "template-button"
                      }
                      onClick={() => {
                        setSelectedTemplateKey(template.key);
                        setTemplateDraft({
                          subjectTemplate: template.subjectTemplate,
                          bodyTemplate: template.bodyTemplate,
                          isActive: template.isActive
                        });
                        setErrorMessage("");
                        setSuccessMessage("");
                      }}
                    >
                      <strong>{template.name}</strong>
                      <small>{template.key}</small>
                      <span className={template.isActive ? "chip-enabled" : "chip-disabled"}>
                        {template.isActive ? "Activa" : "Inactiva"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="communications-card template-editor-card">
              <h2>Editor de plantilla</h2>
              {!selectedTemplate ? (
                <p className="card-feedback">Seleccioná una plantilla para editar.</p>
              ) : (
                <div className="template-editor-form">
                  <p className="template-description">
                    {selectedTemplate.description ?? "Sin descripción"}
                  </p>
                  <label>
                    Asunto
                    <input
                      type="text"
                      value={templateDraft.subjectTemplate}
                      onChange={(event) =>
                        setTemplateDraft((current) => ({
                          ...current,
                          subjectTemplate: event.target.value
                        }))
                      }
                    />
                  </label>
                  <label>
                    Cuerpo
                    <textarea
                      rows={8}
                      value={templateDraft.bodyTemplate}
                      onChange={(event) =>
                        setTemplateDraft((current) => ({
                          ...current,
                          bodyTemplate: event.target.value
                        }))
                      }
                    />
                  </label>
                  <div className="variables-block">
                    <strong>Variables disponibles</strong>
                    <div className="variables-list">
                      {selectedTemplate.variables.map((token) => (
                        <span key={token}>{`{{${token}}}`}</span>
                      ))}
                    </div>
                  </div>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={templateDraft.isActive}
                      onChange={(event) =>
                        setTemplateDraft((current) => ({
                          ...current,
                          isActive: event.target.checked
                        }))
                      }
                    />
                    Plantilla activa
                  </label>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => void handleSaveTemplate()}
                    disabled={isSavingTemplate}
                  >
                    {isSavingTemplate ? "Guardando..." : "Guardar plantilla"}
                  </button>
                </div>
              )}
            </section>
          </div>

          <div className="admin-communications-grid">
            <section className="communications-card manual-card">
              <h2>Preparar notificación manual</h2>
              <div className="manual-grid">
                <label>
                  Plantilla
                  <select
                    value={effectiveManualTemplateKey}
                    onChange={(event) =>
                      setManualTemplateKey(event.target.value as EmailTemplateKey)
                    }
                    disabled={activeTemplates.length === 0}
                  >
                    {activeTemplates.length === 0 ? (
                      <option value="">No hay plantillas activas</option>
                    ) : null}
                    {activeTemplates.map((template) => (
                      <option key={template.key} value={template.key}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Destino
                  <select
                    value={targetMode}
                    onChange={(event) => {
                      setTargetMode(event.target.value as NotificationTargetMode);
                      setErrorMessage("");
                      setSuccessMessage("");
                    }}
                  >
                    <option value="all">Todas las empresas</option>
                    <option value="group">Por grupo (sector)</option>
                    <option value="selected">Selección individual</option>
                  </select>
                </label>
              </div>

              {targetMode === "group" ? (
                <div className="group-selector">
                  <strong>Grupos por sector</strong>
                  {recipientsLoading ? (
                    <p className="card-feedback">Cargando grupos...</p>
                  ) : null}
                  {!recipientsLoading && recipientsCatalog.groups.length === 0 ? (
                    <p className="card-feedback">No hay sectores disponibles para agrupar.</p>
                  ) : null}
                  <ul className="group-list">
                    {recipientsCatalog.groups.map((group) => (
                      <li key={group.value}>
                        <label>
                          <input
                            type="checkbox"
                            checked={selectedGroupValues.includes(group.value)}
                            onChange={() => toggleGroup(group.value)}
                          />
                          {group.label} ({group.count})
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {targetMode === "selected" ? (
                <div className="recipient-selector">
                  <div className="recipient-toolbar">
                    <strong>Empresas destinatarias</strong>
                    <small>{selectedRecipientCount} seleccionadas</small>
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar por empresa, contacto, email o sector"
                    value={recipientSearch}
                    onChange={(event) => setRecipientSearch(event.target.value)}
                  />
                  {recipientsLoading ? (
                    <p className="card-feedback">Cargando empresas...</p>
                  ) : null}
                  <ul className="recipient-list">
                    {filteredRecipients.map((recipient) => (
                      <li key={recipient.profileId}>
                        <label>
                          <input
                            type="checkbox"
                            checked={selectedProfileIds.includes(recipient.profileId)}
                            onChange={() => toggleProfile(recipient.profileId)}
                          />
                          <span>
                            <strong>{labelRecipient(recipient)}</strong>
                            <small>{recipient.contactEmail}</small>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <label>
                Título del mensaje
                <input
                  type="text"
                  value={messageTitle}
                  onChange={(event) => setMessageTitle(event.target.value)}
                  placeholder="Usado por la plantilla general_information"
                />
              </label>
              <label>
                Mensaje
                <textarea
                  rows={5}
                  value={messageBody}
                  onChange={(event) => setMessageBody(event.target.value)}
                  placeholder="Contenido para notificaciones informativas"
                />
              </label>

              <button
                type="button"
                className="primary-button"
                onClick={() => void handlePrepareManualNotifications()}
                disabled={isPreparingManual || activeTemplates.length === 0}
              >
                {isPreparingManual ? "Preparando..." : "Preparar correos"}
              </button>
            </section>

            <section className="communications-card outbox-card">
              <div className="outbox-header">
                <h2>Bandeja de correos preparados</h2>
                <button
                  type="button"
                  onClick={() => {
                    setOutboxLoading(true);
                    void loadOutbox();
                  }}
                  disabled={outboxLoading}
                >
                  {outboxLoading ? "Actualizando..." : "Recargar"}
                </button>
              </div>

              {outboxLoading ? <p className="card-feedback">Cargando bandeja...</p> : null}
              {!outboxLoading && outboxEntries.length === 0 ? (
                <p className="card-feedback">No hay correos preparados todavía.</p>
              ) : null}

              <ul className="outbox-list">
                {outboxEntries.map((entry) => (
                  <li key={entry.id} className="outbox-item">
                    <div className="outbox-item-header">
                      <strong>{entry.subject}</strong>
                      <span className={`outbox-status ${entry.status}`}>{entry.status}</span>
                    </div>
                    <p>{entry.recipientName ?? entry.recipientEmail}</p>
                    <small>{entry.recipientEmail}</small>
                    <small>
                      Evento: {entry.triggerEvent} · {formatDate(entry.createdAt)}
                    </small>
                    <details>
                      <summary>Ver cuerpo</summary>
                      <pre>{entry.body}</pre>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </section>
    </PrivateLayout>
  );
}
