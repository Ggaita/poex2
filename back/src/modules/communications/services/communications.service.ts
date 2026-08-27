import {
  EmailOutboxStatus as PrismaEmailOutboxStatus,
  type Prisma
} from "@prisma/client";
import prisma from "../../../lib/prisma";
import { sendMail } from "../../../lib/mailer";
import type {
  CommunicationRecipientsCatalog,
  EmailOutboxEntryView,
  EmailTemplateKey,
  EmailTemplatePatch,
  EmailTemplateView,
  InfoRequestReplyInput,
  InfoRequestReplyResult,
  ManualNotificationInput,
  ManualNotificationResult,
  RecipientCompanyOption
} from "../types/communications.types";
import { emailTemplateKeys } from "../types/communications.types";

type CommunicationsPrismaClient = Prisma.TransactionClient | typeof prisma;

type TemplateDefinition = {
  key: EmailTemplateKey;
  name: string;
  description: string;
  defaultSubjectTemplate: string;
  defaultBodyTemplate: string;
  variables: string[];
};

const templateDefinitionsByKey: Record<EmailTemplateKey, TemplateDefinition> = {
  application_received: {
    key: "application_received",
    name: "Alta de empresa recibida",
    description:
      "Mensaje automático al recibir una solicitud de alta de empresa.",
    defaultSubjectTemplate: "Recibimos la solicitud de alta de {{companyName}}",
    defaultBodyTemplate:
      "Hola {{contactName}},\n\nRecibimos correctamente la solicitud de alta de {{companyName}} en POEX.\nTe avisaremos cuando sea evaluada.\n\nSaludos,\nEquipo POEX",
    variables: ["companyName", "contactName"]
  },
  application_approved: {
    key: "application_approved",
    name: "Solicitud de empresa aprobada",
    description:
      "Mensaje automático cuando una solicitud de alta queda aprobada.",
    defaultSubjectTemplate: "Tu solicitud de {{companyName}} fue aprobada",
    defaultBodyTemplate:
      "Hola {{contactName}},\n\nTu solicitud de alta de {{companyName}} fue aprobada.\nYa podés ingresar al panel de empresa para completar y mantener tu perfil.\n\nSaludos,\nEquipo POEX",
    variables: ["companyName", "contactName"]
  },
  product_review_status_changed: {
    key: "product_review_status_changed",
    name: "Revisión de producto actualizada",
    description:
      "Mensaje automático cuando el admin acepta o no acepta un producto cargado por la empresa.",
    defaultSubjectTemplate:
      "Revisión de producto: {{productName}} ({{reviewStatus}})",
    defaultBodyTemplate:
      "Hola {{contactName}},\n\nSe actualizó la revisión del producto \"{{productName}}\" de {{companyName}}.\nEstado: {{reviewStatus}}.\n{{rejectionMessage}}\n\nSaludos,\nEquipo POEX",
    variables: [
      "companyName",
      "contactName",
      "productName",
      "reviewStatus",
      "rejectionMessage"
    ]
  },
general_information: {
    key: "general_information",
    name: "Notificación general a empresas",
    description:
      "Plantilla para comunicaciones informativas segmentadas por empresa, grupo o todas.",
    defaultSubjectTemplate: "{{messageTitle}}",
    defaultBodyTemplate:
      "Hola {{contactName}},\n\n{{messageBody}}\n\nSaludos,\nEquipo POEX",
    variables: ["companyName", "contactName", "messageTitle", "messageBody"]
  },
info_request_response: {
    key: "info_request_response",
    name: "Respuesta a solicitud de información",
    description:
      "Respuesta del administrador a una solicitud de información de empresa/producto.",
    defaultSubjectTemplate: "{{messageTitle}}",
    defaultBodyTemplate:
      "Hola {{contactName}},\n\nGracias por tu consulta{{companySuffix}}.\n\n{{messageBody}}\n\nSaludos,\nEquipo de la Agencia",
    variables: ["contactName", "companyName", "companySuffix", "messageTitle", "messageBody", "productName"]
  },
  admin_new_info_request: {
    key: "admin_new_info_request",
    name: "Aviso admin: nueva solicitud de información",
    description: "Notificación interna al equipo cuando ingresa una solicitud de información.",
    defaultSubjectTemplate: "Nueva solicitud de información #{{requestId}}",
    defaultBodyTemplate:
      "Ingresó una nueva solicitud de información.\n\nID: {{requestId}}\nTipo: {{requestKind}}\nSolicitante: {{requesterName}}\nEmail: {{requesterEmail}}\nTeléfono/WhatsApp: {{requesterPhone}}\nEmpresa del solicitante: {{requesterCompany}}\nEmpresa consultada: {{companyName}}\nProducto: {{productName}}\nDetalle: {{details}}\n\nRevisala en el panel admin: {{adminUrl}}",
    variables: [
      "requestId",
      "requestKind",
      "requesterName",
      "requesterEmail",
      "requesterPhone",
      "requesterCompany",
      "companyName",
      "productName",
      "details",
      "adminUrl"
    ]
  },
  admin_new_application: {
    key: "admin_new_application",
    name: "Aviso admin: nueva alta de empresa",
    description: "Notificación interna al equipo cuando ingresa una solicitud de alta.",
    defaultSubjectTemplate: "Nueva solicitud de alta #{{applicationId}} - {{companyName}}",
    defaultBodyTemplate:
      "Ingresó una nueva solicitud de alta de empresa.\n\nID: {{applicationId}}\nEmpresa: {{companyName}}\nContacto: {{contactName}}\nEmail: {{contactEmail}}\nTeléfono: {{phone}}\n\nRevisala en el panel admin: {{adminUrl}}",
    variables: [
      "applicationId",
      "companyName",
      "contactName",
      "contactEmail",
      "phone",
      "adminUrl"
    ]
  }
};

