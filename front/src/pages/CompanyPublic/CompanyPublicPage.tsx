import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import MainLayout from "../../layouts/MainLayouts";
import type { ApiResponse } from "../../shared/types/api.types";
import type { PublicCompanyProfileView } from "../../shared/types/profile.types";
import OsmLocationPicker from "../../shared/components/OsmLocationPicker/OsmLocationPicker";
import { toDisplaySrc } from "../../shared/components/ImageField/ImageField";
import "./CompanyPublicPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
type LocatedPublicCompanyProfile = PublicCompanyProfileView & {
  latitude: number;
  longitude: number;
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

  const renderedErrorMessage = invalidCompanyId
    ? "Identificador de empresa inválido."
    : errorMessage;
  const shouldShowLoading = !invalidCompanyId && isLoading;
  const profileWithCoordinates = hasCoordinates(profile) ? profile : null;
  const openStreetMapLink = profileWithCoordinates
    ? `https://www.openstreetmap.org/?mlat=${profileWithCoordinates.latitude}&mlon=${profileWithCoordinates.longitude}#map=14/${profileWithCoordinates.latitude}/${profileWithCoordinates.longitude}`
    : null;

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
{profile.logoUrl ? (
                <img
                  className="company-public-logo"
                  src={toDisplaySrc(profile.logoUrl)}
                  alt={`Logo de ${profile.companyName ?? "empresa"}`}
                />
              ) : null}
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

              <section className="company-map-card">
                <header className="company-map-head">
                  <h2>Ubicación de la empresa</h2>
                  <small>Vista unificada con OpenStreetMap</small>
                </header>
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
                    {profile.address || profile.city ? (
                      <p className="company-map-address">
                        {profile.city ?? "Localidad no informada"}
                        {profile.address ? ` · ${profile.address}` : ""}
                      </p>
                    ) : null}
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
        </div>
      </section>
    </MainLayout>
  );
}
