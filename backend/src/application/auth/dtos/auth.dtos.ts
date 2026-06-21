import { IsString, MinLength, IsOptional, IsEmail, IsIn } from 'class-validator';

export class LoginDto {
  @IsString()
  usuario: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class CreateUserDto {
  @IsString()
  username: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  nombres: string;

  @IsString()
  apellidos: string;

  @IsString()
  @IsOptional()
  @IsIn(['ADMINISTRADOR', 'OPERADOR'])
  rol?: string;

  @IsOptional()
  activo?: boolean;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  nombres?: string;

  @IsString()
  @IsOptional()
  apellidos?: string;

  @IsString()
  @IsOptional()
  @IsIn(['ADMINISTRADOR', 'OPERADOR'])
  rol?: string;

  @IsOptional()
  activo?: boolean;
}
