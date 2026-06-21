import { Injectable, Inject } from '@nestjs/common';
import { INVENTORY_MOVEMENT_REPOSITORY } from '../../../domain/inventory-movement/interfaces/inventory-movement.interface';
import type { IInventoryMovementRepository } from '../../../domain/inventory-movement/interfaces/inventory-movement.interface';
import { InventoryMovement } from '../../../domain/inventory-movement/entities/inventory-movement.entity';

@Injectable()
export class InventoryMovementService {
  constructor(
    @Inject(INVENTORY_MOVEMENT_REPOSITORY) private readonly movementRepository: IInventoryMovementRepository,
  ) {}

  async findAll(): Promise<InventoryMovement[]> {
    return this.movementRepository.findAll();
  }

  async findByProductId(productId: string): Promise<InventoryMovement[]> {
    return this.movementRepository.findByProductId(productId);
  }
}
