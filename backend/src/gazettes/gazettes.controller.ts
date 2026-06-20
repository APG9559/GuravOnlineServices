import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GazettesService } from './gazettes.service';
import {
  CreateGazetteDto,
  UpdateGazetteDto,
  GazetteFilterDto,
} from './gazettes.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums';
import { User } from '../users/user.entity';

@Controller('gazettes')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class GazettesController {
  constructor(private readonly service: GazettesService) {}

  @Post()
  create(@Body() dto: CreateGazetteDto, @CurrentUser() user: User) {
    return this.service.create(dto, user);
  }

  @Get()
  findAll(@Query() filter: GazetteFilterDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGazetteDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.softDelete(id);
  }
}
