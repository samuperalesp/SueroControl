import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from '../../../application/auth/services/auth.service';
import { CreateUserDto, UpdateUserDto } from '../../../application/auth/dtos/auth.dtos';
import { Roles } from '../../../infrastructure/auth/decorators/roles.decorator';
import { USER_REPOSITORY } from '../../../domain/user/interfaces/user.interface';
import { Inject } from '@nestjs/common';
import type { IUserRepository } from '../../../domain/user/interfaces/user.interface';

@Controller('users')
export class UserController {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    private readonly authService: AuthService,
  ) {}

  @Roles('ADMINISTRADOR')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserDto) {
    return this.authService.createUser(dto);
  }

  @Roles('ADMINISTRADOR')
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll() {
    return this.userRepository.findAll();
  }

  @Roles('ADMINISTRADOR')
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return this.userRepository.findById(id);
  }

  @Roles('ADMINISTRADOR')
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userRepository.update(id, dto as any);
  }

  @Roles('ADMINISTRADOR')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.userRepository.delete(id);
  }
}
