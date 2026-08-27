import { Controller, Get, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { InventoryMovementService } from '../../../application/inventory-movement/services/inventory-movement.service';

@Controller('inventory-movements')
export class InventoryMovementController {
  constructor(private readonly movementService: InventoryMovementService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query('warehouseId') warehouseId?: string) {
    return this.movementService.findAll(warehouseId);
  }

  @Get('product/:productId')
  @HttpCode(HttpStatus.OK)
  async findByProduct(@Param('productId') productId: string, @Query('warehouseId') warehouseId?: string) {
    return this.movementService.findByProductId(productId, warehouseId);
  }
}
