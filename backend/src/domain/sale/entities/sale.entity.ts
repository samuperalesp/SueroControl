import { SaleDetail } from './sale-detail.entity';

export class Sale {
  id: string;
  consecutivo: number;
  terceroId?: string;
  medicoId?: string;
  total: number;
  fechaVenta?: Date;
  costoTotal?: number;
  utilidadTotal?: number;
  gananciaMedico?: number;
  gananciaCentro?: number;
  estado: string;
  anuladaMotivo?: string;
  anuladaAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  details?: SaleDetail[];
}
