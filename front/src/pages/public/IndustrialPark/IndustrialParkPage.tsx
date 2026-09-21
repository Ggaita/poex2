import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import MainLayout from "../../../layouts/MainLayouts";
import { toDisplaySrc } from "../../../shared/components/ImageField/ImageField";
import type { ApiResponse } from "../../../shared/types/api.types";
import type { PublicCompanyProfileView } from "../../../shared/types/profile.types";
import "./IndustrialParkPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
const FALLBACK_CENTER: [number, number] = [-27.4516, -58.9866];
const FALLBACK_ZOOM = 7;

const markerStyle: L.CircleMarkerOptions = {
  color: "#0f172a",
  fillColor: "#0ea5e9",
  fillOpacity: 0.88,
  radius: 7,
  weight: 2
};

type IndustrialParkView = {
  id: number;
  slug: string;
  name: string;
  administration?: string;
  progressStatus: string;
  locality: string;
  department?: string;
  yearCreated?: number;
  surfaceHa?: number;
  measuredPlots?: number;
  settledCompanies?: string;
  infrastructure?: string;
  renpiStatus?: string;
  observations?: string;
  sortOrder: number;
};

type LocatedProfile = PublicCompanyProfileView & {
  latitude: number;
  longitude: number;
};

const parseCoordinate = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.trim().replace(",", ".");
    if (!cleaned) return null;
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toLocatedProfile = (profile: PublicCompanyProfileView): LocatedProfile | null => {
  const latitude = parseCoordinate(profile.latitude);
  const longitude = parseCoordinate(profile.longitude);
  if (latitude === null || longitude === null) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { ...profile, latitude, longitude };
};

const toCompanyTitle = (profile: PublicCompanyProfileView): string =>
  profile.companyName?.trim() || `Empresa #${profile.id}`;

const toCompanyInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? "")
    .join("");

const formatHa = (value?: number): string => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return `${value} ha`;
};

