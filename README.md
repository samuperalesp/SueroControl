# SueroControl

Sistema de Inventario, Ventas y Facturación Interna para Pacientes.

## Estructura del Proyecto

- `backend/`: Aplicación NestJS (Node.js, TypeScript).
- `frontend/`: Aplicación React (React, Vite, TypeScript, TailwindCSS).
- `data/`: Archivos de persistencia (JSON).
- `documentacion/`: Documentación del proyecto (arquitectura, historial, requerimientos, manuales).

## Instalación y Configuración

### Backend

```bash
cd backend
npm install
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

> El frontend incluye un proxy inverso que redirige `/products` al backend (puerto 3000). No requiere configuración CORS adicional.

## Documentación Adicional

Consulta la carpeta `documentacion/` para más detalles sobre los requerimientos, arquitectura, historial de cambios y manuales.
