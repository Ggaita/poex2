import {
  ProfileEditMode as PrismaProfileEditMode,
  UserRole as PrismaUserRole,
  type CompanyApplication as DbCompanyApplication,
  type CompanyProduct as DbCompanyProduct,
  type CompanyProfile as DbCompanyProfile,
  type CompanyProfileAuditLog as DbCompanyProfileAuditLog,
  type CompanyProfileVisibility as DbCompanyProfileVisibility,
  type Prisma
} from "@prisma/client";
import prisma from "../../../lib/prisma";
import { prepareProductReviewStatusChangedEmailTx } from "../../communications/services/communications.service";
import type {
  CompanyOwnProfileView,
  CompanyProductInput,
  CompanyProductPatch,
  CompanyProductReviewPatch,
  CompanyProductView,
  CompanyProfileAdminView,
  CompanyProfileAuditLogView,
  CompanyProfileDataPatch,
  CompanyProfileSettingsPatch,
  CompanyProfileVisibilityPatch,
  ProfileAuditActor,
  ProfileEditMode,
  ProfileFieldKey,
  PublicCompanyProfileView
} from "../types/profile.types";
import { profileFieldKeys } from "../types/profile.types";

type ProfilePrismaClient = Prisma.TransactionClient | typeof prisma;

const textFieldKeys = [
  "companyName",
  "contactName",
  "contactEmail",
  "phone",
  "taxId",
  "description",
  "sector",
  "subSector",
  "product",
  "keywords",
  "tariffPosition",
  "exportDestinations",
  "awards",
  "certifications",
  "website",
  "facebook",
  "instagram",
  "linkedin",
  "youtube",
  "otherLink",
  "address",
  "city",
  "googleMapsEmbed"
] as const;

const numericFieldKeys = ["latitude", "longitude"] as const;

type TextFieldKey = (typeof textFieldKeys)[number];
type NumericFieldKey = (typeof numericFieldKeys)[number];

type ProfileWithRelations = DbCompanyProfile & {
  visibilityRules: DbCompanyProfileVisibility[];
  products: DbCompanyProduct[];
};

const defaultVisibilityByField: Record<ProfileFieldKey, boolean> = {
  companyName: true,
  contactName: false,
  contactEmail: false,
  phone: false,
  taxId: false,
  description: true,
  sector: true,
  subSector: true,
  product: true,
  keywords: true,
  tariffPosition: true,
  exportDestinations: true,
  awards: false,
  certifications: false,
  website: true,
  facebook: false,
  instagram: false,
  linkedin: false,
  youtube: false,
  otherLink: false,
  address: false,
  city: true,
  googleMapsEmbed: true,
  latitude: true,
  longitude: true
};

const trimToUndefined = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
};

const trimToNullable = (value: unknown): string | null => {
  const normalized = trimToUndefined(value);
  return normalized ?? null;
};

const asNumberOrNull = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();
  if (!cleaned) {
    return null;
  }

  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeImageUrl = (value: unknown): string | null => {
  const trimmed = trimToUndefined(value);
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
};

const normalizeTariffPosition = (value: unknown): string | null => {
  const trimmed = trimToUndefined(value);
  if (!trimmed) {
    return null;
  }

  return trimmed
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^0-9A-Z./-]/g, "");
};

const toProductView = (product: DbCompanyProduct): CompanyProductView => {
  return {
    id: product.id,
    profileId: product.profileId,
    name: product.name,
    description: product.description ?? undefined,
    imageUrl: product.imageUrl ?? undefined,
    tariffPosition: product.tariffPosition ?? undefined,
    isTariffPositionUnknown: product.isTariffPositionUnknown,
    isAccepted: typeof product.isAccepted === "boolean" ? product.isAccepted : null,
    rejectionMessage: product.rejectionMessage ?? undefined,
    reviewedAt: product.reviewedAt ? product.reviewedAt.toISOString() : undefined,
    reviewedBy: product.reviewedBy ?? undefined,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString()
  };
};

const toApiEditMode = (value: PrismaProfileEditMode): ProfileEditMode => {
  switch (value) {
    case PrismaProfileEditMode.agency:
      return "agency";
    case PrismaProfileEditMode.company:
      return "company";
    case PrismaProfileEditMode.mixed:
      return "mixed";
  }
};

const toPrismaEditMode = (value: ProfileEditMode): PrismaProfileEditMode => {
  switch (value) {
    case "agency":
      return PrismaProfileEditMode.agency;
    case "company":
      return PrismaProfileEditMode.company;
    case "mixed":
      return PrismaProfileEditMode.mixed;
  }
};

