import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PropertyTaxService } from './property-tax.service';
import {
  CreatePropertyTaxDto,
  UpdatePropertyTaxDto,
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

  @Post()
  create(@Body() dto: CreatePropertyTaxDto, @CurrentUser() user: User) {
    return this.service.create(dto, user);
  }

  @Get()
  findAll(@Query() filter: PropertyTaxFilterDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePropertyTaxDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.softDelete(id);
  }
}
