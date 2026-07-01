import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ScheduledMeeting } from '../entity/scheduled-meeting.entity';
import { MailService } from '../mail/mail.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';

@Injectable()
export class MeetingsService {
  constructor(
    @InjectModel('ScheduledMeeting')
    private readonly meetingModel: Model<ScheduledMeeting>,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  joinLink(roomId: string) {
    const base = (this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173').replace(/\/$/, '');
    return `${base}/prejoin/${roomId}`;
  }

  private randomCode() {
    const c = 'abcdefghijkmnpqrstuvwxyz';
    const pick = (n: number) =>
      Array.from({ length: n }, () => c[Math.floor(Math.random() * c.length)]).join('');
    return `${pick(3)}-${pick(4)}-${pick(3)}`;
  }

  private randomKey() {
    return (
      Date.now().toString(36) +
      '-' +
      Math.random().toString(36).slice(2, 12)
    );
  }

  async create(
    userId: string,
    userName: string,
    userEmail: string,
    dto: CreateMeetingDto,
  ) {
    let roomId = this.randomCode();
    while (await this.meetingModel.exists({ roomId })) roomId = this.randomCode();

    const meeting = await this.meetingModel.create({
      title: dto.title.trim(),
      roomId,
      ownerKey: this.randomKey(),
      scheduledAt: new Date(dto.scheduledAt),
      durationMins: dto.durationMins || 60,
      description: (dto.description || '').trim(),
      createdBy: userId,
      createdByName: userName,
      createdByEmail: userEmail,
    });

    if (userEmail) {
      this.mail.scheduleConfirmation(
        userEmail,
        {
          title: meeting.title,
          when: new Date(meeting.scheduledAt).toLocaleString(),
          durationMins: meeting.durationMins,
          roomId: meeting.roomId,
        },
        this.joinLink(meeting.roomId),
      );
    }

    return meeting;
  }

  async listMine(userId: string) {
    const meetings = await this.meetingModel
      .find({ createdBy: userId })
      .sort({ scheduledAt: 1 })
      .lean();
    return { meetings };
  }

  async remove(id: string, userId: string) {
    const meeting = await this.meetingModel.findById(id);
    if (!meeting || String(meeting.createdBy) !== String(userId)) {
      throw new NotFoundException('Meeting not found');
    }
    await this.meetingModel.findByIdAndDelete(id);
    return { id, deleted: true };
  }
}
