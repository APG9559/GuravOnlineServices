import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MarriagesService } from './marriages.service';
import {
  CreateMarriageDto, UpdateMarriageDto, MarriageFilterDto,
  CreateMarriageTicketDto, TicketFilterDto, UpdateMarriageTicketDto,
  ConfirmTicketPayloadDto, AddPaymentDto,
} from './marriages.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums';
import { User } from '../users/user.entity';

@Controller('marriages')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class MarriagesController {
  constructor(private readonly service: MarriagesService) {}

  // ── Ticket endpoints (must be before :id routes) ────────────────────────

  @Post('tickets')
  createTicket(@Body() dto: CreateMarriageTicketDto, @CurrentUser() user: User) {
    return this.service.createTicket(dto, user);
  }

  @Get('tickets')
  findAllTickets(@Query() filter: TicketFilterDto) {
    return this.service.findAllTickets(filter);
  }

  @Get('tickets/:id')
  findOneTicket(@Param('id') id: string) {
    return this.service.findOneTicket(id);
  }

  @Put('tickets/:id')
  updateTicket(@Param('id') id: string, @Body() dto: UpdateMarriageTicketDto) {
    return this.service.updateTicket(id, dto);
  }

  @Post('tickets/:id/confirm')
  confirmTicket(
    @Param('id') id: string,
    @Body() dto: ConfirmTicketPayloadDto,
    @CurrentUser() user: User,
  ) {
    return this.service.confirmTicket(id, dto, user);
  }

  // ── Marriage CRUD ───────────────────────────────────────────────────────

  @Post()
  create(@Body() dto: CreateMarriageDto, @CurrentUser() user: User) {
    return this.service.create(dto, user);
  }

  @Get()
  findAll(@Query() filter: MarriageFilterDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMarriageDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.softDelete(id);
  }

  @Post('payments')
  addPayment(@Body() dto: AddPaymentDto, @CurrentUser() user: User) {
    return this.service.addPayment(dto, user);
  }

  @Delete('payments/:id')
  @Roles(Role.ADMIN)
  deletePayment(@Param('id') id: string) {
    return this.service.softDeletePayment(id);
  }
}
