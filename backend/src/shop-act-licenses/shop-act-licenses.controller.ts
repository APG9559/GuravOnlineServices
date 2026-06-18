import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ShopActLicensesService } from './shop-act-licenses.service';
import {
  CreateShopActLicenseDto,
  UpdateShopActLicenseDto,
  ShopActLicenseFilterDto,
} from './shop-act-licenses.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums';
import { User } from '../users/user.entity';

@Controller('shop-act-licenses')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ShopActLicensesController {
  constructor(private readonly service: ShopActLicensesService) {}

  @Post()
  create(@Body() dto: CreateShopActLicenseDto, @CurrentUser() user: User) {
    return this.service.create(dto, user);
  }

  @Get()
  findAll(@Query() filter: ShopActLicenseFilterDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateShopActLicenseDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.softDelete(id);
  }
}
