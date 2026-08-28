import {
  InvestmentAssetKind as PrismaAssetKind,
  InvestmentInquiryStatus as PrismaInquiryStatus,
  InvestmentOpportunityStatus as PrismaOpportunityStatus,
  InvestmentOpportunityType as PrismaOpportunityType,
  type InvestmentInquiry as DbInquiry,
  type InvestmentOpportunity as DbOpportunity,
  type InvestmentOpportunityAsset as DbAsset,
  Prisma
} from "@prisma/client";
import prisma from "../../../lib/prisma";
import type {
  InvestmentAssetInput,
  InvestmentAssetView,
  InvestmentInquiryCreateInput,
  InvestmentInquiryStatus,
  InvestmentInquiryUpdateInput,
  InvestmentInquiryView,
  InvestmentOpportunityAdminView,
  InvestmentOpportunityCardView,
  InvestmentOpportunityCreateInput,
  InvestmentOpportunityDetailView,
  InvestmentOpportunityStatus,
  InvestmentOpportunityType,
  InvestmentOpportunityUpdateInput
} from "../types/investment-opportunities.types";

type OpportunityWithAssets = DbOpportunity & { assets: DbAsset[] };
type InquiryWithOpportunity = DbInquiry & {
  opportunity: Pick<DbOpportunity, "id" | "title" | "slug">;
};

const slugify = (value: string): string => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
};

const trimToUndefined = (value?: string | null): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : undefined;
};

const toApiType = (value: PrismaOpportunityType): InvestmentOpportunityType => value;
const toApiStatus = (value: PrismaOpportunityStatus): InvestmentOpportunityStatus => value;

const toAssetView = (asset: DbAsset): InvestmentAssetView => ({
  id: asset.id,
  kind: asset.kind === PrismaAssetKind.gallery ? "gallery" : "document",
  url: asset.url,
  label: trimToUndefined(asset.label),
  sortOrder: asset.sortOrder
});

const splitAssets = (assets: DbAsset[]) => {
  const ordered = [...assets].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  return {
    gallery: ordered.filter((item) => item.kind === PrismaAssetKind.gallery).map(toAssetView),
    documents: ordered.filter((item) => item.kind === PrismaAssetKind.document).map(toAssetView)
  };
};

const toCardView = (row: DbOpportunity): InvestmentOpportunityCardView => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  shortDescription: trimToUndefined(row.shortDescription),
  locality: row.locality,
  type: toApiType(row.type),
  status: toApiStatus(row.status),
  mainImageUrl: row.mainImageUrl,
  isFeatured: row.isFeatured,
  estimatedInvestment: trimToUndefined(row.estimatedInvestment)
});

const toDetailView = (row: OpportunityWithAssets): InvestmentOpportunityDetailView => {
  const { gallery, documents } = splitAssets(row.assets);
  return {
    ...toCardView(row),
    fullDescription: row.fullDescription,
    sector: row.sector,
    isPublished: row.isPublished,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    gallery,
    documents
  };
};

const toInquiryView = (row: InquiryWithOpportunity): InvestmentInquiryView => ({
  id: row.id,
  opportunityId: row.opportunityId,
  opportunityTitle: row.opportunity.title,
  opportunitySlug: row.opportunity.slug,
  requesterName: row.requesterName,
  requesterEmail: row.requesterEmail,
  requesterPhone: trimToUndefined(row.requesterPhone),
  requesterCompany: trimToUndefined(row.requesterCompany),
  message: row.message,
  status: row.status,
  adminNotes: trimToUndefined(row.adminNotes),
  reviewedByEmail: trimToUndefined(row.reviewedByEmail),
  reviewedAt: row.reviewedAt?.toISOString(),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString()
});

