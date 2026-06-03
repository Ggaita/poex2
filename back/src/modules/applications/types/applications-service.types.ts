import type { CompanyApplication } from "../../../types/application.types";

export type CreateApplicationError = "duplicate_email" | "duplicate_tax_id";
export type UpdateStatusError = "not_found" | "already_reviewed";

export type CreateApplicationResult =
  | { application: CompanyApplication; error?: never }
  | { application?: never; error: CreateApplicationError };

export type UpdateStatusResult =
  | { application: CompanyApplication; error?: never }
  | { application?: never; error: UpdateStatusError };
