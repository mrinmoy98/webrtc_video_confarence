import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger('MailService');
  private transporter: nodemailer.Transporter | null = null;
  private from = '';
  public enabled = false;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(this.config.get<string>('SMTP_PORT')) || 465,
        secure: String(this.config.get<string>('SMTP_SECURE') ?? 'true') === 'true',
        auth: { user, pass },
      });
      this.from = this.config.get<string>('SMTP_FROM') || user;
      this.enabled = true;
      this.logger.log(`Email enabled via ${host}`);
    } else {
      this.logger.warn('SMTP not configured — emails are disabled (set SMTP_USER/SMTP_PASS to enable)');
    }
  }

  async send(to: string, subject: string, html: string) {
    if (!this.enabled || !this.transporter || !to) return false;
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
      this.logger.log(`Email sent to ${to}: ${subject}`);
      return true;
    } catch (e: any) {
      this.logger.error(`Email to ${to} failed: ${e?.message || e}`);
      return false;
    }
  }

  // ── Templates ──

  private shell(title: string, body: string) {
    return `
    <div style="background:#eef3fb;padding:32px 0;font-family:Inter,Arial,sans-serif;">
      <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e4e9f2;">
        <div style="background:linear-gradient(135deg,#0b5cff,#2d8cff);padding:22px 28px;color:#fff;">
          <span style="font-size:18px;font-weight:700;">🎥 Video Conference</span>
        </div>
        <div style="padding:28px;color:#3a4861;font-size:15px;line-height:1.6;">
          <h2 style="color:#0b1221;margin:0 0 12px;">${title}</h2>
          ${body}
        </div>
        <div style="padding:16px 28px;border-top:1px solid #e4e9f2;color:#9aa6bd;font-size:12px;">
          You received this because you scheduled a meeting on Video Conference.
        </div>
      </div>
    </div>`;
  }

  private meetingCard(m: { title: string; when: string; durationMins: number; roomId: string }, link: string) {
    return `
      <div style="background:#f4f8ff;border:1px solid #e4e9f2;border-radius:12px;padding:18px;margin:16px 0;">
        <div style="font-size:16px;font-weight:700;color:#0b1221;">${m.title}</div>
        <div style="margin-top:6px;color:#3a4861;">🗓️ ${m.when}</div>
        <div style="color:#3a4861;">⏱️ ${m.durationMins} minutes</div>
        <div style="color:#6b7a90;font-size:13px;margin-top:4px;">Room: ${m.roomId}</div>
      </div>
      <a href="${link}" style="display:inline-block;background:#0b5cff;color:#fff;text-decoration:none;
        padding:12px 24px;border-radius:10px;font-weight:600;">Join meeting</a>
      <p style="color:#9aa6bd;font-size:13px;margin-top:14px;">Or copy this link: ${link}</p>`;
  }

  scheduleConfirmation(
    to: string,
    m: { title: string; when: string; durationMins: number; roomId: string },
    link: string,
  ) {
    const html = this.shell(
      'Your meeting is scheduled ✅',
      `<p>Hi! Your meeting has been scheduled. We'll remind you shortly before it starts.</p>
       ${this.meetingCard(m, link)}`,
    );
    return this.send(to, `Scheduled: ${m.title}`, html);
  }

  scheduleReminder(
    to: string,
    m: { title: string; when: string; durationMins: number; roomId: string },
    link: string,
  ) {
    const html = this.shell(
      'Your meeting starts soon ⏰',
      `<p>This is a reminder that your meeting is about to start.</p>
       ${this.meetingCard(m, link)}`,
    );
    return this.send(to, `Reminder: ${m.title} starts soon`, html);
  }
}
