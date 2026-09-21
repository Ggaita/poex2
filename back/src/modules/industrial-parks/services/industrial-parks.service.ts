import type { IndustrialPark as DbPark, Prisma } from "@prisma/client";
import prisma from "../../../lib/prisma";
import type { IndustrialParkView } from "../types/industrial-parks.types";

const trimToUndefined = (value?: string | null): string | undefined => {
  if (typeof value !== "string") return undefined;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : undefined;
};

const slugify = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export type IndustrialParkAdminView = IndustrialParkView & {
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type IndustrialParkInput = {
  name: string;
  administration?: string | null;
  progressStatus: string;
  locality: string;
  department?: string | null;
  yearCreated?: number | null;
  surfaceHa?: number | null;
  measuredPlots?: number | null;
  settledCompanies?: string | null;
  infrastructure?: string | null;
  renpiStatus?: string | null;
  observations?: string | null;
  sortOrder?: number;
  isPublished?: boolean;
  slug?: string | null;
};

const toView = (row: DbPark): IndustrialParkView => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  administration: trimToUndefined(row.administration),
  progressStatus: row.progressStatus,
  locality: row.locality,
  department: trimToUndefined(row.department),
  yearCreated: row.yearCreated ?? undefined,
  surfaceHa: row.surfaceHa ?? undefined,
  measuredPlots: row.measuredPlots ?? undefined,
  settledCompanies: trimToUndefined(row.settledCompanies),
  infrastructure: trimToUndefined(row.infrastructure),
  renpiStatus: trimToUndefined(row.renpiStatus),
  observations: trimToUndefined(row.observations),
  sortOrder: row.sortOrder
});

const toAdminView = (row: DbPark): IndustrialParkAdminView => ({
  ...toView(row),
  isPublished: row.isPublished,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString()
});

const ensureUniqueSlug = async (
  baseName: string,
  preferred?: string | null,
  excludeId?: number
): Promise<string> => {
  const base = slugify(preferred?.trim() || baseName) || `parque-${Date.now()}`;
  let candidate = base;
  let suffix = 2;
  while (true) {
    const existing = await prisma.industrialPark.findUnique({
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

export const listPublicIndustrialParks = async (): Promise<IndustrialParkView[]> => {
  const rows = await prisma.industrialPark.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }, { id: "asc" }]
  });
  return rows.map(toView);
};

export const getPublicIndustrialParkBySlug = async (
  slug: string
): Promise<IndustrialParkView | null> => {
  const row = await prisma.industrialPark.findFirst({
    where: { slug, isPublished: true }
  });
  return row ? toView(row) : null;
};

export const listAdminIndustrialParks = async (filters?: {
  q?: string;
  published?: boolean;
}): Promise<IndustrialParkAdminView[]> => {
  const where: Prisma.IndustrialParkWhereInput = {};
  if (typeof filters?.published === "boolean") {
    where.isPublished = filters.published;
  }
  if (filters?.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { locality: { contains: filters.q, mode: "insensitive" } },
      { department: { contains: filters.q, mode: "insensitive" } },
      { administration: { contains: filters.q, mode: "insensitive" } },
      { progressStatus: { contains: filters.q, mode: "insensitive" } }
    ];
  }

  const rows = await prisma.industrialPark.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }, { id: "desc" }]
  });
  return rows.map(toAdminView);
};

export const getAdminIndustrialParkById = async (
  id: number
): Promise<IndustrialParkAdminView | null> => {
  const row = await prisma.industrialPark.findUnique({ where: { id } });
  return row ? toAdminView(row) : null;
};

export const createIndustrialPark = async (
  input: IndustrialParkInput
): Promise<IndustrialParkAdminView> => {
  const slug = await ensureUniqueSlug(input.name, input.slug);
  const row = await prisma.industrialPark.create({
    data: {
      slug,
      name: input.name.trim(),
      administration: trimToUndefined(input.administration) ?? null,
      progressStatus: input.progressStatus.trim() || "Sin dato",
      locality: input.locality.trim(),
      department: trimToUndefined(input.department) ?? null,
      yearCreated: input.yearCreated ?? null,
      surfaceHa: input.surfaceHa ?? null,
      measuredPlots: input.measuredPlots ?? null,
      settledCompanies: trimToUndefined(input.settledCompanies) ?? null,
      infrastructure: trimToUndefined(input.infrastructure) ?? null,
      renpiStatus: trimToUndefined(input.renpiStatus) ?? null,
      observations: trimToUndefined(input.observations) ?? null,
      sortOrder: input.sortOrder ?? 0,
      isPublished: input.isPublished ?? false
    }
  });
  return toAdminView(row);
};

export const updateIndustrialPark = async (
  id: number,
  input: Partial<IndustrialParkInput>
): Promise<IndustrialParkAdminView | null> => {
  const existing = await prisma.industrialPark.findUnique({ where: { id } });
  if (!existing) return null;

  const nextName = input.name?.trim() || existing.name;
  const slug =
    input.slug !== undefined || input.name !== undefined
      ? await ensureUniqueSlug(nextName, input.slug ?? existing.slug, id)
      : existing.slug;

  const row = await prisma.industrialPark.update({
    where: { id },
    data: {
      slug,
      name: nextName,
      administration:
        input.administration !== undefined
          ? trimToUndefined(input.administration) ?? null
          : undefined,
      progressStatus:
        input.progressStatus !== undefined
          ? input.progressStatus.trim() || existing.progressStatus
          : undefined,
      locality: input.locality !== undefined ? input.locality.trim() : undefined,
      department:
        input.department !== undefined ? trimToUndefined(input.department) ?? null : undefined,
      yearCreated: input.yearCreated !== undefined ? input.yearCreated : undefined,
      surfaceHa: input.surfaceHa !== undefined ? input.surfaceHa : undefined,
      measuredPlots: input.measuredPlots !== undefined ? input.measuredPlots : undefined,
      settledCompanies:
        input.settledCompanies !== undefined
          ? trimToUndefined(input.settledCompanies) ?? null
          : undefined,
      infrastructure:
        input.infrastructure !== undefined
          ? trimToUndefined(input.infrastructure) ?? null
          : undefined,
      renpiStatus:
        input.renpiStatus !== undefined ? trimToUndefined(input.renpiStatus) ?? null : undefined,
      observations:
        input.observations !== undefined ? trimToUndefined(input.observations) ?? null : undefined,
      sortOrder: input.sortOrder !== undefined ? input.sortOrder : undefined,
      isPublished: input.isPublished !== undefined ? input.isPublished : undefined
    }
  });

  return toAdminView(row);
};

export const deleteIndustrialPark = async (id: number): Promise<boolean> => {
  const existing = await prisma.industrialPark.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return false;
  await prisma.industrialPark.delete({ where: { id } });
  return true;
};
