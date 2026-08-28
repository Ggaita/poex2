export type InvestmentOpportunityType =
  | "inversiones"
  | "exportaciones"
  | "proyectos_productivos"
  | "licitaciones"
  | "alianzas_comerciales"
  | "proveedores"
  | "parques_industriales";

export type InvestmentOpportunityStatus =
  | "licitacion_vigente"
  | "proxima_licitacion"
  | "licitacion_cerrada";

export type InvestmentInquiryStatus = "pending" | "in_review" | "resolved" | "rejected";

export type InvestmentAssetView = {
  id: number;
  kind: "gallery" | "document";
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

export const opportunityTypeLabel: Record<InvestmentOpportunityType, string> = {
  inversiones: "Inversiones",
  exportaciones: "Exportaciones",
  proyectos_productivos: "Proyectos productivos",
  licitaciones: "Licitaciones",
  alianzas_comerciales: "Alianzas comerciales",
  proveedores: "Proveedores",
  parques_industriales: "Parques industriales"
};

export const opportunityStatusLabel: Record<InvestmentOpportunityStatus, string> = {
  licitacion_vigente: "Licitación vigente",
  proxima_licitacion: "Próxima licitación",
  licitacion_cerrada: "Licitación cerrada"
};

export const opportunityTypeOptions = Object.entries(opportunityTypeLabel).map(([value, label]) => ({
  value: value as InvestmentOpportunityType,
  label
}));

export const opportunityStatusOptions = Object.entries(opportunityStatusLabel).map(
  ([value, label]) => ({
    value: value as InvestmentOpportunityStatus,
    label
  })
);
