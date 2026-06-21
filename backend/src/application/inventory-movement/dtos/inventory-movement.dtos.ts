import { IsString, IsNumber } from 'class-validator';

export class InventoryMovementResponseDto {
  @IsString()
  id: string;

  @IsString()
  productId: string;

  @IsString()
  movementType: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  stockBefore: number;

  @IsNumber()
  stockAfter: number;

  @IsString()
  referenceType: string;

  @IsString()
  referenceId: string;

  @IsString()
  createdAt: Date;
}
