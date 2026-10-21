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
const FALLBACK_CENTER: [number, number] = [-26.8, -60.45];
const FALLBACK_ZOOM = 7;

/** Coordenadas aproximadas de localidades chaqueñas (centro urbano) para el mapa de parques. */
const LOCALITY_COORDS: Record<string, [number, number]> = {
  "barranqueras": [-27.4826, -58.9358],
  "campo largo": [-26.8006, -60.8411],
  "charata": [-27.2142, -61.1878],
  "fontana": [-27.4181, -59.0239],
  "gancedo": [-27.4897, -61.6744],
  "general jose de san martin": [-26.5375, -59.3414],
  "general pinedo": [-27.3256, -61.2817],
  "general vedia": [-26.9339, -58.6611],
  "hermoso campo": [-27.6081, -61.3447],
  "juan jose castelli": [-25.9464, -60.6169],
  "las brenas": [-27.0897, -61.0819],
  "machagai": [-26.9233, -60.0486],
  "margarita belen": [-27.2619, -58.9722],
  "p r saenz pena": [-26.7833, -60.4411],
  "pampa del infierno": [-26.5167, -61.1667],
  "pcia de la plaza": [-27.0, -59.85],
  "presidencia de la plaza": [-27.0, -59.85],
  "puerto tirol": [-27.3728, -59.0819],
  "puerto vilelas": [-27.5142, -58.9392],
  "san bernardo": [-27.2917, -60.7125],
  "tres isletas": [-26.3406, -60.4311],
  "villa angela": [-27.5767, -60.7114],
  "resistencia": [-27.4516, -58.9866]
};

const parkMarkerStyle: L.CircleMarkerOptions = {
  color: "#0f172a",
  fillColor: "#e6007e",
  fillOpacity: 0.9,
  radius: 9,
  weight: 2
};

