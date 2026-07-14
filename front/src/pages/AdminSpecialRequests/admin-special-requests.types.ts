export type SpecialRequestKind = "special_offer" | "required_product";

export type SpecialRequestStatus =
  | "pending"
  | "in_review"
  | "forwarded"
  | "resolved"
  | "rejected";

export type SpecialRequestStatusFilter = SpecialRequestStatus | "all";

export interface SpecialRequestView {
  id: number;
  kind: SpecialRequestKind;
  sourceQuery?: string;
  requestedProduct: string;
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
}
