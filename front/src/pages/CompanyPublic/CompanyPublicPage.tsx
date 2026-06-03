import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import MainLayout from "../../layouts/MainLayouts";
import type { ApiResponse } from "../../shared/types/api.types";
import type { PublicCompanyProfileView } from "../../shared/types/profile.types";
import "./CompanyPublicPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const hasIframeMarkup = (value?: string): boolean => {
  if (!value) {
    return false;
  }

  return /<iframe[\s\S]*<\/iframe>/i.test(value);
};

export default function CompanyPublicPage() {
  const { id } = useParams();
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

  const mapLink = useMemo(() => {
    if (
      typeof profile?.latitude === "number" &&
      typeof profile?.longitude === "number"
    ) {
      return `https://www.google.com/maps?q=${profile.latitude},${profile.longitude}`;
    }

    return null;
  }, [profile?.latitude, profile?.longitude]);
  const renderedErrorMessage = invalidCompanyId
    ? "Identificador de empresa inválido."
    : errorMessage;
  const shouldShowLoading = !invalidCompanyId && isLoading;

  return (
    <MainLayout>
      <section className="company-public-page">
        <div className="company-public-shell">
          <Link to="/" className="company-public-back">
            ← Volver al inicio
          </Link>

          {shouldShowLoading ? <p className="company-public-feedback">Cargando empresa...</p> : null}
          {renderedErrorMessage ? (
            <p className="company-public-feedback error">{renderedErrorMessage}</p>
          ) : null}

          {!shouldShowLoading && profile ? (
            <article className="company-public-card">
              {profile.companyName ? <h1>{profile.companyName}</h1> : null}
              {profile.description ? <p>{profile.description}</p> : null}

              <div className="company-public-grid">
                {profile.sector ? (
                  <div>
                    <dt>Sector</dt>
                    <dd>{profile.sector}</dd>
                  </div>
                ) : null}
                {profile.subSector ? (
                  <div>
                    <dt>Subsector</dt>
                    <dd>{profile.subSector}</dd>
                  </div>
                ) : null}
                {profile.product ? (
                  <div>
                    <dt>Producto</dt>
                    <dd>{profile.product}</dd>
                  </div>
                ) : null}
                {profile.keywords ? (
                  <div>
                    <dt>Keywords</dt>
                    <dd>{profile.keywords}</dd>
                  </div>
                ) : null}
                {profile.city ? (
                  <div>
                    <dt>Ciudad</dt>
                    <dd>{profile.city}</dd>
                  </div>
                ) : null}
                {profile.address ? (
                  <div>
                    <dt>Dirección</dt>
                    <dd>{profile.address}</dd>
                  </div>
                ) : null}
                {profile.contactName ? (
                  <div>
                    <dt>Contacto</dt>
                    <dd>{profile.contactName}</dd>
                  </div>
                ) : null}
                {profile.contactEmail ? (
                  <div>
                    <dt>Email</dt>
                    <dd>{profile.contactEmail}</dd>
                  </div>
                ) : null}
                {profile.phone ? (
                  <div>
                    <dt>Teléfono</dt>
                    <dd>{profile.phone}</dd>
                  </div>
                ) : null}
                {profile.website ? (
                  <div>
                    <dt>Sitio web</dt>
                    <dd>
                      <a href={profile.website} target="_blank" rel="noreferrer">
                        {profile.website}
                      </a>
                    </dd>
                  </div>
                ) : null}
              </div>

              {mapLink ? (
                <p className="company-map-link">
                  <a href={mapLink} target="_blank" rel="noreferrer">
                    Ver ubicación en Google Maps
                  </a>
                </p>
              ) : null}

              {hasIframeMarkup(profile.googleMapsEmbed) ? (
                <div
                  className="company-map-embed"
                  dangerouslySetInnerHTML={{ __html: profile.googleMapsEmbed ?? "" }}
                />
              ) : null}
            </article>
          ) : null}
        </div>
      </section>
    </MainLayout>
  );
}
