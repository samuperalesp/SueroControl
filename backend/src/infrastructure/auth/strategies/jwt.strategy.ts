import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'SueroControl2024SecretKey',
    });
  }

  async validate(payload: { sub: string; username: string; rol: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.activo) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      nombres: user.nombres,
      apellidos: user.apellidos,
      rol: user.rol,
    };
  }
}
