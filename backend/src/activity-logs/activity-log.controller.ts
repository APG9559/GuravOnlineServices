import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums';
import { ActivityLogService } from './activity-log.service';

@Controller('activity-logs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
export class ActivityLogController {
  constructor(private readonly service: ActivityLogService) {}

  @Get()
  findAll(
    @Query('limit') limit = 100,
    @Query('offset') offset = 0,
  ) {
    return this.service.findAll(Number(limit), Number(offset));
  }
}
