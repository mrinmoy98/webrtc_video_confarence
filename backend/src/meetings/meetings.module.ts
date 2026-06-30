import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduledMeetingSchema } from '../entity/scheduled-meeting.entity';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';
import { MeetingsReminderService } from './meetings-reminder.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'ScheduledMeeting', schema: ScheduledMeetingSchema },
    ]),
  ],
  controllers: [MeetingsController],
  providers: [MeetingsService, MeetingsReminderService],
})
export class MeetingsModule {}
