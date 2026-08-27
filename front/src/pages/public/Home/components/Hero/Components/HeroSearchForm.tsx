import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
type HeroSearchMode = "all" | "company" | "product";

type HeroSearchFormProps = {
  initialQuery?: string;
  mode?: HeroSearchMode;
  placeholder?: string;
};

export const HeroSearchForm = ({
  initialQuery = "",
  mode = "all",
  placeholder = "Vinos, cacao, agrotech..."
}: HeroSearchFormProps) => {
  const [query, setQuery] = useState<string>(initialQuery);

  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    const params = new URLSearchParams();
    params.set("q", trimmedQuery);
    if (mode !== "all") {
      params.set("mode", mode);
    }

    navigate(`/search?${params.toString()}`);
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
          placeholder={placeholder}
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