const isPrismaRole = (value: unknown): value is PrismaUserRole => {
  return value === PrismaUserRole.admin || value === PrismaUserRole.empresa;
};

const buildVisibilityMap = (
  visibilityRows: DbCompanyProfileVisibility[]
): Record<ProfileFieldKey, boolean> => {
  const base: Record<ProfileFieldKey, boolean> = { ...defaultVisibilityByField };

  visibilityRows.forEach((row) => {
    if (isProfileFieldKey(row.fieldKey)) {
      base[row.fieldKey] = row.isVisible;
    }
  });

  return base;
};

const slugify = (value: string): string => {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();

  return normalized || `empresa-${Date.now()}`;
};

const generateUniqueSlug = async (
  db: ProfilePrismaClient,
  companyName: string,
  ignoreProfileId?: number
): Promise<string> => {
  const base = slugify(companyName);
  let candidate = base;
  let suffix = 2;

  while (true) {
    const existing = await db.companyProfile.findFirst({
      where: {
        slug: candidate,
        ...(ignoreProfileId ? { NOT: { id: ignoreProfileId } } : {})
      },
      select: { id: true }
    });

    if (!existing) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
};

type ParsedApplicationMessage = {
  address?: string;
  city?: string;
  description?: string;
  representativeRole?: string;
  representativeEmail?: string;
  sector?: string;
  chamberMembership?: string;
  chamberNames?: string;
  product?: string;
  keywords?: string;
  tariffPosition?: string;
  exportDestinations?: string;
  awards?: string;
  certifications?: string;
  googleMapsEmbed?: string;
  links?: {
    website?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
    other?: string;
  };
  geo?: {
    latitude?: number | string;
    longitude?: number | string;
  };
};

const parseApplicationMessage = (message?: string | null): ParsedApplicationMessage => {
  if (!message) {
    return {};
  }

  try {
    const parsed = JSON.parse(message) as ParsedApplicationMessage;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const toOptionalString = (value?: string | null): string | undefined => {
  return value ?? undefined;
};

const toOptionalNumber = (value?: number | null): number | undefined => {
  return typeof value === "number" ? value : undefined;
};

const toAdminView = (
  profile: ProfileWithRelations,
  visibility: Record<ProfileFieldKey, boolean>
): CompanyProfileAdminView => {
  return {
    id: profile.id,
    applicationId: toOptionalNumber(profile.applicationId),
    ownerUserId: toOptionalNumber(profile.ownerUserId),
    slug: profile.slug,
    companyName: profile.companyName,
    contactName: profile.contactName,
    contactEmail: profile.contactEmail,
    phone: toOptionalString(profile.phone),
    taxId: toOptionalString(profile.taxId),
    description: toOptionalString(profile.description),
    sector: toOptionalString(profile.sector),
    subSector: toOptionalString(profile.subSector),
    product: toOptionalString(profile.product),
    keywords: toOptionalString(profile.keywords),
    tariffPosition: toOptionalString(profile.tariffPosition),
    exportDestinations: toOptionalString(profile.exportDestinations),
    awards: toOptionalString(profile.awards),
    certifications: toOptionalString(profile.certifications),
    website: toOptionalString(profile.website),
    facebook: toOptionalString(profile.facebook),
    instagram: toOptionalString(profile.instagram),
    linkedin: toOptionalString(profile.linkedin),
    youtube: toOptionalString(profile.youtube),
    otherLink: toOptionalString(profile.otherLink),
    address: toOptionalString(profile.address),
    city: toOptionalString(profile.city),
    googleMapsEmbed: toOptionalString(profile.googleMapsEmbed),
    latitude: toOptionalNumber(profile.latitude),
    longitude: toOptionalNumber(profile.longitude),
    editMode: toApiEditMode(profile.editMode),
    isPublished: profile.isPublished,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
    visibility,
    products: profile.products
      .slice()
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime() || b.id - a.id)
      .map(toProductView)
  };
};

const assignPublicField = (
  target: PublicCompanyProfileView,
  fieldKey: ProfileFieldKey,
  profile: DbCompanyProfile
): void => {
  const writableTarget = target as Partial<
    Record<ProfileFieldKey, string | number>
  >;
  const value = profile[fieldKey as keyof DbCompanyProfile];

  if (typeof value === "string") {
    const cleaned = value.trim();
    if (cleaned.length > 0) {
      writableTarget[fieldKey] = cleaned;
    }
    return;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    writableTarget[fieldKey] = value;
  }
};

const toPublicView = (
  profile: DbCompanyProfile,
  visibility: Record<ProfileFieldKey, boolean>
): PublicCompanyProfileView => {
  const projected: PublicCompanyProfileView = {
    id: profile.id,
    slug: profile.slug
  };

  profileFieldKeys.forEach((fieldKey) => {
    if (!visibility[fieldKey]) {
      return;
    }

    assignPublicField(projected, fieldKey, profile);
  });

  return projected;
};

const defaultVisibilityCreateRows = (profileId: number) => {
  return profileFieldKeys.map((fieldKey) => ({
    profileId,
    fieldKey,
    isVisible: defaultVisibilityByField[fieldKey]
  }));
};

const createAuditLog = async (
  db: ProfilePrismaClient,
  profileId: number,
  actor: ProfileAuditActor | undefined,
  payload: {
    action: string;
    fieldKey?: string;
    oldValue?: string | null;
    newValue?: string | null;
    metadata?: Prisma.InputJsonValue;
  }
): Promise<void> => {
  const actorRole = isPrismaRole(actor?.role) ? actor.role : undefined;

  await db.companyProfileAuditLog.create({
    data: {
      profileId,
      actorUserId: actor?.userId ?? null,
      actorEmail: actor?.email ?? actor?.displayName ?? null,
      actorRole: actorRole ?? null,
      action: payload.action,
      fieldKey: payload.fieldKey ?? null,
      oldValue: payload.oldValue ?? null,
      newValue: payload.newValue ?? null,
      metadata: payload.metadata ?? undefined
    }
  });
};

const parseDataPatch = (
  payload: CompanyProfileDataPatch
): Prisma.CompanyProfileUpdateInput => {
  const data: Prisma.CompanyProfileUpdateInput = {};

  textFieldKeys.forEach((key) => {
    if (!(key in payload)) {
      return;
    }

    if (key === "companyName" || key === "contactName" || key === "contactEmail") {
      const requiredValue = trimToUndefined(payload[key]);
      if (requiredValue) {
        data[key] = requiredValue;
      }
      return;
    }

    data[key] = trimToNullable(payload[key]);
  });

  numericFieldKeys.forEach((key) => {
    if (!(key in payload)) {
      return;
    }

    data[key] = asNumberOrNull(payload[key]);
  });

  return data;
};

const compareFieldValues = (
  previous: DbCompanyProfile,
  next: Prisma.CompanyProfileUpdateInput
): Array<{ fieldKey: string; oldValue: string | null; newValue: string | null }> => {
  const changes: Array<{ fieldKey: string; oldValue: string | null; newValue: string | null }> = [];
  const nextRecord = next as Record<string, unknown>;

  [...textFieldKeys, ...numericFieldKeys].forEach((fieldKey) => {
    if (!(fieldKey in nextRecord)) {
      return;
    }

    const oldRaw = previous[fieldKey as keyof DbCompanyProfile];
    const newRaw = nextRecord[fieldKey];

    const oldValue =
      typeof oldRaw === "number"
        ? String(oldRaw)
        : typeof oldRaw === "string"
          ? oldRaw
          : null;
    const newValue =
      typeof newRaw === "number"
        ? String(newRaw)
        : typeof newRaw === "string"
          ? newRaw
          : null;

    if (oldValue !== newValue) {
      changes.push({ fieldKey, oldValue, newValue });
    }
  });

  return changes;
};

const toCompanyProductCreateData = (
  profileId: number,
  payload: CompanyProductInput
): Prisma.CompanyProductUncheckedCreateInput => {
  const isTariffPositionUnknown = payload.isTariffPositionUnknown === true;
  const normalizedTariff = normalizeTariffPosition(payload.tariffPosition);

  return {
    profileId,
    name: trimToUndefined(payload.name) ?? "",
    description: trimToNullable(payload.description),
    imageUrl: normalizeImageUrl(payload.imageUrl),
    tariffPosition: isTariffPositionUnknown ? null : normalizedTariff,
    isTariffPositionUnknown,
    isAccepted: null,
    rejectionMessage: null,
    reviewedAt: null,
    reviewedBy: null
  };
};

const toCompanyProductUpdateData = (
  payload: CompanyProductPatch,
  options?: { resetReviewDecision?: boolean }
): Prisma.CompanyProductUpdateInput => {
  const data: Prisma.CompanyProductUpdateInput = {};

  if ("name" in payload) {
    const nextName = trimToUndefined(payload.name);
    if (nextName) {
      data.name = nextName;
    }
  }

  if ("description" in payload) {
    data.description = trimToNullable(payload.description);
  }

  if ("imageUrl" in payload) {
    data.imageUrl = normalizeImageUrl(payload.imageUrl);
  }

  if ("isTariffPositionUnknown" in payload && typeof payload.isTariffPositionUnknown === "boolean") {
    data.isTariffPositionUnknown = payload.isTariffPositionUnknown;
    if (payload.isTariffPositionUnknown) {
      data.tariffPosition = null;
    }
  }

  if ("tariffPosition" in payload) {
    const normalizedTariff = normalizeTariffPosition(payload.tariffPosition);
    data.tariffPosition = normalizedTariff;
    if (normalizedTariff) {
      data.isTariffPositionUnknown = false;
    }
  }

  if (options?.resetReviewDecision) {
    data.isAccepted = null;
    data.rejectionMessage = null;
    data.reviewedAt = null;
    data.reviewedBy = null;
  }

  return data;
};

const findProfileByCompanyActor = async (
  userId: number,
  email: string
): Promise<ProfileWithRelations | null> => {
  const owned = await prisma.companyProfile.findFirst({
    where: { ownerUserId: userId },
    include: includeProfileRelations
  });

  if (owned) {
    return owned;
  }

  const byEmail = await prisma.companyProfile.findFirst({
    where: {
      contactEmail: {
        equals: email,
        mode: "insensitive"
      }
    },
    include: includeProfileRelations
  });

  if (!byEmail) {
    return null;
  }
  if (byEmail.ownerUserId && byEmail.ownerUserId !== userId) {
    return null;
  }

  if (!byEmail.ownerUserId) {
    const claimed = await prisma.companyProfile.update({
      where: { id: byEmail.id },
      data: { ownerUserId: userId },
      include: includeProfileRelations
    });

    return claimed;
  }

  return byEmail;
};

const includeProfileRelations = {
  visibilityRules: true,
  products: {
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }]
  }
} satisfies Prisma.CompanyProfileInclude;

