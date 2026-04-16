import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter | null;
  private readonly fromAddress: string;
  private readonly appUrl: string;

  constructor(config: ConfigService) {
    const host = config.get<string>('MAILTRAP_HOST');
    const portStr = config.get<string>('MAILTRAP_PORT');
    const user = config.get<string>('MAILTRAP_USER');
    const pass = config.get<string>('MAILTRAP_PASS');

    this.fromAddress = config.get<string>('MAIL_FROM') ?? 'noreply@fea-sfi.local';
    this.appUrl = config.get<string>('APP_URL') ?? 'http://localhost:3002';

    if (host && portStr && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(portStr),
        auth: { user, pass },
      });
    } else {
      this.logger.warn(
        'Mailtrap config missing — falling back to console logging. Set MAILTRAP_HOST/PORT/USER/PASS to enable real SMTP.',
      );
      this.transporter = null;
    }
  }

  async sendPasswordResetEmail(toEmail: string, token: string): Promise<void> {
    const resetLink = `${this.appUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const subject = 'Reset your FEA-SFI password';
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #111; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: #fff; margin: 0; font-size: 20px; font-weight: 400;">
            Reset your <strong>FEA-SFI</strong> password
          </h1>
        </div>
        <div style="border: 1px solid #e5e5e5; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
          <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6;">
            We received a request to reset the password for <strong>${escapeHtml(toEmail)}</strong>.
          </p>
          <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6;">
            Click the button below to choose a new password. This link expires in 1 hour.
          </p>
          <p style="margin: 0 0 24px;">
            <a href="${resetLink}"
               style="background: #111; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; font-size: 14px; font-weight: 500;">
              Reset Password
            </a>
          </p>
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
          <p style="margin: 0 0 8px; font-size: 13px; color: #666; line-height: 1.5;">
            If you didn't request this, you can safely ignore this email — your password won't change.
          </p>
          <p style="margin: 16px 0 0; font-size: 12px; color: #999; line-height: 1.5;">
            Or copy this link into your browser:<br/>
            <span style="word-break: break-all; color: #666;">${resetLink}</span>
          </p>
          <p style="margin: 24px 0 0; font-size: 12px; color: #999;">
            This email was sent by FEA-SFI.
          </p>
        </div>
      </div>
    `;
    const text = `Reset your FEA-SFI password\n\nWe received a request to reset the password for ${toEmail}.\n\nOpen this link to choose a new password (expires in 1 hour):\n${resetLink}\n\nIf you didn't request this, you can ignore this email.`;

    await this.send({ to: toEmail, subject, html, text });
  }

  private async send(opts: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    if (!this.transporter) {
      this.logger.log(`[email:dev] To: ${opts.to} | Subject: ${opts.subject}`);
      this.logger.debug(opts.text);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      });
    } catch (error) {
      // Never throw — email failures must not break the auth flow.
      // Log and move on; the constant-response contract for forgot-password is preserved.
      this.logger.error(
        `Failed to send email to ${opts.to}: ${(error as Error).message}`,
      );
    }
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
