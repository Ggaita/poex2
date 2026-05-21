import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { SearchMode } from "../../../../../shared/types/search.types";

export const HeroSearchForm = () => {
  const [query, setQuery] = useState<string>("");
  const [mode, setMode] = useState<SearchMode>("products");

  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    navigate(
      `/search?q=${encodeURIComponent(trimmedQuery)}&mode=${mode}`
    );
  };

  return (
    <form
      role="search"
      aria-label="Buscar productos o empresas"
      className="search-form"
      onSubmit={handleSubmit}
    >
      <div className="search-box">
        <input
          type="search"
          name="query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          required
          placeholder="Vinos, cacao, agrotech..."
          className="search-input"
          aria-label="Buscar productos o empresas"
        />

        <div className="search-button-wrapper">
          <button type="submit" className="search-button">
            Buscar
          </button>
        </div>
      </div>
    </form>
  );
};