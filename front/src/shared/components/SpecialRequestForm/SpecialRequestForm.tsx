import { useState } from "react";
import type { ApiResponse } from "../../types/api.types";
import "./SpecialRequestForm.css";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export type SpecialRequestKind = "special_offer" | "required_product";

type SpecialRequestFormProps = {
  title?: string;
  description?: string;
  initialQuery?: string;
  initialRequestedProduct?: string;
  className?: string;
};

export default function SpecialRequestForm({
  title = "Formulario de consulta",
  description = "Dejá tu pedido especial para oferta o producto necesario y lo gestiona el equipo de la Agencia.",
  initialQuery = "",
  initialRequestedProduct = "",
  className = ""
}: SpecialRequestFormProps) {
  const [specialKind, setSpecialKind] = useState<SpecialRequestKind>("required_product");
  const [specialRequestedProduct, setSpecialRequestedProduct] = useState(
    () => initialRequestedProduct || initialQuery
  );
  const [specialDetails, setSpecialDetails] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [requesterPhone, setRequesterPhone] = useState("");
  const [requesterCompany, setRequesterCompany] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (): Promise<void> => {
    const requestedProduct = specialRequestedProduct.trim() || initialQuery.trim();
    const name = requesterName.trim();
    const email = requesterEmail.trim();

    if (!requestedProduct) {
      setErrorMessage("Indicá el producto/oferta que necesitás.");
      setFeedback("");
      return;
    }

    if (!name) {
      setErrorMessage("Indicá tu nombre para registrar el pedido.");
      setFeedback("");
      return;
    }

    if (!email) {
      setErrorMessage("Indicá un email de contacto.");
      setFeedback("");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setFeedback("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/public/special-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          kind: specialKind,
          sourceQuery: initialQuery.trim() || undefined,
          requestedProduct,
          details: specialDetails.trim() || undefined,
          requesterName: name,
          requesterEmail: email,
          requesterPhone: requesterPhone.trim() || undefined,
          requesterCompany: requesterCompany.trim() || undefined
        })
      });

      const payload = (await response.json()) as ApiResponse<{ id: number }>;

      if (!response.ok || !payload.success) {
        setErrorMessage(payload.error ?? "No se pudo registrar el pedido especial.");
        return;
      }

      setFeedback(
        "Pedido especial enviado correctamente. El equipo de la Agencia lo revisará."
      );
      setSpecialDetails("");
      setSpecialRequestedProduct(initialRequestedProduct || initialQuery);
      setRequesterName("");
      setRequesterEmail("");
      setRequesterPhone("");
      setRequesterCompany("");
      setSpecialKind("required_product");
    } catch {
      setErrorMessage("No se pudo conectar para registrar el pedido especial.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={`special-request-card ${className}`.trim()}>
      <header>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </header>

      {errorMessage ? (
        <p className="special-request-feedback special-request-feedback-error">
          {errorMessage}
        </p>
      ) : null}
      {feedback ? (
        <p className="special-request-feedback special-request-feedback-success">
          {feedback}
        </p>
      ) : null}

      <div className="special-request-grid">
        <label>
          Tipo de pedido
          <select
            value={specialKind}
            onChange={(event) => setSpecialKind(event.target.value as SpecialRequestKind)}
          >
            <option value="required_product">Producto necesario</option>
            <option value="special_offer">Solicitud de oferta especial</option>
          </select>
        </label>
        <label>
          Producto / necesidad
          <input
            type="text"
            value={specialRequestedProduct}
            onChange={(event) => setSpecialRequestedProduct(event.target.value)}
            placeholder="Ej: tanino vegetal de quebracho"
          />
        </label>
        <label>
          Tu nombre
          <input
            type="text"
            value={requesterName}
            onChange={(event) => setRequesterName(event.target.value)}
          />
        </label>
        <label>
          Email de contacto
          <input
            type="email"
            value={requesterEmail}
            onChange={(event) => setRequesterEmail(event.target.value)}
          />
        </label>
        <label>
          Teléfono
          <input
            type="text"
            value={requesterPhone}
            onChange={(event) => setRequesterPhone(event.target.value)}
          />
        </label>
        <label>
          Empresa (opcional)
          <input
            type="text"
            value={requesterCompany}
            onChange={(event) => setRequesterCompany(event.target.value)}
          />
        </label>
      </div>

      <label className="special-request-details">
        Detalle adicional
        <textarea
          rows={4}
          value={specialDetails}
          onChange={(event) => setSpecialDetails(event.target.value)}
          placeholder="Cantidad, especificaciones, mercado destino, etc."
        />
      </label>

      <button
        type="button"
        className="special-request-button"
        onClick={() => void handleSubmit()}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Enviando..." : "Enviar pedido especial"}
      </button>
    </section>
  );
}
