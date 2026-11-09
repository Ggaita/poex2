export type YesNo = "" | "si" | "no";

export type RegisterFormState = {
  companyName: string;
  contactEmail: string;
  phone: string;
  taxId: string;
  address: string;
  city: string;
  latitude: string;
  longitude: string;
  description: string;
  representativeName: string;
  representativeRole: string;
  representativeEmail: string;
  sector: string;
  chamberMembership: YesNo;
  chamberNames: string;
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
  hasCatalog: YesNo;
  hasProductPhotos: YesNo;
  hasCompanyPhotos: YesNo;
  /** Clave deseada para el panel empresa (opcional: si vacía, el sistema genera una al aprobar). */
  accessPassword: string;
  accessPasswordConfirm: string;
};

export type CatalogItem = {
  id: string;
  title: string;
  file: File | null;
};

export type ProductPhotoItem = {
  id: string;
  description: string;
  file: File | null;
};

export type CompanyPhotoItem = {
  id: string;
  file: File | null;
};
