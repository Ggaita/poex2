import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "./tracker";

/** Escucha cambios de ruta y registra page_view (sitio público). */
export default function AnalyticsRouteListener() {
  const location = useLocation();

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    trackPageView(path);
  }, [location.pathname, location.search]);

  return null;
}
