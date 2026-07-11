import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { WaterSupplyService } from "./water-supply.service";
import { WaterServiceRecord } from "./water-service-record.entity";
import {
  CreateWaterServiceRecordDto,
  UpdateWaterServiceRecordDto,
  CreateWaterPaymentDto,
  CreateWaterFeeConfigDto,
  CreateWaterDocumentDto,
  WaterSupplyFilterDto,
} from "./water-supply.dto";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { Role } from "../common/enums";
import { User } from "../users/user.entity";

function flattenWaterRecord(record: WaterServiceRecord): any {
  if (!record) return record;
  const connection: any = record.connection || {};
  const details: any = record.details || {};

  return {
    ...record,
    // Flat connection fields
    connectionNo: connection.connectionNo || null,
    customerName: connection.currentOwner || (connection.customer?.name) || null,
    phone: connection.contactPersonPhone || (connection.customer?.phone) || null,
    connectionAddress: connection.connectionAddress || null,
    address: connection.connectionAddress || null, // generic fallback
    contactPersonName: connection.contactPersonName || null,
    contactPersonPhone: connection.contactPersonPhone || null,
    currentUsage: connection.currentUsage || null,
    meterDetails: connection.meterDetails || null,

    // Flat details fields
    plumberName: details.plumberName || null,
    plumberPhone: details.plumberPhone || null,
    newOwnerName: details.newOwnerName || null,
    newOwnerPhone: details.newOwnerPhone || null,
    transferSubtype: details.transferSubtype || null,
    newUsage: details.newUsage || null,
    currentOwner: details.currentOwner || connection.currentOwner || null,
  };
}

@Controller("water-supply")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class WaterSupplyController {
  constructor(private readonly service: WaterSupplyService) {}

  // ── Configs ────────────────────────────────────────────────────────────────

  @Get("configs")
  findAllConfigs() {
    return this.service.findAllConfigs();
  }

  @Post("configs")
  @Roles(Role.ADMIN)
  createConfig(@Body() dto: CreateWaterFeeConfigDto) {
    return this.service.createConfig(dto);
  }

  @Put("configs/:id")
  @Roles(Role.ADMIN)
  updateConfig(@Param("id") id: string, @Body() dto: CreateWaterFeeConfigDto) {
    return this.service.updateConfig(id, dto);
  }

  @Delete("configs/:id")
  @Roles(Role.ADMIN)
  deleteConfig(@Param("id") id: string) {
    return this.service.deleteConfig(id);
  }

  // ── Connections ────────────────────────────────────────────────────────────

  @Get("connections")
  findAllConnections(@Query() filter: WaterSupplyFilterDto) {
    return this.service.findAllConnections(filter);
  }

  @Get("connections/:id")
  findConnectionDetails(@Param("id") id: string) {
    return this.service.findConnectionDetails(id);
  }

  @Post("connections/:id/approve")
  approveConnection(
    @Param("id") id: string,
    @Body("connectionNo") connectionNo: string,
    @CurrentUser() user: User,
  ) {
    return this.service.approveConnection(id, connectionNo, user);
  }

  // ── Service Records ────────────────────────────────────────────────────────

  @Get("records")
  async findAllRecords(@Query() filter: WaterSupplyFilterDto) {
    const res = await this.service.findAllRecords(filter);
    if (res && res.records) {
      res.records = res.records.map((r) => flattenWaterRecord(r));
    } else if (Array.isArray(res)) {
      return res.map((r) => flattenWaterRecord(r));
    }
    return res;
  }

  @Get("records/:id")
  async findOneRecord(@Param("id") id: string) {
    const record = await this.service.findOneRecord(id);
    return flattenWaterRecord(record);
  }

  @Post("records")
  async createRecord(
    @Body() dto: CreateWaterServiceRecordDto,
    @CurrentUser() user: User,
  ) {
    const record = await this.service.createRecord(dto, user);
    return flattenWaterRecord(record);
  }

  @Put("records/:id")
  async updateRecord(
    @Param("id") id: string,
    @Body() dto: UpdateWaterServiceRecordDto,
  ) {
    const record = await this.service.updateRecord(id, dto);
    return flattenWaterRecord(record);
  }

  @Delete("records/:id")
  @Roles(Role.ADMIN)
  removeRecord(@Param("id") id: string) {
    return this.service.softDelete(id);
  }

  // ── Payments ──────────────────────────────────────────────────────────────

  @Get("payments")
  findAllPayments(@Query() filter: WaterSupplyFilterDto) {
    return this.service.findAllPayments(filter);
  }

  @Post("records/:id/payments")
  createPayment(
    @Param("id") recordId: string,
    @Body() dto: CreateWaterPaymentDto,
    @CurrentUser() user: User,
  ) {
    return this.service.createPayment(recordId, dto, user);
  }

  @Delete("payments/:id")
  @Roles(Role.ADMIN)
  deletePayment(@Param("id") id: string) {
    return this.service.deletePayment(id);
  }

  // ── Documents ──────────────────────────────────────────────────────────────

  @Post("records/:id/documents")
  createDocument(
    @Param("id") recordId: string,
    @Body() dto: CreateWaterDocumentDto,
    @CurrentUser() user: User,
  ) {
    return this.service.createDocument(recordId, dto, user);
  }

  @Delete("documents/:id")
  deleteDocument(@Param("id") id: string) {
    return this.service.deleteDocument(id);
  }
}
