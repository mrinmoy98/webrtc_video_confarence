import {
  ConflictException,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { User } from '../entity/user.entity';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger('AuthService');

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectModel('User') private readonly userModel: Model<User>,
  ) { }

  async onModuleInit() {
    const email = (this.config.get<string>('ADMIN_EMAIL') || 'admin@videoconference.com')
      .toLowerCase()
      .trim();
    const password = this.config.get<string>('ADMIN_PASSWORD') || 'admin123';

    const existing = await this.userModel.findOne({ role: 'admin' });
    if (existing) return;

    const hash = await bcrypt.hash(password, 10);
    await this.userModel.create({
      name: 'Administrator',
      email,
      password: hash,
      role: 'admin',
      is_active: true,
    });
    this.logger.log(`Seeded default admin: ${email} (password: ${password})`);
  }

  async register(name: string, email: string, password: string) {
    const normEmail = email.toLowerCase().trim();
    const exists = await this.userModel.findOne({ email: normEmail });
    if (exists) throw new ConflictException('An account with this email already exists');

    const hash = await bcrypt.hash(password, 10);
    const user = await this.userModel.create({
      name: name.trim(),
      email: normEmail,
      password: hash,
      role: 'user',
      is_active: true,
    });
    return this.issueToken(user);
  }

  async login(email: string, password: string) {
    const user = await this.userModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) throw new UnauthorizedException('Invalid email or password');
    if (!user.is_active) throw new UnauthorizedException('Your account has been deactivated');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid email or password');

    await this.userModel.findByIdAndUpdate(user._id, { last_login: new Date() });
    return this.issueToken(user);
  }

  async me(userId: string) {
    const user = await this.userModel.findById(userId).select('-password').lean();
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  private issueToken(user: User) {
    const payload = {
      sub: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    return {
      token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
