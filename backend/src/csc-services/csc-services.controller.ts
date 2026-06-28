import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PanCardsService } from './pan-cards.service';
import { PassportsService } from './passports.service';
import { VoterCardsService } from './voter-cards.service';
import {
  CreatePanCardDto, UpdatePanCardDto,
  CreatePassportDto, UpdatePassportDto,
  CreateVoterCardDto, UpdateVoterCardDto,
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
  constructor(
    private readonly panCardsService: PanCardsService,
    private readonly passportsService: PassportsService,
    private readonly voterCardsService: VoterCardsService,
  ) {}

  // ── PAN Card Endpoints ─────────────────────────────────────────────────────

  @Post('pan-cards')
  createPanCard(@Body() dto: CreatePanCardDto, @CurrentUser() user: User) {
    return this.panCardsService.create(dto, user);
  }

  @Get('pan-cards')
  findAllPanCards(@Query() filter: CscFilterDto) {
    return this.panCardsService.findAll(filter);
  }

  @Get('pan-cards/:id')
  findOnePanCard(@Param('id') id: string) {
    return this.panCardsService.findOne(id);
  }

  @Put('pan-cards/:id')
  updatePanCard(@Param('id') id: string, @Body() dto: UpdatePanCardDto) {
    return this.panCardsService.update(id, dto);
  }

  @Delete('pan-cards/:id')
  @Roles(Role.ADMIN)
  removePanCard(@Param('id') id: string) {
    return this.panCardsService.softDelete(id);
  }

  // ── Passport Endpoints ─────────────────────────────────────────────────────

  @Post('passports')
  createPassport(@Body() dto: CreatePassportDto, @CurrentUser() user: User) {
    return this.passportsService.create(dto, user);
  }

  @Get('passports')
  findAllPassports(@Query() filter: CscFilterDto) {
    return this.passportsService.findAll(filter);
  }

  @Get('passports/:id')
  findOnePassport(@Param('id') id: string) {
    return this.passportsService.findOne(id);
  }

  @Put('passports/:id')
  updatePassport(@Param('id') id: string, @Body() dto: UpdatePassportDto) {
    return this.passportsService.update(id, dto);
  }

  @Delete('passports/:id')
  @Roles(Role.ADMIN)
  removePassport(@Param('id') id: string) {
    return this.passportsService.softDelete(id);
  }

  // ── Voter Card Endpoints ───────────────────────────────────────────────────

  @Post('voter-cards')
  createVoterCard(@Body() dto: CreateVoterCardDto, @CurrentUser() user: User) {
    return this.voterCardsService.create(dto, user);
  }

  @Get('voter-cards')
  findAllVoterCards(@Query() filter: CscFilterDto) {
    return this.voterCardsService.findAll(filter);
  }

  @Get('voter-cards/:id')
  findOneVoterCard(@Param('id') id: string) {
    return this.voterCardsService.findOne(id);
  }

  @Put('voter-cards/:id')
  updateVoterCard(@Param('id') id: string, @Body() dto: UpdateVoterCardDto) {
    return this.voterCardsService.update(id, dto);
  }

  @Delete('voter-cards/:id')
  @Roles(Role.ADMIN)
  removeVoterCard(@Param('id') id: string) {
    return this.voterCardsService.softDelete(id);
  }
}
