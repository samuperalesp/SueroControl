import { SaleDetail } from './sale-detail.entity';

export class Sale {
  id: string;
  consecutivo: number;
  terceroId?: string;
  total: number;
  costoTotal?: number;
  utilidadTotal?: number;
  gananciaMedico?: number;
  gananciaCentro?: number;
  estado: string;
  anuladaMotivo?: string;
  anuladaAt?: Date;
  createdAt: Date;
  details?: SaleDetail[];
}
