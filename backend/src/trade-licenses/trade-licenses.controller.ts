import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards, Patch
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TradeLicensesService } from './trade-licenses.service';
import {
  CreateTradeTypeConfigDto,
  CreateTradeLicenseRecordDto,
  UpdateTradeLicenseRecordDto,
  TradeLicenseFilterDto,
  CreateTradeLicensePaymentDto,
  TradeLicensePaymentFilterDto,
} from './trade-licenses.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums';
import { User } from '../users/user.entity';

@Controller('trade-licenses')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TradeLicensesController {
  constructor(private readonly service: TradeLicensesService) {}

  // ── Config Management ──
  @Get('configs')
  findAllConfigs() {
    return this.service.findAllConfigs();
  }

  @Post('configs')
  createConfig(@Body() dto: CreateTradeTypeConfigDto) {
    return this.service.createConfig(dto);
  }

  @Delete('configs/:id')
  @Roles(Role.ADMIN)
  removeConfig(@Param('id') id: string) {
    return this.service.deleteConfig(id);
  }

  // ── Businesses Management ──
  @Get('businesses')
  findAllBusinesses(@Query() filter: TradeLicenseFilterDto) {
    return this.service.findAllBusinesses(filter);
  }

  @Get('businesses/renewal-queue')
  getRenewalQueue() {
    return this.service.getRenewalQueue();
  }

  @Get('businesses/:id')
  findBusinessDetails(@Param('id') id: string) {
    return this.service.findBusinessDetails(id);
  }

  // ── Payment Management ──
  @Get('payments')
  findAllPayments(@Query() filter: TradeLicensePaymentFilterDto) {
    return this.service.findAllPayments(filter);
  }

  @Post('records/:id/payments')
  addPayment(
    @Param('id') recordId: string,
    @Body() dto: CreateTradeLicensePaymentDto,
    @CurrentUser() user: User,
  ) {
    return this.service.addPayment(recordId, dto, user);
  }

  @Delete('payments/:id')
  @Roles(Role.ADMIN)
  removePayment(@Param('id') id: string) {
    return this.service.deletePayment(id);
  }

  // ── Record Management ──
  @Post()
  createRecord(@Body() dto: CreateTradeLicenseRecordDto, @CurrentUser() user: User) {
    return this.service.createRecord(dto, user);
  }

  @Get()
  findAllRecords(@Query() filter: TradeLicenseFilterDto) {
    return this.service.findAllRecords(filter);
  }

  @Get(':id')
  findOneRecord(@Param('id') id: string) {
    return this.service.findOneRecord(id);
  }

  @Put(':id')
  updateRecord(@Param('id') id: string, @Body() dto: UpdateTradeLicenseRecordDto) {
    return this.service.updateRecord(id, dto);
  }

  @Patch(':id/approve')
  approveApplication(@Param('id') id: string, @Body('licenseNo') licenseNo: string) {
    return this.service.approveApplication(id, licenseNo);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  removeRecord(@Param('id') id: string) {
    return this.service.deleteRecord(id);
  }
}