export default function IndustrialParkPage() {
  const [parks, setParks] = useState<IndustrialParkView[]>([]);
  const [profiles, setProfiles] = useState<PublicCompanyProfileView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [parkStatusFilter, setParkStatusFilter] = useState("all");
  const [parkSearch, setParkSearch] = useState("");

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    let active = true;

    const load = async (): Promise<void> => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const [parksRes, profilesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/public/industrial-parks`),
          fetch(`${API_BASE_URL}/api/public/profiles`)
        ]);

        const parksPayload = (await parksRes.json()) as ApiResponse<IndustrialParkView[]>;
        const profilesPayload = (await profilesRes.json()) as ApiResponse<PublicCompanyProfileView[]>;

        if (!active) return;

        if (!parksRes.ok || !parksPayload.success) {
          setParks([]);
        } else {
          setParks(Array.isArray(parksPayload.data) ? parksPayload.data : []);
        }

        if (!profilesRes.ok || !profilesPayload.success) {
          setProfiles([]);
          if (!parksRes.ok || !parksPayload.success) {
            setErrorMessage(
              parksPayload.error ||
                profilesPayload.error ||
                "No se pudieron cargar parques y empresas."
            );
          }
        } else {
          setProfiles(Array.isArray(profilesPayload.data) ? profilesPayload.data : []);
        }
      } catch {
        if (!active) return;
        setParks([]);
        setProfiles([]);
        setErrorMessage("No se pudo conectar con el backend.");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  const locatedProfiles = useMemo(
    () =>
      profiles
        .map((profile) => toLocatedProfile(profile))
        .filter((profile): profile is LocatedProfile => profile !== null),
    [profiles]
  );

  const parkStatusOptions = useMemo(() => {
    const set = new Set(parks.map((p) => p.progressStatus).filter(Boolean));
    return ["all", ...[...set].sort((a, b) => a.localeCompare(b, "es"))];
  }, [parks]);

  const filteredParks = useMemo(() => {
    const q = parkSearch.trim().toLowerCase();
    return parks.filter((park) => {
      if (parkStatusFilter !== "all" && park.progressStatus !== parkStatusFilter) return false;
      if (!q) return true;
      const hay = [park.name, park.locality, park.department, park.administration]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [parks, parkSearch, parkStatusFilter]);

  useEffect(() => {
    if (isLoading || !mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView(FALLBACK_CENTER, FALLBACK_ZOOM);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const resizeTimer = window.setTimeout(() => map.invalidateSize(), 50);
    return () => {
      window.clearTimeout(resizeTimer);
      markersLayerRef.current?.clearLayers();
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, [isLoading]);

  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    if (locatedProfiles.length === 0) {
      map.setView(FALLBACK_CENTER, FALLBACK_ZOOM);
      window.setTimeout(() => map.invalidateSize(), 0);
      return;
    }

    const bounds = L.latLngBounds([]);
    locatedProfiles.forEach((profile) => {
      const point: L.LatLngExpression = [profile.latitude, profile.longitude];
      const title = toCompanyTitle(profile);
      const details = [profile.sector, profile.city, profile.address]
        .filter((value): value is string => Boolean(value && value.trim()))
        .join(" · ");

      const marker = L.circleMarker(point, markerStyle).bindPopup(
        `<strong>${title}</strong>${details ? `<br/><span>${details}</span>` : ""}<br/><a href="/empresas/${profile.id}">Ver ficha</a>`
      );
      marker.bindTooltip(title, { direction: "top", offset: [0, -8], opacity: 0.95 });
      markersLayer.addLayer(marker);
      bounds.extend(point);
    });

    if (locatedProfiles.length === 1) {
      map.setView([locatedProfiles[0].latitude, locatedProfiles[0].longitude], 12);
    } else {
      map.fitBounds(bounds.pad(0.18), { maxZoom: 12, animate: false });
    }

    window.setTimeout(() => {
      map.invalidateSize();
      if (locatedProfiles.length > 1 && bounds.isValid()) {
        map.fitBounds(bounds.pad(0.18), { maxZoom: 12, animate: false });
      }
    }, 80);
  }, [locatedProfiles]);

  return (
    <MainLayout>
      <section className="industrial-park-page">
        <div className="industrial-park-shell">
          <header className="industrial-park-header">
            <p>Parques industriales e industria</p>
            <h1>Mapa y catálogo productivo del Chaco</h1>
            <small>
              Mapa completo de empresas publicadas y, debajo, tarjetas limpias de parques
              industriales y empresas.
            </small>
          </header>

          {errorMessage ? (
            <p className="industrial-feedback industrial-feedback-error">{errorMessage}</p>
          ) : null}
          {isLoading ? <p className="industrial-feedback">Cargando mapa y catálogos...</p> : null}

          {!isLoading ? (
            <>
              <article className="industrial-map-card industrial-map-card-full">
                <div className="industrial-map-toolbar">
                  <strong>{locatedProfiles.length} empresas en el mapa</strong>
                  <small>
                    {profiles.length - locatedProfiles.length > 0
                      ? `${profiles.length - locatedProfiles.length} sin coordenadas`
                      : "Todas las publicadas con ubicación"}
                  </small>
                </div>
                <div ref={mapContainerRef} className="industrial-map-canvas industrial-map-canvas-full" />
                <p className="industrial-map-hint">
                  Vista completa del territorio. Clic en un marcador para abrir la ficha de la empresa.
                </p>
              </article>

              <section className="industrial-section">
                <div className="industrial-section-head">
                  <div>
                    <h2>Parques industriales</h2>
                    <small>{filteredParks.length} en catálogo</small>
                  </div>
                  <div className="industrial-section-filters">
                    <input
                      type="search"
                      value={parkSearch}
                      onChange={(event) => setParkSearch(event.target.value)}
                      placeholder="Buscar parque..."
                      aria-label="Buscar parque"
                    />
                    <select
                      value={parkStatusFilter}
                      onChange={(event) => setParkStatusFilter(event.target.value)}
                      aria-label="Filtrar por estado"
                    >
                      {parkStatusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option === "all" ? "Todos los estados" : option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {filteredParks.length === 0 ? (
                  <p className="industrial-empty">
                    {parks.length === 0
                      ? "Todavía no hay parques cargados. Ejecutá el seed de cartera."
                      : "No hay parques con esos filtros."}
                  </p>
                ) : (
                  <div className="industrial-cards-grid">
                    {filteredParks.map((park) => (
                      <article key={park.id} className="industrial-clean-card">
                        <div className="industrial-clean-card-media industrial-clean-card-media-park">
                          <span>{park.progressStatus}</span>
                        </div>
                        <div className="industrial-clean-card-body">
                          <span className="industrial-clean-chip">
                            {park.administration || "Parque industrial"}
                          </span>
                          <h3 className="industrial-clean-title">{park.name}</h3>
                          <div className="industrial-clean-meta">
                            <span>{park.locality}</span>
                            {park.department ? <span>{park.department}</span> : null}
                            {typeof park.surfaceHa === "number" ? (
                              <span>{formatHa(park.surfaceHa)}</span>
                            ) : null}
                          </div>
                          {park.renpiStatus ? (
                            <span className="industrial-clean-status">{park.renpiStatus}</span>
                          ) : null}
                          <div className="industrial-clean-actions">
                            <span className="industrial-clean-cta">
                              {park.measuredPlots != null
                                ? `${park.measuredPlots} parcelas`
                                : "Ver detalle en ficha provincial"}
                            </span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="industrial-section">
                <div className="industrial-section-head">
                  <div>
                    <h2>Empresas e industrias publicadas</h2>
                    <small>{profiles.length} fichas</small>
                  </div>
                </div>

                {profiles.length === 0 ? (
                  <p className="industrial-empty">Todavía no hay empresas publicadas.</p>
                ) : (
                  <div className="industrial-cards-grid">
                    {profiles.map((profile) => {
                      const title = toCompanyTitle(profile);
                      const href = `/empresas/${profile.id}`;
                      return (
                        <article key={profile.id} className="industrial-clean-card">
                          <Link to={href} className="industrial-clean-media-link" aria-label={`Ver ficha de ${title}`}>
                            <div className="industrial-clean-card-media">
                              {profile.logoUrl ? (
                                <img src={toDisplaySrc(profile.logoUrl)} alt="" />
                              ) : (
                                <div className="industrial-clean-card-fallback">
                                  {toCompanyInitials(title)}
                                </div>
                              )}
                            </div>
                          </Link>
                          <div className="industrial-clean-card-body">
                            {profile.sector ? (
                              <span className="industrial-clean-chip">{profile.sector}</span>
                            ) : (
                              <span className="industrial-clean-chip">Empresa</span>
                            )}
                            <h3 className="industrial-clean-title">
                              <Link to={href}>{title}</Link>
                            </h3>
                            <div className="industrial-clean-meta">
                              {profile.city ? <span>{profile.city}</span> : null}
                              {profile.latitude != null && profile.longitude != null ? (
                                <span className="industrial-clean-status">En mapa</span>
                              ) : (
                                <span>Sin coordenadas</span>
                              )}
                            </div>
                            <div className="industrial-clean-actions">
                              <Link to={href} className="industrial-clean-link">
                                Ver ficha
                              </Link>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          ) : null}
        </div>
      </section>
    </MainLayout>
  );
}
