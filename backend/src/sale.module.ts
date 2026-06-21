import { Module } from '@nestjs/common';
import { SaleController } from './presentation/sale/controllers/sale.controller';
import { SaleService } from './application/sale/services/sale.service';
import { SalePrismaRepository } from './infrastructure/sale/repositories/sale.prisma.repository';
import { SALE_REPOSITORY } from './domain/sale/interfaces/sale.interface';
import { PRODUCT_REPOSITORY } from './domain/product/interfaces/product.interface';
import { ProductPrismaRepository } from './infrastructure/product/repositories/product.prisma.repository';
import { INVENTORY_MOVEMENT_REPOSITORY } from './domain/inventory-movement/interfaces/inventory-movement.interface';
import { InventoryMovementPrismaRepository } from './infrastructure/inventory-movement/repositories/inventory-movement.prisma.repository';
import { TERCERO_REPOSITORY } from './domain/tercero/interfaces/tercero.interface';
import { TerceroPrismaRepository } from './infrastructure/tercero/repositories/tercero.prisma.repository';

@Module({
  controllers: [SaleController],
  providers: [
    SaleService,
    { provide: SALE_REPOSITORY, useClass: SalePrismaRepository },
    { provide: PRODUCT_REPOSITORY, useClass: ProductPrismaRepository },
    { provide: INVENTORY_MOVEMENT_REPOSITORY, useClass: InventoryMovementPrismaRepository },
    { provide: TERCERO_REPOSITORY, useClass: TerceroPrismaRepository },
  ],
  exports: [SaleService],
})
export class SaleModule {}
