import { Controller, Get, Post, Patch, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { PackageSessionService } from '../../../application/package-session/services/package-session.service';
import { CreatePackageSessionDto, ApplySessionDto } from '../../../application/package-session/dtos/package-session.dtos';
import { Roles } from '../../../infrastructure/auth/decorators/roles.decorator';

@Controller('package-sessions')
export class PackageSessionController {
  constructor(private readonly packageSessionService: PackageSessionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMINISTRADOR', 'OPERADOR')
  async create(@Body() dto: CreatePackageSessionDto) {
    return this.packageSessionService.create(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles('ADMINISTRADOR', 'OPERADOR')
  async findAll() {
    return this.packageSessionService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMINISTRADOR', 'OPERADOR')
  async findOne(@Param('id') id: string) {
    return this.packageSessionService.findById(id);
  }

  @Post(':id/apply')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMINISTRADOR', 'OPERADOR')
  async applySession(@Param('id') id: string, @Body() dto: ApplySessionDto) {
    return this.packageSessionService.applySession(id, dto);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMINISTRADOR')
  async cancel(@Param('id') id: string) {
    return this.packageSessionService.cancel(id);
  }
}
