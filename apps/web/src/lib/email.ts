import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<void> {
  // Usar configuración existente de Mailgun
  const host = process.env.SMTP_HOST || "smtp.mailgun.org";
  const port = parseInt(process.env.SMTP_PORT || "587");
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER || "postmaster@cspbaleares.com";
  const pass = process.env.SMTP_PASS || process.env.MAILGUN_API_KEY || "";

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM || "CyberAware <no-reply@cspbaleares.com>",
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ""),
  });
}
