import type { UserRole as PrismaUserRole } from "@prisma/client";

export type ProfileEditMode = "agency" | "company" | "mixed";

export const profileFieldKeys = [
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
  "logoUrl",
  "website",
  "facebook",
  "instagram",
  "linkedin",
  "youtube",
  "otherLink",
  "address",
  "city",
  "googleMapsEmbed",
  "latitude",
  "longitude"
] as const;

export type ProfileFieldKey = (typeof profileFieldKeys)[number];

export interface ProfileAuditActor {
  userId?: number;
  email?: string;
  role?: PrismaUserRole;
  displayName?: string;
}

export interface CreateAdminCompanyProfileInput {
  companyName: string;
  contactName: string;
  contactEmail: string;
  phone?: string | null;
  taxId?: string | null;
  description?: string | null;
  sector?: string | null;
  subSector?: string | null;
  product?: string | null;
  keywords?: string | null;
  tariffPosition?: string | null;
  exportDestinations?: string | null;
  awards?: string | null;
  certifications?: string | null;
  logoUrl?: string | null;
  website?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  youtube?: string | null;
  otherLink?: string | null;
  address?: string | null;
  city?: string | null;
  googleMapsEmbed?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  editMode?: ProfileEditMode;
  isPublished?: boolean;
}

export interface CompanyProfileDataPatch {
  companyName?: string;
  contactName?: string;
  contactEmail?: string;
  phone?: string | null;
  taxId?: string | null;
  description?: string | null;
  sector?: string | null;
  subSector?: string | null;
  product?: string | null;
  keywords?: string | null;
  tariffPosition?: string | null;
  exportDestinations?: string | null;
  awards?: string | null;
  certifications?: string | null;
  logoUrl?: string | null;
  website?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  youtube?: string | null;
  otherLink?: string | null;
  address?: string | null;
  city?: string | null;
  googleMapsEmbed?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface CompanyProfileSettingsPatch {
  editMode?: ProfileEditMode;
  isPublished?: boolean;
}

export interface CompanyProfileVisibilityPatch {
  fieldKey: ProfileFieldKey;
  isVisible: boolean;
}

export type CompanyProfileVisibilityBulkPatch = Partial<
  Record<ProfileFieldKey, boolean>
>;

export interface CompanyProductInput {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  tariffPosition?: string | null;
  isTariffPositionUnknown?: boolean;
}

export interface CompanyProductPatch {
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  tariffPosition?: string | null;
  isTariffPositionUnknown?: boolean;
}
export interface CompanyProductReviewPatch {
  isAccepted: boolean;
  rejectionMessage?: string | null;
}

export interface CompanyProductView {
  id: number;
  profileId: number;
  name: string;
  description?: string;
  imageUrl?: string;
  tariffPosition?: string;
  isTariffPositionUnknown: boolean;
  isAccepted: boolean | null;
  rejectionMessage?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyProfileAdminView {
  id: number;
  applicationId?: number;
  ownerUserId?: number;
  slug: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  phone?: string;
  taxId?: string;
  description?: string;
  sector?: string;
  subSector?: string;
  product?: string;
  keywords?: string;
  tariffPosition?: string;
  exportDestinations?: string;
  awards?: string;
  certifications?: string;
  logoUrl?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  otherLink?: string;
  address?: string;
  city?: string;
  googleMapsEmbed?: string;
  latitude?: number;
  longitude?: number;
  editMode: ProfileEditMode;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  visibility: Record<ProfileFieldKey, boolean>;
  products: CompanyProductView[];
}

export interface CompanyOwnProfileView extends CompanyProfileAdminView {
  canCompanyEdit: boolean;
}

export interface PublicCompanyProfileView {
  id: number;
  slug: string;
  companyName?: string;
  description?: string;
  sector?: string;
  subSector?: string;
  product?: string;
  keywords?: string;
  tariffPosition?: string;
  exportDestinations?: string;
  awards?: string;
  certifications?: string;
  logoUrl?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  otherLink?: string;
  address?: string;
  city?: string;
  googleMapsEmbed?: string;
  latitude?: number;
  longitude?: number;
  contactName?: string;
  contactEmail?: string;
  phone?: string;
  taxId?: string;
}

export interface CompanyProfileAuditLogView {
  id: number;
  action: string;
  fieldKey?: string;
  oldValue?: string;
  newValue?: string;
  actorEmail?: string;
  actorRole?: PrismaUserRole;
  createdAt: string;
}
