import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../../domain/user/interfaces/user.interface';
import { User } from '../../../domain/user/entities/user.entity';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserPrismaRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Partial<User>): Promise<User> {
    const created = await this.prisma.user.create({ data: data as any });
    return created as unknown as User;
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } }) as Promise<User[]>;
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } }) as Promise<User | null>;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } }) as Promise<User | null>;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } }) as Promise<User | null>;
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    try {
      return this.prisma.user.update({ where: { id }, data }) as Promise<User>;
    } catch {
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.user.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async count(): Promise<number> {
    return this.prisma.user.count();
  }
}
