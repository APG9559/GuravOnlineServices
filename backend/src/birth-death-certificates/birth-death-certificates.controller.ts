import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BirthDeathCertificatesService } from './birth-death-certificates.service';
import { CreateBirthDeathCertificateDto, UpdateBirthDeathCertificateDto, BirthDeathCertificateFilterDto } from './birth-death-certificates.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums';
import { User } from '../users/user.entity';

@Controller('birth-death-certificates')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class BirthDeathCertificatesController {
  constructor(private readonly service: BirthDeathCertificatesService) {}

  @Post()
  create(@Body() dto: CreateBirthDeathCertificateDto, @CurrentUser() user: User) {
    return this.service.create(dto, user);
  }

  @Get()
  findAll(@Query() filter: BirthDeathCertificateFilterDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBirthDeathCertificateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.softDelete(id);
  }
}
