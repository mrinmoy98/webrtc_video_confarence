import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ScheduledMeeting } from '../entity/scheduled-meeting.entity';
import { MailService } from '../mail/mail.service';
import { MeetingsService } from './meetings.service';

// Send a reminder this many minutes before the meeting starts.
const REMINDER_LEAD_MINS = 10;

@Injectable()
export class MeetingsReminderService {
  private readonly logger = new Logger('MeetingsReminder');

  constructor(
    @InjectModel('ScheduledMeeting')
    private readonly meetingModel: Model<ScheduledMeeting>,
    private readonly mail: MailService,
    private readonly meetingsService: MeetingsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async sendDueReminders() {
    if (!this.mail.enabled) return; // nothing to do without SMTP

    const now = Date.now();
    const windowEnd = new Date(now + REMINDER_LEAD_MINS * 60000);

    // Meetings starting within the lead window, not yet reminded, not long past.
    const due = await this.meetingModel.find({
      reminderSent: false,
      createdByEmail: { $ne: '' },
      scheduledAt: { $gte: new Date(now - 60000), $lte: windowEnd },
    });

    for (const m of due) {
      const ok = await this.mail.scheduleReminder(
        m.createdByEmail,
        {
          title: m.title,
          when: new Date(m.scheduledAt).toLocaleString(),
          durationMins: m.durationMins,
          roomId: m.roomId,
        },
        this.meetingsService.joinLink(m.roomId),
      );
      if (ok) {
        m.reminderSent = true;
        await m.save();
        this.logger.log(`Reminder sent for "${m.title}" → ${m.createdByEmail}`);
      }
    }
  }
}
