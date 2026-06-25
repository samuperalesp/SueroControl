import { Module } from '@nestjs/common';
import { PackageSessionController } from './presentation/package-session/controllers/package-session.controller';
import { PackageSessionService } from './application/package-session/services/package-session.service';
import { PackageSessionPrismaRepository } from './infrastructure/package-session/repositories/package-session.prisma.repository';
import { PACKAGE_SESSION_REPOSITORY } from './domain/package-session/interfaces/package-session.interface';
import { SALE_REPOSITORY } from './domain/sale/interfaces/sale.interface';
import { SalePrismaRepository } from './infrastructure/sale/repositories/sale.prisma.repository';
import { PACKAGE_REPOSITORY, SALE_PACKAGE_REPOSITORY } from './domain/package/interfaces/package.interface';
import { PackagePrismaRepository } from './infrastructure/package/repositories/package.prisma.repository';
import { SalePackagePrismaRepository } from './infrastructure/sale-package/repositories/sale-package.prisma.repository';
import { PRODUCT_REPOSITORY } from './domain/product/interfaces/product.interface';
import { ProductPrismaRepository } from './infrastructure/product/repositories/product.prisma.repository';
import { INVENTORY_MOVEMENT_REPOSITORY } from './domain/inventory-movement/interfaces/inventory-movement.interface';
import { InventoryMovementPrismaRepository } from './infrastructure/inventory-movement/repositories/inventory-movement.prisma.repository';
import { TERCERO_REPOSITORY } from './domain/tercero/interfaces/tercero.interface';
import { TerceroPrismaRepository } from './infrastructure/tercero/repositories/tercero.prisma.repository';

@Module({
  controllers: [PackageSessionController],
  providers: [
    PackageSessionService,
    { provide: PACKAGE_SESSION_REPOSITORY, useClass: PackageSessionPrismaRepository },
    { provide: SALE_REPOSITORY, useClass: SalePrismaRepository },
    { provide: PACKAGE_REPOSITORY, useClass: PackagePrismaRepository },
    { provide: SALE_PACKAGE_REPOSITORY, useClass: SalePackagePrismaRepository },
    { provide: PRODUCT_REPOSITORY, useClass: ProductPrismaRepository },
    { provide: INVENTORY_MOVEMENT_REPOSITORY, useClass: InventoryMovementPrismaRepository },
    { provide: TERCERO_REPOSITORY, useClass: TerceroPrismaRepository },
  ],
  exports: [PackageSessionService],
})
export class PackageSessionModule {}