const templateDefinitions = emailTemplateKeys.map(
  (key) => templateDefinitionsByKey[key]
);

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const trimOptional = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : undefined;
};

export const isEmailTemplateKey = (value: unknown): value is EmailTemplateKey => {
  return (
    typeof value === "string" &&
    (emailTemplateKeys as readonly string[]).includes(value)
  );
};

const toTemplateView = (row: {
  key: string;
  name: string;
  description: string | null;
  subjectTemplate: string;
  bodyTemplate: string;
  isActive: boolean;
  updatedAt: Date;
}): EmailTemplateView => {
  const key = isEmailTemplateKey(row.key) ? row.key : "general_information";
  const definition = templateDefinitionsByKey[key];

  return {
    key,
    name: row.name,
    description: row.description ?? definition.description,
    subjectTemplate: row.subjectTemplate,
    bodyTemplate: row.bodyTemplate,
    isActive: row.isActive,
    variables: definition.variables,
    updatedAt: row.updatedAt.toISOString()
  };
};

const toOutboxView = (row: {
  id: number;
  templateKey: string | null;
  triggerEvent: string;
  recipientEmail: string;
  recipientName: string | null;
  recipientProfileId: number | null;
  subject: string;
  body: string;
  status: PrismaEmailOutboxStatus;
  createdAt: Date;
  sentAt: Date | null;
  errorMessage: string | null;
}): EmailOutboxEntryView => {
  return {
    id: row.id,
    templateKey: isEmailTemplateKey(row.templateKey) ? row.templateKey : undefined,
    triggerEvent: row.triggerEvent,
    recipientEmail: row.recipientEmail,
    recipientName: row.recipientName ?? undefined,
    recipientProfileId:
      typeof row.recipientProfileId === "number" ? row.recipientProfileId : undefined,
    subject: row.subject,
    body: row.body,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    sentAt: row.sentAt ? row.sentAt.toISOString() : undefined,
    errorMessage: row.errorMessage ?? undefined
  };
};

const renderTemplate = (template: string, context: Record<string, string>): string => {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_full, token: string) => {
    return context[token] ?? "";
  });
};

const ensureDefaultTemplatesTx = async (
  db: CommunicationsPrismaClient
): Promise<void> => {
  for (const definition of templateDefinitions) {
    await db.emailTemplate.upsert({
      where: { key: definition.key },
      update: {
        name: definition.name,
        description: definition.description
      },
      create: {
        key: definition.key,
        name: definition.name,
        description: definition.description,
        subjectTemplate: definition.defaultSubjectTemplate,
        bodyTemplate: definition.defaultBodyTemplate,
        isActive: true
      }
    });
  }
};

