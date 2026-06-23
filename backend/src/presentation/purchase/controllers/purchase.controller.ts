import { Controller, Get, Post, Put, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { PurchaseService } from '../../../application/purchase/services/purchase.service';
import { CreatePurchaseDto, UpdatePurchaseDto } from '../../../application/purchase/dtos/purchase.dtos';

@Controller('purchases')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePurchaseDto) {
    return this.purchaseService.create(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll() {
    return this.purchaseService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return this.purchaseService.findById(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdatePurchaseDto) {
    return this.purchaseService.updatePedido(id, dto);
  }

  @Put(':id/convert')
  @HttpCode(HttpStatus.OK)
  async convert(@Param('id') id: string) {
    return this.purchaseService.convertPedidoToCompra(id);
  }
}
