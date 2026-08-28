export const investmentOpportunityTypes = [
  "inversiones",
  "exportaciones",
  "proyectos_productivos",
  "licitaciones",
  "alianzas_comerciales",
  "proveedores",
  "parques_industriales"
] as const;

export type InvestmentOpportunityType = (typeof investmentOpportunityTypes)[number];

export const investmentOpportunityStatuses = [
  "licitacion_vigente",
  "proxima_licitacion",
  "licitacion_cerrada"
] as const;

export type InvestmentOpportunityStatus = (typeof investmentOpportunityStatuses)[number];

export const investmentAssetKinds = ["gallery", "document"] as const;
export type InvestmentAssetKind = (typeof investmentAssetKinds)[number];

export const investmentInquiryStatuses = [
  "pending",
  "in_review",
  "resolved",
  "rejected"
] as const;

export type InvestmentInquiryStatus = (typeof investmentInquiryStatuses)[number];

export type InvestmentAssetInput = {
  kind: InvestmentAssetKind;
  url: string;
  label?: string | null;
  sortOrder?: number;
};

export type InvestmentOpportunityCreateInput = {
  title: string;
  shortDescription?: string | null;
  fullDescription: string;
  sector: string;
  locality: string;
  type: InvestmentOpportunityType;
  status: InvestmentOpportunityStatus;
  estimatedInvestment?: string | null;
  mainImageUrl: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  sortOrder?: number;
  slug?: string | null;
  assets?: InvestmentAssetInput[];
};

export type InvestmentOpportunityUpdateInput = Partial<InvestmentOpportunityCreateInput>;

export type InvestmentInquiryCreateInput = {
  opportunityId: number;
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string | null;
  requesterCompany?: string | null;
  message: string;
};

export type InvestmentInquiryUpdateInput = {
  status: InvestmentInquiryStatus;
  adminNotes?: string | null;
  reviewedByUserId?: number;
  reviewedByEmail?: string;
};

export type InvestmentAssetView = {
  id: number;
  kind: InvestmentAssetKind;
  url: string;
  label?: string;
  sortOrder: number;
};

export type InvestmentOpportunityCardView = {
  id: number;
  slug: string;
  title: string;
  shortDescription?: string;
  locality: string;
  type: InvestmentOpportunityType;
  status: InvestmentOpportunityStatus;
  mainImageUrl: string;
  isFeatured: boolean;
  estimatedInvestment?: string;
};

export type InvestmentOpportunityDetailView = InvestmentOpportunityCardView & {
  fullDescription: string;
  sector: string;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  gallery: InvestmentAssetView[];
  documents: InvestmentAssetView[];
};

export type InvestmentOpportunityAdminView = InvestmentOpportunityDetailView;

export type InvestmentInquiryView = {
  id: number;
  opportunityId: number;
  opportunityTitle: string;
  opportunitySlug: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string;
  requesterCompany?: string;
  message: string;
  status: InvestmentInquiryStatus;
  adminNotes?: string;
  reviewedByEmail?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export const isInvestmentOpportunityType = (
  value: unknown
): value is InvestmentOpportunityType => {
  return (
    typeof value === "string" &&
    (investmentOpportunityTypes as readonly string[]).includes(value)
  );
};

export const isInvestmentOpportunityStatus = (
  value: unknown
): value is InvestmentOpportunityStatus => {
  return (
    typeof value === "string" &&
    (investmentOpportunityStatuses as readonly string[]).includes(value)
  );
};

export const isInvestmentAssetKind = (value: unknown): value is InvestmentAssetKind => {
  return typeof value === "string" && (investmentAssetKinds as readonly string[]).includes(value);
};

export const isInvestmentInquiryStatus = (
  value: unknown
): value is InvestmentInquiryStatus => {
  return (
    typeof value === "string" &&
    (investmentInquiryStatuses as readonly string[]).includes(value)
  );
};
