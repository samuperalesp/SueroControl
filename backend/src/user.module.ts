import { Module } from '@nestjs/common';
import { UserController } from './presentation/user/controllers/user.controller';
import { AuthService } from './application/auth/services/auth.service';
import { UserPrismaRepository } from './infrastructure/user/repositories/user.prisma.repository';
import { USER_REPOSITORY } from './domain/user/interfaces/user.interface';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'SueroControl2024SecretKey',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [UserController],
  providers: [
    AuthService,
    { provide: USER_REPOSITORY, useClass: UserPrismaRepository },
  ],
  exports: [AuthService, USER_REPOSITORY],
})
export class UserModule {}
