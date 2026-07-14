import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import MainLayout from "../../layouts/MainLayouts";
import type { ApiResponse } from "../../shared/types/api.types";
import type { PublicCompanyProfileView } from "../../shared/types/profile.types";
import "./IndustrialParkPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
const FALLBACK_CENTER: [number, number] = [-27.4516, -58.9866];

const markerStyle: L.CircleMarkerOptions = {
  color: "#0f172a",
  fillColor: "#0ea5e9",
  fillOpacity: 0.88,
  radius: 7,
  weight: 2
};

const selectedMarkerStyle: L.CircleMarkerOptions = {
  color: "#1d4ed8",
  fillColor: "#60a5fa",
  fillOpacity: 0.95,
  radius: 9,
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

const formatCoordinate = (value: number): string => value.toFixed(5);

export default function IndustrialParkPage() {
  const [profiles, setProfiles] = useState<PublicCompanyProfileView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRefs = useRef<Map<number, L.CircleMarker>>(new Map());

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

  const activeSelectedProfileId = useMemo(() => {
    if (
      selectedProfileId !== null &&
      locatedProfiles.some((profile) => profile.id === selectedProfileId)
    ) {
      return selectedProfileId;
    }

    return locatedProfiles[0]?.id ?? null;
  }, [locatedProfiles, selectedProfileId]);

  const selectedLocatedProfile = useMemo(() => {
    if (activeSelectedProfileId === null) {
      return null;
    }
    return locatedProfiles.find((profile) => profile.id === activeSelectedProfileId) ?? null;
  }, [activeSelectedProfileId, locatedProfiles]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: true
    }).setView(FALLBACK_CENTER, 7);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19
    }).addTo(map);

    mapRef.current = map;
    const markers = markerRefs.current;

    const resizeTimer = window.setTimeout(() => {
      map.invalidateSize();
    }, 0);

    return () => {
      window.clearTimeout(resizeTimer);
      markers.forEach((marker) => marker.remove());
      markers.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    markerRefs.current.forEach((marker) => marker.remove());
    markerRefs.current.clear();

    if (locatedProfiles.length === 0) {
      map.setView(FALLBACK_CENTER, 7);
      return;
    }

    const bounds = L.latLngBounds([]);
    locatedProfiles.forEach((profile) => {
      const marker = L.circleMarker([profile.latitude, profile.longitude], markerStyle)
        .addTo(map)
        .bindTooltip(toCompanyTitle(profile), {
          direction: "top",
          offset: [0, -8]
        });

      marker.on("click", () => {
        setSelectedProfileId(profile.id);
      });

      markerRefs.current.set(profile.id, marker);
      bounds.extend([profile.latitude, profile.longitude]);
    });

    map.fitBounds(bounds.pad(0.2), { maxZoom: 12 });
  }, [locatedProfiles]);

  useEffect(() => {
    markerRefs.current.forEach((marker, profileId) => {
      marker.setStyle(
        profileId === activeSelectedProfileId ? selectedMarkerStyle : markerStyle
      );
    });

    if (!selectedLocatedProfile || !mapRef.current) {
      return;
    }

    mapRef.current.panTo([selectedLocatedProfile.latitude, selectedLocatedProfile.longitude], {
      animate: true,
      duration: 0.5
    });
  }, [activeSelectedProfileId, selectedLocatedProfile]);

  const profilesWithoutCoordinates = profiles.length - locatedProfiles.length;

  return (
    <MainLayout>
      <section className="industrial-park-page">
        <div className="industrial-park-shell">
          <header className="industrial-park-header">
            <p>Parque Industrial</p>
            <h1>Empresas geolocalizadas</h1>
            <small>
              Explorá en el mapa de OpenStreetMap las empresas publicadas y su
              ubicación.
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
                {selectedLocatedProfile ? (
                  <p className="industrial-selected-location">
                    Seleccionada: <strong>{toCompanyTitle(selectedLocatedProfile)}</strong> ·{" "}
                    {formatCoordinate(selectedLocatedProfile.latitude)},{" "}
                    {formatCoordinate(selectedLocatedProfile.longitude)}
                  </p>
                ) : (
                  <p className="industrial-selected-location">
                    No hay empresas con coordenadas para mostrar en el mapa.
                  </p>
                )}
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
                        <li
                          key={profile.id}
                          className={
                            profile.id === activeSelectedProfileId
                              ? "industrial-company-item active"
                              : "industrial-company-item"
                          }
                        >
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
                            <button
                              type="button"
                              onClick={() => {
                                if (located) {
                                  setSelectedProfileId(profile.id);
                                }
                              }}
                              disabled={!located}
                            >
                              Ver en mapa
                            </button>
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
