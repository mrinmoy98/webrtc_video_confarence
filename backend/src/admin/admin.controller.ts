import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminService } from './admin.service';

class SetActiveDto {
  @IsBoolean()
  active: boolean;
}

@ApiTags('Admin')
@ApiBearerAuth('JWT')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Dashboard counters (users + live meetings)' })
  stats() {
    return this.adminService.stats();
  }

  @Get('users')
  @ApiOperation({ summary: 'List all registered users' })
  listUsers() {
    return this.adminService.listUsers();
  }

  @Patch('users/:id/active')
  @ApiOperation({ summary: 'Activate / deactivate a user' })
  setActive(@Param('id') id: string, @Body() dto: SetActiveDto) {
    return this.adminService.setActive(id, dto.active);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete a user' })
  deleteUser(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.adminService.deleteUser(id, user.sub);
  }

  @Get('meetings')
  @ApiOperation({ summary: 'List live / active meetings' })
  liveMeetings() {
    return this.adminService.liveMeetings();
  }
}
