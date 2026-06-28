import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CustomersService } from './customers.service';
import { CustomerHistoryService } from '../customer-history/customer-history.service';
import { CreateCustomerDto, UpdateCustomerDto, CustomerFilterDto } from './customers.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums';

@Controller('customers')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CustomersController {
  constructor(
    private readonly service: CustomersService,
    private readonly historyService: CustomerHistoryService,
  ) {}

  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() filter: CustomerFilterDto) {
    return this.service.findAll(filter);
  }

  @Get('lookup')
  lookup(@Query('phone') phone: string) {
    return this.service.lookup(phone);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.historyService.getCustomerDetails(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.softDelete(id);
  }
}
