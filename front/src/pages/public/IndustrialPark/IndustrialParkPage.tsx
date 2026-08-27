import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import MainLayout from "../../../layouts/MainLayouts";
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

type LocatedProfile = PublicCompanyProfileView & {
  latitude: number;
  longitude: number;
};

const parseCoordinate = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const cleaned = value.trim().replace(",", ".");
    if (cleaned.length === 0) {
      return null;
    }
    const parsed = Number.parseFloat(cleaned);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

const toLocatedProfile = (profile: PublicCompanyProfileView): LocatedProfile | null => {
  const latitude = parseCoordinate(profile.latitude);
  const longitude = parseCoordinate(profile.longitude);

  if (latitude === null || longitude === null) {
    return null;
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }

  return {
    ...profile,
    latitude,
    longitude
  };
};

const toCompanyTitle = (profile: PublicCompanyProfileView): string => {
  if (profile.companyName?.trim()) {
    return profile.companyName.trim();
  }

  return `Empresa #${profile.id}`;
};

export default function IndustrialParkPage() {
  const [profiles, setProfiles] = useState<PublicCompanyProfileView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    let active = true;

    const loadProfiles = async (): Promise<void> => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(`${API_BASE_URL}/api/public/profiles`);
        const result = (await response.json()) as ApiResponse<PublicCompanyProfileView[]>;

        if (!active) {
          return;
        }

        if (!response.ok || !result.success) {
          setProfiles([]);
          setErrorMessage(result.error ?? "No se pudieron cargar las empresas publicadas.");
          return;
        }

        setProfiles(Array.isArray(result.data) ? result.data : []);
      } catch {
        if (!active) {
          return;
        }
        setProfiles([]);
        setErrorMessage("No se pudo conectar con el backend de perfiles.");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadProfiles();

    return () => {
      active = false;
    };
  }, []);

  const locatedProfiles = useMemo<LocatedProfile[]>(() => {
    return profiles
      .map((profile) => toLocatedProfile(profile))
      .filter((profile): profile is LocatedProfile => profile !== null);
  }, [profiles]);

  const locatedProfileIds = useMemo(() => {
    return new Set(locatedProfiles.map((profile) => profile.id));
  }, [locatedProfiles]);

  // El contenedor del mapa solo existe cuando termina la carga.
  // Hay que inicializar Leaflet despues de ese render, no en mount vacio.
  useEffect(() => {
    if (isLoading || errorMessage || !mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView(FALLBACK_CENTER, FALLBACK_ZOOM);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    mapRef.current = map;
    markersLayerRef.current = markersLayer;

    const resizeTimer = window.setTimeout(() => {
      map.invalidateSize();
    }, 50);

    return () => {
      window.clearTimeout(resizeTimer);
      markersLayer.clearLayers();
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, [isLoading, errorMessage]);

  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) {
      return;
    }

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

      marker.bindTooltip(title, {
        direction: "top",
        offset: [0, -8],
        opacity: 0.95
      });

      markersLayer.addLayer(marker);
      bounds.extend(point);
    });

    if (locatedProfiles.length === 1) {
      map.setView([locatedProfiles[0].latitude, locatedProfiles[0].longitude], 12);
    } else {
      map.fitBounds(bounds.pad(0.18), {
        maxZoom: 12,
        animate: false
      });
    }

    window.setTimeout(() => {
      map.invalidateSize();
      if (locatedProfiles.length > 1 && bounds.isValid()) {
        map.fitBounds(bounds.pad(0.18), {
          maxZoom: 12,
          animate: false
        });
      }
    }, 80);
  }, [locatedProfiles]);

  const profilesWithoutCoordinates = profiles.length - locatedProfiles.length;

  return (
    <MainLayout>
      <section className="industrial-park-page">
        <div className="industrial-park-shell">
          <header className="industrial-park-header">
            <p>Parque Industrial</p>
            <h1>Mapa de empresas</h1>
            <small>
              Vista global de empresas publicadas. El mapa se ajusta solo para
              mostrar todas las ubicaciones disponibles.
            </small>
          </header>

          {errorMessage ? (
            <p className="industrial-feedback industrial-feedback-error">{errorMessage}</p>
          ) : null}

          {isLoading ? <p className="industrial-feedback">Cargando empresas...</p> : null}

          {!isLoading && !errorMessage ? (
            <div className="industrial-park-grid">
              <article className="industrial-map-card">
                <div className="industrial-map-toolbar">
                  <strong>{locatedProfiles.length} empresas en mapa</strong>
                  {profilesWithoutCoordinates > 0 ? (
                    <small>
                      {profilesWithoutCoordinates} empresas publicadas sin coordenadas.
                    </small>
                  ) : null}
                </div>
                <div ref={mapContainerRef} className="industrial-map-canvas" />
                <p className="industrial-map-hint">
                  {locatedProfiles.length > 0
                    ? "Todas las empresas con ubicación se muestran a la vez. Hacé clic en un marcador para ver el detalle."
                    : "No hay empresas con coordenadas para mostrar en el mapa."}
                </p>
              </article>

              <aside className="industrial-list-card">
                <header>
                  <h2>Empresas publicadas</h2>
                  <small>{profiles.length} resultados</small>
                </header>
                {profiles.length === 0 ? (
                  <p className="industrial-empty">
                    Todavía no hay perfiles de empresa publicados.
                  </p>
                ) : (
                  <ul className="industrial-company-list">
                    {profiles.map((profile) => {
                      const located = locatedProfileIds.has(profile.id);
                      return (
                        <li key={profile.id} className="industrial-company-item">
                          <div className="industrial-company-item-top">
                            <h3>{toCompanyTitle(profile)}</h3>
                            <span>{located ? "Con ubicación" : "Sin coordenadas"}</span>
                          </div>
                          <p>{profile.sector ?? "Sin sector informado"}</p>
                          <small>
                            {profile.city ?? "Localidad no informada"}
                            {profile.address ? ` · ${profile.address}` : ""}
                          </small>
                          <div className="industrial-company-actions">
                            <Link to={`/empresas/${profile.id}`}>Ver ficha</Link>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </aside>
            </div>
          ) : null}
        </div>
      </section>
    </MainLayout>
  );
}
