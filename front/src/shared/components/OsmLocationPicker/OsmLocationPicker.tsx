import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./OsmLocationPicker.css";

type OsmLocationPickerProps = {
  latitude: number | null;
  longitude: number | null;
  onChange: (coords: { latitude: number; longitude: number }) => void;
  readOnly?: boolean;
};

const FALLBACK_CENTER: [number, number] = [-27.4516, -58.9866];

const baseMarkerStyle: L.CircleMarkerOptions = {
  color: "#1d4ed8",
  fillColor: "#60a5fa",
  fillOpacity: 0.88,
  radius: 7,
  weight: 2
};

const roundCoordinate = (value: number): number => {
  return Number(value.toFixed(6));
};

export default function OsmLocationPicker({
  latitude,
  longitude,
  onChange,
  readOnly = false
}: OsmLocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const onChangeRef = useRef(onChange);
  const readOnlyRef = useRef(readOnly);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    readOnlyRef.current = readOnly;
  }, [readOnly]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const center: [number, number] =
      latitude !== null && longitude !== null
        ? [latitude, longitude]
        : FALLBACK_CENTER;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true
    }).setView(center, latitude !== null && longitude !== null ? 14 : 8);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19
    }).addTo(map);

    map.on("click", (event: L.LeafletMouseEvent) => {
      if (readOnlyRef.current) {
        return;
      }

      const nextLat = roundCoordinate(event.latlng.lat);
      const nextLng = roundCoordinate(event.latlng.lng);
      onChangeRef.current({
        latitude: nextLat,
        longitude: nextLng
      });
    });

    mapRef.current = map;

    const resizeTimer = window.setTimeout(() => {
      map.invalidateSize();
    }, 0);

    return () => {
      window.clearTimeout(resizeTimer);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [latitude, longitude]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    if (latitude === null || longitude === null) {
      if (markerRef.current) {
        markerRef.current.removeFrom(map);
        markerRef.current = null;
      }
      return;
    }

    if (!markerRef.current) {
      markerRef.current = L.circleMarker([latitude, longitude], baseMarkerStyle).addTo(map);
    } else {
      markerRef.current.setLatLng([latitude, longitude]);
    }

    if (!map.getBounds().contains([latitude, longitude])) {
      map.setView([latitude, longitude], Math.max(map.getZoom(), 12));
    }
  }, [latitude, longitude]);

  return (
    <div
      ref={mapContainerRef}
      className={readOnly ? "osm-location-picker readonly" : "osm-location-picker"}
      role="application"
      aria-label="Mapa OpenStreetMap"
    />
  );
}