const getRecipientRows = async (
  db: CommunicationsPrismaClient
): Promise<RecipientCompanyOption[]> => {
  const rows = await db.companyProfile.findMany({
    select: {
      id: true,
      companyName: true,
      contactName: true,
      contactEmail: true,
      sector: true,
      city: true
    },
    orderBy: [{ companyName: "asc" }, { id: "asc" }]
  });

  return rows
    .map((row) => ({
      profileId: row.id,
      companyName: row.companyName,
      contactName: trimOptional(row.contactName),
      contactEmail: trimOptional(row.contactEmail) ?? "",
      sector: trimOptional(row.sector),
      city: trimOptional(row.city)
    }))
    .filter((row) => row.contactEmail.length > 0);
};

const dedupeRecipients = (
  rows: RecipientCompanyOption[]
): RecipientCompanyOption[] => {
  const unique = new Map<string, RecipientCompanyOption>();

  rows.forEach((row) => {
    const key = `${row.profileId}:${row.contactEmail.toLowerCase()}`;
    if (!unique.has(key)) {
      unique.set(key, row);
    }
  });

  return Array.from(unique.values());
};

const queueTemplatedEmailTx = async (
  db: CommunicationsPrismaClient,
  input: {
    templateKey: EmailTemplateKey;
    triggerEvent: string;
    recipientEmail: string;
    recipientName?: string;
    recipientProfileId?: number;
    context?: Record<string, string>;
    metadata?: Prisma.InputJsonValue;
    createdByUserId?: number;
  }
): Promise<boolean> => {
  await ensureDefaultTemplatesTx(db);

  const template = await db.emailTemplate.findUnique({
    where: { key: input.templateKey }
  });

  if (!template || !template.isActive) {
    return false;
  }

  const context = Object.fromEntries(
    Object.entries(input.context ?? {}).map(([key, value]) => [
      key,
      typeof value === "string" ? value : ""
    ])
  );

  const subject = renderTemplate(template.subjectTemplate, context).trim();
  const body = renderTemplate(template.bodyTemplate, context).trim();

  if (!subject || !body) {
    return false;
  }

  await db.emailOutbox.create({
    data: {
      templateKey: input.templateKey,
      triggerEvent: input.triggerEvent,
      recipientEmail: input.recipientEmail,
      recipientName: trimOptional(input.recipientName) ?? null,
      recipientProfileId:
        typeof input.recipientProfileId === "number" ? input.recipientProfileId : null,
      subject,
      body,
      status: PrismaEmailOutboxStatus.prepared,
      metadata: input.metadata,
      createdByUserId:
        typeof input.createdByUserId === "number" ? input.createdByUserId : null
    }
  });

  return true;
};

export const listEmailTemplates = async (): Promise<EmailTemplateView[]> => {
  return prisma.$transaction(async (db) => {
    await ensureDefaultTemplatesTx(db);

    const rows = await db.emailTemplate.findMany({
      orderBy: [{ key: "asc" }]
    });

    return rows.map(toTemplateView);
  });
};

export const updateEmailTemplate = async (
  key: EmailTemplateKey,
  patch: EmailTemplatePatch
): Promise<EmailTemplateView | null> => {
  return prisma.$transaction(async (db) => {
    await ensureDefaultTemplatesTx(db);

    const existing = await db.emailTemplate.findUnique({ where: { key } });
    if (!existing) {
      return null;
    }

    const data: Prisma.EmailTemplateUpdateInput = {};
    if ("subjectTemplate" in patch && typeof patch.subjectTemplate === "string") {
      data.subjectTemplate = patch.subjectTemplate.trim();
    }
    if ("bodyTemplate" in patch && typeof patch.bodyTemplate === "string") {
      data.bodyTemplate = patch.bodyTemplate.trim();
    }
    if (typeof patch.isActive === "boolean") {
      data.isActive = patch.isActive;
    }

    const hasChanges = Object.keys(data).length > 0;
    const updated = hasChanges
      ? await db.emailTemplate.update({ where: { key }, data })
      : existing;

    return toTemplateView(updated);
  });
};

export const listCommunicationRecipients =
  async (): Promise<CommunicationRecipientsCatalog> => {
    const recipients = dedupeRecipients(await getRecipientRows(prisma));
    const groupsBySector = new Map<string, number>();

    recipients.forEach((row) => {
      const sector = trimOptional(row.sector);
      if (!sector) {
        return;
      }

      const key = sector.toLowerCase();
      groupsBySector.set(key, (groupsBySector.get(key) ?? 0) + 1);
    });

    const groups = Array.from(groupsBySector.entries())
      .map(([value, count]) => ({
        value,
        label:
          recipients.find(
            (recipient) => recipient.sector?.toLowerCase() === value
          )?.sector ?? value,
        count
      }))
      .sort((left, right) => left.label.localeCompare(right.label, "es"));

    return {
      recipients,
      groups
    };
  };

