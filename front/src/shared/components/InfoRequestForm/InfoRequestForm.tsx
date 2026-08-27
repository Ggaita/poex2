import { type FormEvent, useState } from "react";
import type { ApiResponse } from "../../types/api.types";
import "./InfoRequestForm.css";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

type InfoRequestFormProps = {
  profileId?: number;
  companyName?: string;
  productName?: string;
  sourceQuery?: string;
  title?: string;
  description?: string;
  compact?: boolean;
};

type FormState = {
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
  requesterCompany: string;
  details: string;
};

const INITIAL_FORM: FormState = {
  requesterName: "",
  requesterEmail: "",
  requesterPhone: "",
  requesterCompany: "",
  details: ""
};

const isValidEmail = (value: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

export default function InfoRequestForm({
  profileId,
  companyName,
  productName,
  sourceQuery,
  title = "Solicitar información a la administración",
  description = "Completá tus datos y el equipo de la Agencia te contactará por email o WhatsApp con la información habilitada.",
  compact = false
}: InfoRequestFormProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.requesterName.trim() || !form.requesterEmail.trim()) {
      setErrorMessage("Completá nombre y email.");
      return;
    }

    if (!isValidEmail(form.requesterEmail)) {
      setErrorMessage("Ingresá un email válido.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const requestedProduct =
        productName?.trim() ||
        (companyName
          ? `Información de ${companyName}`
          : "Solicitud de información");

      const response = await fetch(`${API_BASE_URL}/api/public/special-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          kind: "info_request",
          profileId,
          productName: productName?.trim() || undefined,
          requestedProduct,
          sourceQuery: sourceQuery?.trim() || undefined,
          details: form.details.trim() || undefined,
          requesterName: form.requesterName.trim(),
          requesterEmail: form.requesterEmail.trim(),
          requesterPhone: form.requesterPhone.trim() || undefined,
          requesterCompany: form.requesterCompany.trim() || undefined
        })
      });

      const payload = (await response.json()) as ApiResponse<{ id: number }>;

      if (!response.ok || !payload.success) {
        setErrorMessage(payload.error ?? "No se pudo registrar la solicitud.");
        return;
      }

      setSuccessMessage(
        "Solicitud enviada. La administración la revisará y te contactará a la brevedad."
      );
      setForm(INITIAL_FORM);
    } catch {
      setErrorMessage("No se pudo conectar con el servidor para enviar la solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={`info-request-card${compact ? " compact" : ""}`}>
      <header>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
        {companyName ? (
          <small>
            Empresa: <strong>{companyName}</strong>
            {productName ? ` · Producto: ${productName}` : ""}
          </small>
        ) : null}
      </header>

      <form className="info-request-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <div className="info-request-grid">
          <label>
            Nombre y apellido *
            <input
              type="text"
              value={form.requesterName}
              onChange={(event) => updateField("requesterName", event.target.value)}
              autoComplete="name"
              required
            />
          </label>
          <label>
            Email *
            <input
              type="email"
              value={form.requesterEmail}
              onChange={(event) => updateField("requesterEmail", event.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label>
            Teléfono / WhatsApp
            <input
              type="tel"
              value={form.requesterPhone}
              onChange={(event) => updateField("requesterPhone", event.target.value)}
              placeholder="+54 362 ..."
              autoComplete="tel"
            />
          </label>
          <label>
            Organización / empresa
            <input
              type="text"
              value={form.requesterCompany}
              onChange={(event) => updateField("requesterCompany", event.target.value)}
              autoComplete="organization"
            />
          </label>
        </div>

        <label className="info-request-details">
          ¿Qué información necesitás?
          <textarea
            rows={compact ? 3 : 4}
            value={form.details}
            onChange={(event) => updateField("details", event.target.value)}
            placeholder="Ej: contacto comercial, certificaciones, capacidad exportable, catálogo..."
          />
        </label>

        {errorMessage ? <p className="info-request-feedback error">{errorMessage}</p> : null}
        {successMessage ? (
          <p className="info-request-feedback success">{successMessage}</p>
        ) : null}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Enviando..." : "Enviar solicitud a la administración"}
        </button>
      </form>
    </section>
  );
}
