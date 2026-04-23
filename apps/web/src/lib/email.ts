import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<void> {
  // Configuración SMTP (Mailgun, SendGrid, etc.)
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || "smtp.mailgun.org",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "CyberAware <noreply@cyberaware.cspcybersecurity.com>",
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ""),
  });
}