const ensureUniqueSlug = async (baseTitle: string, preferred?: string | null, excludeId?: number) => {
  const base = slugify(preferred?.trim() || baseTitle) || `oportunidad-${Date.now()}`;
  let candidate = base;
  let suffix = 2;

  while (true) {
    const existing = await prisma.investmentOpportunity.findUnique({
      where: { slug: candidate },
      select: { id: true }
    });

    if (!existing || (excludeId !== undefined && existing.id === excludeId)) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
};

const normalizeAssets = (assets?: InvestmentAssetInput[]) => {
  if (!assets || assets.length === 0) {
    return [] as Array<{
      kind: PrismaAssetKind;
      url: string;
      label: string | null;
      sortOrder: number;
    }>;
  }

  return assets
    .map((asset, index) => {
      const url = asset.url.trim();
      if (!url) {
        return null;
      }
      return {
        kind: asset.kind === "document" ? PrismaAssetKind.document : PrismaAssetKind.gallery,
        url,
        label: trimToUndefined(asset.label) ?? null,
        sortOrder: typeof asset.sortOrder === "number" ? asset.sortOrder : index
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
};

export const listPublicOpportunities = async (filters?: {
  type?: InvestmentOpportunityType;
  status?: InvestmentOpportunityStatus;
  q?: string;
}): Promise<InvestmentOpportunityCardView[]> => {
  const where: Prisma.InvestmentOpportunityWhereInput = {
    isPublished: true
  };

  if (filters?.type) {
    where.type = filters.type;
  }
  if (filters?.status) {
    where.status = filters.status;
  }
  if (filters?.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { shortDescription: { contains: filters.q, mode: "insensitive" } },
      { locality: { contains: filters.q, mode: "insensitive" } },
      { sector: { contains: filters.q, mode: "insensitive" } }
    ];
  }

  const rows = await prisma.investmentOpportunity.findMany({
    where,
    orderBy: [
      { isFeatured: "desc" },
      { sortOrder: "asc" },
      { updatedAt: "desc" },
      { id: "desc" }
    ]
  });

  return rows.map(toCardView);
};

export const getPublicOpportunityBySlug = async (
  slug: string
): Promise<InvestmentOpportunityDetailView | null> => {
  const row = await prisma.investmentOpportunity.findFirst({
    where: { slug, isPublished: true },
    include: { assets: true }
  });

  return row ? toDetailView(row) : null;
};

export const listAdminOpportunities = async (filters?: {
  published?: boolean;
  q?: string;
}): Promise<InvestmentOpportunityAdminView[]> => {
  const where: Prisma.InvestmentOpportunityWhereInput = {};
  if (typeof filters?.published === "boolean") {
    where.isPublished = filters.published;
  }
  if (filters?.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { locality: { contains: filters.q, mode: "insensitive" } },
      { sector: { contains: filters.q, mode: "insensitive" } }
    ];
  }

  const rows = await prisma.investmentOpportunity.findMany({
    where,
    include: { assets: true },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }, { id: "desc" }]
  });

  return rows.map(toDetailView);
};

export const getAdminOpportunityById = async (
  id: number
): Promise<InvestmentOpportunityAdminView | null> => {
  const row = await prisma.investmentOpportunity.findUnique({
    where: { id },
    include: { assets: true }
  });
  return row ? toDetailView(row) : null;
};

export const createOpportunity = async (
  input: InvestmentOpportunityCreateInput
): Promise<InvestmentOpportunityAdminView> => {
  const slug = await ensureUniqueSlug(input.title, input.slug);
  const assets = normalizeAssets(input.assets);

  const created = await prisma.investmentOpportunity.create({
    data: {
      slug,
      title: input.title.trim(),
      shortDescription: trimToUndefined(input.shortDescription) ?? null,
      fullDescription: input.fullDescription.trim(),
      sector: input.sector.trim(),
      locality: input.locality.trim(),
      type: input.type,
      status: input.status,
      estimatedInvestment: trimToUndefined(input.estimatedInvestment) ?? null,
      mainImageUrl: input.mainImageUrl.trim(),
      isFeatured: Boolean(input.isFeatured),
      isPublished: Boolean(input.isPublished),
      sortOrder: typeof input.sortOrder === "number" ? input.sortOrder : 0,
      assets: assets.length
        ? {
            create: assets
          }
        : undefined
    },
    include: { assets: true }
  });

  return toDetailView(created);
};

