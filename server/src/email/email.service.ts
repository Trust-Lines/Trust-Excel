import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface InviteEmailData {
  recipientEmail: string;
  recipientName: string;
  inviterName: string;
  activationLink: string;
  expiresAt: Date;
}


@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpConfig = {
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    };

    this.transporter = nodemailer.createTransport(smtpConfig);

    // Verify connection on initialization
    this.verifyConnection();
  }

  private async verifyConnection() {
    try {
      // Log SMTP configuration (without sensitive data)
      const config = {
        host: this.configService.get<string>('SMTP_HOST'),
        port: this.configService.get<number>('SMTP_PORT', 587),
        secure: this.configService.get<string>('SMTP_SECURE') === 'true',
        user: this.configService.get<string>('SMTP_USER'),
        from: this.configService.get<string>('SMTP_FROM'),
      };

      this.logger.log('🔧 SMTP Configuration:', {
        host: config.host || '❌ UNDEFINED',
        port: config.port || '❌ UNDEFINED',
        secure: config.secure !== undefined ? config.secure : '❌ UNDEFINED',
        user: config.user || '❌ UNDEFINED',
        from: config.from || '❌ UNDEFINED',
      });

      await this.transporter.verify();
      this.logger.log('✅ SMTP connection verified successfully');
    } catch (error) {
      this.logger.error('❌ SMTP connection failed:', {
        error: error.message,
        stack: error.stack,
        code: error.code,
        command: error.command,
      });
    }
  }

  async sendInviteEmail(data: InviteEmailData): Promise<boolean> {
    const { recipientEmail } = data;

    try {
      this.logger.log(`📧 Attempting to send invite email to ${recipientEmail}`);

      const { recipientName, inviterName, activationLink, expiresAt } = data;

      const html = this.generateInviteEmailTemplate({
        recipientName,
        inviterName,
        activationLink,
        expiresAt,
      });

      const smtpFrom = this.configService.get<string>('SMTP_FROM');
      const mailOptions = {
        from: smtpFrom,
        to: recipientEmail,
        subject: `${inviterName} invited you to Trust Lines`,
        html,
      };

      this.logger.log(`📤 Sending email via SMTP...`, {
        to: recipientEmail,
        from: smtpFrom || '❌ SMTP_FROM undefined',
        subject: mailOptions.subject,
      });

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`✅ Invite email sent successfully to ${recipientEmail}`, {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        pending: info.pending,
      });

      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to send invite email to ${recipientEmail}:`, {
        error: error.message,
        stack: error.stack,
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
        recipientEmail,
      });
      return false;
    }
  }

  private generateInviteEmailTemplate(data: {
    recipientName: string;
    inviterName: string;
    activationLink: string;
    expiresAt: Date;
  }): string {
    const { recipientName, inviterName, activationLink, expiresAt } = data;

    const expiryFormatted = expiresAt.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Trust Lines</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f5f7; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%;">

                        <!-- Header -->
                        <tr>
                            <td style="background-color: #B03A2E; padding: 40px 40px 30px 40px; border-radius: 12px 12px 0 0; text-align: center;">
                                <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Trust Lines</h1>
                                <p style="margin: 0; font-size: 15px; color: #f5c6c0;">Project Management Platform</p>
                            </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                            <td style="background-color: #ffffff; padding: 40px;">
                                <h2 style="margin: 0 0 24px 0; font-size: 22px; font-weight: 600; color: #1a1a2e;">You're Invited!</h2>

                                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.7; color: #374151;">
                                    Hello <strong style="color: #1a1a2e;">${recipientName || 'there'}</strong>,
                                </p>

                                <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.7; color: #374151;">
                                    <strong style="color: #1a1a2e;">${inviterName}</strong> has invited you to join <strong style="color: #1a1a2e;">Trust Lines</strong>. Activate your account to start collaborating with the team.
                                </p>

                                <!-- Steps -->
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 32px;">
                                    <tr>
                                        <td style="padding: 12px 16px; background-color: #fafbfc; border-radius: 8px; border-left: 3px solid #B03A2E;">
                                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                                <tr>
                                                    <td style="padding: 4px 0; font-size: 14px; color: #374151; line-height: 1.8;">
                                                        <strong style="color: #B03A2E;">1.</strong> Click the button below<br/>
                                                        <strong style="color: #B03A2E;">2.</strong> Set your secure password<br/>
                                                        <strong style="color: #B03A2E;">3.</strong> Start collaborating
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>

                                <!-- CTA Button -->
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td align="center" style="padding: 8px 0 32px 0;">
                                            <!--[if mso]>
                                            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${activationLink}" style="height:52px;v-text-anchor:middle;width:260px;" arcsize="12%" strokecolor="#922b21" fillcolor="#B03A2E">
                                            <w:anchorlock/>
                                            <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">Activate My Account</center>
                                            </v:roundrect>
                                            <![endif]-->
                                            <!--[if !mso]><!-->
                                            <a href="${activationLink}" target="_blank" style="display: inline-block; background-color: #B03A2E; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 40px; border-radius: 8px; border: 1px solid #922b21; mso-hide: all;">
                                                Activate My Account
                                            </a>
                                            <!--<![endif]-->
                                        </td>
                                    </tr>
                                </table>

                                <!-- Expiry Warning -->
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td style="padding: 14px 16px; background-color: #fef9e7; border: 1px solid #f9e79f; border-radius: 8px;">
                                            <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #7d6608;">
                                                <strong>Expires:</strong> ${expiryFormatted}<br/>
                                                This link can only be used once.
                                            </p>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Fallback Link -->
                                <p style="margin: 24px 0 0 0; font-size: 12px; line-height: 1.6; color: #9ca3af;">
                                    If the button doesn't work, copy and paste this link into your browser:<br/>
                                    <a href="${activationLink}" style="color: #B03A2E; word-break: break-all;">${activationLink}</a>
                                </p>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f8f9fa; padding: 24px 40px; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
                                <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #6b7280;">Trust Lines</p>
                                <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #9ca3af;">
                                    If you didn't expect this invitation, you can safely ignore this email.
                                </p>
                            </td>
                        </tr>

                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
  }

  async sendRawEmail(mailOptions: { from?: string; to: string; subject: string; html: string }): Promise<boolean> {
    try {
      const from = mailOptions.from || this.configService.get<string>('SMTP_FROM');
      const info = await this.transporter.sendMail({ ...mailOptions, from });
      this.logger.log(`Email sent to ${mailOptions.to}`, { messageId: info.messageId });
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${mailOptions.to}:`, error.message);
      return false;
    }
  }

  async sendTestEmail(recipientEmail: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.configService.get<string>('SMTP_FROM'),
        to: recipientEmail,
        subject: 'Trust Lines - SMTP Test Email',
        html: `
          <h2>SMTP Configuration Test</h2>
          <p>This is a test email to verify SMTP configuration is working correctly.</p>
          <p>Sent at: ${new Date().toISOString()}</p>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Test email sent successfully to ${recipientEmail}`, {
        messageId: info.messageId,
      });

      return true;
    } catch (error) {
      this.logger.error(`Failed to send test email to ${recipientEmail}:`, error);
      return false;
    }
  }
}