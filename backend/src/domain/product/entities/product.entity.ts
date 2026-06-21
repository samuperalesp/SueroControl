export class Product {
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
  createdAt: Date;
  updatedAt: Date;
}
