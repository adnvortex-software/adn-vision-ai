# ADN LYNX AI — PROCESS.md

## 0. Cómo usar este documento

Este es el **archivo maestro** del proyecto ADN LYNX AI. Contiene toda la información necesaria para entender el estado actual del desarrollo y continuar el trabajo.

**REGLAS OBLIGATORIAS:**

1. Leer este documento al inicio de CADA sesión de desarrollo
2. Actualizar después de CADA tarea completada
3. Hacer commit después de cada actualización
4. Si pierdes contexto, este documento debe ser suficiente para continuar

---

## 1. Visión del producto

**ADN LYNX AI** es una plataforma SaaS multi-tenant para monitoreo automático de flotas de buses urbanos en Colombia mediante visión computacional.

### El problema

La empresa lleva 12 años haciendo análisis manual de video:

- Técnicos bajan discos duros de DVR diariamente
- Analistas revisan horas de video buscando incidentes
- Generan informes PDF manualmente
- Proceso lento, costoso, propenso a errores

### La solución

Sistema automatizado que:

- Detecta novedades automáticamente usando YOLOv8 + modelos especializados
- Genera alertas en tiempo real
- Produce reportes PDF automáticos
- Permite gestión centralizada de flotas multi-cliente

### Estado actual

- 20 clientes empresariales con ~1000 vehículos en total
- Procesamiento 100% manual
- Sin sistema digital de gestión

### Objetivo MVP

- Piloto funcional con 10 buses
- Escalar a 1000+ buses en 12 meses
- Liberar personal de análisis manual

---

## 2. Arquitectura general

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ARQUITECTURA ADN LYNX AI                       │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────┐     ┌──────────┐     ┌──────────┐
│  Bus 1   │     │  Bus 2   │     │  Bus N   │
│ ┌──────┐ │     │ ┌──────┐ │     │ ┌──────┐ │
│ │ DVR  │ │     │ │ DVR  │ │     │ │ DVR  │ │
│ │ 4-6  │ │     │ │ 4-6  │ │     │ │ 4-6  │ │
│ │ cams │ │     │ │ cams │ │     │ │ cams │ │
│ └──┬───┘ │     │ └──┬───┘ │     │ └──┬───┘ │
│    │     │     │    │     │     │    │     │
│ ┌──┴───┐ │     │ ┌──┴───┐ │     │ ┌──┴───┐ │
│ │RUT200│ │     │ │RUT200│ │     │ │RUT200│ │
│ │Router│ │     │ │Router│ │     │ │Router│ │
│ └──┬───┘ │     │ └──┬───┘ │     │ └──┬───┘ │
└────┼─────┘     └────┼─────┘     └────┼─────┘
     │                │                │
     └────────────────┼────────────────┘
                      │
              ┌───────┴───────┐
              │   ZeroTier    │
              │    VPN        │
              └───────┬───────┘
                      │
         ┌────────────┴────────────┐
         │   SERVIDOR ON-PREMISE   │
         │  ┌────────────────────┐ │
         │  │   Python Backend   │ │
         │  │  ┌──────────────┐  │ │
         │  │  │   YOLOv8     │  │ │
         │  │  │  + Modelos   │  │ │
         │  │  └──────────────┘  │ │
         │  └─────────┬──────────┘ │
         └────────────┼────────────┘
                      │
              ┌───────┴───────┐
              │   Firebase    │
              │ ┌───────────┐ │
              │ │ Firestore │ │
              │ │  Storage  │ │
              │ │   Auth    │ │
              │ │ Functions │ │
              │ └───────────┘ │
              └───────┬───────┘
                      │
              ┌───────┴───────┐
              │   FRONTEND    │
              │  React + TS   │
              │  (Este repo)  │
              └───────────────┘
