import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PrivateLayout from "../../layouts/PrivateLayout";
import ImageField, { toDisplaySrc } from "../../shared/components/ImageField/ImageField";
import { clearAuthSession, getAuthSession } from "../../shared/auth/session";
import type { ApiResponse } from "../../shared/types/api.types";
import type {
  CompanyOwnProfile,
  CompanyPanelFormState,
  CompanyProductView,
  ProfileEditMode
} from "./company-panel.types";
import "./CompanyPanelPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const editModeLabel: Record<ProfileEditMode, string> = {
  agency: "Gestiona Agencia",
  company: "Gestiona Empresa",
  mixed: "Gestión Mixta"
};

const emptyFormState: CompanyPanelFormState = {
  companyName: "",
  contactName: "",
  contactEmail: "",
  phone: "",
  taxId: "",
  description: "",
  sector: "",
  subSector: "",
  product: "",
  keywords: "",
  tariffPosition: "",
  exportDestinations: "",
  awards: "",
  certifications: "",
  logoUrl: "",
  website: "",
  facebook: "",
  instagram: "",
  linkedin: "",
  youtube: "",
  otherLink: "",
  address: "",
  city: "",
  googleMapsEmbed: "",
  latitude: "",
  longitude: ""
};

interface CompanyProductFormState {
  name: string;
  description: string;
  imageUrl: string;
  tariffPosition: string;
  isTariffPositionUnknown: boolean;
}

const emptyProductFormState: CompanyProductFormState = {
  name: "",
  description: "",
  imageUrl: "",
  tariffPosition: "",
  isTariffPositionUnknown: false
};

const toFormState = (profile: CompanyOwnProfile): CompanyPanelFormState => {
  return {
    companyName: profile.companyName ?? "",
    contactName: profile.contactName ?? "",
    contactEmail: profile.contactEmail ?? "",
    phone: profile.phone ?? "",
    taxId: profile.taxId ?? "",
    description: profile.description ?? "",
    sector: profile.sector ?? "",
    subSector: profile.subSector ?? "",
    product: profile.product ?? "",
    keywords: profile.keywords ?? "",
    tariffPosition: profile.tariffPosition ?? "",
    exportDestinations: profile.exportDestinations ?? "",
    awards: profile.awards ?? "",
    certifications: profile.certifications ?? "",
    logoUrl: profile.logoUrl ?? "",
    website: profile.website ?? "",
    facebook: profile.facebook ?? "",
    instagram: profile.instagram ?? "",
    linkedin: profile.linkedin ?? "",
    youtube: profile.youtube ?? "",
    otherLink: profile.otherLink ?? "",
    address: profile.address ?? "",
    city: profile.city ?? "",
    googleMapsEmbed: profile.googleMapsEmbed ?? "",
    latitude:
      typeof profile.latitude === "number" && Number.isFinite(profile.latitude)
        ? String(profile.latitude)
        : "",
    longitude:
      typeof profile.longitude === "number" && Number.isFinite(profile.longitude)
        ? String(profile.longitude)
        : ""
  };
};

const toProductFormState = (product: CompanyProductView): CompanyProductFormState => {
  return {
    name: product.name ?? "",
    description: product.description ?? "",
    imageUrl: product.imageUrl ?? "",
    tariffPosition: product.tariffPosition ?? "",
    isTariffPositionUnknown: Boolean(product.isTariffPositionUnknown)
  };
};

const toProductTariffLabel = (product: CompanyProductView): string => {
  if (product.isTariffPositionUnknown) {
    return "P.A. no informada";
  }

  if (product.tariffPosition) {
    return `P.A.: ${product.tariffPosition}`;
  }

  return "P.A. sin definir";
};

const toProductReviewLabel = (product: CompanyProductView): string => {
  if (product.isAccepted === true) {
    return "Aceptado";
  }

  if (product.isAccepted === false) {
    return "No aceptado";
  }

  return "Pendiente de revisión";
};

const toProductReviewTone = (
  product: CompanyProductView
): "accepted" | "rejected" | "pending" => {
  if (product.isAccepted === true) {
    return "accepted";
  }

  if (product.isAccepted === false) {
    return "rejected";
  }

  return "pending";
};

