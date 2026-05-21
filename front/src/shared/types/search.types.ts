export type SearchMode = "products" | "companies";

export interface SearchQuery {
  query: string;
  mode: SearchMode;
}