import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CscServicesService } from './csc-services.service';
import {
  CreatePanCardDto, UpdatePanCardDto,
  CreatePassportDto, UpdatePassportDto,
  CscFilterDto,
} from './csc-services.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums';
import { User } from '../users/user.entity';

@Controller('csc-services')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CscServicesController {
  constructor(private readonly service: CscServicesService) {}

  // ── PAN Card Endpoints ─────────────────────────────────────────────────────

  @Post('pan-cards')
  createPanCard(@Body() dto: CreatePanCardDto, @CurrentUser() user: User) {
    return this.service.createPanCard(dto, user);
  }

  @Get('pan-cards')
  findAllPanCards(@Query() filter: CscFilterDto) {
    return this.service.findAllPanCards(filter);
  }

  @Get('pan-cards/:id')
  findOnePanCard(@Param('id') id: string) {
    return this.service.findOnePanCard(id);
  }

  @Put('pan-cards/:id')
  updatePanCard(@Param('id') id: string, @Body() dto: UpdatePanCardDto) {
    return this.service.updatePanCard(id, dto);
  }

  @Delete('pan-cards/:id')
  @Roles(Role.ADMIN)
  removePanCard(@Param('id') id: string) {
    return this.service.deletePanCard(id);
  }

  // ── Passport Endpoints ─────────────────────────────────────────────────────

  @Post('passports')
  createPassport(@Body() dto: CreatePassportDto, @CurrentUser() user: User) {
    return this.service.createPassport(dto, user);
  }

  @Get('passports')
  findAllPassports(@Query() filter: CscFilterDto) {
    return this.service.findAllPassports(filter);
  }

  @Get('passports/:id')
  findOnePassport(@Param('id') id: string) {
    return this.service.findOnePassport(id);
  }

  @Put('passports/:id')
  updatePassport(@Param('id') id: string, @Body() dto: UpdatePassportDto) {
    return this.service.updatePassport(id, dto);
  }

  @Delete('passports/:id')
  @Roles(Role.ADMIN)
  removePassport(@Param('id') id: string) {
    return this.service.deletePassport(id);
  }
}
