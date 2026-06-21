export interface PackageDetail {
  id: string;
  packageId: string;
  productId: string;
  quantity: number;
}

export interface PackageOperatingCost {
  id: string;
  packageId: string;
  concepto: string;
  valor: number;
}

export interface Package {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  porcentajeMedico: number;
  porcentajeCentro: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  details?: PackageDetail[];
  operatingCosts?: PackageOperatingCost[];
}

export interface CreatePackageDto {
  nombre: string;
  descripcion?: string;
  precio: number;
  porcentajeMedico?: number;
  porcentajeCentro?: number;
  activo?: boolean;
  details: { productId: string; quantity: number }[];
  operatingCosts?: { concepto: string; valor: number }[];
}

export interface UpdatePackageDto {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  porcentajeMedico?: number;
  porcentajeCentro?: number;
  activo?: boolean;
  details?: { productId: string; quantity: number }[];
  operatingCosts?: { concepto: string; valor: number }[];
}
