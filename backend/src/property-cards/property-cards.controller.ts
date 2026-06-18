import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PropertyCardsService } from './property-cards.service';
import {
  CreatePropertyCardDto,
  UpdatePropertyCardDto,
  PropertyCardFilterDto,
} from './property-cards.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums';
import { User } from '../users/user.entity';

@Controller('property-cards')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PropertyCardsController {
  constructor(private readonly service: PropertyCardsService) {}

  @Post()
  create(@Body() dto: CreatePropertyCardDto, @CurrentUser() user: User) {
    return this.service.create(dto, user);
  }

  @Get()
  findAll(@Query() filter: PropertyCardFilterDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePropertyCardDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.softDelete(id);
  }
}
