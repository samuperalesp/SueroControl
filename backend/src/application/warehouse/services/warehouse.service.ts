import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { WAREHOUSE_REPOSITORY } from '../../../domain/warehouse/interfaces/warehouse.interface';
import type { IWarehouseRepository } from '../../../domain/warehouse/interfaces/warehouse.interface';
import { Warehouse } from '../../../domain/warehouse/entities/warehouse.entity';
import { CreateWarehouseDto, UpdateWarehouseDto } from '../dtos/warehouse.dtos';

@Injectable()
export class WarehouseService {
  constructor(
    @Inject(WAREHOUSE_REPOSITORY) private readonly warehouseRepository: IWarehouseRepository,
  ) {}

  async findActive(): Promise<Warehouse[]> {
    return this.warehouseRepository.findActive();
  }

  async findAll(): Promise<Warehouse[]> {
    return this.warehouseRepository.findAll();
  }

  async create(dto: CreateWarehouseDto): Promise<Warehouse> {
    if (dto.esPrincipal) {
      const principal = await this.warehouseRepository.findPrincipal();
      if (principal) {
        throw new BadRequestException('Ya existe un almacén principal');
      }
    }
    return this.warehouseRepository.create(dto);
  }

  async update(id: string, dto: UpdateWarehouseDto): Promise<Warehouse> {
    const warehouse = await this.warehouseRepository.findById(id);
    if (!warehouse) {
      throw new NotFoundException('Almacén no encontrado');
    }

    if (warehouse.esPrincipal) {
      if (dto.activo === false) {
        throw new BadRequestException('No se puede desactivar el almacén principal');
      }
      if (dto.esPrincipal === false) {
        throw new BadRequestException('No se puede quitar el rol de principal');
      }
    } else if (dto.esPrincipal === true) {
      const principal = await this.warehouseRepository.findPrincipal();
      if (principal && principal.id !== id) {
        throw new BadRequestException('Ya existe un almacén principal');
      }
    }

    const updated = await this.warehouseRepository.update(id, dto);
    if (!updated) {
      throw new NotFoundException('Almacén no encontrado tras actualizar');
    }
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const warehouse = await this.warehouseRepository.findById(id);
    if (!warehouse) {
      throw new NotFoundException('Almacén no encontrado');
    }
    if (warehouse.esPrincipal) {
      throw new BadRequestException('No se puede eliminar el almacén principal');
    }
    const updated = await this.warehouseRepository.update(id, { activo: false });
    return !!updated;
  }
}