export const isProfileFieldKey = (value: unknown): value is ProfileFieldKey => {
  return (
    typeof value === "string" &&
    (profileFieldKeys as readonly string[]).includes(value)
  );
};

export const syncProfileFromApprovedApplicationTx = async (
  db: ProfilePrismaClient,
  application: DbCompanyApplication,
  actor?: ProfileAuditActor
): Promise<void> => {
  const parsedMessage = parseApplicationMessage(application.message);

  const ownerUser = await db.appUser.findFirst({
    where: {
      email: {
        equals: application.email,
        mode: "insensitive"
      },
      role: PrismaUserRole.empresa
    },
    select: { id: true }
  });

  const baseData: Prisma.CompanyProfileUncheckedCreateInput = {
    applicationId: application.id,
    ownerUserId: ownerUser?.id ?? null,
    slug: await generateUniqueSlug(db, application.companyName),
    companyName: application.companyName,
    contactName: application.contactName,
    contactEmail: application.email,
    phone: trimToNullable(application.phone),
    taxId: trimToNullable(application.taxId),
    description: trimToNullable(parsedMessage.description),
    sector: trimToNullable(parsedMessage.sector),
    product: trimToNullable(parsedMessage.product),
    keywords: trimToNullable(parsedMessage.keywords),
    tariffPosition: trimToNullable(parsedMessage.tariffPosition),
    exportDestinations: trimToNullable(parsedMessage.exportDestinations),
    awards: trimToNullable(parsedMessage.awards),
    certifications: trimToNullable(parsedMessage.certifications),
    website: trimToNullable(parsedMessage.links?.website),
    facebook: trimToNullable(parsedMessage.links?.facebook),
    instagram: trimToNullable(parsedMessage.links?.instagram),
    linkedin: trimToNullable(parsedMessage.links?.linkedin),
    youtube: trimToNullable(parsedMessage.links?.youtube),
    otherLink: trimToNullable(parsedMessage.links?.other),
    address: trimToNullable(parsedMessage.address),
    city: trimToNullable(parsedMessage.city),
    googleMapsEmbed: trimToNullable(parsedMessage.googleMapsEmbed),
    latitude: asNumberOrNull(parsedMessage.geo?.latitude),
    longitude: asNumberOrNull(parsedMessage.geo?.longitude),
    editMode: PrismaProfileEditMode.mixed,
    isPublished: false
  };

  const existing = await db.companyProfile.findUnique({
    where: { applicationId: application.id },
    include: includeProfileRelations
  });

  if (existing) {
    const nextData: Prisma.CompanyProfileUncheckedUpdateInput = {
      ownerUserId: existing.ownerUserId ?? ownerUser?.id ?? null,
      companyName: baseData.companyName,
      contactName: baseData.contactName,
      contactEmail: baseData.contactEmail,
      phone: baseData.phone,
      taxId: baseData.taxId
    };

    const updated = await db.companyProfile.update({
      where: { id: existing.id },
      data: nextData
    });

    await createAuditLog(db, existing.id, actor, {
      action: "profile_synced_from_application",
      metadata: {
        applicationId: application.id,
        profileId: updated.id
      }
    });

    return;
  }

  const created = await db.companyProfile.create({
    data: baseData
  });

  await db.companyProfileVisibility.createMany({
    data: defaultVisibilityCreateRows(created.id)
  });

  await createAuditLog(db, created.id, actor, {
    action: "profile_created_from_application",
    metadata: {
      applicationId: application.id,
      profileId: created.id
    }
  });
};

