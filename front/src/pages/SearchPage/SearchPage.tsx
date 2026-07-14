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

type SpecialRequestKind = "special_offer" | "required_product";

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

  const [specialKind, setSpecialKind] = useState<SpecialRequestKind>("required_product");
  const [specialRequestedProduct, setSpecialRequestedProduct] = useState(() => query);
  const [specialDetails, setSpecialDetails] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [requesterPhone, setRequesterPhone] = useState("");
  const [requesterCompany, setRequesterCompany] = useState("");
  const [isSubmittingSpecialRequest, setIsSubmittingSpecialRequest] = useState(false);
  const [specialRequestFeedback, setSpecialRequestFeedback] = useState("");
  const [specialRequestError, setSpecialRequestError] = useState("");


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

  const handleSubmitSpecialRequest = async (): Promise<void> => {
    const requestedProduct = specialRequestedProduct.trim() || query;
    const name = requesterName.trim();
    const email = requesterEmail.trim();

    if (!requestedProduct) {
      setSpecialRequestError("Indicá el producto/oferta que necesitás.");
      setSpecialRequestFeedback("");
      return;
    }

    if (!name) {
      setSpecialRequestError("Indicá tu nombre para registrar el pedido.");
      setSpecialRequestFeedback("");
      return;
    }

    if (!email) {
      setSpecialRequestError("Indicá un email de contacto.");
      setSpecialRequestFeedback("");
      return;
    }

    setIsSubmittingSpecialRequest(true);
    setSpecialRequestError("");
    setSpecialRequestFeedback("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/public/special-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          kind: specialKind,
          sourceQuery: query,
          requestedProduct,
          details: specialDetails.trim() || undefined,
          requesterName: name,
          requesterEmail: email,
          requesterPhone: requesterPhone.trim() || undefined,
          requesterCompany: requesterCompany.trim() || undefined
        })
      });

      const payload = (await response.json()) as ApiResponse<{ id: number }>;

      if (!response.ok || !payload.success) {
        setSpecialRequestError(
          payload.error ?? "No se pudo registrar el pedido especial."
        );
        return;
      }

      setSpecialRequestFeedback(
        "Pedido especial enviado correctamente. El equipo de POEX lo revisará."
      );
      setSpecialDetails("");
    } catch {
      setSpecialRequestError("No se pudo conectar para registrar el pedido especial.");
    } finally {
      setIsSubmittingSpecialRequest(false);
    }
  };

  const visibleResults = query ? results : [];
  const visibleErrorMessage = query ? errorMessage : "";
  const shouldShowSpecialRequest =
    !isLoading && !visibleErrorMessage && query.length > 0 && visibleResults.length === 0;

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

          {isLoading ? <p className="search-feedback">Buscando coincidencias...</p> : null}

          {!isLoading && !visibleErrorMessage && query && visibleResults.length === 0 ? (
            <p className="search-feedback">
              No encontramos coincidencias para esa búsqueda.
            </p>
          ) : null}

          {!isLoading && visibleResults.length > 0 ? (
            <div className="search-results-grid">
              {visibleResults.map((item) => (
                <article key={item.resultId} className="search-result-card">
                  <header>
                    <span className="search-kind-chip">{kindLabel[item.kind]}</span>
                    <h2>{item.title}</h2>
                    <small>{item.companyName}</small>
                  </header>

                  {item.product?.imageUrl ? (
                    <img
                      className="search-product-image"
                      src={item.product.imageUrl}
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
            <section className="special-request-card">
              <header>
                <h2>¿No encontraste lo que buscabas?</h2>
                <p>
                  Podés dejar un pedido especial para oferta o producto necesario y lo gestiona
                  el panel administrador.
                </p>
              </header>

              {specialRequestError ? (
                <p className="search-feedback search-feedback-error">{specialRequestError}</p>
              ) : null}
              {specialRequestFeedback ? (
                <p className="search-feedback search-feedback-success">
                  {specialRequestFeedback}
                </p>
              ) : null}

              <div className="special-request-grid">
                <label>
                  Tipo de pedido
                  <select
                    value={specialKind}
                    onChange={(event) => setSpecialKind(event.target.value as SpecialRequestKind)}
                  >
                    <option value="required_product">Producto necesario</option>
                    <option value="special_offer">Solicitud de oferta especial</option>
                  </select>
                </label>
                <label>
                  Producto / necesidad
                  <input
                    type="text"
                    value={specialRequestedProduct}
                    onChange={(event) => setSpecialRequestedProduct(event.target.value)}
                    placeholder="Ej: tanino vegetal de quebracho"
                  />
                </label>
                <label>
                  Tu nombre
                  <input
                    type="text"
                    value={requesterName}
                    onChange={(event) => setRequesterName(event.target.value)}
                  />
                </label>
                <label>
                  Email de contacto
                  <input
                    type="email"
                    value={requesterEmail}
                    onChange={(event) => setRequesterEmail(event.target.value)}
                  />
                </label>
                <label>
                  Teléfono
                  <input
                    type="text"
                    value={requesterPhone}
                    onChange={(event) => setRequesterPhone(event.target.value)}
                  />
                </label>
                <label>
                  Empresa (opcional)
                  <input
                    type="text"
                    value={requesterCompany}
                    onChange={(event) => setRequesterCompany(event.target.value)}
                  />
                </label>
              </div>

              <label className="special-request-details">
                Detalle adicional
                <textarea
                  rows={4}
                  value={specialDetails}
                  onChange={(event) => setSpecialDetails(event.target.value)}
                  placeholder="Cantidad, especificaciones, mercado destino, etc."
                />
              </label>

              <button
                type="button"
                className="special-request-button"
                onClick={() => void handleSubmitSpecialRequest()}
                disabled={isSubmittingSpecialRequest}
              >
                {isSubmittingSpecialRequest ? "Enviando..." : "Enviar pedido especial"}
              </button>
            </section>
          ) : null}
        </div>
      </section>
    </MainLayout>
  );
}