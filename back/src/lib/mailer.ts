import nodemailer from "nodemailer";

export type MailSendInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type MailSendResult =
  | { ok: true; mode: "smtp" | "dry_run"; messageId?: string }
  | { ok: false; mode: "unconfigured" | "smtp"; error: string };

const trimEnv = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : undefined;
};

export const getMailConfig = () => {
  const host = trimEnv(process.env.SMTP_HOST) ?? trimEnv(process.env.OUTLOOK_SMTP_HOST);
  const portRaw = trimEnv(process.env.SMTP_PORT) ?? trimEnv(process.env.OUTLOOK_SMTP_PORT) ?? "587";
  const port = Number.parseInt(portRaw, 10);
  const user = trimEnv(process.env.SMTP_USER) ?? trimEnv(process.env.OUTLOOK_SMTP_USER);
  const pass = trimEnv(process.env.SMTP_PASS) ?? trimEnv(process.env.OUTLOOK_SMTP_PASS);
  const from =
    trimEnv(process.env.SMTP_FROM) ??
    trimEnv(process.env.OUTLOOK_SMTP_FROM) ??
    user;
  const secure =
    (trimEnv(process.env.SMTP_SECURE) ?? "false").toLowerCase() === "true" ||
    port === 465;

  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    user,
    pass,
    from,
    secure,
    isConfigured: Boolean(host && user && pass && from)
  };
};

export const sendMail = async (input: MailSendInput): Promise<MailSendResult> => {
  const config = getMailConfig();

  if (!config.isConfigured) {
    // Without credentials we keep messages in outbox as prepared/dry-run.
    return {
      ok: false,
      mode: "unconfigured",
      error:
        "SMTP/Outlook no configurado. Definí SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS y SMTP_FROM."
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass
      }
    });

    const info = await transporter.sendMail({
      from: config.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html ?? input.text.replace(/\n/g, "<br/>")
    });

    return {
      ok: true,
      mode: "smtp",
      messageId: typeof info.messageId === "string" ? info.messageId : undefined
    };
  } catch (error) {
    return {
      ok: false,
      mode: "smtp",
      error: error instanceof Error ? error.message : "No se pudo enviar el correo"
    };
  }
};
