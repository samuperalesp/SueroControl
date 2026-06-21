import { InventoryMovement } from '../entities/inventory-movement.entity';

export const INVENTORY_MOVEMENT_REPOSITORY = 'INVENTORY_MOVEMENT_REPOSITORY';

export interface IInventoryMovementRepository {
  create(data: {
    productId: string;
    movementType: string;
    quantity: number;
    stockBefore: number;
    stockAfter: number;
    referenceType: string;
    referenceId: string;
  }): Promise<InventoryMovement>;
  findByProductId(productId: string): Promise<InventoryMovement[]>;
  findAll(): Promise<InventoryMovement[]>;
}
