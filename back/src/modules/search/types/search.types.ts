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

export interface SearchResponseData {
  query: string;
  mode: SearchMode;
  total: number;
  results: SearchResultItem[];
}
