import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from '../entity/user.entity';
import { ScheduledMeetingSchema } from '../entity/scheduled-meeting.entity';
import { MeetingModule } from '../meeting/meeting.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'ScheduledMeeting', schema: ScheduledMeetingSchema },
    ]),
    MeetingModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
