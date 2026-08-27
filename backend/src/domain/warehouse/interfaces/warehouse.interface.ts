import { Warehouse } from '../entities/warehouse.entity';

export const WAREHOUSE_REPOSITORY = 'WAREHOUSE_REPOSITORY';

export interface IWarehouseRepository {
  findById(id: string): Promise<Warehouse | undefined>;
  findPrincipal(): Promise<Warehouse | undefined>;
  findActive(): Promise<Warehouse[]>;
  findAll(): Promise<Warehouse[]>;
  create(data: { nombre: string; esPrincipal?: boolean; activo?: boolean }): Promise<Warehouse>;
  update(id: string, data: { nombre?: string; esPrincipal?: boolean; activo?: boolean }): Promise<Warehouse | undefined>;
}
