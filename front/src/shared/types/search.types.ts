export interface SearchQuery {
  query: string;
}

export type SearchResultKind = "company" | "product";

export type SearchFieldName =
  | "companyName"
  | "contactName"
  | "email"
  | "taxId"
  | "description"
  | "product"
  | "keywords"
  | "sector"
  | "city";

export interface SearchResultItem {
  id: number;
  kind: SearchResultKind;
  title: string;
  companyName: string;
  summary: string;
  contactName?: string;
  email?: string;
  sector?: string;
  product?: string;
  keywords: string[];
  matchedFields: SearchFieldName[];
  matchScore: number;
}

export interface SearchResponseData {
  query: string;
  total: number;
  results: SearchResultItem[];
}
