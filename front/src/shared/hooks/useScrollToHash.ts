import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls to the element matching location.hash (e.g. #quienes-somos),
 * accounting for sticky/fixed header height.
 */
export function useScrollToHash(offsetPx = 96): void {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (!hash) {
      return;
    }

    const id = decodeURIComponent(hash.replace(/^#/, ""));
    if (!id) {
      return;
    }

    const scrollToTarget = () => {
      const el = document.getElementById(id);
      if (!el) {
        return;
      }
      const top = el.getBoundingClientRect().top + window.scrollY - offsetPx;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    };

// Wait a tick so hub content is painted after route change.
    let timeoutId = 0;
    const frame = window.requestAnimationFrame(() => {
      timeoutId = window.setTimeout(scrollToTarget, 40);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [hash, pathname, offsetPx]);
}
