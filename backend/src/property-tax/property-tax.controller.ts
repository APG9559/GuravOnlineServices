import {
  Controller, Get, Post, Put, Delete, Patch,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PropertyTaxService, flattenPropertyTaxRecord } from './property-tax.service';
import {
  CreatePropertyTaxRecordDto,
  UpdatePropertyTaxRecordDto,
  CreatePropertyTaxPaymentDto,
  CreatePropertyTaxFeeConfigDto,
  PropertyTaxFilterDto,
} from './property-tax.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums';
import { User } from '../users/user.entity';

@Controller('property-tax')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PropertyTaxController {
  constructor(private readonly service: PropertyTaxService) {}

  // ── Fee Configs ────────────────────────────────────────────────────────────

  @Get('configs')
  findAllConfigs() {
    return this.service.findAllConfigs();
  }

  @Post('configs')
  @Roles(Role.ADMIN)
  createConfig(@Body() dto: CreatePropertyTaxFeeConfigDto) {
    return this.service.createConfig(dto);
  }

  @Put('configs/:id')
  @Roles(Role.ADMIN)
  updateConfig(@Param('id') id: string, @Body() dto: CreatePropertyTaxFeeConfigDto) {
    return this.service.updateConfig(id, dto);
  }

  @Delete('configs/:id')
  @Roles(Role.ADMIN)
  deleteConfig(@Param('id') id: string) {
    return this.service.deleteConfig(id);
  }

  // ── Properties ─────────────────────────────────────────────────────────────

  @Get('properties')
  findAllProperties(@Query() filter: PropertyTaxFilterDto) {
    return this.service.findAllProperties(filter);
  }

  @Get('properties/:id')
  findPropertyDetails(@Param('id') id: string) {
    return this.service.findPropertyDetails(id);
  }

  @Patch('properties/:id/approve')
  approveProperty(
    @Param('id') id: string,
    @Body('propertyTaxNo') propertyTaxNo: string,
  ) {
    return this.service.approveProperty(id, propertyTaxNo);
  }

  // ── Service Records ────────────────────────────────────────────────────────

  @Post('records')
  async createRecord(
    @Body() dto: CreatePropertyTaxRecordDto,
    @CurrentUser() user: User,
  ) {
    const record = await this.service.createRecord(dto, user);
    return flattenPropertyTaxRecord(record);
  }

  @Get('records')
  async findAllRecords(@Query() filter: PropertyTaxFilterDto) {
    const res = await this.service.findAllRecords(filter);
    if (res && (res as any).records) {
      (res as any).records = (res as any).records.map(flattenPropertyTaxRecord);
      return res;
    }
    if (Array.isArray(res)) {
      return res.map(flattenPropertyTaxRecord);
    }
    return res;
  }

  @Get('records/:id')
  async findOneRecord(@Param('id') id: string) {
    const record = await this.service.findOneRecord(id);
    return flattenPropertyTaxRecord(record);
  }

  @Put('records/:id')
  async updateRecord(
    @Param('id') id: string,
    @Body() dto: UpdatePropertyTaxRecordDto,
  ) {
    const record = await this.service.updateRecord(id, dto);
    return flattenPropertyTaxRecord(record);
  }

  @Delete('records/:id')
  @Roles(Role.ADMIN)
  deleteRecord(@Param('id') id: string) {
    return this.service.softDelete(id);
  }

  // ── Payments ───────────────────────────────────────────────────────────────

  @Get('payments')
  findAllPayments(@Query() filter: PropertyTaxFilterDto) {
    return this.service.findAllPayments(filter);
  }

  @Post('records/:id/payments')
  createPayment(
    @Param('id') recordId: string,
    @Body() dto: CreatePropertyTaxPaymentDto,
    @CurrentUser() user: User,
  ) {
    return this.service.createPayment(recordId, dto, user);
  }

  @Delete('payments/:id')
  @Roles(Role.ADMIN)
  deletePayment(@Param('id') id: string) {
    return this.service.deletePayment(id);
  }
}
