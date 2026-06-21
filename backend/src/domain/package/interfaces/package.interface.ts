import { Package } from '../entities/package.entity';
import { SalePackage } from '../entities/sale-package.entity';

export const PACKAGE_REPOSITORY = 'PACKAGE_REPOSITORY';

export interface PackageDetailData {
  productId: string;
  quantity: number;
}

export interface PackageOperatingCostData {
  concepto: string;
  valor: number;
}

export interface CreatePackageData {
  nombre: string;
  descripcion?: string;
  precio: number;
  porcentajeMedico: number;
  porcentajeCentro: number;
  activo: boolean;
  details: PackageDetailData[];
  operatingCosts?: PackageOperatingCostData[];
}

export interface UpdatePackageData {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  porcentajeMedico?: number;
  porcentajeCentro?: number;
  activo?: boolean;
  details?: PackageDetailData[];
  operatingCosts?: PackageOperatingCostData[];
}

export interface IPackageRepository {
  createWithDetails(data: CreatePackageData): Promise<Package>;
  findAll(): Promise<Package[]>;
  findById(id: string): Promise<Package | null>;
  update(id: string, data: UpdatePackageData): Promise<Package | null>;
  delete(id: string): Promise<boolean>;
}

export const SALE_PACKAGE_REPOSITORY = 'SALE_PACKAGE_REPOSITORY';

export interface ISalePackageRepository {
  create(data: {
    saleId: string;
    packageId: string;
    precioVenta: number;
    costoMedicamentos: number;
    costoOperativo: number;
    costoTotal: number;
    utilidad: number;
    porcentajeMedico: number;
    porcentajeCentro: number;
    gananciaMedico: number;
    gananciaCentro: number;
  }): Promise<SalePackage>;
  findBySaleId(saleId: string): Promise<SalePackage[]>;
  findAll(): Promise<SalePackage[]>;
}
