import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { TerceroService } from '../../../application/tercero/services/tercero.service';
import { CreateTerceroDto, UpdateTerceroDto } from '../../../application/tercero/dtos/tercero.dtos';

@Controller('terceros')
export class TerceroController {
  constructor(private readonly terceroService: TerceroService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTerceroDto) {
    return this.terceroService.create(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll() {
    return this.terceroService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return this.terceroService.findById(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdateTerceroDto) {
    return this.terceroService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.terceroService.delete(id);
  }
}
