import { Injectable, Inject, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { USER_REPOSITORY } from '../../../domain/user/interfaces/user.interface';
import type { IUserRepository } from '../../../domain/user/interfaces/user.interface';
import { LoginDto, CreateUserDto } from '../dtos/auth.dtos';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userRepository.findByUsername(dto.usuario);
    if (!user) {
      const userByEmail = await this.userRepository.findByEmail(dto.usuario);
      if (!userByEmail) throw new UnauthorizedException('Credenciales inválidas');
      return this.validateAndSign(userByEmail, dto.password);
    }
    return this.validateAndSign(user, dto.password);
  }

  private async validateAndSign(user: any, password: string) {
    if (!user.activo) throw new UnauthorizedException('Usuario inactivo');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    await this.userRepository.update(user.id, { ultimoAcceso: new Date() });

    const payload = { sub: user.id, username: user.username, rol: user.rol };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nombres: user.nombres,
        apellidos: user.apellidos,
        rol: user.rol,
      },
    };
  }

  async createUser(dto: CreateUserDto) {
    const existingUsername = await this.userRepository.findByUsername(dto.username);
    if (existingUsername) throw new ConflictException('El username ya está en uso');

    const existingEmail = await this.userRepository.findByEmail(dto.email);
    if (existingEmail) throw new ConflictException('El email ya está en uso');

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(dto.password, salt);

    return this.userRepository.create({
      username: dto.username,
      email: dto.email,
      passwordHash,
      nombres: dto.nombres,
      apellidos: dto.apellidos,
      rol: dto.rol || 'OPERADOR',
      activo: dto.activo ?? true,
    });
  }

  async validateToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch {
      return null;
    }
  }
}
