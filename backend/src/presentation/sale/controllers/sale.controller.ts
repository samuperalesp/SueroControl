import { Controller, Get, Post, Put, Patch, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { SaleService } from '../../../application/sale/services/sale.service';
import { CreateSaleDto, UpdateSaleDto, CancelSaleDto, SaleSearchDto } from '../../../application/sale/dtos/sale.dtos';
import { CurrentUser } from '../../../infrastructure/auth/decorators/current-user.decorator';
import { Roles } from '../../../infrastructure/auth/decorators/roles.decorator';

@Controller('sales')
export class SaleController {
  constructor(private readonly saleService: SaleService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMINISTRADOR', 'OPERADOR')
  async create(@Body() dto: CreateSaleDto) {
    return this.saleService.create(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles('ADMINISTRADOR', 'OPERADOR')
  async findAll(@Query() query: SaleSearchDto) {
    if (query.consecutivo || query.terceroId || query.fechaDesde || query.fechaHasta) {
      return this.saleService.findAll({
        consecutivo: query.consecutivo,
        terceroId: query.terceroId,
        fechaDesde: query.fechaDesde,
        fechaHasta: query.fechaHasta,
      });
    }
    return this.saleService.findAll();
  }

  @Get('comprobante/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMINISTRADOR', 'OPERADOR')
  async getComprobante(@Param('id') id: string) {
    return this.saleService.getComprobante(id);
  }

  @Get('consecutivo/:num')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMINISTRADOR', 'OPERADOR')
  async findByConsecutivo(@Param('num', ) num: string) {
    return this.saleService.findByConsecutivo(parseInt(num, 10));
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMINISTRADOR', 'OPERADOR')
  async findOne(@Param('id') id: string) {
    return this.saleService.findById(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMINISTRADOR')
  async update(@Param('id') id: string, @Body() dto: UpdateSaleDto, @CurrentUser() user: any) {
    return this.saleService.update(id, dto, user?.sub);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMINISTRADOR')
  async cancel(@Param('id') id: string, @Body() dto: CancelSaleDto) {
    return this.saleService.cancel(id, dto);
  }
}
