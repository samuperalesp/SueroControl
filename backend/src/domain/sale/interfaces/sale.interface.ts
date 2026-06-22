import { Sale } from '../entities/sale.entity';

export const SALE_REPOSITORY = 'SALE_REPOSITORY';

export interface SaleDetailData {
  productId?: string;
  packageId?: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
}

export interface SaleSearchParams {
  consecutivo?: number;
  terceroId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface ISaleRepository {
  createWithDetails(data: {
    consecutivo: number;
    terceroId?: string;
    medicoId?: string;
    total: number;
    costoTotal?: number;
    utilidadTotal?: number;
    gananciaMedico?: number;
    gananciaCentro?: number;
    details: SaleDetailData[];
  }): Promise<Sale>;
  findAll(params?: SaleSearchParams): Promise<Sale[]>;
  findById(id: string): Promise<Sale | null>;
  findByConsecutivo(consecutivo: number): Promise<Sale | null>;
  findMaxConsecutivo(): Promise<number>;
  update(id: string, data: { terceroId?: string; medicoId?: string; total?: number; details?: SaleDetailData[] }): Promise<Sale>;
  cancel(id: string, motivo: string): Promise<Sale>;
}
