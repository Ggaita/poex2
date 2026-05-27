export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface CompanyApplication {
  id: number;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  taxId?: string;
  message?: string;
  status: ApplicationStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface CreateCompanyApplicationInput {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  taxId?: string;
  message?: string;
}

export interface UpdateApplicationStatusInput {
  status: Exclude<ApplicationStatus, "pending">;
  reviewedBy: string;
  rejectionReason?: string;
}
