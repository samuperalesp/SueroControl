export class InventoryMovement {
  id: string;
  productId: string;
  warehouseId?: string;
  movementType: string;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  referenceType: string;
  referenceId: string;
  createdAt: Date;
}