export const listAdminProfiles = async (
  query?: string
): Promise<CompanyProfileAdminView[]> => {
  const rows = await prisma.companyProfile.findMany({
    where: query
      ? {
          OR: [
            { companyName: { contains: query, mode: "insensitive" } },
            { sector: { contains: query, mode: "insensitive" } },
            { product: { contains: query, mode: "insensitive" } }
          ]
        }
      : undefined,
    include: includeProfileRelations,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }]
  });

  return rows.map((row) => toAdminView(row, buildVisibilityMap(row.visibilityRules)));
};

export const getAdminProfileById = async (
  id: number
): Promise<CompanyProfileAdminView | null> => {
  const row = await prisma.companyProfile.findUnique({
    where: { id },
    include: includeProfileRelations
  });

  if (!row) {
    return null;
  }

  return toAdminView(row, buildVisibilityMap(row.visibilityRules));
};

export const updateAdminProfileData = async (
  id: number,
  patch: CompanyProfileDataPatch,
  actor?: ProfileAuditActor
): Promise<CompanyProfileAdminView | null> => {
  return prisma.$transaction(async (db) => {
    const current = await db.companyProfile.findUnique({
      where: { id },
      include: includeProfileRelations
    });

    if (!current) {
      return null;
    }

    const data = parseDataPatch(patch);
    const changes = compareFieldValues(current, data);

    if ("companyName" in data && typeof data.companyName === "string") {
      data.slug = await generateUniqueSlug(db, data.companyName, current.id);
    }

    const updated = await db.companyProfile.update({
      where: { id },
      data,
      include: includeProfileRelations
    });

    for (const change of changes) {
      await createAuditLog(db, updated.id, actor, {
        action: "admin_profile_field_updated",
        fieldKey: change.fieldKey,
        oldValue: change.oldValue,
        newValue: change.newValue
      });
    }

    return toAdminView(updated, buildVisibilityMap(updated.visibilityRules));
  });
};

