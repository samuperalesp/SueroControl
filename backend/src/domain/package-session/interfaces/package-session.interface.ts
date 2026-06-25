import { PackageSession } from '../entities/package-session.entity';

export const PACKAGE_SESSION_REPOSITORY = 'PACKAGE_SESSION_REPOSITORY';

export interface CreatePackageSessionData {
  saleId: string;
  patientId?: string;
  medicoId: string;
  packageId: string;
  cantidadSesiones: number;
  precioUnitario: number;
  subtotal: number;
  descuentoPorcentaje: number;
  descuentoValor: number;
  totalPagado: number;
  fechaVencimiento?: Date;
}

export interface IPackageSessionRepository {
  create(data: CreatePackageSessionData): Promise<PackageSession>;
  findAll(): Promise<PackageSession[]>;
  findById(id: string): Promise<PackageSession | null>;
  updateSesiones(id: string, sesionesConsumidas: number, sesionesPendientes: number, estado: string): Promise<PackageSession>;
  cancel(id: string): Promise<PackageSession>;
}
