import {
  SpecialRequestStatus as PrismaSpecialRequestStatus,
  type SpecialRequest as DbSpecialRequest,
  type Prisma
} from "@prisma/client";
import prisma from "../../../lib/prisma";
import { notifyAdminNewInfoRequest } from "../../communications/services/communications.service";
import type {
  CreateSpecialRequestInput,
  ListSpecialRequestsFilters,
  SpecialRequestStatus,
  SpecialRequestView,
  UpdateSpecialRequestInput
} from "../types/special-requests.types";

type SpecialRequestWithProfile = DbSpecialRequest & {
  profile?: {
    id: number;
    companyName: string;
    contactName: string | null;
    contactEmail: string | null;
    phone: string | null;
    city: string | null;
    sector: string | null;
  } | null;
};

const trimToUndefined = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : undefined;
};

const trimToNullable = (value: unknown): string | null => {
  return trimToUndefined(value) ?? null;
};

const toPrismaStatus = (
  status: SpecialRequestStatus
): PrismaSpecialRequestStatus => {
  switch (status) {
    case "pending":
      return PrismaSpecialRequestStatus.pending;
    case "in_review":
      return PrismaSpecialRequestStatus.in_review;
    case "forwarded":
      return PrismaSpecialRequestStatus.forwarded;
    case "resolved":
      return PrismaSpecialRequestStatus.resolved;
    case "rejected":
      return PrismaSpecialRequestStatus.rejected;
  }
};

const toApiStatus = (
  status: PrismaSpecialRequestStatus
): SpecialRequestStatus => {
  switch (status) {
    case PrismaSpecialRequestStatus.pending:
      return "pending";
    case PrismaSpecialRequestStatus.in_review:
      return "in_review";
    case PrismaSpecialRequestStatus.forwarded:
      return "forwarded";
    case PrismaSpecialRequestStatus.resolved:
      return "resolved";
    case PrismaSpecialRequestStatus.rejected:
      return "rejected";
  }
};

const toWhatsappUrl = (phone?: string | null): string | undefined => {
  const cleaned = trimToUndefined(phone);
  if (!cleaned) {
    return undefined;
  }

  const digits = cleaned.replace(/\D+/g, "");
  if (digits.length < 8) {
    return undefined;
  }

  const normalized =
    digits.startsWith("54") || digits.startsWith("549")
      ? digits
      : digits.startsWith("0")
        ? `54${digits.replace(/^0+/, "")}`
        : `549${digits}`;

  return `https://wa.me/${normalized}`;
};

const toView = (row: SpecialRequestWithProfile): SpecialRequestView => {
  return {
    id: row.id,
    kind: row.kind,
    sourceQuery: trimToUndefined(row.sourceQuery),
    requestedProduct: row.requestedProduct,
    productName: trimToUndefined(row.productName),
    profileId: typeof row.profileId === "number" ? row.profileId : undefined,
    profile: row.profile
      ? {
          id: row.profile.id,
          companyName: row.profile.companyName,
          contactName: trimToUndefined(row.profile.contactName),
          contactEmail: trimToUndefined(row.profile.contactEmail),
          phone: trimToUndefined(row.profile.phone),
          city: trimToUndefined(row.profile.city),
          sector: trimToUndefined(row.profile.sector)
        }
      : undefined,
    details: trimToUndefined(row.details),
    requesterName: row.requesterName,
    requesterEmail: row.requesterEmail,
    requesterPhone: trimToUndefined(row.requesterPhone),
    requesterCompany: trimToUndefined(row.requesterCompany),
    status: toApiStatus(row.status),
    adminNotes: trimToUndefined(row.adminNotes),
    reviewedByEmail: trimToUndefined(row.reviewedByEmail),
    reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    whatsappUrl: toWhatsappUrl(row.requesterPhone)
  };
};

const includeProfile = {
  profile: {
    select: {
      id: true,
      companyName: true,
      contactName: true,
      contactEmail: true,
      phone: true,
      city: true,
      sector: true
    }
  }
} satisfies Prisma.SpecialRequestInclude;

