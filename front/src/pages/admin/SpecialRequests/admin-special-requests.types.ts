export type SpecialRequestKind =
  | "special_offer"
  | "required_product"
  | "info_request";

export type SpecialRequestStatus =
  | "pending"
  | "in_review"
  | "forwarded"
  | "resolved"
  | "rejected";

export type SpecialRequestStatusFilter = SpecialRequestStatus | "all";

export interface SpecialRequestProfileSummary {
  id: number;
  companyName: string;
  contactName?: string;
  contactEmail?: string;
  phone?: string;
  city?: string;
  sector?: string;
}

export interface SpecialRequestView {
  id: number;
  kind: SpecialRequestKind;
  sourceQuery?: string;
  requestedProduct: string;
  productName?: string;
  profileId?: number;
  profile?: SpecialRequestProfileSummary;
  details?: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string;
  requesterCompany?: string;
  status: SpecialRequestStatus;
  adminNotes?: string;
  reviewedByEmail?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  whatsappUrl?: string;
}
