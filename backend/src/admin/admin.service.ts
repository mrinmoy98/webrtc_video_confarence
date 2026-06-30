import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../entity/user.entity';
import { ScheduledMeeting } from '../entity/scheduled-meeting.entity';
import { MeetingGateway } from '../meeting/meeting.gateway';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('ScheduledMeeting')
    private readonly scheduledModel: Model<ScheduledMeeting>,
    private readonly meetingGateway: MeetingGateway,
  ) {}

  async listUsers() {
    const users = await this.userModel
      .find()
      .select('-password')
      .sort({ created_at: -1 })
      .lean();
    return { users };
  }

  async setActive(id: string, active: boolean) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'admin' && !active) {
      throw new BadRequestException('You cannot deactivate an admin account');
    }
    user.is_active = active;
    await user.save();
    return { id, is_active: active };
  }

  async deleteUser(id: string, requesterId: string) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    if (String(user._id) === String(requesterId)) {
      throw new BadRequestException('You cannot delete your own account');
    }
    if (user.role === 'admin') {
      throw new BadRequestException('Admin accounts cannot be deleted');
    }
    await this.userModel.findByIdAndDelete(id);
    return { id, deleted: true };
  }

  async stats() {
    const now = new Date();
    const [total, active, admins, scheduled, upcoming] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ is_active: true }),
      this.userModel.countDocuments({ role: 'admin' }),
      this.scheduledModel.countDocuments(),
      this.scheduledModel.countDocuments({ scheduledAt: { $gte: now } }),
    ]);
    const meetings = this.meetingGateway.getActiveRooms();
    const liveParticipants = meetings.reduce((sum, m) => sum + m.participants, 0);
    return {
      users: { total, active, inactive: total - active, admins },
      meetings: { active: meetings.length, participants: liveParticipants },
      scheduled: { total: scheduled, upcoming },
    };
  }

  liveMeetings() {
    return { meetings: this.meetingGateway.getActiveRooms() };
  }

  async scheduledMeetings() {
    const meetings = await this.scheduledModel
      .find()
      .select('-ownerKey')
      .sort({ scheduledAt: 1 })
      .lean();
    return { meetings };
  }

  async deleteScheduled(id: string) {
    const m = await this.scheduledModel.findByIdAndDelete(id);
    if (!m) throw new NotFoundException('Scheduled meeting not found');
    return { id, deleted: true };
  }
}
