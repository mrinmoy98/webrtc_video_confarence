import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { CustomThrottlerGuard } from './custom-throttler.guard';
import { AuthModule } from './admin/auth/auth.module';
import { MeetingModule } from './meeting/meeting.module';
import { AppController } from './app.controller';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({ throttlers: [{ name: 'default', ttl: 60000, limit: 100 }] }),
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_URL),
    AuthModule,
    MeetingModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: CustomThrottlerGuard },
  ],
})
export class AppModule { }
