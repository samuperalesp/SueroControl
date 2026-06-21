import { Module } from '@nestjs/common';
import { PackageController } from './presentation/package/controllers/package.controller';
import { PackageService } from './application/package/services/package.service';
import { PackagePrismaRepository } from './infrastructure/package/repositories/package.prisma.repository';
import { PACKAGE_REPOSITORY } from './domain/package/interfaces/package.interface';
import { PRODUCT_REPOSITORY } from './domain/product/interfaces/product.interface';
import { ProductPrismaRepository } from './infrastructure/product/repositories/product.prisma.repository';
import { INVENTORY_MOVEMENT_REPOSITORY } from './domain/inventory-movement/interfaces/inventory-movement.interface';
import { InventoryMovementPrismaRepository } from './infrastructure/inventory-movement/repositories/inventory-movement.prisma.repository';
import { SALE_REPOSITORY } from './domain/sale/interfaces/sale.interface';
import { SalePrismaRepository } from './infrastructure/sale/repositories/sale.prisma.repository';

@Module({
  controllers: [PackageController],
  providers: [
    PackageService,
    { provide: PACKAGE_REPOSITORY, useClass: PackagePrismaRepository },
    { provide: PRODUCT_REPOSITORY, useClass: ProductPrismaRepository },
    { provide: INVENTORY_MOVEMENT_REPOSITORY, useClass: InventoryMovementPrismaRepository },
    { provide: SALE_REPOSITORY, useClass: SalePrismaRepository },
  ],
  exports: [PackageService],
})
export class PackageModule {}
