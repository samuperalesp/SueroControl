import { Sale } from '../entities/sale.entity';

export const SALE_REPOSITORY = 'SALE_REPOSITORY';
export const SALE_HISTORY_REPOSITORY = 'SALE_HISTORY_REPOSITORY';

export interface SaleDetailData {
  productId?: string;
  packageId?: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
}

export interface SaleHistoryData {
  saleId: string;
  campo: string;
  valorAnterior?: string;
  valorNuevo?: string;
  userId?: string;
}

export interface SaleSearchParams {
  consecutivo?: number;
  terceroId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface UpdateSaleData {
  terceroId?: string;
  medicoId?: string;
  total?: number;
  estado?: string;
  fechaVenta?: Date;
  details?: SaleDetailData[];
}

export interface ISaleRepository {
  createWithDetails(data: {
    consecutivo: number;
    terceroId?: string;
    medicoId?: string;
    total: number;
    fechaVenta?: Date;
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
  update(id: string, data: UpdateSaleData): Promise<Sale>;
  cancel(id: string, motivo: string): Promise<Sale>;
}

export interface ISaleHistoryRepository {
  create(data: SaleHistoryData): Promise<void>;
  findBySaleId(saleId: string): Promise<SaleHistoryData[]>;
}
