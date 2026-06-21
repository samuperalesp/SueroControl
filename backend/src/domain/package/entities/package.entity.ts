import { PackageDetail } from './package-detail.entity';

export class Package {
  id: string;
  nombre: string;
  precio: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
  details?: PackageDetail[];
}
