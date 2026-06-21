import { PackageDetail } from './package-detail.entity';
import { PackageOperatingCost } from './package-operating-cost.entity';

export class Package {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  porcentajeMedico: number;
  porcentajeCentro: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
  details?: PackageDetail[];
  operatingCosts?: PackageOperatingCost[];
}