export const createAdminProfileProduct = async (
  profileId: number,
  payload: CompanyProductInput,
  actor?: ProfileAuditActor
): Promise<CompanyProductView | null> => {
  return prisma.$transaction(async (db) => {
    const profile = await db.companyProfile.findUnique({
      where: { id: profileId },
      select: { id: true }
    });

    if (!profile) {
      return null;
    }

    const created = await db.companyProduct.create({
      data: toCompanyProductCreateData(profileId, payload)
    });

    await createAuditLog(db, profileId, actor, {
      action: "admin_profile_product_created",
      fieldKey: "product",
      newValue: created.name,
      metadata: {
        productId: created.id,
        tariffPosition: created.tariffPosition,
        isTariffPositionUnknown: created.isTariffPositionUnknown
      }
    });

    return toProductView(created);
  });
};

export const updateAdminProfileProduct = async (
  profileId: number,
  productId: number,
  payload: CompanyProductPatch,
  actor?: ProfileAuditActor
): Promise<CompanyProductView | null> => {
  return prisma.$transaction(async (db) => {
    const product = await db.companyProduct.findFirst({
      where: { id: productId, profileId }
    });

    if (!product) {
      return null;
    }

    const data = toCompanyProductUpdateData(payload);
    const hasChanges = Object.keys(data).length > 0;
    if (!hasChanges) {
      return toProductView(product);
    }

    const updated = await db.companyProduct.update({
      where: { id: productId },
      data
    });

    await createAuditLog(db, profileId, actor, {
      action: "admin_profile_product_updated",
      fieldKey: "product",
      oldValue: product.name,
      newValue: updated.name,
      metadata: {
        productId: updated.id,
        previousTariffPosition: product.tariffPosition,
        nextTariffPosition: updated.tariffPosition,
        previousIsTariffPositionUnknown: product.isTariffPositionUnknown,
        nextIsTariffPositionUnknown: updated.isTariffPositionUnknown
      }
    });

    return toProductView(updated);
  });
};

