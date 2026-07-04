import {
  Controller, Get, Patch, Post, Body, UseGuards, Res, UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { SettingsService } from './settings.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums';
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

  // ── Database Management (Admin only) ────────────────────────────────────

  // GET /api/settings/database/export  — download a full pg_dump binary
  @Get('database/export')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  exportDatabase(@Res() res: Response) {
    return this.service.exportDatabase(res);
  }

  // POST /api/settings/database/import  — upload a .dump file and restore
  // Body (multipart): file + mode ('full' | 'insert')
  @Post('database/import')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 100 * 1024 * 1024 } })) // 100 MB max
  importDatabase(
    @UploadedFile() file: Express.Multer.File,
    @Body('mode') mode: string,
  ) {
    if (!file) {
      throw new BadRequestException('No dump file uploaded.');
    }
    if (mode !== 'full' && mode !== 'insert') {
      throw new BadRequestException('Invalid mode. Must be "full" or "insert".');
    }
    return this.service.importDatabase(file.buffer, mode as 'full' | 'insert');
  }
}
