import * as mongoose from 'mongoose';

export const ScheduledMeetingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    roomId: { type: String, required: true, unique: true },
    ownerKey: { type: String, required: true }, // lets the creator reclaim host
    scheduledAt: { type: Date, required: true },
    durationMins: { type: Number, default: 60 },
    description: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdByName: { type: String, default: '' },
    createdByEmail: { type: String, default: '' },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

export interface ScheduledMeeting extends mongoose.Document {
  title: string;
  roomId: string;
  ownerKey: string;
  scheduledAt: Date;
  durationMins: number;
  description: string;
  createdBy: mongoose.Types.ObjectId;
  createdByName: string;
  createdByEmail: string;
  reminderSent: boolean;
  created_at: Date;
  updated_at: Date;
}
