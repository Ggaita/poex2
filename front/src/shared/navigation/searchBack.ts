const LAST_SEARCH_KEY = "poex_last_search_path";

export type SearchBackLocationState = {
  fromSearch?: string;
};

const isSearchPath = (value: string): boolean => {
  return value === "/search" || value.startsWith("/search?");
};

/** Guarda la URL de búsqueda activa para poder volver desde fichas. */
export const rememberSearchPath = (pathWithQuery: string): void => {
  if (typeof window === "undefined") {
    return;
  }
  if (!isSearchPath(pathWithQuery)) {
    return;
  }
  try {
    sessionStorage.setItem(LAST_SEARCH_KEY, pathWithQuery);
  } catch {
    // private mode / quota
  }
};

/** Resuelve a dónde volver: state de navegación → última búsqueda → /search. */
export const resolveSearchBackPath = (fromState?: unknown): string => {
  if (typeof fromState === "string" && isSearchPath(fromState)) {
    return fromState;
  }

  if (
    fromState &&
    typeof fromState === "object" &&
    "fromSearch" in fromState &&
    typeof (fromState as SearchBackLocationState).fromSearch === "string" &&
    isSearchPath((fromState as SearchBackLocationState).fromSearch as string)
  ) {
    return (fromState as SearchBackLocationState).fromSearch as string;
  }

  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem(LAST_SEARCH_KEY);
      if (stored && isSearchPath(stored)) {
        return stored;
      }
    } catch {
      // ignore
    }
  }

  return "/search";
};
