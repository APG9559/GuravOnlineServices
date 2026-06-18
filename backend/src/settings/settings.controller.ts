import {
  Controller, Get, Patch, Post, Body, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SettingsService } from './settings.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

// Both Admin and Operator can read and update pricing (no @Roles restriction)
@Controller('settings')
@UseGuards(AuthGuard('jwt'))
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  // GET /api/settings/pricing  — full list with metadata
  @Get('pricing')
  getAll() {
    return this.service.getAll();
  }

  // GET /api/settings/pricing/map  — flat { key: value } used by frontend calculators
  @Get('pricing/map')
  getPricingMap() {
    return this.service.getPricingMap();
  }

  // PATCH /api/settings/pricing  — update one or many keys
  // Body: { "updates": { "magistrate_fee": 950, "notary_fee": 1200 } }
  @Patch('pricing')
  updateMany(
    @Body('updates') updates: Record<string, number>,
    @CurrentUser() user: User,
  ) {
    return this.service.updateMany(updates, user);
  }

  // POST /api/settings/pricing/reset  — restore all to original defaults
  @Post('pricing/reset')
  resetDefaults(@CurrentUser() user: User) {
    return this.service.resetDefaults(user);
  }
}
