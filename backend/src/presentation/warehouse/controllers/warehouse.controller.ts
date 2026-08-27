import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { WarehouseService } from '../../../application/warehouse/services/warehouse.service';
import { CreateWarehouseDto, UpdateWarehouseDto } from '../../../application/warehouse/dtos/warehouse.dtos';
import { Roles } from '../../../infrastructure/auth/decorators/roles.decorator';

@Controller('warehouses')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findActive() {
    return this.warehouseService.findActive();
  }

  @Get('all')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMINISTRADOR')
  async findAll() {
    return this.warehouseService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMINISTRADOR')
  async create(@Body() dto: CreateWarehouseDto) {
    return this.warehouseService.create(dto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMINISTRADOR')
  async update(@Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    return this.warehouseService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMINISTRADOR')
  async remove(@Param('id') id: string) {
    await this.warehouseService.delete(id);
  }
}
