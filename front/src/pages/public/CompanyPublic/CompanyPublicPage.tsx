import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { resolveSearchBackPath } from "../../../shared/navigation/searchBack";
import MainLayout from "../../../layouts/MainLayouts";
import type { ApiResponse } from "../../../shared/types/api.types";
import type { PublicCompanyProfileView } from "../../../shared/types/profile.types";
import OsmLocationPicker from "../../../shared/components/OsmLocationPicker/OsmLocationPicker";
import { toDisplaySrc } from "../../../shared/components/ImageField/ImageField";
import InfoRequestForm from "../../../shared/components/InfoRequestForm/InfoRequestForm";
import { trackCompanyView } from "../../../shared/analytics/tracker";
import "./CompanyPublicPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

type LocatedPublicCompanyProfile = PublicCompanyProfileView & {
  latitude: number;
  longitude: number;
};

type LabeledLine = {
  label: string;
  value: string;
};

const hasCoordinates = (
  value: PublicCompanyProfileView | null
): value is LocatedPublicCompanyProfile => {
  return (
    typeof value?.latitude === "number" &&
    Number.isFinite(value.latitude) &&
    typeof value?.longitude === "number" &&
    Number.isFinite(value.longitude)
  );
};

const formatCoordinate = (value: number): string => value.toFixed(5);

const noopLocationChange = (): void => undefined;

/** Separa líneas "Etiqueta: valor" del párrafo libre de descripción. */
const splitDescription = (
  description?: string
): { labeled: LabeledLine[]; prose: string } => {
  if (!description?.trim()) {
    return { labeled: [], prose: "" };
  }

  const labeled: LabeledLine[] = [];
  const proseLines: string[] = [];

  description
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const match = line.match(/^([^:]{2,48}):\s*(.+)$/);
      if (match) {
        labeled.push({
          label: match[1].trim(),
          value: match[2].trim()
        });
        return;
      }
      proseLines.push(line);
    });

  return {
    labeled,
    prose: proseLines.join("\n")
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
  <div className={`company-public-field ${className}`.trim()}>
    <dt>{label}</dt>
    <dd>{children}</dd>
  </div>
);

