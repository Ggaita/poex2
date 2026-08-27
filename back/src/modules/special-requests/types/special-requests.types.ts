export const specialRequestKinds = [
  "special_offer",
  "required_product",
  "info_request"
] as const;
export type SpecialRequestKind = (typeof specialRequestKinds)[number];

export const specialRequestStatuses = [
  "pending",
  "in_review",
  "forwarded",
  "resolved",
  "rejected"
] as const;
export type SpecialRequestStatus = (typeof specialRequestStatuses)[number];

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

export interface CreateSpecialRequestInput {
  kind: SpecialRequestKind;
  sourceQuery?: string;
  requestedProduct: string;
  productName?: string;
  profileId?: number;
  details?: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string;
  requesterCompany?: string;
}

export interface ListSpecialRequestsFilters {
  status?: SpecialRequestStatus;
  query?: string;
  limit?: number;
}

export interface UpdateSpecialRequestInput {
  status?: SpecialRequestStatus;
  adminNotes?: string | null;
  reviewedByUserId?: number;
  reviewedByEmail?: string;
}

export const isSpecialRequestKind = (value: unknown): value is SpecialRequestKind => {
  return (
    typeof value === "string" &&
    (specialRequestKinds as readonly string[]).includes(value)
  );
};

export const isSpecialRequestStatus = (
  value: unknown
): value is SpecialRequestStatus => {
  return (
    typeof value === "string" &&
    (specialRequestStatuses as readonly string[]).includes(value)
  );
};
