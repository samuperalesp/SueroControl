import { Purchase } from '../entities/purchase.entity';

export const PURCHASE_REPOSITORY = 'PURCHASE_REPOSITORY';

export interface IPurchaseRepository {
  createWithDetails(data: {
    tipo?: string;
    pedidoId?: string;
    facturaNumero?: string;
    terceroId?: string;
    warehouseId: string;
    total: number;
    fechaCompra?: Date;
    details: { productId: string; quantity: number; unitCost: number; subTotal: number }[];
  }): Promise<Purchase>;
  findAll(warehouseId?: string): Promise<Purchase[]>;
  findById(id: string): Promise<Purchase | null>;
  update(id: string, data: { tipo?: string; pedidoId?: string; terceroId?: string; warehouseId?: string; total?: number; fechaCompra?: Date; details?: { productId: string; quantity: number; unitCost: number; subTotal: number }[] }): Promise<Purchase | null>;
}
