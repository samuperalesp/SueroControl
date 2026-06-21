export class User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  nombres: string;
  apellidos: string;
  rol: string;
  activo: boolean;
  ultimoAcceso?: Date;
  createdAt: Date;
  updatedAt: Date;
}