export const reviewAdminProfileProduct = async (
  profileId: number,
  productId: number,
  patch: CompanyProductReviewPatch,
  actor?: ProfileAuditActor
): Promise<CompanyProductView | null> => {
  return prisma.$transaction(async (db) => {
    const profile = await db.companyProfile.findUnique({
      where: { id: profileId },
      select: {
        id: true,
        companyName: true,
        contactName: true,
        contactEmail: true
      }
    });

    if (!profile) {
      return null;
    }
    const product = await db.companyProduct.findFirst({
      where: { id: productId, profileId }
    });

    if (!product) {
      return null;
    }

    const rejectionMessage = patch.isAccepted ? null : trimToNullable(patch.rejectionMessage);
    const reviewedBy = actor?.email ?? actor?.displayName ?? null;
    const reviewedAt = new Date();

    const updated = await db.companyProduct.update({
      where: { id: productId },
      data: {
        isAccepted: patch.isAccepted,
        rejectionMessage,
        reviewedAt,
        reviewedBy
      }
    });

    const previousDecision =
      typeof product.isAccepted === "boolean"
        ? product.isAccepted
          ? "accepted"
          : "rejected"
        : "pending";
    const nextDecision = patch.isAccepted ? "accepted" : "rejected";

    await createAuditLog(db, profileId, actor, {
      action: patch.isAccepted
        ? "admin_profile_product_accepted"
        : "admin_profile_product_rejected",
      fieldKey: "product",
      oldValue: `${product.name} (${previousDecision})`,
      newValue: `${updated.name} (${nextDecision})`,
      metadata: {
        productId: updated.id,
        isAccepted: patch.isAccepted,
        rejectionMessage: rejectionMessage
      }
    });

    const recipientEmail = trimToUndefined(profile.contactEmail);
    if (recipientEmail) {
      await prepareProductReviewStatusChangedEmailTx(db, {
        profileId: profile.id,
        companyName: profile.companyName,
        contactName: trimToUndefined(profile.contactName) ?? profile.companyName,
        recipientEmail,
        productId: updated.id,
        productName: updated.name,
        isAccepted: patch.isAccepted,
        rejectionMessage
      });
    }

    return toProductView(updated);
  });
};

export const deleteAdminProfileProduct = async (
  profileId: number,
  productId: number,
  actor?: ProfileAuditActor
): Promise<boolean> => {
  return prisma.$transaction(async (db) => {
    const product = await db.companyProduct.findFirst({
      where: { id: productId, profileId }
    });

    if (!product) {
      return false;
    }

    await db.companyProduct.delete({
      where: { id: product.id }
    });

    await createAuditLog(db, profileId, actor, {
      action: "admin_profile_product_deleted",
      fieldKey: "product",
      oldValue: product.name,
      metadata: {
        productId: product.id,
        tariffPosition: product.tariffPosition,
        isTariffPositionUnknown: product.isTariffPositionUnknown
      }
    });

    return true;
  });
};

export const updateAdminProfileSettings = async (
  id: number,
  patch: CompanyProfileSettingsPatch,
  actor?: ProfileAuditActor
): Promise<CompanyProfileAdminView | null> => {
  return prisma.$transaction(async (db) => {
    const current = await db.companyProfile.findUnique({
      where: { id },
      include: includeProfileRelations
    });

    if (!current) {
      return null;
    }

    const data: Prisma.CompanyProfileUpdateInput = {};

    if (patch.editMode) {
      data.editMode = toPrismaEditMode(patch.editMode);
    }
    if (typeof patch.isPublished === "boolean") {
      data.isPublished = patch.isPublished;
    }

    const updated = await db.companyProfile.update({
      where: { id },
      data,
      include: includeProfileRelations
    });

    if (patch.editMode && patch.editMode !== toApiEditMode(current.editMode)) {
      await createAuditLog(db, id, actor, {
        action: "admin_profile_edit_mode_changed",
        fieldKey: "editMode",
        oldValue: toApiEditMode(current.editMode),
        newValue: patch.editMode
      });
    }

    if (
      typeof patch.isPublished === "boolean" &&
      patch.isPublished !== current.isPublished
    ) {
      await createAuditLog(db, id, actor, {
        action: "admin_profile_publish_state_changed",
        fieldKey: "isPublished",
        oldValue: String(current.isPublished),
        newValue: String(patch.isPublished)
      });
    }

    return toAdminView(updated, buildVisibilityMap(updated.visibilityRules));
  });
};

