import { Controller, Get, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { InventoryMovementService } from '../../../application/inventory-movement/services/inventory-movement.service';
import { Roles } from '../../../infrastructure/auth/decorators/roles.decorator';

@Controller('inventory-movements')
export class InventoryMovementController {
  constructor(private readonly movementService: InventoryMovementService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query('warehouseId') warehouseId?: string) {
    return this.movementService.findAll(warehouseId);
  }

  @Get('transfers')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMINISTRADOR', 'OPERADOR')
  async findTransfers(@Query('warehouseId') warehouseId?: string) {
    return this.movementService.findTransfers(warehouseId);
  }

  @Get('product/:productId')
  @HttpCode(HttpStatus.OK)
  async findByProduct(@Param('productId') productId: string, @Query('warehouseId') warehouseId?: string) {
    return this.movementService.findByProductId(productId, warehouseId);
  }
}
