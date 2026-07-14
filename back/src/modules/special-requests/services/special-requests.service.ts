import {
  SpecialRequestStatus as PrismaSpecialRequestStatus,
  type SpecialRequest as DbSpecialRequest,
  type Prisma
} from "@prisma/client";
import prisma from "../../../lib/prisma";
import type {
  CreateSpecialRequestInput,
  ListSpecialRequestsFilters,
  SpecialRequestStatus,
  SpecialRequestView,
  UpdateSpecialRequestInput
} from "../types/special-requests.types";

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

const toView = (row: DbSpecialRequest): SpecialRequestView => {
  return {
    id: row.id,
    kind: row.kind,
    sourceQuery: trimToUndefined(row.sourceQuery),
    requestedProduct: row.requestedProduct,
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
    updatedAt: row.updatedAt.toISOString()
  };
};

export const createSpecialRequest = async (
  input: CreateSpecialRequestInput
): Promise<SpecialRequestView> => {
  const created = await prisma.specialRequest.create({
    data: {
      kind: input.kind,
      sourceQuery: trimToNullable(input.sourceQuery),
      requestedProduct: input.requestedProduct.trim(),
      details: trimToNullable(input.details),
      requesterName: input.requesterName.trim(),
      requesterEmail: input.requesterEmail.trim().toLowerCase(),
      requesterPhone: trimToNullable(input.requesterPhone),
      requesterCompany: trimToNullable(input.requesterCompany)
    }
  });

  return toView(created);
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
              { details: { contains: query, mode: "insensitive" } },
              { requesterName: { contains: query, mode: "insensitive" } },
              { requesterEmail: { contains: query, mode: "insensitive" } },
              { requesterCompany: { contains: query, mode: "insensitive" } },
              { sourceQuery: { contains: query, mode: "insensitive" } }
            ]
          }
        : {})
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit
  });

  return rows.map(toView);
};

export const getSpecialRequestById = async (
  id: number
): Promise<SpecialRequestView | null> => {
  const row = await prisma.specialRequest.findUnique({
    where: { id }
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
      data
    });

    return toView(updated);
  });
};
