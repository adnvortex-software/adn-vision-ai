# ADN LYNX AI

Plataforma SaaS multi-tenant para monitoreo automático de flotas de buses urbanos en Colombia mediante visión computacional.

## Stack tecnológico

- **Framework:** React 18 + Vite 5
- **Lenguaje:** TypeScript (strict mode)
- **Estilos:** Tailwind CSS + shadcn/ui
- **Estado:** TanStack Query (servidor) + Zustand (cliente)
- **Backend:** Firebase (Auth, Firestore, Storage, Functions)
- **Formularios:** React Hook Form + Zod
- **i18n:** react-i18next (ES/EN)

## Requisitos

- Node.js 18+
- pnpm 8+
- Cuenta de Firebase con proyecto configurado

## Instalación

```bash
# Clonar repositorio
git clone https://github.com/tu-org/adn-lynx-ai.git
cd adn-lynx-ai

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con credenciales de Firebase

# Iniciar desarrollo
pnpm dev
```

## Scripts disponibles

```bash
pnpm dev          # Servidor de desarrollo (http://localhost:3000)
pnpm build        # Build de producción
pnpm preview      # Preview del build
pnpm lint         # Verificar código con ESLint
pnpm lint:fix     # Arreglar errores de lint automáticamente
pnpm typecheck    # Verificar tipos TypeScript
pnpm format       # Formatear código con Prettier
pnpm test         # Ejecutar tests con Vitest
```

## Estructura del proyecto

```
src/
├── config/       # Configuración (Firebase, env, constants)
├── lib/          # Utilidades (utils, date, format, permissions)
├── i18n/         # Traducciones
├── types/        # TypeScript types
├── schemas/      # Zod schemas
├── services/     # Capa de acceso a Firebase
├── hooks/        # Custom hooks
├── stores/       # Zustand stores
├── components/   # Componentes React
├── pages/        # Páginas/rutas
└── routes/       # Configuración del router
```

## Documentación

Consulta `PROCESS.md` para detalles completos sobre:

- Modelo de datos
- Roles y permisos
- Arquitectura
- Estado del desarrollo

## Licencia

Propietario - ADN Lynx AI © 2026
