export class SalePackage {
  id: string;
  saleId: string;
  packageId: string;
  medicoId?: string;
  precioVenta: number;
  costoMedicamentos: number;
  costoOperativo: number;
  costoTotal: number;
  utilidad: number;
  porcentajeMedico: number;
  porcentajeCentro: number;
  gananciaMedico: number;
  gananciaCentro: number;
  createdAt: Date;
}
