import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import MainLayout from "../../../layouts/MainLayouts";
import { HeroSearchForm } from "../Home/components/Hero/Components/HeroSearchForm";
import SpecialRequestForm from "../../../shared/components/SpecialRequestForm/SpecialRequestForm";
import InfoRequestForm from "../../../shared/components/InfoRequestForm/InfoRequestForm";
import { toDisplaySrc } from "../../../shared/components/ImageField/ImageField";
import type { ApiResponse } from "../../../shared/types/api.types";
import type {
  SearchFacets,
  SearchHasPaFilter,
  SearchMode,
  SearchResponseData,
  SearchResultItem,
  SearchResultKindFilter
} from "../../../shared/types/search.types";
import { trackProductView, trackSearch } from "../../../shared/analytics/tracker";
import "./SearchPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

type SearchModeUi = {
  eyebrow: string;
  title: string;
  subtitle: string;
  emptyQueryLabel: string;
  noResultsLabel: string;
  searchingLabel: string;
  placeholder: string;
  showAllLabel?: string;
};

const parseSearchMode = (value: string | null): SearchMode => {
  if (value === "company" || value === "product") {
    return value;
  }
  return "all";
};

const parseKindFilter = (value: string | null): SearchResultKindFilter => {
  if (value === "company" || value === "product") {
    return value;
  }
  return "all";
};

const parseHasPaFilter = (value: string | null): SearchHasPaFilter => {
  if (value === "yes" || value === "no") {
    return value;
  }
  return "all";
};

const EMPTY_FACETS: SearchFacets = {
  kinds: [{ value: "all", label: "Todos", count: 0 }],
  sectors: [],
  cities: [],
  hasPa: [{ value: "all", label: "Todas", count: 0 }]
};

const modeUi: Record<SearchMode, SearchModeUi> = {
  all: {
    eyebrow: "Buscador unificado",
    title: "Resultados de búsqueda",
    subtitle: "Encontrá productos y empresas por nombre, sector, ciudad o posición arancelaria (P.A.).",
    emptyQueryLabel: "Ingresá una palabra clave para iniciar la búsqueda.",
    noResultsLabel: "No encontramos coincidencias para esa búsqueda.",
    searchingLabel: "Buscando coincidencias...",
    placeholder: "Producto, empresa, ciudad o P.A. (ej. 0802.10)"
  },
  company: {
    eyebrow: "Oportunidades comerciales",
    title: "Búsqueda de empresas",
    subtitle: "Buscá empresas exportadoras o visualizá todas las empresas publicadas.",
    emptyQueryLabel: "Mostrando todas las empresas publicadas.",
    noResultsLabel: "No encontramos empresas para esa búsqueda.",
    searchingLabel: "Buscando empresas...",
    placeholder: "Empresa, sector, ciudad o P.A.",
    showAllLabel: "Mostrar todas las empresas"
  },
  product: {
    eyebrow: "Oportunidades comerciales",
    title: "Búsqueda de productos",
    subtitle: "Buscá productos exportables o visualizá todos los productos publicados.",
    emptyQueryLabel: "Mostrando todos los productos publicados.",
    noResultsLabel: "No encontramos productos para esa búsqueda.",
    searchingLabel: "Buscando productos...",
    placeholder: "Producto, NCM o P.A. (ej. 1201.90)",
    showAllLabel: "Mostrar todos los productos"
  }
};

const kindLabel: Record<SearchResultItem["kind"], string> = {
  company: "Empresa",
  product: "Producto"
};

const toKeywordTags = (keywords: string[], extras: string[] = []): string[] => {
  const isMostlyEnglish = (value: string): boolean => {
    const letters = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, "");
    if (!letters) return false;
    const ascii = letters.replace(/[^a-zA-Z]/g, "").length;
    return ascii / letters.length > 0.85 && /[a-zA-Z]{4,}/.test(value) && !/[áéíóúñÁÉÍÓÚÑ]/.test(value);
  };

  const raw = [...keywords, ...extras]
    .flatMap((item) => String(item ?? "").split(/[,;|]/))
    .map((item) => item.trim())
    .filter((item) => item.length >= 2 && item.length <= 42);

  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of raw) {
    const key = tag
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    if (seen.has(key)) continue;
    // Evitar tags EN duplicados tipo Chemicals si ya hay Químicos, y frases muy largas de producto
    if (isMostlyEnglish(tag) && out.some((t) => !isMostlyEnglish(t))) continue;
    seen.add(key);
    out.push(tag);
    if (out.length >= 10) break;
  }
  return out;
};

