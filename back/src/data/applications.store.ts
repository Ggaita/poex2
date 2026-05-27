import {
  ApplicationStatus as PrismaApplicationStatus,
  type CompanyApplication as DbCompanyApplication
} from "@prisma/client";
import prisma from "../lib/prisma";
import type {
  ApplicationStatus,
  CompanyApplication,
  CreateCompanyApplicationInput,
  UpdateApplicationStatusInput
} from "../types/application.types";

type CreateApplicationError = "duplicate_email" | "duplicate_tax_id";
type UpdateStatusError = "not_found" | "already_reviewed";

type CreateApplicationResult =
  | { application: CompanyApplication; error?: never }
  | { application?: never; error: CreateApplicationError };

type UpdateStatusResult =
  | { application: CompanyApplication; error?: never }
  | { application?: never; error: UpdateStatusError };

const toPrismaStatus = (status: ApplicationStatus): PrismaApplicationStatus => {
  switch (status) {
    case "pending":
      return PrismaApplicationStatus.pending;
    case "approved":
      return PrismaApplicationStatus.approved;
    case "rejected":
      return PrismaApplicationStatus.rejected;
  }
};

const toApiStatus = (status: PrismaApplicationStatus): ApplicationStatus => {
  switch (status) {
    case PrismaApplicationStatus.pending:
      return "pending";
    case PrismaApplicationStatus.approved:
      return "approved";
    case PrismaApplicationStatus.rejected:
      return "rejected";
  }
};

const toApiApplication = (application: DbCompanyApplication): CompanyApplication => {
  return {
    id: application.id,
    companyName: application.companyName,
    contactName: application.contactName,
    email: application.email,
    phone: application.phone ?? undefined,
    taxId: application.taxId ?? undefined,
    message: application.message ?? undefined,
    status: toApiStatus(application.status),
    createdAt: application.createdAt.toISOString(),
    reviewedAt: application.reviewedAt?.toISOString(),
    reviewedBy: application.reviewedBy ?? undefined,
    rejectionReason: application.rejectionReason ?? undefined
  };
};

const hasDuplicateEmail = async (email: string): Promise<boolean> => {
  const row = await prisma.companyApplication.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive"
      }
    },
    select: { id: true }
  });

  return Boolean(row);
};

const hasDuplicateTaxId = async (taxId?: string): Promise<boolean> => {
  if (!taxId) {
    return false;
  }

  const row = await prisma.companyApplication.findFirst({
    where: {
      taxId: {
        equals: taxId,
        mode: "insensitive"
      }
    },
    select: { id: true }
  });

  return Boolean(row);
};

export const listApplications = async (
  status?: ApplicationStatus
): Promise<CompanyApplication[]> => {
  const rows = await prisma.companyApplication.findMany({
    where: status ? { status: toPrismaStatus(status) } : undefined,
    orderBy: { id: "desc" }
  });

  return rows.map(toApiApplication);
};

export const getApplicationById = async (
  id: number
): Promise<CompanyApplication | undefined> => {
  const row = await prisma.companyApplication.findUnique({
    where: { id }
  });

  return row ? toApiApplication(row) : undefined;
};

export const createApplication = async (
  input: CreateCompanyApplicationInput
): Promise<CreateApplicationResult> => {
  const duplicateEmail = await hasDuplicateEmail(input.email);
  if (duplicateEmail) {
    return { error: "duplicate_email" };
  }

  const duplicateTaxId = await hasDuplicateTaxId(input.taxId);
  if (duplicateTaxId) {
    return { error: "duplicate_tax_id" };
  }

  const application = await prisma.companyApplication.create({
    data: {
      companyName: input.companyName,
      contactName: input.contactName,
      email: input.email,
      phone: input.phone ?? null,
      taxId: input.taxId ?? null,
      message: input.message ?? null
    }
  });

  return { application: toApiApplication(application) };
};

export const updateApplicationStatus = async (
  id: number,
  input: UpdateApplicationStatusInput
): Promise<UpdateStatusResult> => {
  const current = await prisma.companyApplication.findUnique({
    where: { id },
    select: { id: true, status: true }
  });

  if (!current) {
    return { error: "not_found" };
  }

  if (current.status !== PrismaApplicationStatus.pending) {
    return { error: "already_reviewed" };
  }

  const updated = await prisma.companyApplication.update({
    where: { id },
    data: {
      status: toPrismaStatus(input.status),
      reviewedBy: input.reviewedBy,
      reviewedAt: new Date(),
      rejectionReason:
        input.status === "rejected" ? (input.rejectionReason ?? null) : null
    }
  });

  return { application: toApiApplication(updated) };
};