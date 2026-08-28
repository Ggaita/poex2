import { type FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import MainLayout from "../../../layouts/MainLayouts";
import { toDisplaySrc } from "../../../shared/components/ImageField/ImageField";
import type { ApiResponse } from "../../../shared/types/api.types";
import type { InvestmentOpportunityDetailView } from "../../../shared/types/investment-opportunity.types";
import {
  opportunityStatusLabel,
  opportunityTypeLabel
} from "../../../shared/types/investment-opportunity.types";
import "./InvestmentOpportunitiesPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

type InquiryForm = {
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
  requesterCompany: string;
  message: string;
};

const INITIAL_FORM: InquiryForm = {
  requesterName: "",
  requesterEmail: "",
  requesterPhone: "",
  requesterCompany: "",
  message: ""
};

const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function OportunidadDetallePage() {
  const { slug = "" } = useParams();
  const [item, setItem] = useState<InvestmentOpportunityDetailView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState<InquiryForm>(INITIAL_FORM);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async (): Promise<void> => {
      if (!slug.trim()) {
        setErrorMessage("Slug inválido.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/public/investment-opportunities/${encodeURIComponent(slug)}`
        );
        const payload = (await response.json()) as ApiResponse<InvestmentOpportunityDetailView>;

        if (!active) return;

        if (!response.ok || !payload.success || !payload.data) {
          setItem(null);
          setErrorMessage(payload.error ?? "No se encontró la oportunidad.");
          return;
        }

        setItem(payload.data);
      } catch {
        if (!active) return;
        setItem(null);
        setErrorMessage("No se pudo conectar con el backend de oportunidades.");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [slug]);

  const updateField = <K extends keyof InquiryForm>(key: K, value: InquiryForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFormError("");
    setFormSuccess("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!item) return;

    if (!form.requesterName.trim() || !form.requesterEmail.trim() || !form.message.trim()) {
      setFormError("Completá nombre, email y mensaje.");
      return;
    }
    if (!isValidEmail(form.requesterEmail)) {
      setFormError("Ingresá un email válido.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/public/investment-opportunities/${item.id}/inquiries`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            opportunityId: item.id,
            requesterName: form.requesterName.trim(),
            requesterEmail: form.requesterEmail.trim(),
            requesterPhone: form.requesterPhone.trim() || undefined,
            requesterCompany: form.requesterCompany.trim() || undefined,
            message: form.message.trim()
          })
        }
      );
      const payload = (await response.json()) as ApiResponse<unknown>;

      if (!response.ok || !payload.success) {
        setFormError(payload.error ?? "No se pudo enviar la consulta.");
        return;
      }

      setForm(INITIAL_FORM);
      setFormSuccess("Recibimos tu consulta. El equipo de la Agencia te contactará a la brevedad.");
    } catch {
      setFormError("No se pudo conectar para enviar la consulta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <section className="investment-opportunities-page">
        <div className="investment-opportunities-shell">
          <div className="investment-opportunity-detail-top">
            <Link to="/oportunidades-de-inversion" className="investment-opportunity-detail-back">
              ← Volver al catálogo
            </Link>
          </div>

          {isLoading ? <p className="investment-opportunities-empty">Cargando ficha...</p> : null}
          {errorMessage ? <p className="investment-opportunities-feedback investment-opportunities-feedback-error">{errorMessage}</p> : null}

          {item ? (
            <div className="investment-opportunity-detail-grid">
              <article className="investment-opportunity-detail-main">
                <div className="investment-opportunity-detail-hero-media">
                  <img src={toDisplaySrc(item.mainImageUrl)} alt={item.title} />
                </div>

                <div className="investment-opportunity-detail-body">
                  <div className="investment-opportunity-card-tags">
                    <span className="investment-opportunity-badge">{opportunityTypeLabel[item.type]}</span>
                    <span className="investment-opportunity-badge investment-opportunity-badge-soft">{opportunityStatusLabel[item.status]}</span>
                    {item.isFeatured ? <span className="investment-opportunity-badge investment-opportunity-badge-featured">Destacada</span> : null}
                  </div>
                  <h1>{item.title}</h1>
                  {item.shortDescription ? <p className="investment-opportunity-detail-lead">{item.shortDescription}</p> : null}

                  <ul className="investment-opportunity-detail-meta">
                    <li>
                      <strong>Sector</strong>
                      <span>{item.sector}</span>
                    </li>
                    <li>
                      <strong>Localidad</strong>
                      <span>{item.locality}</span>
                    </li>
                    {item.estimatedInvestment ? (
                      <li>
                        <strong>Inversión estimada</strong>
                        <span>{item.estimatedInvestment}</span>
                      </li>
                    ) : null}
                  </ul>

                  <div className="investment-opportunity-detail-prose">
                    {item.fullDescription.split(/\n+/).map((paragraph, index) => (
                      <p key={`${item.id}-p-${index}`}>{paragraph}</p>
                    ))}
                  </div>

                  {item.gallery.length > 0 ? (
                    <section className="investment-opportunity-assets-block">
                      <h2>Galería</h2>
                      <div className="investment-opportunity-gallery-grid">
                        {item.gallery.map((asset) => (
                          <a
                            key={asset.id}
                            href={toDisplaySrc(asset.url)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <img src={toDisplaySrc(asset.url)} alt={asset.label || item.title} />
                          </a>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {item.documents.length > 0 ? (
                    <section className="investment-opportunity-assets-block">
                      <h2>Documentos</h2>
                      <ul className="investment-opportunity-doc-list">
                        {item.documents.map((asset) => (
                          <li key={asset.id}>
                            <a href={toDisplaySrc(asset.url)} target="_blank" rel="noreferrer">
                              {asset.label || "Documento adjunto"}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                </div>
              </article>

              <aside className="investment-opportunity-detail-aside">
                <div className="investment-opportunity-inquiry-card">
                  <h2>Consultar esta oportunidad</h2>
                  <p>
                    Completá el formulario y el equipo de la Agencia revisará tu consulta.
                  </p>
                  <form className="investment-opportunity-inquiry-form" onSubmit={(event) => void handleSubmit(event)}>
                    <label>
                      Nombre y apellido
                      <input
                        type="text"
                        value={form.requesterName}
                        onChange={(event) => updateField("requesterName", event.target.value)}
                        required
                      />
                    </label>
                    <label>
                      Email
                      <input
                        type="email"
                        value={form.requesterEmail}
                        onChange={(event) => updateField("requesterEmail", event.target.value)}
                        required
                      />
                    </label>
                    <label>
                      Teléfono
                      <input
                        type="text"
                        value={form.requesterPhone}
                        onChange={(event) => updateField("requesterPhone", event.target.value)}
                      />
                    </label>
                    <label>
                      Empresa / organización
                      <input
                        type="text"
                        value={form.requesterCompany}
                        onChange={(event) => updateField("requesterCompany", event.target.value)}
                      />
                    </label>
                    <label>
                      Mensaje
                      <textarea
                        value={form.message}
                        onChange={(event) => updateField("message", event.target.value)}
                        required
                      />
                    </label>

                    {formError ? <p className="investment-opportunities-feedback investment-opportunities-feedback-error">{formError}</p> : null}
                    {formSuccess ? <p className="investment-opportunities-feedback investment-opportunities-feedback-success">{formSuccess}</p> : null}

                    <button type="submit" className="investment-opportunities-btn-primary" disabled={isSubmitting}>
                      {isSubmitting ? "Enviando..." : "Enviar consulta"}
                    </button>
                  </form>
                </div>
              </aside>
            </div>
          ) : null}
        </div>
      </section>
    </MainLayout>
  );
}
