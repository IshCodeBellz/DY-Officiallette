import nodemailer from "nodemailer";

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailMessage {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(config: EmailConfig) {
    this.transporter = nodemailer.createTransporter(config);
  }

  async sendEmail(message: EmailMessage): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        ...message,
      });
    } catch (error) {
      console.error("Failed to send email:", error);
      throw error;
    }
  }

  async sendAlert(
    subject: string,
    message: string,
    recipients: string[]
  ): Promise<void> {
    await this.sendEmail({
      to: recipients,
      subject: `[DY Official Alert] ${subject}`,
      text: message,
      html: `<div style="font-family: Arial, sans-serif;">
        <h2 style="color: #e74c3c;">System Alert</h2>
        <h3>${subject}</h3>
        <p>${message}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          This is an automated alert from DY Official monitoring system.
        </p>
      </div>`,
    });
  }
}

// Create default email service
export const emailService = new EmailService({
  host: process.env.SMTP_HOST || "localhost",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
});

// Helper function for sending alerts
export async function sendAlert(
  subject: string,
  message: string
): Promise<void> {
  const recipients = process.env.ALERT_EMAIL_RECIPIENTS?.split(",") || [];
  if (recipients.length > 0) {
    await emailService.sendAlert(subject, message, recipients);
  }
}