export const updateAdminProfileVisibility = async (
  id: number,
  patch: CompanyProfileVisibilityPatch,
  actor?: ProfileAuditActor
): Promise<CompanyProfileAdminView | null> => {
  return prisma.$transaction(async (db) => {
    const current = await db.companyProfile.findUnique({
      where: { id },
      include: includeProfileRelations
    });

    if (!current) {
      return null;
    }

    const previousVisibility = buildVisibilityMap(current.visibilityRules)[patch.fieldKey];

    await db.companyProfileVisibility.upsert({
      where: {
        profileId_fieldKey: {
          profileId: id,
          fieldKey: patch.fieldKey
        }
      },
      update: {
        isVisible: patch.isVisible,
        updatedBy: actor?.displayName ?? actor?.email ?? null
      },
      create: {
        profileId: id,
        fieldKey: patch.fieldKey,
        isVisible: patch.isVisible,
        updatedBy: actor?.displayName ?? actor?.email ?? null
      }
    });

    if (previousVisibility !== patch.isVisible) {
      await createAuditLog(db, id, actor, {
        action: "admin_profile_visibility_changed",
        fieldKey: patch.fieldKey,
        oldValue: String(previousVisibility),
        newValue: String(patch.isVisible)
      });
    }

    const updated = await db.companyProfile.findUnique({
      where: { id },
      include: includeProfileRelations
    });

    if (!updated) {
      return null;
    }

    return toAdminView(updated, buildVisibilityMap(updated.visibilityRules));
  });
};

export const listProfileAuditLogs = async (
  profileId: number,
  limit = 100
): Promise<CompanyProfileAuditLogView[]> => {
  const rows: DbCompanyProfileAuditLog[] = await prisma.companyProfileAuditLog.findMany({
    where: { profileId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: Math.max(1, Math.min(500, limit))
  });

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    fieldKey: row.fieldKey ?? undefined,
    oldValue: row.oldValue ?? undefined,
    newValue: row.newValue ?? undefined,
    actorEmail: row.actorEmail ?? undefined,
    actorRole: row.actorRole ?? undefined,
    createdAt: row.createdAt.toISOString()
  }));
};

export const getCompanyOwnProfile = async (
  userId: number,
  email: string
): Promise<CompanyOwnProfileView | null> => {
  const row = await findProfileByCompanyActor(userId, email);
  if (!row) {
    return null;
  }

  const visibility = buildVisibilityMap(row.visibilityRules);

  return {
    ...toAdminView(row, visibility),
    canCompanyEdit: row.editMode !== PrismaProfileEditMode.agency
  };
};

export const updateCompanyOwnProfile = async (
  userId: number,
  email: string,
  patch: CompanyProfileDataPatch,
  actor?: ProfileAuditActor
): Promise<
  | { status: "not_found" }
  | { status: "forbidden" }
  | { status: "ok"; profile: CompanyOwnProfileView }
> => {
  const current = await findProfileByCompanyActor(userId, email);

  if (!current) {
    return { status: "not_found" };
  }

  if (current.editMode === PrismaProfileEditMode.agency) {
    return { status: "forbidden" };
  }

  const updated = await prisma.$transaction(async (db) => {
    const data = parseDataPatch(patch);
    const changes = compareFieldValues(current, data);

    if ("companyName" in data && typeof data.companyName === "string") {
      data.slug = await generateUniqueSlug(db, data.companyName, current.id);
    }

    const saved = await db.companyProfile.update({
      where: { id: current.id },
      data,
      include: includeProfileRelations
    });

    for (const change of changes) {
      await createAuditLog(db, saved.id, actor, {
        action: "company_profile_field_updated",
        fieldKey: change.fieldKey,
        oldValue: change.oldValue,
        newValue: change.newValue
      });
    }

    return saved;
  });

  const visibility = buildVisibilityMap(updated.visibilityRules);

  return {
    status: "ok",
    profile: {
      ...toAdminView(updated, visibility),
      canCompanyEdit: updated.editMode !== PrismaProfileEditMode.agency
    }
  };
};

export const createCompanyOwnProduct = async (
  userId: number,
  email: string,
  payload: CompanyProductInput,
  actor?: ProfileAuditActor
): Promise<
  | { status: "not_found" }
  | { status: "forbidden" }
  | { status: "ok"; product: CompanyProductView }
