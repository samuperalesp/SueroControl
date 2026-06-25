export class PackageSession {
  id: string;
  saleId: string;
  patientId?: string;
  medicoId: string;
  packageId: string;
  cantidadSesiones: number;
  sesionesConsumidas: number;
  sesionesPendientes: number;
  precioUnitario: number;
  subtotal: number;
  descuentoPorcentaje: number;
  descuentoValor: number;
  totalPagado: number;
  estado: string;
  fechaInicio: Date;
  fechaVencimiento?: Date;
  createdAt: Date;
  updatedAt: Date;
}
