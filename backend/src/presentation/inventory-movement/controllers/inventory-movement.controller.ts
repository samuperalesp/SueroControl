import { Controller, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { InventoryMovementService } from '../../../application/inventory-movement/services/inventory-movement.service';

@Controller('inventory-movements')
export class InventoryMovementController {
  constructor(private readonly movementService: InventoryMovementService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll() {
    return this.movementService.findAll();
  }

  @Get('product/:productId')
  @HttpCode(HttpStatus.OK)
  async findByProduct(@Param('productId') productId: string) {
    return this.movementService.findByProductId(productId);
  }
}
