import { type FormEvent, useState } from "react";
import InstitutionalShell from "./InstitutionalShell";

// Datos provisorios hasta que se confirmen los oficiales de la Agencia.
const CONTACT_INFO = {
  organization: "Agencia para la Inversión y el Desarrollo del Chaco",
  dependency: "Secretaría de Coordinación de Gabinete",
  address: "Resistencia, Provincia del Chaco, Argentina",
  email: "contacto@agenciachaco.gob.ar",
  phone: "+54 362 XXX-XXXX",
  hours: "Lunes a viernes, 8:00 a 16:00"
} as const;

type FormState = {
  fullName: string;
  email: string;
  organization: string;
  subject: string;
  message: string;
};

const INITIAL_FORM: FormState = {
  fullName: "",
  email: "",
  organization: "",
  subject: "Consulta general",
  message: ""
};

const isValidEmail = (value: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

export default function ContactoInstitucionalPage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.fullName.trim() || !form.email.trim() || !form.message.trim()) {
      setErrorMessage("Completá nombre, email y mensaje.");
      return;
    }

    if (!isValidEmail(form.email)) {
      setErrorMessage("Ingresá un email válido.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    // Por ahora el formulario valida y confirma en cliente.
    // Cuando exista endpoint de contacto institucional, se conecta acá.
    window.setTimeout(() => {
      setSuccessMessage(
        "Recibimos tu consulta. El equipo institucional se pondrá en contacto a la brevedad."
      );
      setForm(INITIAL_FORM);
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <InstitutionalShell
      title="Contacto institucional"
      subtitle="Datos de contacto, dirección y formulario de consulta"
      wide
    >
      <div className="institutional-contact-grid">
        <article className="institutional-card">
          <h2>Datos de contacto</h2>
          <ul className="institutional-contact-list">
            <li>
              <span>Organismo</span>
              <strong>{CONTACT_INFO.organization}</strong>
            </li>
            <li>
              <span>Dependencia</span>
              <strong>{CONTACT_INFO.dependency}</strong>
            </li>
            <li>
              <span>Dirección</span>
              <strong>{CONTACT_INFO.address}</strong>
            </li>
            <li>
              <span>Email</span>
              <a href={`mailto:${CONTACT_INFO.email}`}>{CONTACT_INFO.email}</a>
            </li>
            <li>
              <span>Teléfono</span>
              <strong>{CONTACT_INFO.phone}</strong>
            </li>
            <li>
              <span>Horario de atención</span>
              <strong>{CONTACT_INFO.hours}</strong>
            </li>
          </ul>
          <p className="institutional-note">
            Los datos de contacto están provisorios hasta confirmar la información
            oficial de la Agencia.
          </p>
        </article>

        <article className="institutional-card">
          <h2>Formulario de consulta</h2>
          <form className="institutional-form" onSubmit={handleSubmit} noValidate>
            <div className="institutional-form-row">
              <label>
                Nombre y apellido
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  autoComplete="name"
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  autoComplete="email"
                  required
                />
              </label>
            </div>

            <div className="institutional-form-row">
              <label>
                Organización / empresa
                <input
                  type="text"
                  value={form.organization}
                  onChange={(event) => updateField("organization", event.target.value)}
                  autoComplete="organization"
                />
              </label>
              <label>
                Asunto
                <select
                  value={form.subject}
                  onChange={(event) => updateField("subject", event.target.value)}
                >
                  <option value="Consulta general">Consulta general</option>
                  <option value="Inversiones">Inversiones</option>
                  <option value="Comercio exterior">Comercio exterior</option>
                  <option value="Directorio de empresas">Directorio de empresas</option>
                  <option value="Parques industriales">Parques industriales</option>
                </select>
              </label>
            </div>

            <label>
              Mensaje
              <textarea
                value={form.message}
                onChange={(event) => updateField("message", event.target.value)}
                required
              />
            </label>

            {errorMessage ? (
              <p className="institutional-form-feedback error">{errorMessage}</p>
            ) : null}
            {successMessage ? (
              <p className="institutional-form-feedback success">{successMessage}</p>
            ) : null}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Enviar consulta"}
            </button>
          </form>
        </article>
      </div>
    </InstitutionalShell>
  );
}