```

### Componentes

| Componente           | Responsabilidad                           |
| -------------------- | ----------------------------------------- |
| DVR en bus           | Grabación de 4-6 cámaras RTSP             |
| RUT200               | Router 4G con ZeroTier                    |
| ZeroTier VPN         | Red privada entre buses y servidor        |
| Servidor on-prem     | Procesamiento de video con IA (Python)    |
| Firebase             | Base de datos, auth, storage, funciones   |
| Frontend (este repo) | Interfaz web para gestión y visualización |

---

## 3. Stack tecnológico

| Categoría       | Tecnología                    | Versión      |
| --------------- | ----------------------------- | ------------ |
| Framework       | React + Vite                  | 18.x + 5.x   |
| Lenguaje        | TypeScript                    | strict: true |
| Estilos         | Tailwind CSS                  | v3.x         |
| UI Components   | shadcn/ui                     | latest       |
| Iconos          | lucide-react                  | latest       |
| Fuentes         | Inter + JetBrains Mono        | @fontsource  |
| Gráficos        | Recharts + Tremor             | latest       |
| Tablas          | TanStack Table                | v8           |
| Formularios     | React Hook Form + Zod         | latest       |
| Estado servidor | TanStack Query                | v5           |
| Estado cliente  | Zustand                       | latest       |
| Routing         | React Router                  | v6           |
| i18n            | react-i18next                 | latest       |
| Firebase        | SDK modular                   | v10          |
| PDFs            | @react-pdf/renderer           | latest       |
| Fechas          | date-fns + date-fns-tz        | latest       |
| Notificaciones  | sonner                        | latest       |
| Drag & drop     | @dnd-kit/core                 | latest       |
| Linter          | ESLint flat config + Prettier | latest       |
| Pre-commit      | Husky + lint-staged           | latest       |
| Tests           | Vitest + Testing Library      | latest       |
| Package manager | pnpm                          | latest       |

---

## 4. Estructura del proyecto

```
adn-lynx-ai/
├── PROCESS.md                    # Este archivo
├── README.md                     # Setup y comandos
├── .env.example                  # Variables documentadas
├── .env.local                    # Local (gitignored)
├── .gitignore
├── eslint.config.js              # ESLint flat config
├── .prettierrc
├── tsconfig.json                 # strict: true
├── tailwind.config.ts
├── vite.config.ts
├── package.json
├── pnpm-lock.yaml
├── index.html
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx                  # Entry point
    ├── App.tsx                   # Router root
    ├── globals.css               # Tailwind + CSS vars
    ├── config/                   # Firebase, env, constants
    ├── lib/                      # Utils, date, format, permissions
    ├── i18n/                     # Traducciones ES/EN
    ├── types/                    # TypeScript types
    ├── schemas/                  # Zod schemas
    ├── services/                 # Capa Firebase
    ├── hooks/                    # Custom hooks
    ├── stores/                   # Zustand stores
    ├── components/
    │   ├── ui/                   # shadcn components
    │   ├── layout/               # AppShell, Sidebar, Header
    │   ├── common/               # Reutilizables genéricos
    │   ├── auth/                 # Login, ProtectedRoute
    │   ├── clientes/             # CRUD clientes
    │   ├── buses/                # CRUD buses
    │   ├── camaras/              # Config cámaras
    │   ├── novedades/            # Config y eventos
    │   ├── conductores/          # CRUD conductores
    │   ├── dashboard/            # KPIs y overview
    │   ├── reportes/             # PDFs y exports
    │   └── usuarios/             # Gestión usuarios
    ├── pages/                    # Rutas/vistas
    ├── routes/                   # Router config
    └── tests/                    # Vitest tests
