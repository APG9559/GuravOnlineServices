import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WaterSupplyService } from './water-supply.service';
import {
  CreateWaterSupplyDto,
  UpdateWaterSupplyDto,
  WaterSupplyFilterDto,
} from './water-supply.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums';
import { User } from '../users/user.entity';

@Controller('water-supply')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class WaterSupplyController {
  constructor(private readonly service: WaterSupplyService) {}

  @Post()
  create(@Body() dto: CreateWaterSupplyDto, @CurrentUser() user: User) {
    return this.service.create(dto, user);
  }

  @Get()
  findAll(@Query() filter: WaterSupplyFilterDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWaterSupplyDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.softDelete(id);
  }
}
