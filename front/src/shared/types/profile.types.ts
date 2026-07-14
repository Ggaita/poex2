export type ProfileEditMode = "agency" | "company" | "mixed";

export type ProfileFieldKey =
  | "companyName"
  | "contactName"
  | "contactEmail"
  | "phone"
  | "taxId"
  | "description"
  | "sector"
  | "subSector"
  | "product"
  | "keywords"
  | "tariffPosition"
  | "exportDestinations"
  | "awards"
  | "certifications"
  | "website"
  | "facebook"
  | "instagram"
  | "linkedin"
  | "youtube"
  | "otherLink"
  | "address"
  | "city"
  | "googleMapsEmbed"
  | "latitude"
  | "longitude";

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

export interface CompanyOwnProfile extends CompanyProfileAdminView {
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
  actorRole?: "admin" | "empresa";
  createdAt: string;
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
