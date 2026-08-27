import { WarehouseStock } from '../entities/warehouse-stock.entity';

export const WAREHOUSE_STOCK_REPOSITORY = 'WAREHOUSE_STOCK_REPOSITORY';

export interface IWarehouseStockRepository {
  findByWarehouseAndProduct(warehouseId: string, productId: string): Promise<WarehouseStock | undefined>;
  findByProduct(productId: string): Promise<WarehouseStock[]>;
  findByWarehouse(warehouseId: string): Promise<WarehouseStock[]>;
  updateStock(warehouseId: string, productId: string, quantity: number): Promise<WarehouseStock | undefined>;
  setStock(warehouseId: string, productId: string, stock: number, stockMinimo: number): Promise<WarehouseStock>;
  upsert(warehouseId: string, productId: string, stock: number, stockMinimo: number): Promise<WarehouseStock>;
}
