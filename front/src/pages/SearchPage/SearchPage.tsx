import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import MainLayout from "../../layouts/MainLayouts";
import { HeroSearchForm } from "../Home/components/Hero/Components/HeroSearchForm";
import type { ApiResponse } from "../../shared/types/api.types";
import type {
  SearchResponseData,
  SearchResultItem
} from "../../shared/types/search.types";
import "./SearchPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const kindLabel: Record<SearchResultItem["kind"], string> = {
  company: "Empresa",
  product: "Producto"
};

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!query.trim()) {
      return;
    }

    let active = true;

    const runSearch = async (): Promise<void> => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`
        );
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
  }, [query]);

  const visibleResults = query ? results : [];
  const visibleErrorMessage = query ? errorMessage : "";
  return (
    <MainLayout>
      <section className="search-page">
        <div className="search-page-shell">
          <header className="search-page-header">
            <p>Buscador unificado</p>
            <h1>Resultados de búsqueda</h1>
            <small>
              Encontrá productos y empresas desde un único campo de búsqueda.
            </small>
            <HeroSearchForm key={query} initialQuery={query} />
          </header>

          {query ? (
            <p className="search-query-label">
              Buscando: <strong>{query}</strong>
            </p>
          ) : (
            <p className="search-query-label">
              Ingresá una palabra clave para iniciar la búsqueda.
            </p>
          )}

          {visibleErrorMessage ? (
            <p className="search-feedback search-feedback-error">{visibleErrorMessage}</p>
          ) : null}

          {isLoading ? (
            <p className="search-feedback">Buscando coincidencias...</p>
          ) : null}

          {!isLoading && !visibleErrorMessage && query && visibleResults.length === 0 ? (
            <p className="search-feedback">
              No encontramos coincidencias para esa búsqueda.
            </p>
          ) : null}
          {!isLoading && visibleResults.length > 0 ? (
            <div className="search-results-grid">
              {visibleResults.map((item) => (
                <article key={item.id} className="search-result-card">
                  <header>
                    <span className="search-kind-chip">{kindLabel[item.kind]}</span>
                    <h2>{item.title}</h2>
                    <small>{item.companyName}</small>
                  </header>

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
                    <div>
                      <dt>Producto</dt>
                      <dd>{item.product ?? "-"}</dd>
                    </div>
                  </dl>

                  {item.keywords.length > 0 ? (
                    <ul className="search-keywords">
                      {item.keywords.slice(0, 6).map((keyword) => (
                        <li key={keyword}>{keyword}</li>
                      ))}
                    </ul>
                  ) : null}

                  <Link className="search-card-link" to={`/empresas/${item.id}`}>
                    Ver ficha empresa
                  </Link>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </MainLayout>
  );
}