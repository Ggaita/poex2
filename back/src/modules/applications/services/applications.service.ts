import {
  ApplicationStatus as PrismaApplicationStatus,
  UserRole as PrismaUserRole,
  type CompanyApplication as DbCompanyApplication
} from "@prisma/client";
import prisma from "../../../lib/prisma";
import type {
  ApplicationStatus,
  CompanyApplication,
  CreateCompanyApplicationInput,
  UpdateApplicationStatusInput
} from "../../../types/application.types";
import type {
  CreateApplicationResult,
  UpdateStatusResult
} from "../types/applications-service.types";
import { syncProfileFromApprovedApplicationTx } from "../../profiles/services/profiles.service";
import {
  notifyAdminNewApplication,
  prepareApplicationApprovedEmailTx,
  prepareApplicationReceivedEmail
} from "../../communications/services/communications.service";

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

await prepareApplicationReceivedEmail({
    applicationId: application.id,
    companyName: application.companyName,
    contactName: application.contactName,
    recipientEmail: application.email
  });

  void notifyAdminNewApplication({
    applicationId: application.id,
    companyName: application.companyName,
    contactName: application.contactName,
    contactEmail: application.email,
    phone: application.phone ?? undefined
  }).catch(() => undefined);

  return { application: toApiApplication(application) };
};

export const countPendingApplications = async (): Promise<number> => {
  return prisma.companyApplication.count({
    where: { status: PrismaApplicationStatus.pending }
  });
};

export const updateApplicationStatus = async (
  id: number,
  input: UpdateApplicationStatusInput
): Promise<UpdateStatusResult> => {
  return prisma.$transaction(async (db) => {
    const current = await db.companyApplication.findUnique({
      where: { id },
      select: { id: true, status: true }
    });

    if (!current) {
      return { error: "not_found" };
    }

    if (current.status !== PrismaApplicationStatus.pending) {
      return { error: "already_reviewed" };
    }

    const updated = await db.companyApplication.update({
      where: { id },
      data: {
        status: toPrismaStatus(input.status),
        reviewedBy: input.reviewedBy,
        reviewedAt: new Date(),
        rejectionReason:
          input.status === "rejected" ? (input.rejectionReason ?? null) : null
      }
    });

    if (updated.status === PrismaApplicationStatus.approved) {
      const reviewerRole =
        input.reviewedByRole === "admin"
          ? PrismaUserRole.admin
          : input.reviewedByRole === "empresa"
            ? PrismaUserRole.empresa
            : undefined;

      await syncProfileFromApprovedApplicationTx(db, updated, {
        userId: input.reviewedByUserId,
        email: input.reviewedByEmail ?? input.reviewedBy,
        role: reviewerRole,
        displayName: input.reviewedBy
      });

      await prepareApplicationApprovedEmailTx(db, {
        applicationId: updated.id,
        companyName: updated.companyName,
        contactName: updated.contactName,
        recipientEmail: updated.email
      });
    }

    return { application: toApiApplication(updated) };
  });
};
