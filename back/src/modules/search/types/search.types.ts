export type SearchResultKind = "company" | "product";
export type SearchMode = "all" | "company" | "product";

export type SearchFieldName =
  | "companyName"
  | "contactName"
  | "email"
  | "taxId"
  | "description"
  | "product"
  | "keywords"
  | "sector"
  | "city"
  | "tariffPosition";

export interface SearchCompanyProductSummary {
  id: number;
  name: string;
  tariffPosition?: string;
}

export interface SearchProductDetail {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  tariffPosition?: string;
}

export interface SearchResultItem {
  resultId: string;
  profileId: number;
  kind: SearchResultKind;
  title: string;
  companyName: string;
  companyLogoUrl?: string;
  summary: string;
  /** Etiqueta corta de experiencia exportadora (ej. Exportador frecuente). */
  exportExperience?: string;
  contactName?: string;
  email?: string;
  sector?: string;
  city?: string;
  product?: SearchProductDetail;
  companyProducts: SearchCompanyProductSummary[];
  keywords: string[];
  matchedFields: SearchFieldName[];
  matchScore: number;
}

export type SearchResultKindFilter = SearchResultKind | "all";

export type SearchHasPaFilter = "all" | "yes" | "no";

export interface SearchFilters {
  sector?: string;
  city?: string;
  kind?: SearchResultKindFilter;
  hasPa?: SearchHasPaFilter;
}

export interface SearchFacetOption {
  value: string;
  label: string;
  count: number;
}

export interface SearchFacets {
  kinds: SearchFacetOption[];
  sectors: SearchFacetOption[];
  cities: SearchFacetOption[];
  hasPa: SearchFacetOption[];
}

export interface SearchResponseData {
  query: string;
  mode: SearchMode;
  total: number;
  filters: Required<SearchFilters>;
  facets: SearchFacets;
  results: SearchResultItem[];
}
