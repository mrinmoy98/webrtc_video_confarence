import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { User } from 'src/entity/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel('User') private readonly userModel: Model<User>,
  ) {}

  async login(email: string, password: string) {
    console.log(email,password, "==========>");
    
    const user = await this.userModel.findOne({ email, is_active: true });
    console.log(user,"user===========>");
    
    if (!user) throw new UnauthorizedException('Invalid Users');

    const isMatch = await bcrypt.compare(password, user.password);
    console.log(isMatch,"isMatch=====>");
    
    if (!isMatch) throw new UnauthorizedException('Invalid email or password');

    await this.userModel.findByIdAndUpdate(user._id, { last_login: new Date() });

    const payload = {
      sub: user._id,
      email: user.email,
      name: user.name,
      // role: user.role,
    };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('-password')
      .lean();
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) throw new UnauthorizedException('Old password is incorrect');

    if (await bcrypt.compare(newPassword, user.password)) {
      throw new UnauthorizedException('New password must differ from old password');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return { message: 'Password changed successfully' };
  }
}