export const createManualNotifications = async (
  input: ManualNotificationInput,
  actor?: {
    userId?: number;
    email?: string;
    displayName?: string;
  }
): Promise<ManualNotificationResult> => {
  const recipientsCatalog = await listCommunicationRecipients();
  const allRecipients = recipientsCatalog.recipients;
  let targetRecipients: RecipientCompanyOption[] = [];

  if (input.targetMode === "all") {
    targetRecipients = allRecipients;
  } else if (input.targetMode === "selected") {
    const selectedIds = new Set((input.profileIds ?? []).map((id) => Number(id)));
    targetRecipients = allRecipients.filter((row) => selectedIds.has(row.profileId));
  } else {
    const groupValues = new Set(
      (input.groupValues ?? []).map((value) => value.trim().toLowerCase())
    );

    targetRecipients = allRecipients.filter((row) => {
      const sector = row.sector?.trim().toLowerCase();
      return sector ? groupValues.has(sector) : false;
    });
  }

  const dedupedRecipients = dedupeRecipients(targetRecipients);

  if (dedupedRecipients.length === 0) {
    return {
      createdCount: 0,
      recipients: []
    };
  }

  const messageTitle = trimOptional(input.messageTitle) ?? "";
  const messageBody = trimOptional(input.messageBody) ?? "";

  const createdCount = await prisma.$transaction(async (db) => {
    await ensureDefaultTemplatesTx(db);

    const template = await db.emailTemplate.findUnique({
      where: { key: input.templateKey }
    });

    if (!template || !template.isActive) {
      return 0;
    }

    const entries = dedupedRecipients
      .map((recipient) => {
        const context = {
          companyName: recipient.companyName,
          contactName: recipient.contactName ?? recipient.companyName,
          messageTitle,
          messageBody
        };

        return {
          templateKey: input.templateKey,
          triggerEvent: "manual_information_notification",
          recipientEmail: recipient.contactEmail,
          recipientName: recipient.contactName ?? recipient.companyName,
          recipientProfileId: recipient.profileId,
          subject: renderTemplate(template.subjectTemplate, context).trim(),
          body: renderTemplate(template.bodyTemplate, context).trim(),
          status: PrismaEmailOutboxStatus.prepared,
          metadata: {
            targetMode: input.targetMode,
            groupBy: input.groupBy ?? null,
            groupValues: input.groupValues ?? [],
            actorEmail: actor?.email ?? actor?.displayName ?? null
          } satisfies Prisma.InputJsonValue,
          createdByUserId:
            typeof actor?.userId === "number" ? actor.userId : null
        };
      })
      .filter((entry) => entry.subject.length > 0 && entry.body.length > 0);

    if (entries.length === 0) {
      return 0;
    }

    await db.emailOutbox.createMany({
      data: entries
    });

    return entries.length;
  });

  return {
    createdCount,
    recipients: dedupedRecipients
  };
};

export const listEmailOutboxEntries = async (
  limit = 40
): Promise<EmailOutboxEntryView[]> => {
  const safeLimit = Number.isFinite(limit)
    ? Math.max(1, Math.min(200, Math.floor(limit)))
    : 40;

  const rows = await prisma.emailOutbox.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: safeLimit
  });

  return rows.map(toOutboxView);
};

const getAdminNotificationEmail = (): string | undefined => {
  return (
    trimOptional(process.env.ADMIN_NOTIFICATION_EMAIL) ??
    trimOptional(process.env.SMTP_FROM)?.replace(/^.*<([^>]+)>.*$/, "$1") ??
    trimOptional(process.env.SMTP_USER) ??
    trimOptional(process.env.OUTLOOK_SMTP_USER)
  );
};

const getAdminPanelBaseUrl = (): string => {
  return (
    trimOptional(process.env.ADMIN_PANEL_URL) ??
    trimOptional(process.env.PUBLIC_APP_URL) ??
    "http://localhost:5173"
  ).replace(/\/$/, "");
};

