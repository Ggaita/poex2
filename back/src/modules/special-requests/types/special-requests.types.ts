export const specialRequestKinds = ["special_offer", "required_product"] as const;
export type SpecialRequestKind = (typeof specialRequestKinds)[number];

export const specialRequestStatuses = [
  "pending",
  "in_review",
  "forwarded",
  "resolved",
  "rejected"
] as const;
export type SpecialRequestStatus = (typeof specialRequestStatuses)[number];

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

export interface CreateSpecialRequestInput {
  kind: SpecialRequestKind;
  sourceQuery?: string;
  requestedProduct: string;
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
