import * as mongoose from 'mongoose';

export const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    is_active: { type: Boolean, default: true },
    last_login: { type: Date, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

export interface User extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  is_active: boolean;
  last_login: Date | null;
  created_at: Date;
  updated_at: Date;
}
