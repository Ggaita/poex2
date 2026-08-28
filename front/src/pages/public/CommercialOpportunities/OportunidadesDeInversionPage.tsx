import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../../../layouts/MainLayouts";
import { toDisplaySrc } from "../../../shared/components/ImageField/ImageField";
import type { ApiResponse } from "../../../shared/types/api.types";
import type {
  InvestmentOpportunityCardView,
  InvestmentOpportunityStatus,
  InvestmentOpportunityType
} from "../../../shared/types/investment-opportunity.types";
import {
  opportunityStatusLabel,
  opportunityStatusOptions,
  opportunityTypeLabel,
  opportunityTypeOptions
} from "../../../shared/types/investment-opportunity.types";
import "./InvestmentOpportunitiesPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export default function OportunidadesDeInversionPage() {
  const [items, setItems] = useState<InvestmentOpportunityCardView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [typeFilter, setTypeFilter] = useState<InvestmentOpportunityType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<InvestmentOpportunityStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let active = true;

    const load = async (): Promise<void> => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const params = new URLSearchParams();
        if (typeFilter !== "all") params.set("type", typeFilter);
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (searchTerm.trim()) params.set("q", searchTerm.trim());

        const query = params.toString();
        const response = await fetch(
          `${API_BASE_URL}/api/public/investment-opportunities${query ? `?${query}` : ""}`
        );
        const payload = (await response.json()) as ApiResponse<InvestmentOpportunityCardView[]>;

        if (!active) return;

        if (!response.ok || !payload.success) {
          setItems([]);
          setErrorMessage(payload.error ?? "No se pudieron cargar las oportunidades.");
          return;
        }

        setItems(Array.isArray(payload.data) ? payload.data : []);
      } catch {
        if (!active) return;
        setItems([]);
        setErrorMessage("No se pudo conectar con el backend de oportunidades.");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    const timeoutId = window.setTimeout(() => {
      void load();
    }, 180);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [searchTerm, statusFilter, typeFilter]);

  const featuredCount = useMemo(
    () => items.filter((item) => item.isFeatured).length,
    [items]
  );

  const scrollToCatalog = () => {
    const target = document.getElementById("oportunidades-catalogo");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <MainLayout>
      <section className="investment-opportunities-page">
        <div className="investment-opportunities-shell">
          <header className="investment-opportunities-hero">
            <p>Micrositio de inversión</p>
            <h1>Oportunidades de inversión en proyectos estratégicos en Chaco</h1>
            <p className="investment-opportunities-hero-copy">
              Este espacio reúne oportunidades de inversión promovidas por la Provincia del Chaco
              para proyectos productivos, exportaciones, licitaciones y alianzas estratégicas.
              Consultá el catálogo, revisá cada ficha y contactá a la Agencia para avanzar.
            </p>
            <div className="investment-opportunities-hero-actions">
              <button type="button" className="investment-opportunities-btn-primary" onClick={scrollToCatalog}>
                Explorar oportunidades
              </button>
              <Link to="/contacto-institucional" className="investment-opportunities-btn-secondary">
                Contactar a la Agencia
              </Link>
            </div>
          </header>

          <section id="oportunidades-catalogo" className="investment-opportunities-catalog">
            <div className="investment-opportunities-catalog-header">
              <div>
                <h2>Catálogo de oportunidades</h2>
                <small>
                  {isLoading
                    ? "Cargando..."
                    : `${items.length} publicadas${featuredCount ? ` · ${featuredCount} destacadas` : ""}`}
                </small>
              </div>
            </div>

            <div className="investment-opportunities-filters">
              <label>
                Buscar
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Título, localidad, sector..."
                />
              </label>
              <label>
                Tipo
                <select
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(event.target.value as InvestmentOpportunityType | "all")
                  }
                >
                  <option value="all">Todos</option>
                  {opportunityTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Estado
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as InvestmentOpportunityStatus | "all")
                  }
                >
                  <option value="all">Todos</option>
                  {opportunityStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {errorMessage ? <p className="investment-opportunities-feedback investment-opportunities-feedback-error">{errorMessage}</p> : null}

            {isLoading ? (
              <p className="investment-opportunities-empty">Cargando oportunidades...</p>
            ) : items.length === 0 ? (
              <p className="investment-opportunities-empty">
                Todavía no hay oportunidades publicadas con esos filtros. Volvé más tarde o
                contactá a la Agencia.
              </p>
            ) : (
              <div className="investment-opportunities-card-grid">
                {items.map((item) => (
                  <article key={item.id} className="investment-opportunity-card">
                    <div className="investment-opportunity-card-media">
                      {item.mainImageUrl ? (
                        <img src={toDisplaySrc(item.mainImageUrl)} alt={item.title} />
                      ) : (
                        <div className="investment-opportunity-card-media-fallback">Sin imagen</div>
                      )}
                      {item.isFeatured ? <span className="investment-opportunity-badge investment-opportunity-badge-featured">Destacada</span> : null}
                    </div>
                    <div className="investment-opportunity-card-body">
                      <div className="investment-opportunity-card-tags">
                        <span className="investment-opportunity-badge">{opportunityTypeLabel[item.type]}</span>
                        <span className="investment-opportunity-badge investment-opportunity-badge-soft">
                          {opportunityStatusLabel[item.status]}
                        </span>
                      </div>
                      <h3>{item.title}</h3>
                      <p>{item.shortDescription || "Oportunidad de inversión en la Provincia del Chaco."}</p>
                      <ul className="investment-opportunity-card-meta">
                        <li>
                          <strong>Localidad:</strong> {item.locality}
                        </li>
                        {item.estimatedInvestment ? (
                          <li>
                            <strong>Inversión estimada:</strong> {item.estimatedInvestment}
                          </li>
                        ) : null}
                      </ul>
                      <Link
                        to={`/oportunidades-de-inversion/${item.slug}`}
                        className="investment-opportunity-card-link"
                      >
                        Ver ficha
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </MainLayout>
  );
}
