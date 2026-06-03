import { type ChangeEvent, type FormEvent, useState } from "react";
import PrivateLayout from "../../layouts/PrivateLayout";
import type {
  CatalogItem,
  CompanyPhotoItem,
  ProductPhotoItem,
  RegisterFormState
} from "./register.types";
import "./RegisterPage.css";
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const stepTitles = [
  "Datos de la empresa",
  "Contacto y sector",
  "Producto y comunicación",
  "Adjuntos y envío"
];

const sectorOptions = [
  "Agroindustria",
  "Alimentos y Bebidas",
  "Energético – Minero",
  "Forestal",
  "Ganadería",
  "Industria y otros",
  "Turismo",
  "Vitivinícola",
  "Servicios"
];

const initialFormState: RegisterFormState = {
  companyName: "",
  contactEmail: "",
  phone: "",
  address: "",
  city: "",
  googleMapsEmbed: "",
  description: "",
  representativeName: "",
  representativeRole: "",
  representativeEmail: "",
  sector: "",
  chamberMembership: "",
  chamberNames: "",
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
  hasCatalog: "",
  hasProductPhotos: "",
  hasCompanyPhotos: ""
};

const createId = (): string => {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createCatalogItem = (): CatalogItem => ({
  id: createId(),
  title: "",
  file: null
});

const createProductPhotoItem = (): ProductPhotoItem => ({
  id: createId(),
  description: "",
  file: null
});

const createCompanyPhotoItem = (): CompanyPhotoItem => ({
  id: createId(),
  file: null
});

const isValidEmail = (value: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const isValidUrl = (value: string): boolean => {
  if (!value.trim()) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const hasFile = (
  items: Array<{ file: File | null }>
): boolean => {
  return items.some((item) => item.file !== null);
};

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formState, setFormState] = useState<RegisterFormState>(initialFormState);
  const [logo, setLogo] = useState<File | null>(null);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [productPhotos, setProductPhotos] = useState<ProductPhotoItem[]>([]);
  const [companyPhotos, setCompanyPhotos] = useState<CompanyPhotoItem[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const clearError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }

      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const key = event.target.name as keyof RegisterFormState;
    const value = event.target.value;

    setFormState((prev) => ({
      ...prev,
      [key]: value
    }));
    clearError(String(key));
    setSuccessMessage("");
    setApiError("");

    if (key === "hasCatalog") {
      if (value === "si" && catalogItems.length === 0) {
        setCatalogItems([createCatalogItem()]);
      }
      if (value !== "si") {
        setCatalogItems([]);
      }
      clearError("catalogItems");
    }

    if (key === "hasProductPhotos") {
      if (value === "si" && productPhotos.length === 0) {
        setProductPhotos([createProductPhotoItem()]);
      }
      if (value !== "si") {
        setProductPhotos([]);
      }
      clearError("productPhotos");
    }

    if (key === "hasCompanyPhotos") {
      if (value === "si" && companyPhotos.length === 0) {
        setCompanyPhotos([createCompanyPhotoItem()]);
      }
      if (value !== "si") {
        setCompanyPhotos([]);
      }
      clearError("companyPhotos");
    }
  };

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setLogo(file);
    clearError("logo");
    setSuccessMessage("");
    setApiError("");
  };

  const addCatalogItem = () => {
    setCatalogItems((prev) => {
      if (prev.length >= 6) {
        return prev;
      }

      return [...prev, createCatalogItem()];
    });
  };

  const updateCatalogTitle = (id: string, title: string) => {
    setCatalogItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, title } : item))
    );
    clearError("catalogItems");
  };

  const updateCatalogFile = (id: string, file: File | null) => {
    setCatalogItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, file } : item))
    );
    clearError("catalogItems");
  };

  const removeCatalogItem = (id: string) => {
    setCatalogItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addProductPhoto = () => {
    setProductPhotos((prev) => {
      if (prev.length >= 6) {
        return prev;
      }

      return [...prev, createProductPhotoItem()];
    });
  };

  const updateProductPhotoDescription = (id: string, description: string) => {
    setProductPhotos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, description } : item))
    );
    clearError("productPhotos");
  };

  const updateProductPhotoFile = (id: string, file: File | null) => {
    setProductPhotos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, file } : item))
    );
    clearError("productPhotos");
  };

  const removeProductPhoto = (id: string) => {
    setProductPhotos((prev) => prev.filter((item) => item.id !== id));
  };

  const addCompanyPhoto = () => {
    setCompanyPhotos((prev) => {
      if (prev.length >= 6) {
        return prev;
      }

      return [...prev, createCompanyPhotoItem()];
    });
  };

  const updateCompanyPhotoFile = (id: string, file: File | null) => {
    setCompanyPhotos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, file } : item))
    );
    clearError("companyPhotos");
  };

  const removeCompanyPhoto = (id: string) => {
    setCompanyPhotos((prev) => prev.filter((item) => item.id !== id));
  };

  const validateStep = (step: number): boolean => {
    const nextErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formState.companyName.trim()) {
        nextErrors.companyName = "Ingresá el nombre de la empresa.";
      }
      if (!formState.contactEmail.trim()) {
        nextErrors.contactEmail = "Ingresá un email de contacto.";
      } else if (!isValidEmail(formState.contactEmail)) {
        nextErrors.contactEmail = "El email no tiene un formato válido.";
      }
      if (!formState.phone.trim()) {
        nextErrors.phone = "Ingresá un teléfono.";
      }
      if (!formState.address.trim()) {
        nextErrors.address = "Ingresá el domicilio.";
      }
      if (!formState.city.trim()) {
        nextErrors.city = "Ingresá la localidad.";
      }
      if (!formState.description.trim()) {
        nextErrors.description = "Agregá una descripción breve de la empresa.";
      }
      if (logo && logo.size > 2 * 1024 * 1024) {
        nextErrors.logo = "El logo debe pesar como máximo 2 MB.";
      }
    }

    if (step === 1) {
      if (!formState.representativeName.trim()) {
        nextErrors.representativeName = "Ingresá el representante de la empresa.";
      }
      if (
        formState.representativeEmail.trim() &&
        !isValidEmail(formState.representativeEmail)
      ) {
        nextErrors.representativeEmail =
          "El email del representante no tiene un formato válido.";
      }
      if (!formState.sector.trim()) {
        nextErrors.sector = "Seleccioná un sector productivo.";
      }
      if (!formState.chamberMembership) {
        nextErrors.chamberMembership = "Indicá si la empresa está en una cámara.";
      }
      if (
        formState.chamberMembership === "si" &&
        !formState.chamberNames.trim()
      ) {
        nextErrors.chamberNames = "Indicá qué cámara/s integra la empresa.";
      }
    }

    if (step === 2) {
      const socialFields: Array<keyof RegisterFormState> = [
        "website",
        "facebook",
        "instagram",
        "linkedin",
        "youtube",
        "otherLink"
      ];

      socialFields.forEach((field) => {
        if (!isValidUrl(formState[field])) {
          nextErrors[field] = "Ingresá una URL válida (http o https).";
        }
      });
    }

    if (step === 3) {
      if (!formState.hasCatalog) {
        nextErrors.hasCatalog = "Indicá si querés adjuntar catálogo.";
      }
      if (!formState.hasProductPhotos) {
        nextErrors.hasProductPhotos = "Indicá si querés adjuntar fotos de producto.";
      }
      if (!formState.hasCompanyPhotos) {
        nextErrors.hasCompanyPhotos = "Indicá si querés adjuntar fotos de empresa.";
      }

      if (formState.hasCatalog === "si" && !hasFile(catalogItems)) {
        nextErrors.catalogItems = "Adjuntá al menos un archivo de catálogo.";
      }
      if (formState.hasProductPhotos === "si" && !hasFile(productPhotos)) {
        nextErrors.productPhotos = "Adjuntá al menos una foto de producto.";
      }
      if (formState.hasCompanyPhotos === "si" && !hasFile(companyPhotos)) {
        nextErrors.companyPhotos = "Adjuntá al menos una foto de empresa.";
      }
      if (!acceptedTerms) {
        nextErrors.terms = "Debés aceptar la revisión de datos para enviar.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNextStep = () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, stepTitles.length - 1));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateStep(3)) {
      return;
    }
    const contactName = formState.representativeName.trim() || formState.companyName.trim();
    const payload = {
      companyName: formState.companyName.trim(),
      contactName,
      email: formState.contactEmail.trim(),
      phone: formState.phone.trim() || undefined,
      message: JSON.stringify({
        address: formState.address.trim(),
        city: formState.city.trim(),
        description: formState.description.trim(),
        representativeRole: formState.representativeRole.trim(),
        representativeEmail: formState.representativeEmail.trim(),
        sector: formState.sector,
        chamberMembership: formState.chamberMembership,
        chamberNames: formState.chamberNames.trim(),
        product: formState.product.trim(),
        keywords: formState.keywords.trim(),
        tariffPosition: formState.tariffPosition.trim(),
        exportDestinations: formState.exportDestinations.trim(),
        awards: formState.awards.trim(),
        certifications: formState.certifications.trim(),
        links: {
          website: formState.website.trim(),
          facebook: formState.facebook.trim(),
          instagram: formState.instagram.trim(),
          linkedin: formState.linkedin.trim(),
          youtube: formState.youtube.trim(),
          other: formState.otherLink.trim()
        },
        attachments: {
          logo: logo?.name ?? null,
          hasCatalog: formState.hasCatalog,
          catalog: catalogItems.map((item) => ({
            title: item.title.trim(),
            fileName: item.file?.name ?? null
          })),
          hasProductPhotos: formState.hasProductPhotos,
          productPhotos: productPhotos.map((item) => ({
            description: item.description.trim(),
            fileName: item.file?.name ?? null
          })),
          hasCompanyPhotos: formState.hasCompanyPhotos,
          companyPhotos: companyPhotos.map((item) => ({
            fileName: item.file?.name ?? null
          }))
        }
      })
    };

    setIsSubmitting(true);
    setApiError("");
    setSuccessMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/public/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        setApiError(result?.error ?? "No se pudo enviar la solicitud.");
        return;
      }

      setSuccessMessage(
        `Solicitud enviada correctamente (ID ${result?.data?.id ?? "N/A"}). Quedó registrada para revisión del administrador.`
      );
    } catch {
      setApiError("No se pudo conectar con el backend. Verificá que la API esté levantada.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PrivateLayout>
      <section className="register-page">
        <div className="register-shell">
          <header className="register-header">
            <p className="register-eyebrow">Incorporá tu empresa</p>
            <h1>Formulario de preinscripción</h1>
            <p>
              Completá la información de tu empresa. La solicitud será revisada
              por el equipo administrador antes de publicarse.
            </p>
          </header>

          <ol className="register-steps" aria-label="Paso del formulario">
            {stepTitles.map((title, index) => (
              <li
                key={title}
                className={index === currentStep ? "step-item active" : "step-item"}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (index <= currentStep) {
                      setCurrentStep(index);
                    }
                  }}
                  disabled={index > currentStep}
                >
                  <span>{index + 1}</span>
                  <small>{title}</small>
                </button>
              </li>
            ))}
          </ol>

          {successMessage ? (
            <div className="form-success" role="status">
              {successMessage}
            </div>
          ) : null}
          {apiError ? (
            <div className="form-error" role="alert">
              {apiError}
            </div>
          ) : null}

          <form className="register-form" onSubmit={handleSubmit} noValidate>
            {currentStep === 0 ? (
              <div className="form-step">
                <h2>Datos de la empresa</h2>
                <div className="form-grid">
                  <label>
                    Nombre de la empresa *
                    <input
                      type="text"
                      name="companyName"
                      value={formState.companyName}
                      onChange={handleInputChange}
                    />
                    {errors.companyName ? <span>{errors.companyName}</span> : null}
                  </label>

                  <label>
                    Email de contacto *
                    <input
                      type="email"
                      name="contactEmail"
                      value={formState.contactEmail}
                      onChange={handleInputChange}
                    />
                    {errors.contactEmail ? <span>{errors.contactEmail}</span> : null}
                  </label>

                  <label>
                    Teléfono *
                    <input
                      type="tel"
                      name="phone"
                      value={formState.phone}
                      onChange={handleInputChange}
                    />
                    {errors.phone ? <span>{errors.phone}</span> : null}
                  </label>

                  <label>
                    Domicilio *
                    <input
                      type="text"
                      name="address"
                      value={formState.address}
                      onChange={handleInputChange}
                    />
                    {errors.address ? <span>{errors.address}</span> : null}
                  </label>

                  <label>
                    Localidad *
                    <input
                      type="text"
                      name="city"
                      value={formState.city}
                      onChange={handleInputChange}
                    />
                    {errors.city ? <span>{errors.city}</span> : null}
                  </label>

                  <label>
                    Ubicación Google Maps (HTML embed)
                    <textarea
                      name="googleMapsEmbed"
                      value={formState.googleMapsEmbed}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </label>

                  <label className="full-width">
                    Breve descripción *
                    <textarea
                      name="description"
                      value={formState.description}
                      onChange={handleInputChange}
                      rows={4}
                    />
                    {errors.description ? <span>{errors.description}</span> : null}
                  </label>

                  <label className="full-width">
                    Logo (jpg/png/jpeg, máx 2 MB)
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      onChange={handleLogoChange}
                    />
                    {errors.logo ? <span>{errors.logo}</span> : null}
                  </label>
                </div>
              </div>
            ) : null}

            {currentStep === 1 ? (
              <div className="form-step">
                <h2>Información de contacto</h2>
                <div className="form-grid">
                  <label>
                    Representante de la empresa *
                    <input
                      type="text"
                      name="representativeName"
                      value={formState.representativeName}
                      onChange={handleInputChange}
                    />
                    {errors.representativeName ? (
                      <span>{errors.representativeName}</span>
                    ) : null}
                  </label>

                  <label>
                    Cargo
                    <input
                      type="text"
                      name="representativeRole"
                      value={formState.representativeRole}
                      onChange={handleInputChange}
                    />
                  </label>

                  <label>
                    Email del representante
                    <input
                      type="email"
                      name="representativeEmail"
                      value={formState.representativeEmail}
                      onChange={handleInputChange}
                    />
                    {errors.representativeEmail ? (
                      <span>{errors.representativeEmail}</span>
                    ) : null}
                  </label>

                  <label>
                    Sector productivo *
                    <select
                      name="sector"
                      value={formState.sector}
                      onChange={handleInputChange}
                    >
                      <option value="">Seleccionar sector</option>
                      {sectorOptions.map((sector) => (
                        <option key={sector} value={sector}>
                          {sector}
                        </option>
                      ))}
                    </select>
                    {errors.sector ? <span>{errors.sector}</span> : null}
                  </label>

                  <label>
                    Inscripta en alguna cámara *
                    <select
                      name="chamberMembership"
                      value={formState.chamberMembership}
                      onChange={handleInputChange}
                    >
                      <option value="">Seleccionar</option>
                      <option value="si">Sí</option>
                      <option value="no">No</option>
                    </select>
                    {errors.chamberMembership ? (
                      <span>{errors.chamberMembership}</span>
                    ) : null}
                  </label>

                  {formState.chamberMembership === "si" ? (
                    <label>
                      ¿Cuáles?
                      <input
                        type="text"
                        name="chamberNames"
                        value={formState.chamberNames}
                        onChange={handleInputChange}
                        placeholder="Ej: Cámara de Comercio de..."
                      />
                      {errors.chamberNames ? <span>{errors.chamberNames}</span> : null}
                    </label>
                  ) : null}
                </div>
              </div>
            ) : null}

            {currentStep === 2 ? (
              <div className="form-step">
                <h2>Producto/servicio y comunicación</h2>
                <div className="form-grid">
                  <label>
                    Producto o servicio
                    <input
                      type="text"
                      name="product"
                      value={formState.product}
                      onChange={handleInputChange}
                    />
                  </label>

                  <label>
                    Palabras clave
                    <input
                      type="text"
                      name="keywords"
                      value={formState.keywords}
                      onChange={handleInputChange}
                      placeholder="Separar con coma"
                    />
                  </label>

                  <label>
                    Posición arancelaria
                    <input
                      type="text"
                      name="tariffPosition"
                      value={formState.tariffPosition}
                      onChange={handleInputChange}
                    />
                  </label>

                  <label>
                    Destinos de exportación
                    <input
                      type="text"
                      name="exportDestinations"
                      value={formState.exportDestinations}
                      onChange={handleInputChange}
                    />
                  </label>

                  <label>
                    Premios (últimos 2 años)
                    <input
                      type="text"
                      name="awards"
                      value={formState.awards}
                      onChange={handleInputChange}
                    />
                  </label>

                  <label>
                    Certificaciones
                    <input
                      type="text"
                      name="certifications"
                      value={formState.certifications}
                      onChange={handleInputChange}
                    />
                  </label>

                  <label>
                    Web
                    <input
                      type="url"
                      name="website"
                      value={formState.website}
                      onChange={handleInputChange}
                      placeholder="https://..."
                    />
                    {errors.website ? <span>{errors.website}</span> : null}
                  </label>

                  <label>
                    Facebook
                    <input
                      type="url"
                      name="facebook"
                      value={formState.facebook}
                      onChange={handleInputChange}
                      placeholder="https://..."
                    />
                    {errors.facebook ? <span>{errors.facebook}</span> : null}
                  </label>

                  <label>
                    Instagram
                    <input
                      type="url"
                      name="instagram"
                      value={formState.instagram}
                      onChange={handleInputChange}
                      placeholder="https://..."
                    />
                    {errors.instagram ? <span>{errors.instagram}</span> : null}
                  </label>

                  <label>
                    LinkedIn
                    <input
                      type="url"
                      name="linkedin"
                      value={formState.linkedin}
                      onChange={handleInputChange}
                      placeholder="https://..."
                    />
                    {errors.linkedin ? <span>{errors.linkedin}</span> : null}
                  </label>

                  <label>
                    YouTube
                    <input
                      type="url"
                      name="youtube"
                      value={formState.youtube}
                      onChange={handleInputChange}
                      placeholder="https://..."
                    />
                    {errors.youtube ? <span>{errors.youtube}</span> : null}
                  </label>

                  <label>
                    Otro enlace
                    <input
                      type="url"
                      name="otherLink"
                      value={formState.otherLink}
                      onChange={handleInputChange}
                      placeholder="https://..."
                    />
                    {errors.otherLink ? <span>{errors.otherLink}</span> : null}
                  </label>
                </div>
              </div>
            ) : null}

            {currentStep === 3 ? (
              <div className="form-step">
                <h2>Adjuntos y envío</h2>
                <div className="form-grid">
                  <label>
                    ¿Desea adjuntar catálogo? *
                    <select
                      name="hasCatalog"
                      value={formState.hasCatalog}
                      onChange={handleInputChange}
                    >
                      <option value="">Seleccionar</option>
                      <option value="si">Sí</option>
                      <option value="no">No</option>
                    </select>
                    {errors.hasCatalog ? <span>{errors.hasCatalog}</span> : null}
                  </label>

                  <label>
                    ¿Desea adjuntar fotos del producto? *
                    <select
                      name="hasProductPhotos"
                      value={formState.hasProductPhotos}
                      onChange={handleInputChange}
                    >
                      <option value="">Seleccionar</option>
                      <option value="si">Sí</option>
                      <option value="no">No</option>
                    </select>
                    {errors.hasProductPhotos ? (
                      <span>{errors.hasProductPhotos}</span>
                    ) : null}
                  </label>

                  <label>
                    ¿Desea agregar fotos de la empresa? *
                    <select
                      name="hasCompanyPhotos"
                      value={formState.hasCompanyPhotos}
                      onChange={handleInputChange}
                    >
                      <option value="">Seleccionar</option>
                      <option value="si">Sí</option>
                      <option value="no">No</option>
                    </select>
                    {errors.hasCompanyPhotos ? (
                      <span>{errors.hasCompanyPhotos}</span>
                    ) : null}
                  </label>
                </div>

                {formState.hasCatalog === "si" ? (
                  <div className="dynamic-block">
                    <div className="dynamic-header">
                      <h3>Catálogo de productos (máx. 6)</h3>
                      <button
                        type="button"
                        onClick={addCatalogItem}
                        disabled={catalogItems.length >= 6}
                      >
                        + Agregar archivo
                      </button>
                    </div>
                    {catalogItems.map((item) => (
                      <article key={item.id} className="dynamic-row">
                        <label>
                          Título
                          <input
                            type="text"
                            value={item.title}
                            onChange={(event) =>
                              updateCatalogTitle(item.id, event.target.value)
                            }
                          />
                        </label>
                        <label>
                          Archivo PDF
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(event) =>
                              updateCatalogFile(item.id, event.target.files?.[0] ?? null)
                            }
                          />
                        </label>
                        <button
                          type="button"
                          className="remove-row"
                          onClick={() => removeCatalogItem(item.id)}
                        >
                          Quitar
                        </button>
                      </article>
                    ))}
                    {errors.catalogItems ? <span>{errors.catalogItems}</span> : null}
                  </div>
                ) : null}

                {formState.hasProductPhotos === "si" ? (
                  <div className="dynamic-block">
                    <div className="dynamic-header">
                      <h3>Fotos de producto (máx. 6)</h3>
                      <button
                        type="button"
                        onClick={addProductPhoto}
                        disabled={productPhotos.length >= 6}
                      >
                        + Agregar foto
                      </button>
                    </div>
                    {productPhotos.map((item) => (
                      <article key={item.id} className="dynamic-row">
                        <label>
                          Foto (jpg/png/jpeg)
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png"
                            onChange={(event) =>
                              updateProductPhotoFile(
                                item.id,
                                event.target.files?.[0] ?? null
                              )
                            }
                          />
                        </label>
                        <label>
                          Descripción breve
                          <input
                            type="text"
                            value={item.description}
                            onChange={(event) =>
                              updateProductPhotoDescription(
                                item.id,
                                event.target.value
                              )
                            }
                          />
                        </label>
                        <button
                          type="button"
                          className="remove-row"
                          onClick={() => removeProductPhoto(item.id)}
                        >
                          Quitar
                        </button>
                      </article>
                    ))}
                    {errors.productPhotos ? <span>{errors.productPhotos}</span> : null}
                  </div>
                ) : null}

                {formState.hasCompanyPhotos === "si" ? (
                  <div className="dynamic-block">
                    <div className="dynamic-header">
                      <h3>Fotos de empresa (máx. 6)</h3>
                      <button
                        type="button"
                        onClick={addCompanyPhoto}
                        disabled={companyPhotos.length >= 6}
                      >
                        + Agregar foto
                      </button>
                    </div>
                    {companyPhotos.map((item) => (
                      <article key={item.id} className="dynamic-row">
                        <label>
                          Foto (jpg/png/jpeg)
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png"
                            onChange={(event) =>
                              updateCompanyPhotoFile(
                                item.id,
                                event.target.files?.[0] ?? null
                              )
                            }
                          />
                        </label>
                        <button
                          type="button"
                          className="remove-row"
                          onClick={() => removeCompanyPhoto(item.id)}
                        >
                          Quitar
                        </button>
                      </article>
                    ))}
                    {errors.companyPhotos ? <span>{errors.companyPhotos}</span> : null}
                  </div>
                ) : null}

                <label className="terms-check">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(event) => {
                      setAcceptedTerms(event.target.checked);
                      clearError("terms");
                    }}
                  />
                  <span>
                    Confirmo que los datos serán revisados por el administrador
                    antes de su publicación.
                  </span>
                </label>
                {errors.terms ? <span className="terms-error">{errors.terms}</span> : null}
              </div>
            ) : null}

            <footer className="form-actions">
              <button
                type="button"
                className="register-btn-ghost"
                onClick={handlePrevStep}
                disabled={currentStep === 0}
              >
                Anterior
              </button>

              {currentStep < stepTitles.length - 1 ? (
                <button
                  type="button"
                  className="register-btn-primary"
                  onClick={handleNextStep}
                >
                  Siguiente
                </button>
              ) : (
                <button type="submit" className="register-btn-primary">
                  {isSubmitting ? "Enviando..." : "Enviar solicitud"}
                </button>
              )}
            </footer>
          </form>
        </div>
      </section>
    </PrivateLayout>
  );
}