export const createSpecialRequest = async (
  input: CreateSpecialRequestInput
): Promise<SpecialRequestView> => {
  let profileId: number | null =
    typeof input.profileId === "number" && Number.isFinite(input.profileId)
      ? Math.floor(input.profileId)
      : null;

  if (profileId !== null) {
    const profile = await prisma.companyProfile.findFirst({
      where: {
        id: profileId,
        isPublished: true
      },
      select: { id: true, companyName: true }
    });

    if (!profile) {
      throw new Error("profile_not_found");
    }
  }

const created = await prisma.specialRequest.create({
    data: {
      kind: input.kind,
      sourceQuery: trimToNullable(input.sourceQuery),
      requestedProduct: input.requestedProduct.trim(),
      productName: trimToNullable(input.productName),
      profileId,
      details: trimToNullable(input.details),
      requesterName: input.requesterName.trim(),
      requesterEmail: input.requesterEmail.trim().toLowerCase(),
      requesterPhone: trimToNullable(input.requesterPhone),
      requesterCompany: trimToNullable(input.requesterCompany)
    },
    include: includeProfile
  });

  const view = toView(created);

  // Fire-and-forget admin notice; never block the public request flow.
  void notifyAdminNewInfoRequest({
    requestId: view.id,
    requestKind: view.kind,
    requesterName: view.requesterName,
    requesterEmail: view.requesterEmail,
    requesterPhone: view.requesterPhone,
    requesterCompany: view.requesterCompany,
    companyName: view.profile?.companyName,
    productName: view.productName ?? view.requestedProduct,
    details: view.details
  }).catch(() => undefined);

  return view;
};

export const countPendingSpecialRequests = async (): Promise<number> => {
  return prisma.specialRequest.count({
    where: { status: PrismaSpecialRequestStatus.pending }
  });
};

export const listSpecialRequests = async (
  filters?: ListSpecialRequestsFilters
): Promise<SpecialRequestView[]> => {
  const limit = Number.isFinite(filters?.limit)
    ? Math.max(1, Math.min(200, Math.floor(filters?.limit ?? 80)))
    : 80;
  const query = trimToUndefined(filters?.query);

const rows = await prisma.specialRequest.findMany({
    where: {
      ...(filters?.status ? { status: toPrismaStatus(filters.status) } : {}),
      ...(query
        ? {
            OR: [
              { requestedProduct: { contains: query, mode: "insensitive" } },
              { productName: { contains: query, mode: "insensitive" } },
              { details: { contains: query, mode: "insensitive" } },
              { requesterName: { contains: query, mode: "insensitive" } },
              { requesterEmail: { contains: query, mode: "insensitive" } },
              { requesterCompany: { contains: query, mode: "insensitive" } },
              { sourceQuery: { contains: query, mode: "insensitive" } },
              { profile: { companyName: { contains: query, mode: "insensitive" } } }
            ]
          }
        : {})
    },
    include: includeProfile,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit
  });

  return rows.map(toView);
};

export const getSpecialRequestById = async (
  id: number
): Promise<SpecialRequestView | null> => {
  const row = await prisma.specialRequest.findUnique({
    where: { id },
    include: includeProfile
  });

  return row ? toView(row) : null;
};

export const updateSpecialRequest = async (
  id: number,
  input: UpdateSpecialRequestInput
): Promise<SpecialRequestView | null> => {
  return prisma.$transaction(async (db) => {
    const current = await db.specialRequest.findUnique({
      where: { id }
    });

    if (!current) {
      return null;
    }

    const nextStatus = input.status ? toPrismaStatus(input.status) : current.status;
    const nextNotes =
      "adminNotes" in input ? trimToNullable(input.adminNotes) : current.adminNotes;

    const statusChanged = nextStatus !== current.status;
    const notesChanged = nextNotes !== current.adminNotes;

    if (!statusChanged && !notesChanged) {
      return toView(current);
    }
    const data: Prisma.SpecialRequestUncheckedUpdateInput = {};
    if (input.status) {
      data.status = nextStatus;
    }
    if ("adminNotes" in input) {
      data.adminNotes = nextNotes;
    }

    data.reviewedAt = new Date();
    if (typeof input.reviewedByUserId === "number") {
      data.reviewedByUserId = input.reviewedByUserId;
    }
    if (typeof input.reviewedByEmail === "string") {
      data.reviewedByEmail = input.reviewedByEmail.trim();
    }

const updated = await db.specialRequest.update({
      where: { id },
      data,
      include: includeProfile
    });

    return toView(updated);
  });
};
