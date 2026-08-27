import { Module } from '@nestjs/common';
import { WarehouseController } from './presentation/warehouse/controllers/warehouse.controller';
import { WarehouseService } from './application/warehouse/services/warehouse.service';
import { WAREHOUSE_REPOSITORY } from './domain/warehouse/interfaces/warehouse.interface';
import { WarehousePrismaRepository } from './infrastructure/warehouse/repositories/warehouse.prisma.repository';
import { WAREHOUSE_STOCK_REPOSITORY } from './domain/warehouse-stock/interfaces/warehouse-stock.interface';
import { WarehouseStockPrismaRepository } from './infrastructure/warehouse-stock/repositories/warehouse-stock.prisma.repository';

@Module({
  controllers: [WarehouseController],
  providers: [
    WarehouseService,
    { provide: WAREHOUSE_REPOSITORY, useClass: WarehousePrismaRepository },
    { provide: WAREHOUSE_STOCK_REPOSITORY, useClass: WarehouseStockPrismaRepository },
  ],
  exports: [WAREHOUSE_REPOSITORY, WAREHOUSE_STOCK_REPOSITORY],
})
export class WarehouseModule {}
