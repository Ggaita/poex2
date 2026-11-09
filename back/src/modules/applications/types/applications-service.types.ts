import type { CompanyApplication } from "../../../types/application.types";

export type CreateApplicationError = "duplicate_email" | "duplicate_tax_id";
export type UpdateStatusError = "not_found" | "already_reviewed";

export type CreateApplicationResult =
  | { application: CompanyApplication; error?: never }
  | { application?: never; error: CreateApplicationError };

export type ApprovedApplicationAccessPayload = {
  loginEmail: string;
  /** Clave en texto plano solo si el sistema la generó en esta aprobación. */
  temporaryPassword?: string;
  passwordWasChosenByApplicant: boolean;
};

export type UpdateStatusResult =
  | {
      application: CompanyApplication;
      access?: ApprovedApplicationAccessPayload;
      error?: never;
    }
  | { application?: never; error: UpdateStatusError };
