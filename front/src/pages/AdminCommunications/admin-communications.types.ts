export type EmailTemplateKey =
  | "application_received"
  | "application_approved"
  | "product_review_status_changed"
  | "general_information";

export type NotificationTargetMode = "all" | "group" | "selected";

export interface EmailTemplateView {
  key: EmailTemplateKey;
  name: string;
  description?: string;
  subjectTemplate: string;
  bodyTemplate: string;
  isActive: boolean;
  variables: string[];
  updatedAt: string;
}

export interface RecipientCompanyOption {
  profileId: number;
  companyName: string;
  contactName?: string;
  contactEmail: string;
  sector?: string;
  city?: string;
}

export interface RecipientGroupOption {
  value: string;
  label: string;
  count: number;
}

export interface CommunicationRecipientsCatalog {
  recipients: RecipientCompanyOption[];
  groups: RecipientGroupOption[];
}

export interface ManualNotificationInput {
  templateKey: EmailTemplateKey;
  targetMode: NotificationTargetMode;
  groupBy?: "sector";
  groupValues?: string[];
  profileIds?: number[];
  messageTitle?: string;
  messageBody?: string;
}

export interface ManualNotificationResult {
  createdCount: number;
  recipients: RecipientCompanyOption[];
}

export type EmailOutboxStatus = "prepared" | "sent" | "failed" | "cancelled";

export interface EmailOutboxEntryView {
  id: number;
  templateKey?: EmailTemplateKey;
  triggerEvent: string;
  recipientEmail: string;
  recipientName?: string;
  recipientProfileId?: number;
  subject: string;
  body: string;
  status: EmailOutboxStatus;
  createdAt: string;
  sentAt?: string;
  errorMessage?: string;
}
