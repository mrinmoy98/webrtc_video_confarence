import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { MeetingsService } from './meetings.service';

@ApiTags('Meetings')
@ApiBearerAuth('JWT')
@Controller('meetings')
@UseGuards(JwtAuthGuard)
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post()
  @ApiOperation({ summary: 'Schedule a new meeting' })
  create(
    @CurrentUser() user: { sub: string; name: string; email: string },
    @Body() dto: CreateMeetingDto,
  ) {
    return this.meetingsService.create(user.sub, user.name, user.email, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List my scheduled meetings' })
  list(@CurrentUser() user: { sub: string }) {
    return this.meetingsService.listMine(user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a scheduled meeting' })
  remove(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.meetingsService.remove(id, user.sub);
  }
}
