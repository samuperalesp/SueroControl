import { Injectable, NotFoundException, BadRequestException, Inject, ForbiddenException } from '@nestjs/common';
import { PACKAGE_SESSION_REPOSITORY } from '../../../domain/package-session/interfaces/package-session.interface';
import type { IPackageSessionRepository } from '../../../domain/package-session/interfaces/package-session.interface';
import { SALE_REPOSITORY } from '../../../domain/sale/interfaces/sale.interface';
import type { ISaleRepository } from '../../../domain/sale/interfaces/sale.interface';
import { PACKAGE_REPOSITORY, SALE_PACKAGE_REPOSITORY } from '../../../domain/package/interfaces/package.interface';
import type { IPackageRepository, ISalePackageRepository } from '../../../domain/package/interfaces/package.interface';
import { PRODUCT_REPOSITORY } from '../../../domain/product/interfaces/product.interface';
import type { IProductRepository } from '../../../domain/product/interfaces/product.interface';
import { INVENTORY_MOVEMENT_REPOSITORY } from '../../../domain/inventory-movement/interfaces/inventory-movement.interface';
import type { IInventoryMovementRepository } from '../../../domain/inventory-movement/interfaces/inventory-movement.interface';
import { TERCERO_REPOSITORY } from '../../../domain/tercero/interfaces/tercero.interface';
import type { ITerceroRepository } from '../../../domain/tercero/interfaces/tercero.interface';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CreatePackageSessionDto, ApplySessionDto } from '../dtos/package-session.dtos';

@Injectable()
export class PackageSessionService {
  constructor(
    @Inject(PACKAGE_SESSION_REPOSITORY) private readonly packageSessionRepository: IPackageSessionRepository,
    @Inject(SALE_REPOSITORY) private readonly saleRepository: ISaleRepository,
    @Inject(PACKAGE_REPOSITORY) private readonly packageRepository: IPackageRepository,
    @Inject(SALE_PACKAGE_REPOSITORY) private readonly salePackageRepository: ISalePackageRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
    @Inject(INVENTORY_MOVEMENT_REPOSITORY) private readonly movementRepository: IInventoryMovementRepository,
    @Inject(TERCERO_REPOSITORY) private readonly terceroRepository: ITerceroRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreatePackageSessionDto) {
    if (dto.patientId) {
      const patient = await this.terceroRepository.findById(dto.patientId);
      if (!patient) throw new NotFoundException('Paciente no encontrado');
      if (patient.tipoRelacion !== 'CLIENTE' && patient.tipoRelacion !== 'CLIENTE_PROVEEDOR') {
        throw new BadRequestException('El paciente debe ser de tipo CLIENTE o CLIENTE_PROVEEDOR');
      }
    }

    const medico = await this.terceroRepository.findById(dto.medicoId);
    if (!medico) throw new NotFoundException('Médico no encontrado');
    if (medico.tipoRelacion !== 'MEDICO') {
      throw new BadRequestException('El médico debe ser de tipo MEDICO');
    }

    const pkg = await this.packageRepository.findById(dto.packageId);
    if (!pkg) throw new NotFoundException('Paquete no encontrado');
    if (!pkg.details || pkg.details.length === 0) {
      throw new BadRequestException('El paquete no tiene componentes');
    }

    const cantidad = dto.cantidadSesiones;
    const precioUnitario = pkg.precio;
    const subtotal = precioUnitario * cantidad;
    const descuentoValor = subtotal * (dto.descuentoPorcentaje / 100);
    const totalPagado = subtotal - descuentoValor;

    const maxCons = await this.saleRepository.findMaxConsecutivo();
    const consecutivo = maxCons + 1;

    const sale = await this.saleRepository.createWithDetails({
      consecutivo,
      terceroId: dto.patientId,
      medicoId: dto.medicoId,
      total: totalPagado,
      details: [{
        packageId: dto.packageId,
        quantity: 1,
        unitPrice: totalPagado,
        subTotal: totalPagado,
      }],
    });

    const fechaVencimiento = dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : undefined;

    const packageSession = await this.packageSessionRepository.create({
      saleId: sale.id,
      patientId: dto.patientId,
      medicoId: dto.medicoId,
      packageId: dto.packageId,
      cantidadSesiones: cantidad,
      precioUnitario,
      subtotal,
      descuentoPorcentaje: dto.descuentoPorcentaje,
      descuentoValor,
      totalPagado,
      fechaVencimiento,
    });

    return packageSession;
  }

  async findAll() {
    return this.packageSessionRepository.findAll();
  }

