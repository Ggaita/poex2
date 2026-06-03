export type {
  CompanyProfileAdminView,
  CompanyProfileAuditLogView,
  ProfileEditMode,
  ProfileFieldKey
} from "../../shared/types/profile.types";

export interface AdminProfileFormState {
  companyName: string;
  contactName: string;
  contactEmail: string;
  phone: string;
  taxId: string;
  description: string;
  sector: string;
  subSector: string;
  product: string;
  keywords: string;
  tariffPosition: string;
  exportDestinations: string;
  awards: string;
  certifications: string;
  website: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  youtube: string;
  otherLink: string;
  address: string;
  city: string;
  googleMapsEmbed: string;
  latitude: string;
  longitude: string;
}
