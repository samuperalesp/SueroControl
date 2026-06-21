import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { TERCERO_REPOSITORY } from '../../../domain/tercero/interfaces/tercero.interface';
import type { ITerceroRepository } from '../../../domain/tercero/interfaces/tercero.interface';
import { Tercero } from '../../../domain/tercero/entities/tercero.entity';
import { CreateTerceroDto, UpdateTerceroDto } from '../dtos/tercero.dtos';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TerceroService {
  constructor(@Inject(TERCERO_REPOSITORY) private readonly terceroRepository: ITerceroRepository) {}

  async create(dto: CreateTerceroDto): Promise<Tercero> {
    if (dto.tipoDocumento === 'NIT' && !dto.digitoVerificacion) {
      throw new BadRequestException('El dígito de verificación es obligatorio para NIT');
    }
    const existing = await this.terceroRepository.findByDocumento(dto.tipoDocumento, dto.numeroDocumento);
    if (existing) {
      throw new BadRequestException('Ya existe un tercero con este tipo y número de documento');
    }
    const tercero = new Tercero();
    tercero.id = uuidv4();
    tercero.tipoRelacion = dto.tipoRelacion;
    tercero.tipoPersona = dto.tipoPersona;
    tercero.tipoDocumento = dto.tipoDocumento;
    tercero.numeroDocumento = dto.numeroDocumento;
    tercero.digitoVerificacion = dto.digitoVerificacion;
    tercero.nombres = dto.nombres;
    tercero.apellidos = dto.apellidos;
    tercero.razonSocial = dto.razonSocial;
    tercero.direccion = dto.direccion;
    tercero.ciudad = dto.ciudad;
    tercero.departamento = dto.departamento;
    tercero.telefono = dto.telefono;
    tercero.email = dto.email;
    tercero.observaciones = dto.observaciones;
    tercero.activo = dto.activo ?? true;
    return this.terceroRepository.create(tercero);
  }

  async update(id: string, dto: UpdateTerceroDto): Promise<Tercero> {
    await this.findById(id);
    if (dto.tipoDocumento && dto.numeroDocumento) {
      const existing = await this.terceroRepository.findByDocumento(dto.tipoDocumento, dto.numeroDocumento);
      if (existing && existing.id !== id) {
        throw new BadRequestException('Ya existe un tercero con este tipo y número de documento');
      }
    }
    const updated = await this.terceroRepository.update(id, dto as any);
    if (!updated) throw new NotFoundException('Tercero no encontrado');
    return updated;
  }

  async findAll(): Promise<Tercero[]> {
    return this.terceroRepository.findAll();
  }

  async findById(id: string): Promise<Tercero> {
    const tercero = await this.terceroRepository.findById(id);
    if (!tercero) throw new NotFoundException('Tercero no encontrado');
    return tercero;
  }

  async delete(id: string): Promise<boolean> {
    await this.findById(id);
    return this.terceroRepository.delete(id);
  }
}
