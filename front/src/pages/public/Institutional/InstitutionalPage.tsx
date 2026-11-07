import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../../../layouts/MainLayouts";
import { useScrollToHash } from "../../../shared/hooks/useScrollToHash";
import "./InstitutionalPage.css";

const TOC = [
  { id: "quienes-somos", label: "Quiénes somos" },
  { id: "objetivos", label: "Objetivos" },
  { id: "organismos-vinculados", label: "Organismos vinculados" },
  { id: "contacto", label: "Contacto" }
] as const;

const OBJECTIVES = [
  "Atraer y coordinar inversiones nacionales y extranjeras que impulsen la diversificación productiva de la provincia.",
  "Relevar y sistematizar la oferta exportable chaqueña, generando información confiable y actualizada sobre empresas, productos y capacidades.",
  "Crear y mantener un Directorio de empresas exportadoras y una Cartera de Inversiones y Parques Industriales, disponibles para compradores e inversores de todo el mundo.",
  "Facilitar trámites, incentivos y financiamiento para proyectos productivos, actuando como ventanilla única ante el Estado provincial.",
  "Promover la internacionalización de bienes y servicios chaqueños, conectando a las empresas locales con mercados y compradores externos.",
  "Fortalecer la articulación entre el sector público y el sector privado, acompañando a cada inversor con seguimiento personalizado."
] as const;

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

export default function InstitutionalPage() {
  useScrollToHash();

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

    window.setTimeout(() => {
      setSuccessMessage(
        "Recibimos tu consulta. El equipo institucional se pondrá en contacto a la brevedad."
      );
      setForm(INITIAL_FORM);
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <MainLayout>
      <section className="institutional-page">
        <div className="institutional-shell institutional-shell-wide">
          <header className="institutional-header">
            <p>Institucional</p>
            <h1>Agencia para la Inversión y el Desarrollo del Chaco</h1>
            <small>
              Conocé la Agencia, sus objetivos, la red de organismos vinculados y
              los canales de contacto.
            </small>
          </header>

          <nav className="hub-toc" aria-label="Secciones institucionales">
            {TOC.map((item) => (
              <Link key={item.id} to={`/institucional#${item.id}`} className="hub-toc-link">
                {item.label}
              </Link>
            ))}
          </nav>

          <section id="quienes-somos" className="hub-section">
            <article className="institutional-card">
              <h2>Quiénes somos</h2>
              <p className="hub-section-lead">
                Agencia para la Inversión y el Desarrollo del Chaco
              </p>
              <div className="institutional-prose">
                <p>
                  La Agencia para la Inversión y el Desarrollo del Chaco es el organismo
                  creado por el Gobierno de la Provincia para atraer, coordinar e impulsar
                  inversiones nacionales y extranjeras, en el marco de una nueva etapa de
                  dinamismo económico y productivo para el Chaco.
                </p>
                <p>
                  Dependiente de la Secretaría de Coordinación de Gabinete, funcionamos
                  como la ventanilla única para quienes deseen invertir en la provincia:
                  promovemos oportunidades sectoriales, diseñamos estrategias de inversión
                  y agilizamos trámites e incentivos para proyectos productivos, evitando
                  burocracia innecesaria. Cada empresario cuenta con un oficial de cuentas
                  que lo acompaña en cada etapa del proceso, garantizando negociaciones
                  rápidas y efectivas.
                </p>
                <p>
                  Somos el puente estratégico entre el sector público y el sector privado,
                  y trabajamos para proyectar al Chaco al mundo: impulsando la
                  internacionalización de sus bienes y servicios, generando empleo genuino
                  y consolidando a la provincia como un nuevo polo de desarrollo productivo
                  y exportador.
                </p>
              </div>
            </article>
          </section>

          <section id="objetivos" className="hub-section">
            <article className="institutional-card">
              <h2>Objetivos</h2>
              <p className="hub-section-lead">
                Trabajamos para consolidar al Chaco como un destino confiable y competitivo
                para la inversión y el comercio exterior.
              </p>
              <h3 className="hub-section-subhead">
                Nuestra gestión se ordena en torno a estos objetivos
              </h3>
              <ul className="institutional-list">
                {OBJECTIVES.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </section>

          <section id="organismos-vinculados" className="hub-section">
            <article className="institutional-card">
              <h2>Organismos vinculados</h2>
              <p className="hub-section-lead">
                Red institucional para el desarrollo productivo y exportador
              </p>
              <div className="institutional-prose">
                <p>
                  La Agencia trabaja de manera articulada con organismos públicos, cámaras
                  empresariales y entidades técnicas que fortalecen el desarrollo
                  productivo y exportador de la provincia. Esta red de aliados
                  institucionales —que incluye organismos de asistencia técnica,
                  financiamiento, ciencia y tecnología, y representación sectorial— es
                  clave para acompañar a las empresas chaqueñas en cada etapa de su
                  proceso exportador y de inversión.
                </p>
              </div>
            </article>
          </section>

          <section id="contacto" className="hub-section">
            <div className="hub-section-heading-block">
              <h2 className="hub-section-title-standalone">Contacto institucional</h2>
              <p className="hub-section-lead">
                Datos de contacto, dirección y formulario de consulta
              </p>
            </div>
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
          </section>
        </div>
      </section>
    </MainLayout>
  );
}
