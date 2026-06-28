import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto, ExpenseFilterDto } from './expenses.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { User } from '../users/user.entity';

@Controller('expenses')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ExpensesController {
  constructor(private readonly service: ExpensesService) {}

  @Post()
  create(@Body() dto: CreateExpenseDto, @CurrentUser() user: User) {
    return this.service.create(dto, user);
  }

  @Get()
  findAll(@Query() filter: ExpenseFilterDto, @CurrentUser() user: User) {
    return this.service.findAll(filter, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.findOne(id, user);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateExpenseDto, @CurrentUser() user: User) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.remove(id, user);
  }
}
