import { Tercero } from '../entities/tercero.entity';

export const TERCERO_REPOSITORY = 'TERCERO_REPOSITORY';

export interface ITerceroRepository {
  create(data: Tercero): Promise<Tercero>;
  findAll(): Promise<Tercero[]>;
  findById(id: string): Promise<Tercero | null>;
  findByDocumento(tipoDocumento: string, numero: string): Promise<Tercero | null>;
  update(id: string, data: Partial<Tercero>): Promise<Tercero | null>;
  delete(id: string): Promise<boolean>;
}
