export type ApplicationStatus = "pending" | "approved" | "rejected";

export type StatusFilter = ApplicationStatus | "all";

export type CompanyApplication = {
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
};
