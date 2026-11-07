import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { resolveSearchBackPath } from "../../../shared/navigation/searchBack";
import MainLayout from "../../../layouts/MainLayouts";
import type { ApiResponse } from "../../../shared/types/api.types";
import { toDisplaySrc } from "../../../shared/components/ImageField/ImageField";
import InfoRequestForm from "../../../shared/components/InfoRequestForm/InfoRequestForm";
import { trackProductView } from "../../../shared/analytics/tracker";
import "./ProductPublicPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export type PublicProductDetail = {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  tariffPosition?: string;
  company: {
    id: number;
    companyName?: string;
    logoUrl?: string;
    sector?: string;
    subSector?: string;
    city?: string;
    website?: string;
    contactName?: string;
    contactEmail?: string;
    phone?: string;
  };
};

const Field = ({
  label,
  children,
  className = ""
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) => (
  <div className={`product-public-field ${className}`.trim()}>
    <dt>{label}</dt>
    <dd>{children}</dd>
  </div>
);

export default function ProductPublicPage() {
  const { id } = useParams();
  const location = useLocation();
  const backToSearch = resolveSearchBackPath(location.state);
  const [product, setProduct] = useState<PublicProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const invalidProductId = !id;

  useEffect(() => {
    if (invalidProductId) {
      return;
    }

    let active = true;

    const loadProduct = async (): Promise<void> => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(`${API_BASE_URL}/api/public/products/${id}`);
        const result = (await response.json()) as ApiResponse<PublicProductDetail>;

        if (!active) {
          return;
        }

        if (!response.ok || !result.success) {
          setProduct(null);
          setErrorMessage(result.error ?? "No se pudo cargar la ficha de producto.");
          return;
        }

        setProduct(result.data);
        if (result.data?.id) {
          trackProductView({
            profileId: result.data.company.id,
            productId: result.data.id,
            productName: result.data.name,
            companyName: result.data.company.companyName,
            path: `/productos/${result.data.id}`
          });
        }
      } catch {
        if (!active) {
          return;
        }
        setProduct(null);
        setErrorMessage("No se pudo conectar con el backend de productos públicos.");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadProduct();

    return () => {
      active = false;
    };
  }, [id, invalidProductId]);

  const renderedErrorMessage = invalidProductId
    ? "Identificador de producto inválido."
    : errorMessage;
  const shouldShowLoading = !invalidProductId && isLoading;
  const company = product?.company;
  const mediaSrc = product?.imageUrl || company?.logoUrl;
  const isLogoFallback = Boolean(company?.logoUrl) && !product?.imageUrl;

  const hasCompanyContext =
    Boolean(company?.companyName) ||
    Boolean(company?.sector) ||
    Boolean(company?.subSector) ||
    Boolean(company?.city);

  const hasContact =
    Boolean(company?.contactName) ||
    Boolean(company?.contactEmail) ||
    Boolean(company?.phone) ||
    Boolean(company?.website);

  return (
    <MainLayout>
      <section className="product-public-page">
        <div className="product-public-shell">
          <Link to={backToSearch} className="product-public-back">
            Volver
          </Link>

          {shouldShowLoading ? (
            <p className="product-public-feedback">Cargando producto...</p>
          ) : null}
          {renderedErrorMessage ? (
            <p className="product-public-feedback error">{renderedErrorMessage}</p>
          ) : null}

          {!shouldShowLoading && product ? (
            <article className="product-public-card">
              <header className="product-public-hero">
                {mediaSrc ? (
                  <img
                    className={`product-public-media${isLogoFallback ? " product-public-media-logo" : ""}`}
                    src={toDisplaySrc(mediaSrc)}
                    alt={
                      isLogoFallback
                        ? `Logo de ${company?.companyName ?? "empresa"}`
                        : `Imagen de ${product.name}`
                    }
                  />
                ) : (
                  <div
                    className="product-public-media product-public-media-empty"
                    role="img"
                    aria-label="Sin imagen"
                  >
                    <span className="product-public-no-image-icon" aria-hidden="true">
                      ⌁
                    </span>
                    <span>Sin imagen</span>
                  </div>
                )}

                <div className="product-public-hero-copy">
                  <h1>{product.name}</h1>
                </div>
              </header>

              {product.tariffPosition || product.description ? (
                <section className="product-public-section">
                  <h2>Detalle del producto</h2>
                  <dl className="product-public-grid">
                    {product.tariffPosition ? (
                      <Field label="Posición arancelaria (P.A.)">
                        <span className="product-public-pa-badge">
                          P.A. {product.tariffPosition}
                        </span>
                      </Field>
                    ) : null}
                    {product.description ? (
                      <Field label="Descripción" className="full">
                        <span className="product-public-multiline">{product.description}</span>
                      </Field>
                    ) : null}
                  </dl>
                </section>
              ) : null}

              {hasCompanyContext ? (
                <section className="product-public-section">
                  <h2>Empresa</h2>
                  <dl className="product-public-grid">
                    {company?.companyName ? (
                      <Field label="Razón social / nombre" className="full">
                        <Link
                          className="product-public-company-link"
                          to={`/empresas/${company.id}`}
                        >
                          {company.companyName}
                        </Link>
                      </Field>
                    ) : null}
                    {company?.sector ? <Field label="Sector">{company.sector}</Field> : null}
                    {company?.subSector ? (
                      <Field label="Subsector">{company.subSector}</Field>
                    ) : null}
                    {company?.city ? <Field label="Ciudad">{company.city}</Field> : null}
                  </dl>
                  <div className="product-public-company-actions">
                    <Link className="product-public-cta" to={`/empresas/${company?.id}`}>
                      Ver ficha de empresa
                    </Link>
                  </div>
                </section>
              ) : null}

              {hasContact ? (
                <section className="product-public-section">
                  <h2>Contacto de la empresa</h2>
                  <dl className="product-public-grid">
                    {company?.contactName ? (
                      <Field label="Contacto">{company.contactName}</Field>
                    ) : null}
                    {company?.contactEmail ? (
                      <Field label="Email">
                        <a href={`mailto:${company.contactEmail}`}>{company.contactEmail}</a>
                      </Field>
                    ) : null}
                    {company?.phone ? (
                      <Field label="Teléfono">
                        <a href={`tel:${company.phone.replace(/\s+/g, "")}`}>{company.phone}</a>
                      </Field>
                    ) : null}
                    {company?.website ? (
                      <Field label="Sitio web" className="full">
                        <a href={company.website} target="_blank" rel="noreferrer">
                          {company.website}
                        </a>
                      </Field>
                    ) : null}
                  </dl>
                </section>
              ) : null}
            </article>
          ) : null}

          {!shouldShowLoading && product ? (
            <InfoRequestForm
              profileId={product.company.id}
              companyName={product.company.companyName}
              sourceQuery={`producto:${product.id}`}
              title="Consultar por este producto"
              description="Si necesitás más información sobre este producto, dejá tu solicitud. El equipo de la Agencia revisará qué datos puede compartir y te responderá por email o WhatsApp."
            />
          ) : null}
        </div>
      </section>
    </MainLayout>
  );
}