```

---

## 5. Modelo de datos (Firestore)

### Convenciones

- IDs autogenerados por Firestore (salvo indicación)
- Todas las entidades: `createdAt`, `updatedAt`, `createdBy`, `deleted`
- Timestamps en UTC, mostrar en TZ America/Bogota
- Placas en mayúsculas, formato colombiano

### Colecciones

#### `usuarios/{uid}`

```typescript
{
  uid: string
  email: string
  nombre: string
  rol: "super_admin" | "ops_admin" | "analyst" | "support" | "client_admin" | "client_viewer"
  clienteId: string | null      // null para roles internos
  sucursalIds: string[] | null  // opcional: limitar a sucursales
  propietarioId: string | null  // opcional: limitar a propietario
  activo: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: string
}
```

#### `clientes/{clienteId}`

```typescript
{
  nombre: string
  nit: string
  contactoEmail: string
  contactoTelefono: string
  planContratado: 'basico' | 'profesional' | 'premium'
  activo: boolean
  ;(createdAt, updatedAt, createdBy)
}
```

#### `clientes/{clienteId}/sucursales/{sucursalId}`

```typescript
{
  nombre: string
  direccion: string
  ciudad: string
  activa: boolean
}
```

#### `clientes/{clienteId}/propietarios/{propietarioId}`

```typescript
{
  nombre: string
  documento: string
  sucursalId: string
  contactoEmail: string | null
  contactoTelefono: string | null
  activo: boolean
}
```

#### `clientes/{clienteId}/conductores/{conductorId}`

```typescript
{
  nombre: string
  cedula: string
  licencia: string
  fechaVencimientoLicencia: Timestamp
  sucursalId: string
  propietarioId: string | null
  activo: boolean
  foto: string | null // URL Storage
}
```

#### `buses/{busId}`

```typescript
{
  placa: string // Único, mayúsculas
  clienteId: string
  sucursalId: string
  propietarioId: string | null
  tipoVehiculo: 'bus' | 'buseta' | 'van' | 'microbus' | 'otro'
  rutaTexto: string | null
  conductorAsignadoId: string | null

  // Conectividad
  ztIpRouter: string // IP ZeroTier del RUT200
  subnetLan: string // Ej: "192.168.26.0/24"

  // Estado operativo
  estado: 'activo' | 'inactivo' | 'mantenimiento' | 'sin_conexion'
  lastHeartbeat: Timestamp | null
  numCamarasConfiguradas: number

  activo: boolean
  ;(createdAt, updatedAt, createdBy)
}
```

#### `buses/{busId}/camaras/{camaraId}`

```typescript
{
  nombre: string // "Cabina", "Puerta", etc
  perfil: 'cabina' | 'puerta' | 'pasillo' | 'frontal' | 'exterior' | 'otro'
  canal: number // Canal DVR (1-N)
  rtspUrl: string
  rtspSubstreamUrl: string | null
  resolucionInferenciaW: number // default 480
  resolucionInferenciaH: number // default 360
  fpsInferencia: number // default 3
  habilitada: boolean
  ultimoScreenshot: string | null
  ultimoScreenshotAt: Timestamp | null
}
```

#### `buses/{busId}/camaras/{camaraId}/novedades/{novedadConfigId}`

```typescript
{
  tipoNovedad: string           // ref a catalogoNovedades
  activa: boolean
  params: {
    lineaVirtual?: { x1, y1, x2, y2, orientacion }
    zonaPoligono?: [{x, y}, ...]
    tiempoMinimoSeg?: number
    cantidadMaxima?: number
    sensibilidad?: number
  }
  createdAt, updatedAt, createdBy
}
```

#### `catalogoNovedades/{novedadId}`

```typescript
{
  codigo: string                // "conteo_pasajeros", etc
  nombre: string
  descripcion: string
  categoria: "operativa" | "seguridad_conductor" | "seguridad_pasajero" | "tecnica" | "comercial"
  perfilesCompatibles: string[] // ["cabina", "pasillo"]
  planMinimo: "basico" | "profesional" | "premium"
  paramsSchema: object          // JSON Schema
  esTecnica: boolean
  generaPDF: boolean
  icono: string                 // lucide icon name
  activa: boolean
}
```

#### `eventos/{eventoId}`

```typescript
{
  tipoNovedad: string
  busId: string
  clienteId: string
  sucursalId: string
  camaraId: string
  timestamp: Timestamp
  screenshotUrl: string | null
  videoClipUrl: string | null
  datos: object
  estado: 'nuevo' | 'revisado' | 'resuelto' | 'descartado'
  revisadoPor: string | null
  revisadoAt: Timestamp | null
  notas: string | null
  reportePdfUrl: string | null
}
```

#### `conteos/{busId}`

```typescript
{
  busId: string
  clienteId: string
  entradasDia: number
  salidasDia: number
  aforoActual: number
  fechaOperativa: string // "2026-05-19"
  updatedAt: Timestamp
}
```

#### `conteos/{busId}/historial/{eventoId}`

```typescript
{
  tipo: 'entrada' | 'salida'
  camaraId: string
  trackId: number
  aforoTrasEvento: number
  timestamp: Timestamp
}
```

#### `conteosDiarios/{busId}_{fecha}`

```typescript
{
  busId: string
  clienteId: string
  fecha: string
  totalEntradas: number
  totalSalidas: number
  aforoMaximoDia: number
  franjasHorarias: {
    "06": { entradas, salidas },
    "07": { entradas, salidas },
    // ...
  }
}
```

#### `reportes/{reporteId}`

```typescript
{
  tipo: "novedades" | "conteo" | "consolidado"
  clienteId: string
  busIds: string[]
  fechaInicio: Timestamp
  fechaFin: Timestamp
  generadoPor: string
  pdfUrl: string
  estado: "generando" | "listo" | "error"
  createdAt: Timestamp
}
```

#### `auditLog/{logId}`

```typescript
{
  accion: string
  actorUid: string
  actorEmail: string
  entidadTipo: string
  entidadId: string
  cambios: object | null
  timestamp: Timestamp
  ip: string | null
}
```

---

## 6. Roles y permisos

### Roles internos (empleados ADN Lynx)

| Rol           | Descripción                                            |
| ------------- | ------------------------------------------------------ |
| `super_admin` | Acceso total. Gestiona catálogo, otros super_admins    |
| `ops_admin`   | Gestiona clientes, buses, cámaras, novedades. Ve todo  |
| `analyst`     | Revisa eventos, genera reportes, crea usuarios cliente |
| `support`     | Solo lectura de todo                                   |

### Roles de cliente (usuarios de empresas de buses)

| Rol             | Descripción                                               |
| --------------- | --------------------------------------------------------- |
| `client_admin`  | Ve todos los buses de SU cliente. Gestiona viewers        |
| `client_viewer` | Solo lectura. Puede estar limitado a sucursal/propietario |

### Matriz de permisos

| Acción              | super_admin | ops_admin | analyst | support | client_admin | client_viewer |
| ------------------- | :---------: | :-------: | :-----: | :-----: | :----------: | :-----------: |
| clientes.create     |     ✅      |    ✅     |   ❌    |   ❌    |      ❌      |      ❌       |
| clientes.read       |     ✅      |    ✅     |   ✅    |   ✅    |      🔒      |      🔒       |
| clientes.update     |     ✅      |    ✅     |   ❌    |   ❌    |      ❌      |      ❌       |
| clientes.delete     |     ✅      |    ❌     |   ❌    |   ❌    |      ❌      |      ❌       |
| buses.create        |     ✅      |    ✅     |   ❌    |   ❌    |      ❌      |      ❌       |
| buses.read          |     ✅      |    ✅     |   ✅    |   ✅    |      🔒      |      🔒       |
| buses.update        |     ✅      |    ✅     |   ❌    |   ❌    |      ❌      |      ❌       |
| camaras.configure   |     ✅      |    ✅     |   ❌    |   ❌    |      ❌      |      ❌       |
| novedades.configure |     ✅      |    ✅     |   ❌    |   ❌    |      ❌      |      ❌       |
| eventos.read        |     ✅      |    ✅     |   ✅    |   ✅    |      🔒      |      🔒       |
| eventos.resolve     |     ✅      |    ✅     |   ✅    |   ❌    |      ❌      |      ❌       |
| reportes.generate   |     ✅      |    ✅     |   ✅    |   ❌    |      ✅      |      ❌       |
| reportes.download   |     ✅      |    ✅     |   ✅    |   ✅    |      🔒      |      🔒       |
| usuarios.create     |     ✅      |    ❌     |  ✅\*   |   ❌    |     ✅\*     |      ❌       |
| usuarios.update     |     ✅      |    ❌     |   ❌    |   ❌    |     ✅\*     |      ❌       |
| catalogo.manage     |     ✅      |    ❌     |   ❌    |   ❌    |      ❌      |      ❌       |
| audit.read          |     ✅      |    ✅     |   ❌    |   ❌    |      ❌      |      ❌       |

🔒 = Solo su cliente | ✅\* = Solo usuarios de su cliente con rol inferior

---

## 7. Catálogo de novedades (MVP)

### 1. conteo_pasajeros

- **Nombre:** Conteo de pasajeros
- **Categoría:** operativa
- **Perfiles:** cabina, puerta, pasillo
- **Plan mínimo:** basico
- **Params:** `lineaVirtual { x1, y1, x2, y2, orientacion }`
- **Genera PDF:** No (genera reporte de conteo)

### 2. pasajero_en_cabina

- **Nombre:** Pasajero en cabina
- **Categoría:** seguridad_pasajero
- **Perfiles:** cabina
- **Plan mínimo:** basico
- **Params:** `zonaPoligono, tiempoMinimoSeg (5), cantidadMaxima (0)`
- **Genera PDF:** Sí

### 3. sobrecupo

- **Nombre:** Sobrecupo / Pasajeros de pie
- **Categoría:** operativa
- **Perfiles:** pasillo
- **Plan mínimo:** profesional
- **Params:** `zonaPoligono, cantidadMaxima (0), tiempoMinimoSeg (10)`
- **Genera PDF:** Sí

### 4. conductor_sin_cinturon

- **Nombre:** Conductor sin cinturón
- **Categoría:** seguridad_conductor
- **Perfiles:** cabina
- **Plan mínimo:** profesional
- **Params:** `zonaPoligono, tiempoMinimoSeg (10)`
- **Genera PDF:** Sí

### 5. conductor_fumando

- **Nombre:** Conductor fumando
- **Categoría:** seguridad_conductor
- **Perfiles:** cabina
- **Plan mínimo:** profesional
- **Params:** `zonaPoligono`
- **Genera PDF:** Sí

---

## 8. Estado actual del desarrollo

**Sprint actual:** 1 - Fundamentos
**Progreso general:** ~15% del MVP total

---

### CHECKLIST COMPLETO DEL PROYECTO

#### A. CONFIGURACIÓN INICIAL Y TOOLING

- [x] Crear PROCESS.md como documento maestro
- [x] Inicializar repositorio git
- [x] Setup Vite 5 + React 18
- [x] TypeScript strict mode (strict: true, noImplicitAny, strictNullChecks)
- [x] Configurar ESLint flat config
- [x] Configurar Prettier
- [x] Configurar Husky + lint-staged (pre-commit hooks)
- [x] Configurar path aliases (@/\*) en tsconfig y vite
- [x] Crear .env.example con todas las variables documentadas
- [x] Crear .gitignore completo
- [x] Crear README.md con instrucciones

#### B. ESTILOS Y TEMA

- [x] Configurar Tailwind CSS v3
- [x] Crear globals.css con CSS variables para theming
- [x] Definir paleta light mode (--background, --foreground, --primary, etc.)
- [x] Definir paleta dark mode
- [x] Configurar fuentes Inter + JetBrains Mono (@fontsource)
- [x] Definir radios (sm, md, lg)
- [x] Crear clase .font-technical para datos técnicos
- [x] Instalar shadcn/ui CLI (components.json configurado)
- [x] Instalar componentes shadcn: button, card, input, label
- [x] Instalar componentes shadcn: dialog, dropdown-menu, table
- [x] Instalar componentes shadcn: form, toast, select, checkbox

#### C. ESTRUCTURA DE CARPETAS

- [x] src/config/ (firebase, env, constants)
- [x] src/lib/ (utils, date, format, permissions)
- [x] src/i18n/ (index, es.json, en.json)
- [x] src/types/ (auth, cliente, bus, novedad, conductor, firestore)
- [x] src/schemas/ (directorio creado, schemas pendientes)
- [x] src/services/ (directorio creado, servicios pendientes)
- [x] src/hooks/ (useTheme, useDebounce creados)
- [x] src/stores/ (ui.store creado)
- [x] src/components/ui/ (para shadcn)
- [x] src/components/layout/ (directorio creado)
- [x] src/components/common/ (LoadingState, Logo creados)
- [x] src/components/auth/ (directorio creado)
- [x] src/components/clientes/ (directorio creado)
- [x] src/components/buses/ (directorio creado)
- [x] src/components/camaras/ (directorio creado)
- [x] src/components/novedades/ (directorio creado)
- [x] src/components/conductores/ (directorio creado)
- [x] src/components/dashboard/ (directorio creado)
- [x] src/components/reportes/ (directorio creado)
- [x] src/components/usuarios/ (directorio creado)
- [x] src/pages/ (estructura completa)
- [x] src/routes/ (directorio creado)
- [x] src/tests/ (directorio creado)

#### D. CONFIGURACIÓN DE SERVICIOS

- [x] src/config/env.ts - Validación Zod de variables de entorno
- [x] src/config/firebase.ts - Inicialización Firebase SDK modular
- [x] src/config/constants.ts - Constantes globales (TZ, formatos, roles, etc.)

#### E. UTILIDADES (src/lib/)

- [x] utils.ts - cn() de shadcn y helpers genéricos
- [x] date.ts - Wrappers date-fns con TZ Bogotá
- [x] format.ts - Formateo de números, moneda, placas, teléfonos
- [x] permissions.ts - Matriz de permisos por rol y helpers

#### F. INTERNACIONALIZACIÓN

- [x] Configurar react-i18next
- [x] Crear es.json con todas las traducciones base
- [x] Crear en.json con todas las traducciones base
- [x] Configurar detección de idioma (localStorage + navigator)

#### G. TIPOS TYPESCRIPT (src/types/)

- [x] firestore.ts - BaseEntity, WithId, Entity<T>, helpers
- [x] auth.ts - Usuario, AuthState, CustomClaims, LoginCredentials
- [x] cliente.ts - Cliente, Sucursal, Propietario
- [x] bus.ts - Bus, Camara, BusWizardData
- [x] novedad.ts - NovedadCatalogo, NovedadConfig, Evento, Conteo
- [x] conductor.ts - Conductor

#### H. SCHEMAS ZOD (src/schemas/)

- [x] auth.schema.ts
- [x] cliente.schema.ts
- [x] bus.schema.ts
- [x] camara.schema.ts
- [x] novedad.schema.ts
- [x] conductor.schema.ts
- [x] index.ts (re-exports)

#### I. SERVICIOS FIREBASE (src/services/)

- [x] auth.service.ts
- [x] clientes.service.ts
- [x] buses.service.ts
- [x] camaras.service.ts
- [x] novedades.service.ts
- [x] conductores.service.ts
- [x] usuarios.service.ts
- [x] reportes.service.ts
- [x] storage.service.ts
- [x] index.ts (re-exports)

#### J. HOOKS PERSONALIZADOS (src/hooks/)

- [x] useTheme.ts - Toggle light/dark con persistencia
- [x] useDebounce.ts - Debounce de valores y callbacks
- [x] useAuth.ts - Hook principal de autenticación
- [x] usePermissions.ts - Validación de permisos por acción
- [x] index.ts (re-exports)

#### K. STORES ZUSTAND (src/stores/)

- [x] ui.store.ts - Sidebar, modals, mobile menu
- [x] auth.store.ts - Usuario actual, claims
- [x] filters.store.ts - Filtros persistentes de dashboard
- [x] index.ts (re-exports)

#### L. COMPONENTES COMUNES (src/components/common/)

- [x] LoadingState.tsx
- [x] Logo.tsx
- [x] EmptyState.tsx
- [x] ErrorBoundary.tsx
- [x] DataTable.tsx (wrapper TanStack Table)
- [x] PageHeader.tsx
- [x] ConfirmDialog.tsx
- [x] StatusBadge.tsx
- [x] FormField.tsx (incluye FormSection, FormGrid)
- [x] DateRangePicker.tsx (incluye SingleDatePicker)
- [x] index.ts (re-exports)

#### M. COMPONENTES DE LAYOUT (src/components/layout/)

- [x] AppShell.tsx (layout principal)
- [x] Sidebar.tsx
- [x] Header.tsx
- [x] ThemeToggle.tsx
- [x] LanguageToggle.tsx
- [x] UserMenu.tsx
- [x] Breadcrumbs.tsx
- [x] MobileMenu.tsx (menú móvil con Sheet)
- [x] index.ts (re-exports)

#### N. COMPONENTES DE AUTH (src/components/auth/)

- [x] LoginForm.tsx (funcional con Firebase, React Hook Form + Zod)
- [x] ProtectedRoute.tsx (incluye PublicRoute)
- [x] RoleGate.tsx (incluye Can, CanAny, CanAll)
- [x] index.ts (re-exports)

#### O. COMPONENTES DE CLIENTES (src/components/clientes/)

- [x] ClienteForm.tsx (React Hook Form + Zod, crea/edita cliente con planes)
- [x] ClientesTable.tsx (DataTable con acciones, badges de plan y estado)
- [x] SucursalForm.tsx (con datalist de ciudades colombianas)
- [x] PropietarioForm.tsx (con selector de sucursal, campos opcionales)
- [x] index.ts (re-exports)

#### P. COMPONENTES DE BUSES (src/components/buses/)

- [x] BusForm.tsx (con selector de sucursal/propietario, validacion IP/subnet)
- [x] BusesTable.tsx (DataTable con estado, camaras, novedades)
- [x] BusWizard.tsx (3 pasos: vehiculo, conectividad, camaras)
- [x] BusCard.tsx (con conteo del dia, ultimo heartbeat, novedades)
- [x] BusStatusIndicator.tsx (activo/inactivo/mantenimiento/sin_conexion)
- [x] index.ts (re-exports)

#### Q. COMPONENTES DE CÁMARAS (src/components/camaras/)

- [x] CamaraForm.tsx (RTSP URLs, resolucion inferencia, canal DVR)
- [x] CamarasGrid.tsx (grid con previews, estado, acciones)
- [x] PerfilCamaraSelect.tsx (select con iconos, PerfilCamaraBadge)
- [x] ScreenshotCapture.tsx (captura, preview, descarga, dialog zoom)
- [x] StreamLiveButton.tsx (placeholder con info RTSP)
- [x] index.ts (re-exports)

#### R. COMPONENTES DE NOVEDADES (src/components/novedades/)

- [x] NovedadCatalogoSelect.tsx (agrupado por categoria, NovedadIcon, NovedadCategoriaBadge)
- [x] NovedadConfigForm.tsx (dinamico segun tipo, params por novedad)
- [x] LineaVirtualEditor.tsx (dibujo SVG sobre screenshot, orientacion)
- [x] ZonaPoligonoEditor.tsx (poligono editable con vertices numerados)
- [x] NovedadesEventosTable.tsx (DataTable con estado, EventoEstadoBadge)
- [x] NovedadDetailModal.tsx (vista completa, acciones resolver/descartar/PDF)
- [x] index.ts (re-exports)

#### S. COMPONENTES DE CONDUCTORES (src/components/conductores/)

- [x] ConductorForm.tsx (licencia vencimiento, alerta expiración, foto)
- [x] ConductoresTable.tsx (estado licencia, bus asignado, acciones)
- [x] index.ts (re-exports)

#### T. COMPONENTES DE DASHBOARD (src/components/dashboard/)

- [x] KPICard.tsx (variantes, trends, KPIGrid helper)
- [x] FlotaOverview.tsx (estado flota, barra progreso, breakdown)
- [x] NovedadesRecientes.tsx (lista eventos recientes con thumbnails)
- [x] BusesEnVivoTable.tsx (estado real-time, conteo, novedades)
- [x] index.ts (re-exports)

#### U. COMPONENTES DE REPORTES (src/components/reportes/)

- [x] ReporteFiltros.tsx (filtros: tipo, fechas, sucursal, buses seleccionables)
- [x] ConteoSliderHorario.tsx (bar chart por hora, hora pico, detalle al click)
- [x] ReportePDF.tsx (tipos exportados, placeholder @react-pdf/renderer)
- [x] ReportePreview.tsx (NovedadesPreview, ConteoPreview, ConsolidadoPreview)
- [x] index.ts (re-exports)

#### V. COMPONENTES DE USUARIOS (src/components/usuarios/)

- [x] UsuarioForm.tsx (create/edit usuarios, role selection, sucursal/propietario binding)
- [x] UsuariosTable.tsx (DataTable con roles, cliente, estado, acciones)
- [x] AsignarRolForm.tsx (modal para cambiar rol con advertencias de cambio de tipo)
- [x] index.ts (re-exports, RoleBadge helper)

#### W. PÁGINAS (src/pages/)

**Auth:**

- [x] LoginPage.tsx (placeholder, falta Firebase Auth)
- [ ] RecuperarPasswordPage.tsx

**Principal:**

- [x] DashboardPage.tsx (placeholder con KPIs mock)
- [x] NotFoundPage.tsx
- [ ] ForbiddenPage.tsx (403)

**Clientes:**

- [ ] ClientesListPage.tsx
- [ ] ClienteDetailPage.tsx
- [ ] ClienteNuevoPage.tsx

**Buses:**

- [ ] BusesListPage.tsx
- [ ] BusDetailPage.tsx
- [ ] BusNuevoPage.tsx (wizard)
- [ ] BusConfigCamarasPage.tsx

**Cámaras:**

- [ ] CamaraConfigPage.tsx

**Novedades:**

- [ ] NovedadesEventosPage.tsx
- [ ] NovedadEventoDetailPage.tsx

**Conductores:**

- [ ] ConductoresListPage.tsx
- [ ] ConductorDetailPage.tsx

**Reportes:**

- [ ] ReportesGeneralPage.tsx
- [ ] ReporteConteoPage.tsx
- [ ] ReporteNovedadesPage.tsx

**Usuarios:**

- [ ] UsuariosListPage.tsx
- [ ] UsuarioDetailPage.tsx

**Configuración:**

- [ ] ConfiguracionPage.tsx

#### X. ROUTING (src/routes/)

- [x] App.tsx con createBrowserRouter básico
- [ ] index.tsx con rutas completas y loaders
- [ ] ProtectedLayout.tsx
- [ ] PublicLayout.tsx

#### Y. FUNCIONALIDADES ESPECÍFICAS

**Editor de Línea Virtual:**

- [ ] Canvas SVG sobre screenshot
- [ ] Estados: idle, placing-first, placing-second, adjusting
- [ ] Handles arrastrables
- [ ] Indicador de dirección (entrada/salida)
- [ ] Snap a horizontal/vertical/diagonal
- [ ] Coordenadas en porcentaje
- [ ] Validación dentro del frame

**Editor de Polígono:**

- [ ] Click agrega vértices
- [ ] Doble click cierra polígono
- [ ] Mínimo 3 vértices
- [ ] Vértices arrastrables
- [ ] Visualización con transparencia
- [ ] Validación no auto-intersectante

**Dashboard:**

- [ ] KPI: Buses activos / total
- [ ] KPI: Novedades hoy
- [ ] KPI: Pasajeros transportados
- [ ] KPI: Alertas críticas
- [ ] Gráfico novedades últimos 7 días
- [ ] Tabla buses con estado tiempo real
- [ ] Filtros: cliente, sucursal, estado, placa

**Wizard de Bus:**

- [ ] Step 1: Datos generales
- [ ] Step 2: Conectividad
- [ ] Step 3: Cámaras (1-6)
- [ ] Step 4: Revisión y crear

**Reportes PDF:**

- [ ] Template con header (logo + cliente)
- [ ] Datos del vehículo
- [ ] Fecha/hora del evento
- [ ] Screenshot grande
- [ ] Datos técnicos
- [ ] Footer con número y fecha

#### Z. DATOS Y SEED

- [ ] Seed catálogo de novedades MVP (5 tipos)
- [ ] Documentar reglas Firestore (para hardening)

#### AA. TESTING

- [ ] Configurar Vitest
- [ ] Smoke test: login
- [ ] Smoke test: crear bus
- [ ] Smoke test: configurar novedad

#### AB. CALIDAD Y PULIDO

- [ ] EmptyStates en todas las pantallas
- [ ] LoadingStates consistentes
- [ ] ErrorBoundaries por ruta
- [ ] Micro-interacciones sutiles
- [ ] Responsive móvil completo
- [ ] Audit log básico

---

### RESUMEN DE PROGRESO

| Categoría               | Completado | Total | %    |
| ----------------------- | ---------- | ----- | ---- |
| Configuración inicial   | 11         | 11    | 100% |
| Estilos y tema          | 11         | 11    | 100% |
| Estructura carpetas     | 20         | 20    | 100% |
| Configuración servicios | 3          | 3     | 100% |
| Utilidades              | 4          | 4     | 100% |
| i18n                    | 4          | 4     | 100% |
| Tipos TypeScript        | 6          | 6     | 100% |
| Schemas Zod             | 0          | 7     | 0%   |
| Servicios Firebase      | 0          | 9     | 0%   |
| Hooks                   | 3          | 4     | 75%  |
| Stores                  | 1          | 3     | 33%  |
| Componentes comunes     | 2          | 10    | 20%  |
| Componentes layout      | 0          | 7     | 0%   |
| Componentes auth        | 0          | 3     | 0%   |
| Componentes dominio     | 0          | 30+   | 0%   |
| Páginas                 | 3          | 20+   | ~15% |
| Routing                 | 1          | 4     | 25%  |
| Funcionalidades         | 0          | 25+   | 0%   |
| Testing                 | 0          | 4     | 0%   |

**Total estimado: ~15% del MVP completado**

---

## 9. Decisiones técnicas (ADR ligero)

| #   | Decisión                         | Justificación                                      |
| --- | -------------------------------- | -------------------------------------------------- |
| 1   | TypeScript strict sin any        | Seguridad de tipos crítica para producción         |
| 2   | pnpm sobre npm/yarn              | Más rápido, mejor manejo de dependencias           |
| 3   | Zustand sobre Redux              | Más simple, suficiente para este scope             |
| 4   | TanStack Query para servidor     | Cache, revalidación, loading states automáticos    |
| 5   | shadcn/ui sobre MUI/Chakra       | Control total, menor bundle, mejor DX              |
| 6   | Firebase sobre backend custom    | Time-to-market, escalabilidad automática           |
| 7   | Soft delete en todas partes      | Recuperabilidad, auditoría, integridad referencial |
| 8   | Timestamps UTC + display Bogotá  | Consistencia en datos, UX local                    |
| 9   | Conventional commits             | Historial legible, posible changelog automático    |
| 10  | PROCESS.md como fuente de verdad | Continuidad entre sesiones de desarrollo           |

---

## 10. Próximos pasos

1. **[ACTUAL]** Instalar componentes shadcn/ui base (button, card, input, etc.)
2. Implementar LoginPage funcional con Firebase Auth
3. Crear AuthStore (Zustand) con usuario actual
4. Implementar AppShell con Sidebar + Header
5. Crear ProtectedRoute y RoleGate components

---

## 11. Historial de sesiones

### Sesión 1 — 2026-05-19

- **Lo que se hizo:**
  - Inicialización del repositorio git
  - Creación de PROCESS.md completo con toda la documentación base
  - Setup completo de Vite + React 18 + TypeScript strict
  - Configuración de Tailwind con variables CSS de tema (light/dark)
  - Configuración de ESLint flat config + Prettier + Husky + lint-staged
  - Estructura completa de carpetas (config, lib, types, components, pages, etc.)
  - Path aliases (@/\*) en tsconfig y vite
  - Configuración de react-i18next con traducciones ES/EN
  - Configuración de Firebase SDK con validación Zod de env vars
  - Tipos base para auth, cliente, bus, novedad, conductor
  - Configuración de React Router v6
  - Hook useTheme para gestión de tema
  - Página de Login (placeholder)
  - Página de Dashboard (placeholder con KPIs mock)
  - Página 404
  - Componentes base: LoadingState, Logo
- **Decisiones tomadas:**
  - Usar React 18 (no 19) por compatibilidad con el ecosistema actual
  - TypeScript strictTypeChecked en ESLint para máxima seguridad de tipos
  - Excluir archivos de config (\*.config.ts) del project check de ESLint
  - Usar filter con type guard para manejar tipos de Zod fieldErrors
- **Bloqueos encontrados:**
  - Ninguno significativo, solo ajustes de lint
- **Lo que sigue:**
  - Instalar componentes shadcn/ui base
  - Completar Sprint 2: Autenticación y Layout completo

---

## 12. Glosario y notas

| Término              | Definición                                                 |
| -------------------- | ---------------------------------------------------------- |
| **Novedad**          | Evento detectado por IA (conteo, pasajero en cabina, etc.) |
| **Sucursal**         | Sede física de un cliente (terminal, garaje)               |
| **Propietario**      | Dueño de buses dentro de un cliente (modelo afiliador)     |
| **Perfil de cámara** | Tipo de ubicación: cabina, puerta, pasillo, etc.           |
| **DVR**              | Grabador de video digital en cada bus                      |
| **RUT200**           | Router 4G Teltonika con ZeroTier                           |
| **Línea virtual**    | Línea dibujada sobre frame para conteo de cruces           |
| **Zona polígono**    | Área delimitada para detección de presencia                |
| **Aforo**            | Cantidad actual de pasajeros en el bus                     |
| **Evento**           | Instancia de una novedad detectada en timestamp específico |

### Notas adicionales

- Zona horaria fija: America/Bogota (UTC-5)
- Formato de placa colombiana: ABC123 o ABC12D
- FPS inferencia recomendado: 3 (balance costo/precisión)
- Resolución inferencia recomendada: 480x360

---

## 13. Variables de entorno

```bash
# Firebase (requeridas)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Ambiente
VITE_ENV=development|staging|production

# Feature flags (opcionales)
VITE_ENABLE_DEBUG=false
VITE_MOCK_AUTH=false
```

---

## 14. Comandos útiles

```bash
# Desarrollo
pnpm dev              # Servidor desarrollo
pnpm build            # Build producción
pnpm preview          # Preview build local

# Calidad
pnpm lint             # ESLint
pnpm lint:fix         # ESLint + autofix
pnpm typecheck        # TypeScript check
pnpm format           # Prettier
pnpm test             # Vitest

# Antes de commit
pnpm lint && pnpm typecheck

# shadcn/ui
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
# etc.
```
