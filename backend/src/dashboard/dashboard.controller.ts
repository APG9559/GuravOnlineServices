import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('summary')
  getSummary(@Query('from') from?: string, @Query('to') to?: string) {
    return this.service.getSummary(from, to);
  }
}
