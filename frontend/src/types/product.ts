export interface Product {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  costoCompra: number;
  precioVenta: number;
  stockActual: number;
  stockMinimo: number;
  activo: boolean;
}

export interface CreateProductDto {
  codigo: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  costoCompra: number;
  precioVenta: number;
  stockActual: number;
  stockMinimo: number;
  activo: boolean;
}

export type UpdateProductDto = Partial<CreateProductDto>;
