import { Module } from '@nestjs/common';
import { PurchaseController } from './presentation/purchase/controllers/purchase.controller';
import { PurchaseService } from './application/purchase/services/purchase.service';
import { PurchasePrismaRepository } from './infrastructure/purchase/repositories/purchase.prisma.repository';
import { PURCHASE_REPOSITORY } from './domain/purchase/interfaces/purchase.interface';
import { PRODUCT_REPOSITORY } from './domain/product/interfaces/product.interface';
import { ProductPrismaRepository } from './infrastructure/product/repositories/product.prisma.repository';
import { INVENTORY_MOVEMENT_REPOSITORY } from './domain/inventory-movement/interfaces/inventory-movement.interface';
import { InventoryMovementPrismaRepository } from './infrastructure/inventory-movement/repositories/inventory-movement.prisma.repository';
import { TERCERO_REPOSITORY } from './domain/tercero/interfaces/tercero.interface';
import { TerceroPrismaRepository } from './infrastructure/tercero/repositories/tercero.prisma.repository';

@Module({
  controllers: [PurchaseController],
  providers: [
    PurchaseService,
    { provide: PURCHASE_REPOSITORY, useClass: PurchasePrismaRepository },
    { provide: PRODUCT_REPOSITORY, useClass: ProductPrismaRepository },
    { provide: INVENTORY_MOVEMENT_REPOSITORY, useClass: InventoryMovementPrismaRepository },
    { provide: TERCERO_REPOSITORY, useClass: TerceroPrismaRepository },
  ],
  exports: [PurchaseService],
})
export class PurchaseModule {}
