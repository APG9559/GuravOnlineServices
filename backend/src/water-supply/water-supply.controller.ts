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
  findAllRecords(@Query() filter: WaterSupplyFilterDto) {
    return this.service.findAllRecords(filter);
  }

  @Get("records/:id")
  findOneRecord(@Param("id") id: string) {
    return this.service.findOneRecord(id);
  }

  @Post("records")
  createRecord(
    @Body() dto: CreateWaterServiceRecordDto,
    @CurrentUser() user: User,
  ) {
    return this.service.createRecord(dto, user);
  }

  @Put("records/:id")
  updateRecord(
    @Param("id") id: string,
    @Body() dto: UpdateWaterServiceRecordDto,
  ) {
    return this.service.updateRecord(id, dto);
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