const queueAndMaybeSendAdminEmail = async (input: {
  templateKey: EmailTemplateKey;
  triggerEvent: string;
  context: Record<string, string>;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> => {
  const adminEmail = getAdminNotificationEmail();
  if (!adminEmail) {
    return;
  }

  const created = await prisma.$transaction(async (db) => {
    await ensureDefaultTemplatesTx(db);
    const template = await db.emailTemplate.findUnique({
      where: { key: input.templateKey }
    });
    if (!template || !template.isActive) {
      return null;
    }

    const subject = renderTemplate(template.subjectTemplate, input.context).trim();
    const body = renderTemplate(template.bodyTemplate, input.context).trim();
    if (!subject || !body) {
      return null;
    }

    return db.emailOutbox.create({
      data: {
        templateKey: input.templateKey,
        triggerEvent: input.triggerEvent,
        recipientEmail: adminEmail,
        recipientName: "Administración POEX",
        subject,
        body,
        status: PrismaEmailOutboxStatus.prepared,
        metadata: input.metadata
      }
    });
  });

  if (!created) {
    return;
  }

  const delivery = await sendMail({
    to: created.recipientEmail,
    subject: created.subject,
    text: created.body
  });

  if (delivery.ok) {
    await prisma.emailOutbox.update({
      where: { id: created.id },
      data: {
        status: PrismaEmailOutboxStatus.sent,
        sentAt: new Date(),
        errorMessage: null
      }
    });
    return;
  }

  if (delivery.mode === "smtp") {
    await prisma.emailOutbox.update({
      where: { id: created.id },
      data: {
        status: PrismaEmailOutboxStatus.failed,
        errorMessage: delivery.error
      }
    });
  }
};

export const notifyAdminNewInfoRequest = async (input: {
  requestId: number;
  requestKind: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string;
  requesterCompany?: string;
  companyName?: string;
  productName?: string;
  details?: string;
}): Promise<void> => {
  const adminUrl = `${getAdminPanelBaseUrl()}/admin/special-requests`;
  await queueAndMaybeSendAdminEmail({
    templateKey: "admin_new_info_request",
    triggerEvent: "special_request_created",
    context: {
      requestId: String(input.requestId),
      requestKind: input.requestKind,
      requesterName: input.requesterName,
      requesterEmail: input.requesterEmail,
      requesterPhone: input.requesterPhone ?? "-",
      requesterCompany: input.requesterCompany ?? "-",
      companyName: input.companyName ?? "-",
      productName: input.productName ?? "-",
      details: input.details ?? "-",
      adminUrl
    },
    metadata: {
      requestId: input.requestId,
      requestKind: input.requestKind
    } satisfies Prisma.InputJsonValue
  });
};

export const notifyAdminNewApplication = async (input: {
  applicationId: number;
  companyName: string;
  contactName: string;
  contactEmail: string;
  phone?: string;
}): Promise<void> => {
  const adminUrl = `${getAdminPanelBaseUrl()}/admin/applications`;
  await queueAndMaybeSendAdminEmail({
    templateKey: "admin_new_application",
    triggerEvent: "application_created_admin_notice",
    context: {
      applicationId: String(input.applicationId),
      companyName: input.companyName,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      phone: input.phone ?? "-",
      adminUrl
    },
    metadata: {
      applicationId: input.applicationId
    } satisfies Prisma.InputJsonValue
  });
};

export const prepareApplicationReceivedEmail = async (input: {
  applicationId: number;
  companyName: string;
  contactName: string;
  recipientEmail: string;
}): Promise<void> => {
  await queueTemplatedEmailTx(prisma, {
    templateKey: "application_received",
    triggerEvent: "application_created",
    recipientEmail: input.recipientEmail,
    recipientName: input.contactName,
    context: {
      companyName: input.companyName,
      contactName: input.contactName
    },
    metadata: {
      applicationId: input.applicationId
    } satisfies Prisma.InputJsonValue
  });
};

export const prepareApplicationApprovedEmailTx = async (
  db: CommunicationsPrismaClient,
  input: {
    applicationId: number;
    companyName: string;
    contactName: string;
    recipientEmail: string;
  }
): Promise<void> => {
  await queueTemplatedEmailTx(db, {
    templateKey: "application_approved",
    triggerEvent: "application_approved",
    recipientEmail: input.recipientEmail,
    recipientName: input.contactName,
    context: {
      companyName: input.companyName,
      contactName: input.contactName
    },
    metadata: {
      applicationId: input.applicationId
    } satisfies Prisma.InputJsonValue
  });
};

export const prepareProductReviewStatusChangedEmailTx = async (
  db: CommunicationsPrismaClient,
  input: {
    profileId: number;
    companyName: string;
    contactName: string;
    recipientEmail: string;
    productId: number;
    productName: string;
    isAccepted: boolean;
    rejectionMessage?: string | null;
  }
): Promise<void> => {
  const reviewStatus = input.isAccepted ? "ACEPTADO" : "NO ACEPTADO";
  const rejectionMessage =
    !input.isAccepted && isNonEmptyString(input.rejectionMessage)
      ? `Mensaje del administrador: ${input.rejectionMessage}`
      : "";

  await queueTemplatedEmailTx(db, {
    templateKey: "product_review_status_changed",
    triggerEvent: "product_review_status_changed",
    recipientEmail: input.recipientEmail,
    recipientName: input.contactName,
    recipientProfileId: input.profileId,
    context: {
      companyName: input.companyName,
      contactName: input.contactName,
      productName: input.productName,
      reviewStatus,
      rejectionMessage
    },
    metadata: {
      productId: input.productId,
      isAccepted: input.isAccepted
    } satisfies Prisma.InputJsonValue
  });
};

export const replyToInfoRequest = async (
  input: InfoRequestReplyInput,
  actor?: {
    userId?: number;
    email?: string;
    displayName?: string;
  }
): Promise<InfoRequestReplyResult> => {
  const recipientEmail = input.recipientEmail.trim().toLowerCase();
  const recipientName = input.recipientName.trim();
  const subject = input.subject.trim();
  const messageBody = input.messageBody.trim();
  const companyName = trimOptional(input.companyName) ?? "";
  const productName = trimOptional(input.productName) ?? "";

  if (!recipientEmail || !recipientName || !subject || !messageBody) {
    throw new Error("invalid_reply_payload");
  }

  const outbox = await prisma.$transaction(async (db) => {
    await ensureDefaultTemplatesTx(db);

    const template = await db.emailTemplate.findUnique({
      where: { key: "info_request_response" }
    });

    const context = {
      contactName: recipientName,
      companyName,
      companySuffix: companyName ? ` sobre ${companyName}` : "",
      messageTitle: subject,
      messageBody,
      productName
    };

    const renderedSubject = template
      ? renderTemplate(template.subjectTemplate, context).trim() || subject
      : subject;
    const renderedBody = template
      ? renderTemplate(template.bodyTemplate, context).trim() || messageBody
      : `Hola ${recipientName},\n\n${messageBody}\n\nSaludos,\nEquipo de la Agencia`;

    return db.emailOutbox.create({
      data: {
        templateKey: "info_request_response",
        triggerEvent: "info_request_admin_reply",
        recipientEmail,
        recipientName,
        subject: renderedSubject,
        body: renderedBody,
        status: PrismaEmailOutboxStatus.prepared,
        metadata: {
          requestId: input.requestId,
          companyName: companyName || null,
          productName: productName || null,
          requesterCompany: trimOptional(input.requesterCompany) ?? null,
          actorEmail: actor?.email ?? actor?.displayName ?? null
        } satisfies Prisma.InputJsonValue,
        createdByUserId: typeof actor?.userId === "number" ? actor.userId : null
      }
    });
  });

  const deliveryAttempt = await sendMail({
    to: outbox.recipientEmail,
    subject: outbox.subject,
    text: outbox.body
  });

  if (deliveryAttempt.ok) {
    const sent = await prisma.emailOutbox.update({
      where: { id: outbox.id },
      data: {
        status: PrismaEmailOutboxStatus.sent,
        sentAt: new Date(),
        errorMessage: null
      }
    });

    return {
      outbox: toOutboxView(sent),
      delivery: {
        status: "sent",
        mode: "smtp",
        messageId: deliveryAttempt.messageId
      }
    };
  }

  if (deliveryAttempt.mode === "unconfigured") {
    return {
      outbox: toOutboxView(outbox),
      delivery: {
        status: "prepared",
        mode: "unconfigured",
        reason: deliveryAttempt.error
      }
    };
  }

  const failed = await prisma.emailOutbox.update({
    where: { id: outbox.id },
    data: {
      status: PrismaEmailOutboxStatus.failed,
      errorMessage: deliveryAttempt.error
    }
  });

  return {
    outbox: toOutboxView(failed),
    delivery: {
      status: "failed",
      mode: "smtp",
      error: deliveryAttempt.error
    }
  };
};