> => {
  const profile = await findProfileByCompanyActor(userId, email);

  if (!profile) {
    return { status: "not_found" };
  }

  if (profile.editMode === PrismaProfileEditMode.agency) {
    return { status: "forbidden" };
  }

  const created = await prisma.$transaction(async (db) => {
    const product = await db.companyProduct.create({
      data: toCompanyProductCreateData(profile.id, payload)
    });

    await createAuditLog(db, profile.id, actor, {
      action: "company_profile_product_created",
      fieldKey: "product",
      newValue: product.name,
      metadata: {
        productId: product.id,
        tariffPosition: product.tariffPosition,
        isTariffPositionUnknown: product.isTariffPositionUnknown
      }
    });

    return product;
  });

  return {
    status: "ok",
    product: toProductView(created)
  };
};

export const updateCompanyOwnProduct = async (
  userId: number,
  email: string,
  productId: number,
  payload: CompanyProductPatch,
  actor?: ProfileAuditActor
): Promise<
  | { status: "not_found" }
  | { status: "forbidden" }
  | { status: "product_not_found" }
  | { status: "ok"; product: CompanyProductView }
> => {
  const profile = await findProfileByCompanyActor(userId, email);

  if (!profile) {
    return { status: "not_found" };
  }

  if (profile.editMode === PrismaProfileEditMode.agency) {
    return { status: "forbidden" };
  }

  const updated = await prisma.$transaction(async (db) => {
    const product = await db.companyProduct.findFirst({
      where: {
        id: productId,
        profileId: profile.id
      }
    });

    if (!product) {
      return null;
    }

    const data = toCompanyProductUpdateData(payload, { resetReviewDecision: true });
    const hasChanges = Object.keys(data).length > 0;
    if (!hasChanges) {
      return product;
    }

    const saved = await db.companyProduct.update({
      where: { id: product.id },
      data
    });

    await createAuditLog(db, profile.id, actor, {
      action: "company_profile_product_updated",
      fieldKey: "product",
      oldValue: product.name,
      newValue: saved.name,
      metadata: {
        productId: saved.id,
        previousTariffPosition: product.tariffPosition,
        nextTariffPosition: saved.tariffPosition,
        previousIsTariffPositionUnknown: product.isTariffPositionUnknown,
        nextIsTariffPositionUnknown: saved.isTariffPositionUnknown
      }
    });

    return saved;
  });

  if (!updated) {
    return { status: "product_not_found" };
  }

  return {
    status: "ok",
    product: toProductView(updated)
  };
};

export const deleteCompanyOwnProduct = async (
  userId: number,
  email: string,
  productId: number,
  actor?: ProfileAuditActor
): Promise<
  | { status: "not_found" }
  | { status: "forbidden" }
  | { status: "product_not_found" }
  | { status: "ok" }
> => {
  const profile = await findProfileByCompanyActor(userId, email);

  if (!profile) {
    return { status: "not_found" };
  }

  if (profile.editMode === PrismaProfileEditMode.agency) {
    return { status: "forbidden" };
  }

  const deleted = await prisma.$transaction(async (db) => {
    const product = await db.companyProduct.findFirst({
      where: {
        id: productId,
        profileId: profile.id
      }
    });

    if (!product) {
      return null;
    }

    await db.companyProduct.delete({
      where: { id: product.id }
    });

    await createAuditLog(db, profile.id, actor, {
      action: "company_profile_product_deleted",
      fieldKey: "product",
      oldValue: product.name,
      metadata: {
        productId: product.id,
        tariffPosition: product.tariffPosition,
        isTariffPositionUnknown: product.isTariffPositionUnknown
      }
    });

    return product.id;
  });

  if (!deleted) {
    return { status: "product_not_found" };
  }

  return { status: "ok" };
};

export const listPublicProfiles = async (query?: string): Promise<PublicCompanyProfileView[]> => {
  const rows = await prisma.companyProfile.findMany({
    where: {
      isPublished: true,
      ...(query
        ? {
            OR: [
              { companyName: { contains: query, mode: "insensitive" } },
              { sector: { contains: query, mode: "insensitive" } },
              { product: { contains: query, mode: "insensitive" } },
              { keywords: { contains: query, mode: "insensitive" } }
            ]
          }
        : {})
    },
    include: includeProfileRelations,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }]
  });

  return rows.map((row) => toPublicView(row, buildVisibilityMap(row.visibilityRules)));
};

export const getPublicProfileById = async (
  id: number
): Promise<PublicCompanyProfileView | null> => {
  const row = await prisma.companyProfile.findFirst({
    where: {
      id,
      isPublished: true
    },
    include: includeProfileRelations
  });

  if (!row) {
    return null;
  }

  return toPublicView(row, buildVisibilityMap(row.visibilityRules));
};
