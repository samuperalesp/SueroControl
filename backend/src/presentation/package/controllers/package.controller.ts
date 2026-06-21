import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { PackageService } from '../../../application/package/services/package.service';
import { CreatePackageDto, UpdatePackageDto } from '../../../application/package/dtos/package.dtos';

@Controller('packages')
export class PackageController {
  constructor(private readonly packageService: PackageService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePackageDto) {
    return this.packageService.create(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll() {
    return this.packageService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return this.packageService.findById(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
    return this.packageService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.packageService.delete(id);
  }

  @Post(':id/sell')
  @HttpCode(HttpStatus.CREATED)
  async sell(
    @Param('id') id: string,
    @Body() body: { terceroId?: string },
  ) {
    return this.packageService.sellPackage(id, body.terceroId);
  }
}
