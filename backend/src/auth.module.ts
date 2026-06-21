import { Module, OnModuleInit } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './presentation/auth/controllers/auth.controller';
import { AuthService } from './application/auth/services/auth.service';
import { JwtStrategy } from './infrastructure/auth/strategies/jwt.strategy';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './infrastructure/auth/guards/jwt-auth.guard';
import { RolesGuard } from './infrastructure/auth/guards/roles.guard';
import { USER_REPOSITORY } from './domain/user/interfaces/user.interface';
import { UserPrismaRepository } from './infrastructure/user/repositories/user.prisma.repository';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'SueroControl2024SecretKey',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    PrismaService,
    { provide: USER_REPOSITORY, useClass: UserPrismaRepository },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const userCount = await this.prisma.user.count();
    if (userCount === 0) {
      const salt = await bcrypt.genSalt();
      const passwordHash = await bcrypt.hash('Admin123*', salt);

      await this.prisma.user.create({
        data: {
          username: 'admin',
          email: 'admin@suerocontrol.com',
          passwordHash,
          nombres: 'Administrador',
          apellidos: 'del Sistema',
          rol: 'ADMINISTRADOR',
          activo: true,
        },
      });
      console.log('Usuario administrador creado: admin / Admin123*');
    }
  }
}