const toCompanyInitials = (companyName: string): string => {
  return companyName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? "")
    .join("");
};

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const searchMode = parseSearchMode(searchParams.get("mode"));
  const filterKind = parseKindFilter(searchParams.get("kind"));
  const filterSector = searchParams.get("sector")?.trim() ?? "";
  const filterCity = searchParams.get("city")?.trim() ?? "";
  const filterHasPa = parseHasPaFilter(searchParams.get("hasPa"));
  const currentModeUi = modeUi[searchMode];
  const shouldRunSearch = query.length > 0 || searchMode !== "all";

  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [total, setTotal] = useState(0);
  const [facets, setFacets] = useState<SearchFacets>(EMPTY_FACETS);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!shouldRunSearch) {
      setResults([]);
      setTotal(0);
      setFacets(EMPTY_FACETS);
      return;
    }

    let active = true;

    const runSearch = async (): Promise<void> => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const params = new URLSearchParams();
        if (query) {
          params.set("q", query);
        }
        if (searchMode !== "all") {
          params.set("mode", searchMode);
        }
        if (searchMode === "all" && filterKind !== "all") {
          params.set("kind", filterKind);
        }
        if (filterSector) {
          params.set("sector", filterSector);
        }
        if (filterCity) {
          params.set("city", filterCity);
        }
        if (filterHasPa !== "all") {
          params.set("hasPa", filterHasPa);
        }

        const response = await fetch(`${API_BASE_URL}/api/search?${params.toString()}`);
        const payload = (await response.json()) as ApiResponse<SearchResponseData>;

        if (!active) {
          return;
        }

        if (!response.ok || !payload.success) {
          setResults([]);
          setTotal(0);
          setFacets(EMPTY_FACETS);
          setErrorMessage(payload.error ?? "No se pudo ejecutar la búsqueda.");
          return;
        }

        const nextResults = payload.data?.results ?? [];
        setResults(nextResults);
        setTotal(payload.data?.total ?? nextResults.length);
        setFacets(payload.data?.facets ?? EMPTY_FACETS);

        if (query) {
          trackSearch({
            query,
            mode: searchMode,
            resultCount: payload.data?.total ?? nextResults.length,
            path: `/search${window.location.search}`
          });

          // Vistas de producto derivadas de resultados (modo producto o mixto).
          nextResults
            .filter((item) => item.kind === "product")
            .slice(0, 12)
            .forEach((item) => {
              trackProductView({
                profileId: item.profileId,
                productId: item.product?.id,
                productName: item.title,
                companyName: item.companyName,
                path: `/search${window.location.search}`
              });
            });
        }
      } catch {
        if (!active) {
          return;
        }
        setResults([]);
        setTotal(0);
        setFacets(EMPTY_FACETS);
        setErrorMessage("No se pudo conectar con el backend de búsqueda.");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void runSearch();

    return () => {
      active = false;
    };
  }, [
    query,
    searchMode,
    shouldRunSearch,
    filterKind,
    filterSector,
    filterCity,
    filterHasPa
  ]);

  const visibleResults = shouldRunSearch ? results : [];
  const visibleErrorMessage = shouldRunSearch ? errorMessage : "";

  const writeSearchParams = (next: {
    mode?: SearchMode;
    kind?: SearchResultKindFilter;
    sector?: string;
    city?: string;
    hasPa?: SearchHasPaFilter;
    clearFilters?: boolean;
  }): void => {
    const params = new URLSearchParams();
    if (query) {
      params.set("q", query);
    }

    const mode = next.mode ?? searchMode;
    if (mode !== "all") {
      params.set("mode", mode);
    }

    if (next.clearFilters) {
      setSearchParams(params);
      return;
    }

    const kind = next.kind ?? filterKind;
    const sector = next.sector !== undefined ? next.sector : filterSector;
    const city = next.city !== undefined ? next.city : filterCity;
    const hasPa = next.hasPa ?? filterHasPa;

    if (mode === "all" && kind !== "all") {
      params.set("kind", kind);
    }
    if (sector) {
      params.set("sector", sector);
    }
    if (city) {
      params.set("city", city);
    }
    if (hasPa !== "all") {
      params.set("hasPa", hasPa);
    }

    setSearchParams(params);
  };

  // Conserva el término buscado al cambiar de modo (empresas/productos/todo).
  const buildSearchLink = (mode: SearchMode = "all"): string => {
    const params = new URLSearchParams();
    if (query) {
      params.set("q", query);
    }
    if (mode !== "all") {
      params.set("mode", mode);
    }
    // Al cambiar modo se resetean filtros de faceta para no mezclar contextos.
    const qs = params.toString();
    return qs ? `/search?${qs}` : "/search";
  };

  // "Mostrar todos" limpia el texto y deja solo el modo.
  const showAllLink =
    searchMode === "company"
      ? "/search?mode=company"
      : searchMode === "product"
        ? "/search?mode=product"
        : null;

  const hasActiveFilters =
    (searchMode === "all" && filterKind !== "all") ||
    Boolean(filterSector) ||
    Boolean(filterCity) ||
    filterHasPa !== "all";

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onClear: () => void }[] = [];

    if (searchMode === "all" && filterKind !== "all") {
      chips.push({
        key: "kind",
        label: filterKind === "company" ? "Tipo: Empresas" : "Tipo: Productos",
        onClear: () => writeSearchParams({ kind: "all" })
      });
    }
    if (filterSector) {
      const sectorLabel =
        facets.sectors.find((item) => item.value === filterSector)?.label ?? filterSector;
      chips.push({
        key: "sector",
        label: `Sector: ${sectorLabel}`,
        onClear: () => writeSearchParams({ sector: "" })
      });
    }
    if (filterCity) {
      const cityLabel =
        facets.cities.find((item) => item.value === filterCity)?.label ?? filterCity;
      chips.push({
        key: "city",
        label: `Ciudad: ${cityLabel}`,
        onClear: () => writeSearchParams({ city: "" })
      });
    }
    if (filterHasPa !== "all") {
      chips.push({
        key: "hasPa",
        label: filterHasPa === "yes" ? "Con P.A." : "Sin P.A.",
        onClear: () => writeSearchParams({ hasPa: "all" })
      });
    }

    return chips;
  }, [
    searchMode,
    filterKind,
    filterSector,
    filterCity,
    filterHasPa,
    facets.sectors,
    facets.cities
  ]);

  const shouldShowSpecialRequest =
    searchMode !== "company" &&
    !isLoading &&
    !visibleErrorMessage &&
    query.length > 0 &&
    visibleResults.length === 0 &&
    !hasActiveFilters;

  const showFiltersBar = shouldRunSearch && !visibleErrorMessage;

  return (
    <MainLayout>
      <section className="search-page">
        <div className="search-page-shell">
          <header className="search-page-header">
            <p>{currentModeUi.eyebrow}</p>
            <h1>{currentModeUi.title}</h1>
            <small>{currentModeUi.subtitle}</small>
            {searchMode !== "all" ? (
              <span className="search-mode-chip">
                {searchMode === "company" ? "Modo empresas" : "Modo productos"}
              </span>
            ) : null}
            <HeroSearchForm
              key={`${searchMode}-${query}`}
              initialQuery={query}
              mode={searchMode}
              placeholder={currentModeUi.placeholder}
            />
            <div className="search-page-actions">
              <Link to="/" className="search-page-link">
                Volver al inicio
              </Link>
              {searchMode === "all" ? (
                <>
                  <Link to={buildSearchLink("company")} className="search-page-link">
                    Ir a empresas
                  </Link>
                  <Link to={buildSearchLink("product")} className="search-page-link">
                    Ir a productos
                  </Link>
                </>
              ) : (
                <>
                  <Link to={buildSearchLink("all")} className="search-page-link">
                    {query ? `Ver todo: ${query}` : "Búsqueda general"}
                  </Link>
                  {searchMode !== "company" ? (
                    <Link to={buildSearchLink("company")} className="search-page-link">
                      Ir a empresas
                    </Link>
                  ) : null}
                  {searchMode !== "product" ? (
                    <Link to={buildSearchLink("product")} className="search-page-link">
                      Ir a productos
                    </Link>
                  ) : null}
                </>
              )}
              {showAllLink && query ? (
                <Link to={showAllLink} className="search-page-link">
                  {currentModeUi.showAllLabel}
                </Link>
              ) : null}
            </div>
          </header>

          {query ? (
            <p className="search-query-label">
              Buscando: <strong>{query}</strong>
            </p>
          ) : (
            <p className="search-query-label">{currentModeUi.emptyQueryLabel}</p>
          )}

          {showFiltersBar ? (
            <section className="search-filters-bar" aria-label="Filtros de resultados">
              <div className="search-filters-row">
                {searchMode === "all" ? (
                  <label className="search-filter-field">
                    <span>Tipo</span>
                    <select
                      value={filterKind}
                      onChange={(event) =>
                        writeSearchParams({
                          kind: parseKindFilter(event.target.value)
                        })
                      }
                    >
                      {(facets.kinds.length > 0 ? facets.kinds : EMPTY_FACETS.kinds).map(
                        (option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                            {option.value === "all" ? "" : ` (${option.count})`}
                          </option>
                        )
                      )}
                    </select>
                  </label>
                ) : null}

                <label className="search-filter-field">
                  <span>Sector</span>
                  <select
                    value={filterSector}
                    onChange={(event) => writeSearchParams({ sector: event.target.value })}
                    disabled={facets.sectors.length === 0 && !filterSector}
                  >
                    <option value="">Todos los sectores</option>
                    {facets.sectors.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} ({option.count})
                      </option>
                    ))}
                    {filterSector &&
                    !facets.sectors.some((option) => option.value === filterSector) ? (
                      <option value={filterSector}>{filterSector}</option>
                    ) : null}
                  </select>
                </label>

                <label className="search-filter-field">
                  <span>Ciudad</span>
                  <select
                    value={filterCity}
                    onChange={(event) => writeSearchParams({ city: event.target.value })}
                    disabled={facets.cities.length === 0 && !filterCity}
                  >
                    <option value="">Todas las ciudades</option>
                    {facets.cities.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} ({option.count})
                      </option>
                    ))}
                    {filterCity &&
                    !facets.cities.some((option) => option.value === filterCity) ? (
                      <option value={filterCity}>{filterCity}</option>
                    ) : null}
                  </select>
                </label>

                <label className="search-filter-field">
                  <span>P.A. / NCM</span>
                  <select
                    value={filterHasPa}
                    onChange={(event) =>
                      writeSearchParams({
                        hasPa: parseHasPaFilter(event.target.value)
                      })
                    }
                  >
                    {(facets.hasPa.length > 0 ? facets.hasPa : EMPTY_FACETS.hasPa).map(
                      (option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                          {option.value === "all" ? "" : ` (${option.count})`}
                        </option>
                      )
                    )}
                  </select>
                </label>

                {hasActiveFilters ? (
                  <button
                    type="button"
                    className="search-filters-clear"
                    onClick={() => writeSearchParams({ clearFilters: true })}
                  >
                    Limpiar filtros
                  </button>
                ) : null}
              </div>

              <div className="search-filters-meta">
                <p className="search-results-count">
                  {isLoading
                    ? "Filtrando resultados..."
                    : total === 1
                      ? "1 resultado"
                      : `${total} resultados`}
                  {hasActiveFilters ? " · con filtros aplicados" : ""}
                </p>
                {activeFilterChips.length > 0 ? (
                  <ul className="search-active-filters">
                    {activeFilterChips.map((chip) => (
                      <li key={chip.key}>
                        <button type="button" onClick={chip.onClear}>
                          {chip.label} ×
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </section>
          ) : null}

          {visibleErrorMessage ? (
            <p className="search-feedback search-feedback-error">{visibleErrorMessage}</p>
          ) : null}

          {isLoading ? (
            <p className="search-feedback">{currentModeUi.searchingLabel}</p>
          ) : null}

          {!isLoading &&
          !visibleErrorMessage &&
          shouldRunSearch &&
          visibleResults.length === 0 ? (
            <p className="search-feedback">
              {hasActiveFilters
                ? "No hay resultados con esos filtros. Probá limpiarlos o ampliar la búsqueda."
                : currentModeUi.noResultsLabel}
            </p>
          ) : null}

          {!isLoading && visibleResults.length > 0 ? (
            <div className="search-results-grid">
              {visibleResults.map((item) => (
                <article key={item.resultId} className="search-result-card">
                  <header>
                    <span className="search-kind-chip">{kindLabel[item.kind]}</span>
                    <div className="search-card-identity">
{item.companyLogoUrl ? (
                        <img
                          className="search-company-logo"
                          src={toDisplaySrc(item.companyLogoUrl)}
                          alt={`Logo de ${item.companyName}`}
                        />
                      ) : (
                        <div className="search-company-logo search-company-logo-fallback">
                          {toCompanyInitials(item.companyName)}
                        </div>
                      )}
                      <div className="search-card-identity-text">
                        <h2>{item.title}</h2>
                        <small>{item.companyName}</small>
                      </div>
                    </div>
                  </header>

<div className="search-card-media" aria-hidden={item.kind === "company" && !item.product?.imageUrl}>
                    {item.product?.imageUrl ? (
                      <img
                        className="search-product-image"
                        src={toDisplaySrc(item.product.imageUrl)}
                        alt={item.product.name}
                      />
                    ) : item.companyLogoUrl ? (
                      <img
                        className="search-product-image search-product-image-logo"
                        src={toDisplaySrc(item.companyLogoUrl)}
                        alt=""
                      />
                    ) : (
                      <div className="search-product-image search-product-image-empty">
                        {item.kind === "product" ? "Producto" : "Empresa"}
                      </div>
                    )}
                  </div>

                  <p className="search-result-summary">{item.summary}</p>

                  {item.matchedFields?.includes("tariffPosition") ? (
                    <p className="search-pa-match-hint">Coincide por posición arancelaria (P.A.)</p>
                  ) : null}

                  <dl>
                    {item.contactName ? (
                      <div>
                        <dt>Contacto</dt>
                        <dd>{item.contactName}</dd>
                      </div>
                    ) : null}
                    {item.email ? (
                      <div>
                        <dt>Email</dt>
                        <dd>{item.email}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt>Sector</dt>
                      <dd>{item.sector ?? "-"}</dd>
                    </div>
                    {item.city ? (
                      <div>
                        <dt>Ciudad</dt>
                        <dd>{item.city}</dd>
                      </div>
                    ) : null}
                    {item.kind === "product" ? (
                      <div className="search-pa-field">
                        <dt>P.A. / NCM</dt>
                        <dd>
                          {item.product?.tariffPosition ? (
                            <span
                              className="search-pa-badge"
                              title="Posición arancelaria / NCM"
                            >
                              P.A. {item.product.tariffPosition}
                            </span>
                          ) : (
                            <span className="search-pa-missing">Sin P.A. informada</span>
                          )}
                        </dd>
                      </div>
                    ) : null}
                  </dl>

                  {item.kind === "company" ? (
                    <section className="search-company-products">
                      <h3>Productos de la empresa</h3>
                      {item.companyProducts.length > 0 ? (
                        <ul>
                          {item.companyProducts.map((product) => (
                            <li key={product.id}>
                              <span>{product.name}</span>
                              {product.tariffPosition ? <span className="search-pa-badge search-pa-badge-inline" title="Posición arancelaria">P.A. {product.tariffPosition}</span> : <span className="search-pa-missing">Sin P.A.</span>}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>Sin productos publicados todavía.</p>
                      )}
                    </section>
                  ) : null}

                  {(() => {
                    const tags = toKeywordTags(item.keywords, [
                      item.sector ?? "",
                      item.kind === "product" ? item.title : ""
                    ]);
                    return tags.length > 0 ? (
                      <ul className="search-keywords">
                        {tags.map((keyword) => (
                          <li key={keyword}>{keyword}</li>
                        ))}
                      </ul>
                    ) : null;
                  })()}

<div className="search-card-body-spacer" aria-hidden="true" />
                  <div className="search-card-actions">
                    <Link className="search-card-link" to={`/empresas/${item.profileId}`}>
                      Ver ficha empresa
                    </Link>
                    <details className="search-info-request">
                      <summary>Solicitar información</summary>
                      <InfoRequestForm
                        compact
                        profileId={item.profileId}
                        companyName={item.companyName}
                        productName={item.kind === "product" ? item.title : undefined}
                        sourceQuery={query || undefined}
                        title="Solicitar información"
                        description="La administración revisará tu pedido y te contactará con la información habilitada."
                      />
                    </details>
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          {shouldShowSpecialRequest ? (
            <SpecialRequestForm
              key={query}
              title="¿No encontraste lo que buscabas?"
              description="Podés dejar un pedido especial para oferta o producto necesario y lo gestiona el panel administrador."
              initialQuery={query}
              initialRequestedProduct={query}
            />
          ) : null}
        </div>
      </section>
    </MainLayout>
  );
}