  async findById(id: string) {
    const ps = await this.packageSessionRepository.findById(id);
    if (!ps) throw new NotFoundException('PackageSession no encontrado');
    return ps;
  }

  async applySession(id: string, dto: ApplySessionDto) {
    const ps = await this.packageSessionRepository.findById(id);
    if (!ps) throw new NotFoundException('PackageSession no encontrado');
    if (ps.estado !== 'ACTIVA') {
      throw new BadRequestException(`El PackageSession está en estado "${ps.estado}"`);
    }
    if (ps.sesionesPendientes <= 0) {
      throw new BadRequestException('No hay sesiones pendientes por aplicar');
    }

    const pkg = await this.packageRepository.findById(ps.packageId);
    if (!pkg) throw new NotFoundException('Paquete no encontrado');
    if (!pkg.details || pkg.details.length === 0) {
      throw new BadRequestException('El paquete no tiene componentes');
    }

    const productsOutOfStock: { nombre: string; disponible: number; requerido: number }[] = [];
    for (const comp of pkg.details) {
      const product = await this.productRepository.findById(comp.productId);
      if (!product) throw new NotFoundException(`Producto ${comp.productId} no encontrado`);
      const requiredQty = comp.quantity;
      if (product.stockActual < requiredQty) {
        productsOutOfStock.push({
          nombre: product.nombre,
          disponible: product.stockActual,
          requerido: requiredQty,
        });
      }
    }

    if (productsOutOfStock.length > 0) {
      const mensaje = productsOutOfStock.map(
        p => `${p.nombre}: disponible ${p.disponible}, requerido ${p.requerido}`
      ).join('; ');
      throw new BadRequestException(`Stock insuficiente: ${mensaje}`);
    }

    const precioSesion = ps.totalPagado / ps.cantidadSesiones;

    let costoMedicamentos = 0;
    for (const comp of pkg.details) {
      const product = await this.productRepository.findById(comp.productId);
      if (product) {
        costoMedicamentos += product.costoCompra * comp.quantity;
        await this.productRepository.updateStock(comp.productId, -comp.quantity);
      }
    }

    const costoOperativo = (pkg.operatingCosts || []).reduce((sum, oc) => sum + oc.valor, 0);
    const costoTotal = costoMedicamentos + costoOperativo;
    const utilidad = precioSesion - costoTotal;
    const gananciaMedico = utilidad * (pkg.porcentajeMedico / 100);
    const gananciaCentro = utilidad * (pkg.porcentajeCentro / 100);

    const salePackage = await this.salePackageRepository.create({
      saleId: ps.saleId,
      packageId: ps.packageId,
      medicoId: ps.medicoId,
      precioVenta: precioSesion,
      costoMedicamentos,
      costoOperativo,
      costoTotal,
      utilidad,
      porcentajeMedico: pkg.porcentajeMedico,
      porcentajeCentro: pkg.porcentajeCentro,
      gananciaMedico,
      gananciaCentro,
    });

    for (const comp of pkg.details) {
      const product = await this.productRepository.findById(comp.productId);
      if (product) {
        await this.movementRepository.create({
          productId: comp.productId,
          movementType: 'EXIT',
          quantity: comp.quantity,
          stockBefore: product.stockActual + comp.quantity,
          stockAfter: product.stockActual,
          referenceType: 'SESSION_APPLICATION',
          referenceId: salePackage.id,
        });
      }
    }

    const nuevasConsumidas = ps.sesionesConsumidas + 1;
    const nuevasPendientes = ps.sesionesPendientes - 1;
    const nuevoEstado = nuevasPendientes === 0 ? 'FINALIZADO' : 'ACTIVA';

    await this.packageSessionRepository.updateSesiones(id, nuevasConsumidas, nuevasPendientes, nuevoEstado);

    await this.prisma.sessionApplication.create({
      data: {
        packageSessionId: id,
        salePackageId: salePackage.id,
        sesionNumero: nuevasConsumidas,
        observaciones: dto.observaciones,
      },
    });

    return this.findById(id);
  }

  async cancel(id: string) {
    const ps = await this.packageSessionRepository.findById(id);
    if (!ps) throw new NotFoundException('PackageSession no encontrado');
    if (ps.estado !== 'ACTIVA') {
      throw new BadRequestException(`El PackageSession está en estado "${ps.estado}"`);
    }
    if (ps.sesionesConsumidas > 0) {
      throw new BadRequestException(
        'No se puede cancelar. El PackageSession tiene sesiones aplicadas. ' +
        'Requiere un proceso administrativo especial.'
      );
    }
    return this.packageSessionRepository.cancel(id);
  }
}