const byProductUpdatedAtDesc = (
  left: CompanyProductView,
  right: CompanyProductView
): number => {
  const leftTime = Date.parse(left.updatedAt);
  const rightTime = Date.parse(right.updatedAt);

  if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
    return rightTime - leftTime;
  }

  return right.id - left.id;
};

const upsertProduct = (
  currentProducts: CompanyProductView[],
  nextProduct: CompanyProductView
): CompanyProductView[] => {
  return [...currentProducts.filter((product) => product.id !== nextProduct.id), nextProduct].sort(
    byProductUpdatedAtDesc
  );
};

const removeProduct = (
  currentProducts: CompanyProductView[],
  productId: number
): CompanyProductView[] => {
  return currentProducts.filter((product) => product.id !== productId);
};

const trimNullable = (value: string): string | null => {
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
};

const parseNullableNumber = (value: string): number | null => {
  const cleaned = value.trim();
  if (!cleaned) {
    return null;
  }

  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const isValidEmail = (value: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

export default function CompanyPanelPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CompanyOwnProfile | null>(null);
  const [formState, setFormState] = useState<CompanyPanelFormState>(emptyFormState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [productFormState, setProductFormState] =
    useState<CompanyProductFormState>(emptyProductFormState);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);

  const visibleFieldCount = useMemo(() => {
    if (!profile) {
      return 0;
    }

    return Object.values(profile.visibility).filter(Boolean).length;
  }, [profile]);

  const handleUnauthorized = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  const getAuthHeader = (): string | null => {
    const token = getAuthSession()?.token;
    return token ? `Bearer ${token}` : null;
  };

  const loadProfile = async (): Promise<void> => {
    setIsLoading(true);
    setErrorMessage("");
    setInfoMessage("");

    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/company/profile/me`, {
        headers: {
          Authorization: authHeader
        }
      });
      const result = (await response.json()) as ApiResponse<CompanyOwnProfile>;

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.status === 404) {
        setProfile(null);
        setFormState(emptyFormState);
        setProductFormState(emptyProductFormState);
        setEditingProductId(null);
        setDeletingProductId(null);
        setInfoMessage(
          result.error ??
            "Cuando la Agencia apruebe tu solicitud, acá vas a poder cargar y completar la ficha de empresa."
        );
        return;
      }

      if (!response.ok || !result.success) {
        setProfile(null);
        setErrorMessage(result.error ?? "No se pudo cargar tu perfil de empresa.");
        return;
      }

      setProfile(result.data);
      setFormState(toFormState(result.data));
      setProductFormState(emptyProductFormState);
      setEditingProductId(null);
      setDeletingProductId(null);
    } catch {
      setProfile(null);
      setErrorMessage("No se pudo conectar con el backend para cargar tu perfil.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value
    }));
    setErrorMessage("");
    setInfoMessage("");
  };

  const handleProductFieldChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setProductFormState((prev) => ({
      ...prev,
      [name]: value
    }));
    setErrorMessage("");
    setInfoMessage("");
  };

  const handleToggleUnknownTariff = (event: ChangeEvent<HTMLInputElement>) => {
    const nextChecked = event.target.checked;
    setProductFormState((prev) => ({
      ...prev,
      isTariffPositionUnknown: nextChecked,
      tariffPosition: nextChecked ? "" : prev.tariffPosition
    }));
    setErrorMessage("");
    setInfoMessage("");
  };

  const handleEditProduct = (product: CompanyProductView) => {
    setEditingProductId(product.id);
    setProductFormState(toProductFormState(product));
    setErrorMessage("");
    setInfoMessage("");
  };

  const handleCancelProductEdit = () => {
    setEditingProductId(null);
    setProductFormState(emptyProductFormState);
    setErrorMessage("");
    setInfoMessage("");
  };

  const handleSaveProduct = async (): Promise<void> => {
    if (!profile) {
      return;
    }

    if (!profile.canCompanyEdit) {
      setErrorMessage(
        "Este perfil está en modo gestionado por Agencia. Solicitá habilitación para editar."
      );
      return;
    }

    const name = productFormState.name.trim();
    if (!name) {
      setErrorMessage("El nombre del producto es obligatorio.");
      return;
    }

    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    const isEditing = editingProductId !== null;
    const endpoint = isEditing
      ? `${API_BASE_URL}/api/company/profile/me/products/${editingProductId}`
      : `${API_BASE_URL}/api/company/profile/me/products`;

    const payload = {
      name,
      description: trimNullable(productFormState.description),
      imageUrl: trimNullable(productFormState.imageUrl),
      tariffPosition: productFormState.isTariffPositionUnknown
        ? null
        : trimNullable(productFormState.tariffPosition),
      isTariffPositionUnknown: productFormState.isTariffPositionUnknown
    };

    setIsSavingProduct(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const response = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader
        },
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as ApiResponse<CompanyProductView>;

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !result.success || !result.data) {
        setErrorMessage(result.error ?? "No se pudo guardar el producto.");
        return;
      }

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              products: upsertProduct(prev.products ?? [], result.data)
            }
          : prev
      );
      setEditingProductId(null);
      setProductFormState(emptyProductFormState);
      setInfoMessage(
        isEditing ? "Producto actualizado correctamente." : "Producto creado correctamente."
      );
    } catch {
      setErrorMessage("No se pudo conectar con el backend para guardar el producto.");
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: number): Promise<void> => {
    if (!profile) {
      return;
    }

    if (!profile.canCompanyEdit) {
      setErrorMessage(
        "Este perfil está en modo gestionado por Agencia. Solicitá habilitación para editar."
      );
      return;
    }

    if (!window.confirm("¿Querés eliminar este producto?")) {
      return;
    }

    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    setDeletingProductId(productId);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/company/profile/me/products/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: authHeader
          }
        }
      );
      const result = (await response.json()) as ApiResponse<null>;

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !result.success) {
        setErrorMessage(result.error ?? "No se pudo eliminar el producto.");
        return;
      }

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              products: removeProduct(prev.products ?? [], productId)
            }
          : prev
      );
      if (editingProductId === productId) {
        setEditingProductId(null);
        setProductFormState(emptyProductFormState);
      }
      setInfoMessage("Producto eliminado correctamente.");
    } catch {
      setErrorMessage("No se pudo conectar con el backend para eliminar el producto.");
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!profile) {
      return;
    }

    if (!profile.canCompanyEdit) {
      setErrorMessage(
        "Este perfil está en modo gestionado por Agencia. Solicitá habilitación para editar."
      );
      return;
    }

    if (
      !formState.companyName.trim() ||
      !formState.contactName.trim() ||
      !formState.contactEmail.trim()
    ) {
      setErrorMessage("Completá nombre de empresa, contacto y email.");
      return;
    }

    if (!isValidEmail(formState.contactEmail)) {
      setErrorMessage("El email de contacto no tiene un formato válido.");
      return;
    }

    const authHeader = getAuthHeader();
    if (!authHeader) {
      handleUnauthorized();
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const payload = {
        companyName: formState.companyName.trim(),
        contactName: formState.contactName.trim(),
        contactEmail: formState.contactEmail.trim(),
        phone: trimNullable(formState.phone),
        taxId: trimNullable(formState.taxId),
        description: trimNullable(formState.description),
        sector: trimNullable(formState.sector),
        subSector: trimNullable(formState.subSector),
        product: trimNullable(formState.product),
        keywords: trimNullable(formState.keywords),
        tariffPosition: trimNullable(formState.tariffPosition),
        exportDestinations: trimNullable(formState.exportDestinations),
        awards: trimNullable(formState.awards),
        certifications: trimNullable(formState.certifications),
        logoUrl: trimNullable(formState.logoUrl),
        website: trimNullable(formState.website),
        facebook: trimNullable(formState.facebook),
        instagram: trimNullable(formState.instagram),
        linkedin: trimNullable(formState.linkedin),
        youtube: trimNullable(formState.youtube),
        otherLink: trimNullable(formState.otherLink),
        address: trimNullable(formState.address),
        city: trimNullable(formState.city),
        googleMapsEmbed: trimNullable(formState.googleMapsEmbed),
        latitude: parseNullableNumber(formState.latitude),
        longitude: parseNullableNumber(formState.longitude)
      };

      const response = await fetch(`${API_BASE_URL}/api/company/profile/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader
        },
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as ApiResponse<CompanyOwnProfile>;

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !result.success) {
        setErrorMessage(result.error ?? "No se pudo guardar tu perfil.");
        return;
      }

      setProfile(result.data);
      setFormState(toFormState(result.data));
      setInfoMessage("Perfil guardado correctamente.");
    } catch {
      setErrorMessage("No se pudo conectar con el backend para guardar el perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PrivateLayout>
      <section className="company-panel-page">
        <div className="company-panel-shell">
          <header className="company-panel-header">
            <p>Panel empresa</p>
            <h1>Cargar datos de empresa y completar</h1>
            <small>
              Completá y actualizá la ficha que se muestra públicamente según la
              visibilidad configurada por la Agencia.
            </small>
            {profile ? (
              <div className="company-panel-metadata">
                <span>{editModeLabel[profile.editMode]}</span>
                <span>{profile.isPublished ? "Publicado" : "No publicado"}</span>
                <span>{visibleFieldCount} campos visibles al público</span>
              </div>
            ) : null}
          </header>

          {errorMessage ? <p className="company-feedback error">{errorMessage}</p> : null}
          {infoMessage ? <p className="company-feedback info">{infoMessage}</p> : null}

          {isLoading ? <p className="company-feedback">Cargando perfil...</p> : null}

          {!isLoading && !profile ? (
            <article className="company-empty-card">
              <h2>Perfil todavía no disponible</h2>
              <p>
                Cuando el administrador apruebe tu solicitud y cree/vincule la ficha,
                acá vas a poder completar toda la información de tu empresa.
              </p>
            </article>
          ) : null}

          {!isLoading && profile ? (
            <form className="company-profile-form" onSubmit={handleSubmit}>
              <section className="form-card">
                <h2>Identidad y contacto</h2>
                <div className="form-grid">
                  <label>
                    Nombre de la empresa *
                    <input
                      name="companyName"
                      value={formState.companyName}
                      onChange={handleInputChange}
                      disabled={!profile.canCompanyEdit}
                    />
                  </label>
                  <label>
                    Persona de contacto *
                    <input
                      name="contactName"
                      value={formState.contactName}
                      onChange={handleInputChange}
                      disabled={!profile.canCompanyEdit}
                    />
                  </label>
                  <label>
                    Email de contacto *
                    <input
                      name="contactEmail"
                      type="email"
                      value={formState.contactEmail}
                      onChange={handleInputChange}
                      disabled={!profile.canCompanyEdit}
                    />
                  </label>
                  <label>
                    Teléfono
                    <input
                      name="phone"
                      value={formState.phone}
                      onChange={handleInputChange}
                      disabled={!profile.canCompanyEdit}
                    />
                  </label>
                  <label>
                    CUIT / Tax ID
                    <input
                      name="taxId"
                      value={formState.taxId}
                      onChange={handleInputChange}
                      disabled={!profile.canCompanyEdit}
                    />
                  </label>
<div className="full">
                    <ImageField
                      label="Logo empresa"
                      kind="logo"
                      value={formState.logoUrl}
                      disabled={!profile.canCompanyEdit}
                      onChange={(nextValue) =>
                        setFormState((prev) => ({
                          ...prev,
                          logoUrl: nextValue
                        }))
                      }
                    />
                  </div>
                </div>
              </section>

              <section className="form-card">
                <h2>Oferta exportable</h2>
                <div className="form-grid">
                  <label className="full">
                    Descripción
                    <textarea
                      name="description"
                      rows={4}
                      value={formState.description}
                      onChange={handleInputChange}
                      disabled={!profile.canCompanyEdit}
                    />
                  </label>
                  <label>
                    Sector / Rubro
                    <input
                      name="sector"
                      value={formState.sector}
                      onChange={handleInputChange}
                      disabled={!profile.canCompanyEdit}
                    />
                  </label>
                  <label>
                    Sub-rubro
                    <input
                      name="subSector"
                      value={formState.subSector}
                      onChange={handleInputChange}
                      disabled={!profile.canCompanyEdit}
                    />
                  </label>
                  <label>
                    Producto principal
                    <input
                      name="product"
                      value={formState.product}
                      onChange={handleInputChange}
                      disabled={!profile.canCompanyEdit}
                    />
                  </label>
                  <label>
                    Palabras clave
                    <input
                      name="keywords"
                      value={formState.keywords}
                      onChange={handleInputChange}
                      disabled={!profile.canCompanyEdit}
                    />
                  </label>
                  <label>
                    Posición arancelaria
                    <input
                      name="tariffPosition"
                      value={formState.tariffPosition}
                      onChange={handleInputChange}
                      disabled={!profile.canCompanyEdit}
                    />
                  </label>
                  <label>
                    Mercados de destino
                    <input
                      name="exportDestinations"
                      value={formState.exportDestinations}
                      onChange={handleInputChange}
                      disabled={!profile.canCompanyEdit}
                    />
                  </label>
                  <label>
                    Premios
                    <input
                      name="awards"
                      value={formState.awards}
                      onChange={handleInputChange}
                      disabled={!profile.canCompanyEdit}
                    />
                  </label>
                  <label>
                    Certificaciones
                    <input
                      name="certifications"
                      value={formState.certifications}
                      onChange={handleInputChange}
                      disabled={!profile.canCompanyEdit}
                    />
                  </label>
                </div>
              </section>

              <section className="form-card company-products-card">
                <div className="company-products-header">
                  <h2>Productos exportables</h2>
                  <small>
                    Cargá múltiples productos con imagen, descripción y Posición Arancelaria
                    (P.A.), o marcá que la P.A. todavía no es conocida.
                  </small>
                </div>

                <div className="company-products-form-grid">
                  <label>
                    Nombre del producto *
                    <input
                      name="name"
                      value={productFormState.name}
                      onChange={handleProductFieldChange}
                      disabled={!profile.canCompanyEdit || isSavingProduct}
                    />
                  </label>
<div className="full">
                    <ImageField
                      label="Imagen del producto"
                      kind="product-image"
                      value={productFormState.imageUrl}
                      disabled={!profile.canCompanyEdit || isSavingProduct}
                      onChange={(nextValue) =>
                        setProductFormState((prev) => ({
                          ...prev,
                          imageUrl: nextValue
                        }))
                      }
                    />
                  </div>
                  <label className="full">
                    Descripción del producto
                    <textarea
                      name="description"
                      rows={3}
                      value={productFormState.description}
                      onChange={handleProductFieldChange}
                      disabled={!profile.canCompanyEdit || isSavingProduct}
                    />
                  </label>
                  <label>
                    Posición arancelaria (P.A.)
                    <input
                      name="tariffPosition"
                      value={productFormState.tariffPosition}
                      onChange={handleProductFieldChange}
                      disabled={
                        !profile.canCompanyEdit ||
                        isSavingProduct ||
                        productFormState.isTariffPositionUnknown
                      }
                      placeholder="Ej: 0201.30"
                    />
                  </label>
                  <label className="full company-product-unknown-toggle">
                    <input
                      type="checkbox"
                      checked={productFormState.isTariffPositionUnknown}
                      onChange={handleToggleUnknownTariff}
                      disabled={!profile.canCompanyEdit || isSavingProduct}
                    />
                    <span>No conozco la Posición Arancelaria (P.A.)</span>
                  </label>
                </div>

                <div className="company-products-form-actions">
                  {editingProductId !== null ? (
                    <button
                      type="button"
                      className="secondary"
                      onClick={handleCancelProductEdit}
                      disabled={isSavingProduct}
                    >
                      Cancelar edición
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void handleSaveProduct()}
                    disabled={!profile.canCompanyEdit || isSavingProduct}
                  >
                    {isSavingProduct
                      ? "Guardando..."
                      : editingProductId !== null
                        ? "Actualizar producto"
                        : "Agregar producto"}
                  </button>
                </div>

                {profile.products.length === 0 ? (
                  <p className="company-products-empty">Todavía no hay productos cargados.</p>
                ) : (
                  <ul className="company-products-list">
                    {profile.products.map((product) => (
                      <li
                        key={product.id}
                        className={
                          editingProductId === product.id
                            ? "company-product-item editing"
                            : "company-product-item"
                        }
                      >
                        <div className="company-product-main">
                          <div className="company-product-main-head">
                            <strong>{product.name}</strong>
                            <span
                              className={`company-product-review-badge ${toProductReviewTone(product)}`}
                            >
                              {toProductReviewLabel(product)}
                            </span>
                          </div>
                          <small>{toProductTariffLabel(product)}</small>
                          {product.isAccepted === false && product.rejectionMessage ? (
                            <p className="company-product-rejection-message">
                              No aceptado: {product.rejectionMessage}
                            </p>
                          ) : null}
                          {product.description ? <p>{product.description}</p> : null}
                          {product.imageUrl ? (
                            <div className="company-product-image-preview-wrap">
                              <img
                                className="company-product-image-preview"
                                src={toDisplaySrc(product.imageUrl)}
                                alt={`Imagen de ${product.name}`}
                              />
                              <a href={toDisplaySrc(product.imageUrl)} target="_blank" rel="noreferrer">
                                Ver imagen
                              </a>
                            </div>
                          ) : null}
                        </div>
                        <div className="company-product-actions">
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => handleEditProduct(product)}
                            disabled={!profile.canCompanyEdit || isSavingProduct}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="danger"
                            onClick={() => void handleDeleteProduct(product.id)}
                            disabled={
                              !profile.canCompanyEdit ||
                              isSavingProduct ||
                              deletingProductId === product.id
                            }
                          >
                            {deletingProductId === product.id ? "Eliminando..." : "Eliminar"}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="form-card">
                <h2>Ubicación y geolocalización</h2>
                <div className="form-grid">
                  <label>
                    Ciudad
                    <input
                      name="city"
                      value={formState.city}
                      onChange={handleInputChange}
                      disabled={!profile.canCompanyEdit}
                    />
                  </label>
                  <label>
                    Dirección
                    <input
                      name="address"
                      value={formState.address}
                      onChange={handleInputChange}
                      disabled={!profile.canCompanyEdit}
                    />
                  </label>
                  <label>
                    Latitud
                    <input
                      name="latitude"
                      value={formState.latitude}
                      onChange={handleInputChange}
                      disabled={!profile.canCompanyEdit}
                    />
                  </label>
                  <label>
                    Longitud
                    <input
                      name="longitude"
                      value={formState.longitude}
                      onChange={handleInputChange}
                      disabled={!profile.canCompanyEdit}
                    />
                  </label>
                  <label className="full">
                    Google Maps Embed (iframe src o snippet)
                    <textarea
                      name="googleMapsEmbed"
                      rows={3}
                      value={formState.googleMapsEmbed}
                      onChange={handleInputChange}
                      disabled={!profile.canCompanyEdit}
                    />
                  </label>
                </div>
              </section>

              <section className="form-card">
                <h2>Canales y enlaces</h2>
                <div className="form-grid">
                  <label>
                    Sitio web
                    <input
                      name="website"
                      value={formState.website}
                      onChange={handleInputChange}
                      disabled={!profile.canCompanyEdit}
                    />
                  </label>
                  <label>
                    Facebook
                    <input
                      name="facebook"
                      value={formState.facebook}
                      onChange={handleInputChange}
                      disabled={!profile.canCompanyEdit}
                    />
                  </label>
                  <label>
                    Instagram
                    <input
                      name="instagram"
                      value={formState.instagram}
                      onChange={handleInputChange}
                      disabled={!profile.canCompanyEdit}
                    />
                  </label>
                  <label>
                    LinkedIn
                    <input
                      name="linkedin"
                      value={formState.linkedin}
                      onChange={handleInputChange}
                      disabled={!profile.canCompanyEdit}
                    />
                  </label>
                  <label>
                    YouTube
                    <input
                      name="youtube"
                      value={formState.youtube}
                      onChange={handleInputChange}
                      disabled={!profile.canCompanyEdit}
                    />
                  </label>
                  <label>
                    Otro enlace
                    <input
                      name="otherLink"
                      value={formState.otherLink}
                      onChange={handleInputChange}
                      disabled={!profile.canCompanyEdit}
                    />
                  </label>
                </div>
              </section>

              <footer className="company-form-actions">
                {!profile.canCompanyEdit ? (
                  <p className="company-lock-note">
                    La Agencia configuró este perfil como no editable para la empresa.
                  </p>
                ) : null}
                <button type="submit" disabled={isSaving || !profile.canCompanyEdit}>
                  {isSaving ? "Guardando..." : "Guardar perfil"}
                </button>
              </footer>
            </form>
          ) : null}
        </div>
      </section>
    </PrivateLayout>
  );
}