export default function CompanyPublicPage() {
  const { id } = useParams();
  const location = useLocation();
  const backToSearch = resolveSearchBackPath(location.state);
  const [profile, setProfile] = useState<PublicCompanyProfileView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const invalidCompanyId = !id;

  useEffect(() => {
    if (invalidCompanyId) {
      return;
    }

    let active = true;

    const loadProfile = async (): Promise<void> => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(`${API_BASE_URL}/api/public/profiles/${id}`);
        const result = (await response.json()) as ApiResponse<PublicCompanyProfileView>;

        if (!active) {
          return;
        }

        if (!response.ok || !result.success) {
          setProfile(null);
          setErrorMessage(result.error ?? "No se pudo cargar la ficha de empresa.");
          return;
        }

        setProfile(result.data);
        if (result.data?.id) {
          trackCompanyView({
            profileId: result.data.id,
            companyName: result.data.companyName,
            path: `/empresas/${result.data.id}`
          });
        }
      } catch {
        if (!active) {
          return;
        }
        setProfile(null);
        setErrorMessage("No se pudo conectar con el backend de perfiles públicos.");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, [id, invalidCompanyId]);

  const descriptionParts = useMemo(
    () => splitDescription(profile?.description),
    [profile?.description]
  );

  const renderedErrorMessage = invalidCompanyId
    ? "Identificador de empresa inválido."
    : errorMessage;
  const shouldShowLoading = !invalidCompanyId && isLoading;
  const profileWithCoordinates = hasCoordinates(profile) ? profile : null;
  const openStreetMapLink = profileWithCoordinates
    ? `https://www.openstreetmap.org/?mlat=${profileWithCoordinates.latitude}&mlon=${profileWithCoordinates.longitude}#map=14/${profileWithCoordinates.latitude}/${profileWithCoordinates.longitude}`
    : null;

  const socialLinks = profile
    ? (
        [
          { key: "facebook", href: profile.facebook, label: "Facebook" },
          { key: "instagram", href: profile.instagram, label: "Instagram" },
          { key: "linkedin", href: profile.linkedin, label: "LinkedIn" },
          { key: "youtube", href: profile.youtube, label: "YouTube" },
          { key: "other", href: profile.otherLink, label: "Otro enlace" }
        ] as const
      ).filter((item) => Boolean(item.href?.trim()))
    : [];

  const hasOffer =
    Boolean(profile?.product) ||
    Boolean(profile?.keywords) ||
    Boolean(profile?.tariffPosition) ||
    Boolean(profile?.exportDestinations) ||
    Boolean(profile?.awards) ||
    Boolean(profile?.certifications);

  const hasContact =
    Boolean(profile?.contactName) ||
    Boolean(profile?.contactEmail) ||
    Boolean(profile?.phone) ||
    Boolean(profile?.website) ||
    socialLinks.length > 0;

  return (
    <MainLayout>
      <section className="company-public-page">
        <div className="company-public-shell">
          <Link to={backToSearch} className="company-public-back">
            Volver
          </Link>

          {shouldShowLoading ? (
            <p className="company-public-feedback">Cargando empresa...</p>
          ) : null}
          {renderedErrorMessage ? (
            <p className="company-public-feedback error">{renderedErrorMessage}</p>
          ) : null}

          {!shouldShowLoading && profile ? (
            <article className="company-public-card">
              <header className="company-public-hero">
                {profile.logoUrl ? (
                  <img
                    className="company-public-logo"
                    src={toDisplaySrc(profile.logoUrl)}
                    alt={`Logo de ${profile.companyName ?? "empresa"}`}
                  />
                ) : (
                  <div
                    className="company-public-logo company-public-logo-empty"
                    role="img"
                    aria-label="Sin imagen"
                  >
                    <span className="company-public-no-image-icon" aria-hidden="true">
                      ⌁
                    </span>
                    <span>Sin imagen</span>
                  </div>
                )}

                <div className="company-public-hero-copy">
                  {profile.companyName ? <h1>{profile.companyName}</h1> : null}
                  <div className="company-public-chips">
                    {profile.sector ? (
                      <span className="company-public-chip">{profile.sector}</span>
                    ) : null}
                    {profile.subSector ? (
                      <span className="company-public-chip soft">{profile.subSector}</span>
                    ) : null}
                    {profile.city ? (
                      <span className="company-public-chip soft">{profile.city}</span>
                    ) : null}
                  </div>
                  {descriptionParts.prose ? (
                    <p className="company-public-description">{descriptionParts.prose}</p>
                  ) : null}
                </div>
              </header>

              {descriptionParts.labeled.length > 0 ? (
                <section className="company-public-section">
                  <h2>Datos declarados</h2>
                  <dl className="company-public-grid">
                    {descriptionParts.labeled.map((item) => (
                      <Field key={`${item.label}-${item.value}`} label={item.label}>
                        {item.value}
                      </Field>
                    ))}
                  </dl>
                </section>
              ) : null}

              {(profile.sector || profile.subSector) && descriptionParts.labeled.length === 0 ? (
                <section className="company-public-section">
                  <h2>Actividad</h2>
                  <dl className="company-public-grid">
                    {profile.sector ? <Field label="Sector">{profile.sector}</Field> : null}
                    {profile.subSector ? (
                      <Field label="Subsector">{profile.subSector}</Field>
                    ) : null}
                  </dl>
                </section>
              ) : null}

              {hasOffer ? (
                <section className="company-public-section">
                  <h2>Oferta exportable</h2>
                  <dl className="company-public-grid">
                    {profile.product ? (
                      <Field label="Producto" className="full">
                        <span className="company-public-multiline">{profile.product}</span>
                      </Field>
                    ) : null}
                    {profile.keywords ? (
                      <Field label="Keywords" className="full">
                        <span className="company-public-multiline">{profile.keywords}</span>
                      </Field>
                    ) : null}
                    {profile.tariffPosition ? (
                      <Field label="Posición arancelaria (P.A.)">
                        <span
                          className="company-public-pa-badge"
                          title="Posición arancelaria / NCM"
                        >
                          P.A. {profile.tariffPosition}
                        </span>
                      </Field>
                    ) : null}
                    {profile.exportDestinations ? (
                      <Field label="Destinos de exportación">
                        {profile.exportDestinations}
                      </Field>
                    ) : null}
                    {profile.awards ? <Field label="Premios">{profile.awards}</Field> : null}
                    {profile.certifications ? (
                      <Field label="Certificaciones">{profile.certifications}</Field>
                    ) : null}
                  </dl>
                </section>
              ) : null}

              {hasContact ? (
                <section className="company-public-section">
                  <h2>Contacto</h2>
                  <dl className="company-public-grid">
                    {profile.contactName ? (
                      <Field label="Contacto">{profile.contactName}</Field>
                    ) : null}
                    {profile.contactEmail ? (
                      <Field label="Email">
                        <a href={`mailto:${profile.contactEmail}`}>{profile.contactEmail}</a>
                      </Field>
                    ) : null}
                    {profile.phone ? (
                      <Field label="Teléfono">
                        <a href={`tel:${profile.phone.replace(/\s+/g, "")}`}>{profile.phone}</a>
                      </Field>
                    ) : null}
                    {profile.website ? (
                      <Field label="Sitio web" className="full">
                        <a href={profile.website} target="_blank" rel="noreferrer">
                          {profile.website}
                        </a>
                      </Field>
                    ) : null}
                    {socialLinks.length > 0 ? (
                      <Field label="Redes" className="full">
                        <ul className="company-public-socials">
                          {socialLinks.map((item) => (
                            <li key={item.key}>
                              <a href={item.href} target="_blank" rel="noreferrer">
                                {item.label}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </Field>
                    ) : null}
                  </dl>
                </section>
              ) : null}

              <section className="company-public-section company-map-card">
                <header className="company-map-head">
                  <h2>Ubicación</h2>
                  <small>Vista unificada con OpenStreetMap</small>
                </header>

                {(profile.address || profile.city) && (
                  <dl className="company-public-grid company-public-grid-compact">
                    {profile.city ? <Field label="Ciudad">{profile.city}</Field> : null}
                    {profile.address ? (
                      <Field label="Dirección" className="full">
                        {profile.address}
                      </Field>
                    ) : null}
                  </dl>
                )}

                {profileWithCoordinates ? (
                  <div className="company-map-view">
                    <OsmLocationPicker
                      latitude={profileWithCoordinates.latitude}
                      longitude={profileWithCoordinates.longitude}
                      onChange={noopLocationChange}
                      readOnly
                    />
                    <p className="company-map-meta">
                      Coordenadas:{" "}
                      <strong>
                        {formatCoordinate(profileWithCoordinates.latitude)},{" "}
                        {formatCoordinate(profileWithCoordinates.longitude)}
                      </strong>
                    </p>
                    {openStreetMapLink ? (
                      <p className="company-map-link">
                        <a href={openStreetMapLink} target="_blank" rel="noreferrer">
                          Abrir en OpenStreetMap
                        </a>
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="company-map-empty">
                    Esta empresa no tiene coordenadas visibles para mostrar en mapa.
                  </p>
                )}
              </section>
            </article>
          ) : null}

          {!shouldShowLoading && profile ? (
            <InfoRequestForm
              profileId={profile.id}
              companyName={profile.companyName}
              sourceQuery={`empresa:${profile.id}`}
              title="Contactar a la administración"
              description="Si necesitás más datos de esta empresa, dejá tu solicitud. El equipo de la Agencia revisará qué información puede compartir y te responderá por email o WhatsApp."
            />
          ) : null}
        </div>
      </section>
    </MainLayout>
  );
}
