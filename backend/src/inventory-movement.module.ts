import { Module } from '@nestjs/common';
import { InventoryMovementController } from './presentation/inventory-movement/controllers/inventory-movement.controller';
import { InventoryMovementService } from './application/inventory-movement/services/inventory-movement.service';
import { InventoryMovementPrismaRepository } from './infrastructure/inventory-movement/repositories/inventory-movement.prisma.repository';
import { INVENTORY_MOVEMENT_REPOSITORY } from './domain/inventory-movement/interfaces/inventory-movement.interface';

@Module({
  controllers: [InventoryMovementController],
  providers: [
    InventoryMovementService,
    { provide: INVENTORY_MOVEMENT_REPOSITORY, useClass: InventoryMovementPrismaRepository },
  ],
  exports: [InventoryMovementService],
})
export class InventoryMovementModule {}
