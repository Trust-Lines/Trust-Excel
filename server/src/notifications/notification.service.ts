import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  /**
   * Check if all items in a project have SENT status.
   * If yes and project is not already DONE, mark it DONE and email admins.
   */
  async checkProjectCompletion(projectId: string): Promise<void> {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: {
          items: { select: { id: true, status: true } },
        },
      });

      if (!project) return;
      if (project.status === 'DONE') return;
      if (project.items.length === 0) return;

      const allSent = project.items.every((item) => item.status === 'SENT');
      if (!allSent) return;

      this.logger.log(`All items SENT for project ${project.projectNo} (${projectId}), marking DONE`);

      // Mark project as DONE
      await this.prisma.project.update({
        where: { id: projectId },
        data: { status: 'DONE' },
      });

      // Always send to the fixed admin alert email — never rely on DB user emails
      const adminEmail = this.configService.get<string>('ADMIN_ALERT_EMAIL', 'hghannom@gmail.com');
      const frontendUrl = this.configService.get('FRONTEND_URL', 'https://projects-table.vercel.app');

      try {
        await this.sendProjectCompletionEmail(
          adminEmail,
          'Admin',
          project.projectNo,
          project.name || project.projectNo,
          project.items.length,
          frontendUrl,
        );
      } catch (error) {
        this.logger.error(`Failed to send completion email to ${adminEmail}:`, error);
      }

      this.logger.log(`Project completion email sent to ${adminEmail} for ${project.projectNo}`);
    } catch (error) {
      this.logger.error(`checkProjectCompletion error for ${projectId}:`, error);
    }
  }

  private async sendProjectCompletionEmail(
    recipientEmail: string,
    recipientName: string,
    projectNo: string,
    projectName: string,
    itemCount: number,
    frontendUrl: string,
  ): Promise<void> {
    const smtpFrom = this.configService.get<string>('SMTP_FROM');
    const projectUrl = `${frontendUrl}/project-tracking/projects`;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Project Completed</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f5f7; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%;">
                        <tr>
                            <td style="background-color: #27ae60; padding: 40px 40px 30px 40px; border-radius: 12px 12px 0 0; text-align: center;">
                                <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #ffffff;">Project Completed</h1>
                                <p style="margin: 0; font-size: 15px; color: #d5f5e3;">All items have been sent</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color: #ffffff; padding: 40px;">
                                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.7; color: #374151;">
                                    Hello <strong>${recipientName}</strong>,
                                </p>
                                <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.7; color: #374151;">
                                    All <strong>${itemCount}</strong> items in project <strong>${projectNo}</strong> have reached <strong>SENT</strong> status. The project has been automatically marked as <strong>DONE</strong>.
                                </p>
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
                                    <tr>
                                        <td style="padding: 16px; background-color: #f0fdf4; border-radius: 8px; border-left: 4px solid #27ae60;">
                                            <p style="margin: 0 0 4px 0; font-size: 13px; color: #6b7280;">Project</p>
                                            <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1a1a2e;">${projectNo} - ${projectName}</p>
                                        </td>
                                    </tr>
                                </table>
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td align="center" style="padding: 8px 0 16px 0;">
                                            <a href="${projectUrl}" target="_blank" style="display: inline-block; background-color: #27ae60; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 40px; border-radius: 8px;">
                                                View in Trust Lines
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color: #f8f9fa; padding: 24px 40px; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
                                <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                                    Trust Lines - Project Management Platform
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`;

    const mailOptions = {
      from: smtpFrom,
      to: recipientEmail,
      subject: `Project ${projectNo} Completed - All Items Sent`,
      html,
    };

    await this.emailService.sendRawEmail(mailOptions);
  }
}