export const updateOpportunity = async (
  id: number,
  input: InvestmentOpportunityUpdateInput
): Promise<InvestmentOpportunityAdminView | null> => {
  const current = await prisma.investmentOpportunity.findUnique({
    where: { id },
    select: { id: true, title: true, slug: true }
  });
  if (!current) {
    return null;
  }

  const nextTitle = input.title?.trim() || current.title;
  const slug =
    input.slug !== undefined || input.title !== undefined
      ? await ensureUniqueSlug(nextTitle, input.slug ?? current.slug, id)
      : undefined;

  const data: Prisma.InvestmentOpportunityUpdateInput = {};
  if (input.title !== undefined) data.title = input.title.trim();
  if (input.shortDescription !== undefined) {
    data.shortDescription = trimToUndefined(input.shortDescription) ?? null;
  }
  if (input.fullDescription !== undefined) data.fullDescription = input.fullDescription.trim();
  if (input.sector !== undefined) data.sector = input.sector.trim();
  if (input.locality !== undefined) data.locality = input.locality.trim();
  if (input.type !== undefined) data.type = input.type;
  if (input.status !== undefined) data.status = input.status;
  if (input.estimatedInvestment !== undefined) {
    data.estimatedInvestment = trimToUndefined(input.estimatedInvestment) ?? null;
  }
  if (input.mainImageUrl !== undefined) data.mainImageUrl = input.mainImageUrl.trim();
  if (input.isFeatured !== undefined) data.isFeatured = Boolean(input.isFeatured);
  if (input.isPublished !== undefined) data.isPublished = Boolean(input.isPublished);
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
  if (slug !== undefined) data.slug = slug;

  const updated = await prisma.$transaction(async (db) => {
    if (input.assets) {
      await db.investmentOpportunityAsset.deleteMany({ where: { opportunityId: id } });
      const assets = normalizeAssets(input.assets);
      if (assets.length > 0) {
        await db.investmentOpportunityAsset.createMany({
          data: assets.map((asset) => ({ ...asset, opportunityId: id }))
        });
      }
    }

    return db.investmentOpportunity.update({
      where: { id },
      data,
      include: { assets: true }
    });
  });

  return toDetailView(updated);
};

export const deleteOpportunity = async (id: number): Promise<boolean> => {
  const existing = await prisma.investmentOpportunity.findUnique({
    where: { id },
    select: { id: true }
  });
  if (!existing) {
    return false;
  }

  await prisma.investmentOpportunity.delete({ where: { id } });
  return true;
};

export const createInquiry = async (
  input: InvestmentInquiryCreateInput
): Promise<InvestmentInquiryView> => {
  const opportunity = await prisma.investmentOpportunity.findFirst({
    where: { id: input.opportunityId, isPublished: true },
    select: { id: true, title: true, slug: true }
  });

  if (!opportunity) {
    throw new Error("opportunity_not_found");
  }

  const created = await prisma.investmentInquiry.create({
    data: {
      opportunityId: opportunity.id,
      requesterName: input.requesterName.trim(),
      requesterEmail: input.requesterEmail.trim().toLowerCase(),
      requesterPhone: trimToUndefined(input.requesterPhone) ?? null,
      requesterCompany: trimToUndefined(input.requesterCompany) ?? null,
      message: input.message.trim()
    },
    include: {
      opportunity: {
        select: { id: true, title: true, slug: true }
      }
    }
  });

  return toInquiryView(created);
};

export const listAdminInquiries = async (filters?: {
  status?: InvestmentInquiryStatus;
  q?: string;
}): Promise<InvestmentInquiryView[]> => {
  const where: Prisma.InvestmentInquiryWhereInput = {};
  if (filters?.status) {
    where.status = filters.status;
  }
  if (filters?.q) {
    where.OR = [
      { requesterName: { contains: filters.q, mode: "insensitive" } },
      { requesterEmail: { contains: filters.q, mode: "insensitive" } },
      { message: { contains: filters.q, mode: "insensitive" } },
      { opportunity: { title: { contains: filters.q, mode: "insensitive" } } }
    ];
  }

  const rows = await prisma.investmentInquiry.findMany({
    where,
    include: {
      opportunity: {
        select: { id: true, title: true, slug: true }
      }
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });

  return rows.map(toInquiryView);
};

export const countPendingInquiries = async (): Promise<number> => {
  return prisma.investmentInquiry.count({
    where: { status: PrismaInquiryStatus.pending }
  });
};

export const updateInquiry = async (
  id: number,
  input: InvestmentInquiryUpdateInput
): Promise<InvestmentInquiryView | null> => {
  const existing = await prisma.investmentInquiry.findUnique({
    where: { id },
    select: { id: true }
  });
  if (!existing) {
    return null;
  }

  const updated = await prisma.investmentInquiry.update({
    where: { id },
    data: {
      status: input.status,
      adminNotes: input.adminNotes !== undefined ? trimToUndefined(input.adminNotes) ?? null : undefined,
      reviewedByUserId: input.reviewedByUserId ?? undefined,
      reviewedByEmail: input.reviewedByEmail ?? undefined,
      reviewedAt: new Date()
    },
    include: {
      opportunity: {
        select: { id: true, title: true, slug: true }
      }
    }
  });

  return toInquiryView(updated);
};
