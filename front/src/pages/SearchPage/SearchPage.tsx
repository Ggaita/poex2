import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import MainLayout from "../../layouts/MainLayouts";
import { HeroSearchForm } from "../Home/components/Hero/Components/HeroSearchForm";
import SpecialRequestForm from "../../shared/components/SpecialRequestForm/SpecialRequestForm";
import { toDisplaySrc } from "../../shared/components/ImageField/ImageField";
import type { ApiResponse } from "../../shared/types/api.types";
import type {
  SearchMode,
  SearchResponseData,
  SearchResultItem
} from "../../shared/types/search.types";
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

const modeUi: Record<SearchMode, SearchModeUi> = {
  all: {
    eyebrow: "Buscador unificado",
    title: "Resultados de búsqueda",
    subtitle: "Encontrá productos y empresas desde un único campo de búsqueda.",
    emptyQueryLabel: "Ingresá una palabra clave para iniciar la búsqueda.",
    noResultsLabel: "No encontramos coincidencias para esa búsqueda.",
    searchingLabel: "Buscando coincidencias...",
    placeholder: "Vinos, cacao, agrotech..."
  },
  company: {
    eyebrow: "Oportunidades comerciales",
    title: "Búsqueda de empresas",
    subtitle: "Buscá empresas exportadoras o visualizá todas las empresas publicadas.",
    emptyQueryLabel: "Mostrando todas las empresas publicadas.",
    noResultsLabel: "No encontramos empresas para esa búsqueda.",
    searchingLabel: "Buscando empresas...",
    placeholder: "Nombre de empresa, sector, ciudad...",
    showAllLabel: "Mostrar todas las empresas"
  },
  product: {
    eyebrow: "Oportunidades comerciales",
    title: "Búsqueda de productos",
    subtitle: "Buscá productos exportables o visualizá todos los productos publicados.",
    emptyQueryLabel: "Mostrando todos los productos publicados.",
    noResultsLabel: "No encontramos productos para esa búsqueda.",
    searchingLabel: "Buscando productos...",
    placeholder: "Miel, algodón, tanino, madera...",
    showAllLabel: "Mostrar todos los productos"
  }
};

const kindLabel: Record<SearchResultItem["kind"], string> = {
  company: "Empresa",
  product: "Producto"
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
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const searchMode = parseSearchMode(searchParams.get("mode"));
  const currentModeUi = modeUi[searchMode];
  const shouldRunSearch = query.length > 0 || searchMode !== "all";

  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!shouldRunSearch) {
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

        const response = await fetch(`${API_BASE_URL}/api/search?${params.toString()}`);
        const payload = (await response.json()) as ApiResponse<SearchResponseData>;

        if (!active) {
          return;
        }

        if (!response.ok || !payload.success) {
          setResults([]);
          setErrorMessage(payload.error ?? "No se pudo ejecutar la búsqueda.");
          return;
        }

        setResults(payload.data?.results ?? []);
      } catch {
        if (!active) {
          return;
        }
        setResults([]);
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
  }, [query, searchMode, shouldRunSearch]);

  const visibleResults = shouldRunSearch ? results : [];
  const visibleErrorMessage = shouldRunSearch ? errorMessage : "";
  const showAllLink =
    searchMode === "company"
      ? "/search?mode=company"
      : searchMode === "product"
        ? "/search?mode=product"
        : null;
  const shouldShowSpecialRequest =
    searchMode !== "company" &&
    !isLoading &&
    !visibleErrorMessage &&
    query.length > 0 &&
    visibleResults.length === 0;

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
                  <Link to="/search?mode=company" className="search-page-link">
                    Ir a empresas
                  </Link>
                  <Link to="/search?mode=product" className="search-page-link">
                    Ir a productos
                  </Link>
                </>
              ) : null}
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
            <p className="search-feedback">{currentModeUi.noResultsLabel}</p>
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

{item.product?.imageUrl ? (
                    <img
                      className="search-product-image"
                      src={toDisplaySrc(item.product.imageUrl)}
                      alt={item.product.name}
                    />
                  ) : null}

                  <p>{item.summary}</p>

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
                      <div>
                        <dt>P.A.</dt>
                        <dd>{item.product?.tariffPosition ?? "-"}</dd>
                      </div>
                    ) : null}
                  </dl>

                  {item.kind === "company" ? (
                    <section className="search-company-products">
                      <h3>Productos de la empresa</h3>
                      {item.companyProducts.length > 0 ? (
                        <ul>
                          {item.companyProducts.slice(0, 6).map((product) => (
                            <li key={product.id}>
                              <span>{product.name}</span>
                              {product.tariffPosition ? <small>{product.tariffPosition}</small> : null}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>Sin productos publicados todavía.</p>
                      )}
                    </section>
                  ) : null}

                  {item.keywords.length > 0 ? (
                    <ul className="search-keywords">
                      {item.keywords.slice(0, 6).map((keyword) => (
                        <li key={keyword}>{keyword}</li>
                      ))}
                    </ul>
                  ) : null}

                  <Link className="search-card-link" to={`/empresas/${item.profileId}`}>
                    Ver ficha empresa
                  </Link>
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
