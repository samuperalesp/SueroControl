import { Package } from '../entities/package.entity';

export const PACKAGE_REPOSITORY = 'PACKAGE_REPOSITORY';

export interface IPackageRepository {
  createWithDetails(data: {
    nombre: string;
    precio: number;
    activo: boolean;
    details: { productId: string; quantity: number }[];
  }): Promise<Package>;
  findAll(): Promise<Package[]>;
  findById(id: string): Promise<Package | null>;
  update(id: string, data: { nombre?: string; precio?: number; activo?: boolean }): Promise<Package | null>;
  delete(id: string): Promise<boolean>;
}