const companyMarkerStyle: L.CircleMarkerOptions = {
  color: "#0f172a",
  fillColor: "#0ea5e9",
  fillOpacity: 0.85,
  radius: 6,
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

type LocatedPark = IndustrialParkView & {
  latitude: number;
  longitude: number;
};

const normalizeLocalityKey = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\./g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const resolveLocalityCoords = (locality?: string | null): [number, number] | null => {
  if (!locality?.trim()) return null;
  const key = normalizeLocalityKey(locality);
  if (LOCALITY_COORDS[key]) return LOCALITY_COORDS[key];
  // Alias suaves
  if (key.includes("saenz pena")) return LOCALITY_COORDS["p r saenz pena"];
  if (key.includes("plaza")) return LOCALITY_COORDS["pcia de la plaza"];
  if (key.includes("castelli")) return LOCALITY_COORDS["juan jose castelli"];
  if (key.includes("san martin")) return LOCALITY_COORDS["general jose de san martin"];
  return null;
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

const toLocatedPark = (park: IndustrialParkView): LocatedPark | null => {
  const coords = resolveLocalityCoords(park.locality);
  if (!coords) return null;
  return { ...park, latitude: coords[0], longitude: coords[1] };
};

const toCompanyTitle = (profile: PublicCompanyProfileView): string =>
  profile.companyName?.trim() || `Empresa #${profile.id}`;

const formatHa = (value?: number): string => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return `${value} ha`;
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export default function IndustrialParkPage() {
  const [parks, setParks] = useState<IndustrialParkView[]>([]);
  const [profiles, setProfiles] = useState<PublicCompanyProfileView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [parkStatusFilter, setParkStatusFilter] = useState("all");
  const [parkSearch, setParkSearch] = useState("");
  const [mapLayer, setMapLayer] = useState<"parks" | "companies" | "both">("parks");

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
          setErrorMessage(parksPayload.error || "No se pudieron cargar los parques industriales.");
        } else {
          setParks(Array.isArray(parksPayload.data) ? parksPayload.data : []);
        }

        if (profilesRes.ok && profilesPayload.success) {
          setProfiles(Array.isArray(profilesPayload.data) ? profilesPayload.data : []);
        } else {
          setProfiles([]);
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

  const locatedCompanies = useMemo(
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

  const locatedParks = useMemo(
    () =>
      filteredParks
        .map((park) => toLocatedPark(park))
        .filter((park): park is LocatedPark => park !== null),
    [filteredParks]
  );

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
    const bounds = L.latLngBounds([]);
    let points = 0;

    const showParks = mapLayer === "parks" || mapLayer === "both";
    const showCompanies = mapLayer === "companies" || mapLayer === "both";

    if (showParks) {
      locatedParks.forEach((park) => {
        const point: L.LatLngExpression = [park.latitude, park.longitude];
        const details = [park.locality, park.department, park.progressStatus]
          .filter((value): value is string => Boolean(value && String(value).trim()))
          .join(" · ");
        const marker = L.circleMarker(point, parkMarkerStyle).bindPopup(
          `<strong>${escapeHtml(park.name)}</strong>${
            details ? `<br/><span>${escapeHtml(details)}</span>` : ""
          }${
            park.settledCompanies
              ? `<br/><span>${escapeHtml(park.settledCompanies)}</span>`
              : ""
          }`
        );
        marker.bindTooltip(park.name, { direction: "top", offset: [0, -8], opacity: 0.95 });
        markersLayer.addLayer(marker);
        bounds.extend(point);
        points += 1;
      });
    }

    if (showCompanies) {
      locatedCompanies.forEach((profile) => {
        const point: L.LatLngExpression = [profile.latitude, profile.longitude];
        const title = toCompanyTitle(profile);
        const details = [profile.sector, profile.city]
          .filter((value): value is string => Boolean(value && value.trim()))
          .join(" · ");
        const marker = L.circleMarker(point, companyMarkerStyle).bindPopup(
          `<strong>${escapeHtml(title)}</strong>${
            details ? `<br/><span>${escapeHtml(details)}</span>` : ""
          }<br/><a href="/empresas/${profile.id}">Ver ficha</a>`
        );
        marker.bindTooltip(title, { direction: "top", offset: [0, -8], opacity: 0.95 });
        markersLayer.addLayer(marker);
        bounds.extend(point);
        points += 1;
      });
    }

    if (points === 0) {
      map.setView(FALLBACK_CENTER, FALLBACK_ZOOM);
      window.setTimeout(() => map.invalidateSize(), 0);
      return;
    }

    if (points === 1) {
      const first = bounds.getCenter();
      map.setView([first.lat, first.lng], 11);
    } else if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.2), { maxZoom: 11, animate: false });
    }

    window.setTimeout(() => {
      map.invalidateSize();
      if (points > 1 && bounds.isValid()) {
        map.fitBounds(bounds.pad(0.2), { maxZoom: 11, animate: false });
      }
    }, 80);
  }, [locatedParks, locatedCompanies, mapLayer]);

  const mapSummary = (() => {
    if (mapLayer === "parks") {
      return `${locatedParks.length} parques en el mapa`;
    }
    if (mapLayer === "companies") {
      return `${locatedCompanies.length} empresas geolocalizadas`;
    }
    return `${locatedParks.length} parques · ${locatedCompanies.length} empresas`;
  })();

  return (
    <MainLayout>
      <section className="industrial-park-page">
        <div className="industrial-park-shell">
          <header className="industrial-park-header">
            <p>Infraestructura productiva</p>
            <h1>Parques industriales del Chaco</h1>
            <small>
              Mapa y fichas de los parques e áreas industriales de la provincia. Las ubicaciones
              en mapa son aproximadas por localidad.
            </small>
          </header>

          {errorMessage ? (
            <p className="industrial-feedback industrial-feedback-error">{errorMessage}</p>
          ) : null}
          {isLoading ? (
            <p className="industrial-feedback">Cargando parques industriales...</p>
          ) : null}

          {!isLoading ? (
            <>
              <article className="industrial-map-card industrial-map-card-full">
                <div className="industrial-map-toolbar">
                  <div>
                    <strong>{mapSummary}</strong>
                    <small className="industrial-map-toolbar-note">
                      {locatedCompanies.length === 0
                        ? "Aún no hay empresas del directorio con coordenadas cargadas."
                        : `${profiles.length - locatedCompanies.length} empresas del directorio sin coordenadas.`}
                    </small>
                  </div>
                  <div className="industrial-map-layer-switch" role="group" aria-label="Capas del mapa">
                    <button
                      type="button"
                      className={mapLayer === "parks" ? "active" : ""}
                      onClick={() => setMapLayer("parks")}
                    >
                      Parques
                    </button>
                    <button
                      type="button"
                      className={mapLayer === "companies" ? "active" : ""}
                      onClick={() => setMapLayer("companies")}
                      disabled={locatedCompanies.length === 0}
                    >
                      Empresas
                    </button>
                    <button
                      type="button"
                      className={mapLayer === "both" ? "active" : ""}
                      onClick={() => setMapLayer("both")}
                      disabled={locatedCompanies.length === 0}
                    >
                      Ambos
                    </button>
                  </div>
                </div>
                <div ref={mapContainerRef} className="industrial-map-canvas industrial-map-canvas-full" />
                <p className="industrial-map-hint">
                  <span className="industrial-map-legend">
                    <i className="industrial-map-dot industrial-map-dot-park" aria-hidden="true" /> Parques
                  </span>
                  <span className="industrial-map-legend">
                    <i className="industrial-map-dot industrial-map-dot-company" aria-hidden="true" /> Empresas
                    (solo si tienen lat/long en ficha)
                  </span>
                </p>
              </article>

              <section className="industrial-section">
                <div className="industrial-section-head">
                  <div>
                    <h2>Catálogo de parques industriales</h2>
                    <small>
                      {filteredParks.length}{" "}
                      {filteredParks.length === 1 ? "parque" : "parques"}
                      {parks.length !== filteredParks.length ? ` de ${parks.length}` : ""}
                    </small>
                  </div>
                  <div className="industrial-section-filters">
                    <input
                      type="search"
                      value={parkSearch}
                      onChange={(event) => setParkSearch(event.target.value)}
                      placeholder="Buscar por nombre o localidad..."
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
                      ? "Todavía no hay parques cargados. Ejecutá el seed de cartera en el servidor."
                      : "No hay parques con esos filtros."}
                  </p>
                ) : (
                  <div className="industrial-cards-grid">
                    {filteredParks.map((park) => {
                      const onMap = Boolean(toLocatedPark(park));
                      return (
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
                                {onMap
                                  ? park.measuredPlots != null
                                    ? `${park.measuredPlots} parcelas · en mapa`
                                    : "Ubicación aproximada en mapa"
                                  : park.measuredPlots != null
                                    ? `${park.measuredPlots} parcelas`
                                    : "Sin georreferencia de localidad"}
                              </span>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

              {locatedCompanies.length > 0 ? (
                <section className="industrial-section industrial-section-secondary">
                  <div className="industrial-section-head">
                    <div>
                      <h2>Empresas del directorio con ubicación</h2>
                      <small>
                        {locatedCompanies.length} con coordenadas · opcional en el mapa (capa
                        Empresas)
                      </small>
                    </div>
                  </div>
                  <div className="industrial-cards-grid">
                    {locatedCompanies.map((profile) => {
                      const title = toCompanyTitle(profile);
                      const href = `/empresas/${profile.id}`;
                      return (
                        <article key={profile.id} className="industrial-clean-card">
                          <Link
                            to={href}
                            className="industrial-clean-media-link"
                            aria-label={`Ver ficha de ${title}`}
                          >
                            <div className="industrial-clean-card-media">
                              {profile.logoUrl ? (
                                <img src={toDisplaySrc(profile.logoUrl)} alt="" />
                              ) : (
                                <div
                                  className="industrial-clean-card-fallback"
                                  role="img"
                                  aria-label="Sin imagen"
                                >
                                  <span aria-hidden="true">⌁</span>
                                  <span>Sin imagen</span>
                                </div>
                              )}
                            </div>
                          </Link>
                          <div className="industrial-clean-card-body">
                            <h3 className="industrial-clean-title">
                              <Link to={href}>{title}</Link>
                            </h3>
                            <div className="industrial-clean-meta">
                              {profile.city ? <span>{profile.city}</span> : null}
                              <span className="industrial-clean-status">En mapa</span>
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
                </section>
              ) : (
                <p className="industrial-feedback">
                  El mapa de <strong>parques</strong> ya está listo. Las empresas del directorio
                  exportable aparecerán en el mapa cuando carguen latitud/longitud en su ficha
                  (admin o panel empresa).
                </p>
              )}
            </>
          ) : null}
        </div>
      </section>
    </MainLayout>
  );
}
