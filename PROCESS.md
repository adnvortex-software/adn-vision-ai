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

| Componente | Responsabilidad |
|------------|-----------------|
| DVR en bus | Grabación de 4-6 cámaras RTSP |
| RUT200 | Router 4G con ZeroTier |
| ZeroTier VPN | Red privada entre buses y servidor |
| Servidor on-prem | Procesamiento de video con IA (Python) |
| Firebase | Base de datos, auth, storage, funciones |
| Frontend (este repo) | Interfaz web para gestión y visualización |

---

## 3. Stack tecnológico

| Categoría | Tecnología | Versión |
|-----------|------------|---------|
| Framework | React + Vite | 18.x + 5.x |
| Lenguaje | TypeScript | strict: true |
| Estilos | Tailwind CSS | v3.x |
| UI Components | shadcn/ui | latest |
| Iconos | lucide-react | latest |
| Fuentes | Inter + JetBrains Mono | @fontsource |
| Gráficos | Recharts + Tremor | latest |
| Tablas | TanStack Table | v8 |
| Formularios | React Hook Form + Zod | latest |
| Estado servidor | TanStack Query | v5 |
| Estado cliente | Zustand | latest |
| Routing | React Router | v6 |
| i18n | react-i18next | latest |
| Firebase | SDK modular | v10 |
| PDFs | @react-pdf/renderer | latest |
| Fechas | date-fns + date-fns-tz | latest |
| Notificaciones | sonner | latest |
| Drag & drop | @dnd-kit/core | latest |
| Linter | ESLint flat config + Prettier | latest |
| Pre-commit | Husky + lint-staged | latest |
| Tests | Vitest + Testing Library | latest |
| Package manager | pnpm | latest |

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
  planContratado: "basico" | "profesional" | "premium"
  activo: boolean
  createdAt, updatedAt, createdBy
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
  foto: string | null  // URL Storage
}
```

#### `buses/{busId}`
```typescript
{
  placa: string                 // Único, mayúsculas
  clienteId: string
  sucursalId: string
  propietarioId: string | null
  tipoVehiculo: "bus" | "buseta" | "van" | "microbus" | "otro"
  rutaTexto: string | null
  conductorAsignadoId: string | null
  
  // Conectividad
  ztIpRouter: string            // IP ZeroTier del RUT200
  subnetLan: string             // Ej: "192.168.26.0/24"
  
  // Estado operativo
  estado: "activo" | "inactivo" | "mantenimiento" | "sin_conexion"
  lastHeartbeat: Timestamp | null
  numCamarasConfiguradas: number
  
  activo: boolean
  createdAt, updatedAt, createdBy
}
```

#### `buses/{busId}/camaras/{camaraId}`
```typescript
{
  nombre: string                // "Cabina", "Puerta", etc
  perfil: "cabina" | "puerta" | "pasillo" | "frontal" | "exterior" | "otro"
  canal: number                 // Canal DVR (1-N)
  rtspUrl: string
  rtspSubstreamUrl: string | null
  resolucionInferenciaW: number // default 480
  resolucionInferenciaH: number // default 360
  fpsInferencia: number         // default 3
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
  estado: "nuevo" | "revisado" | "resuelto" | "descartado"
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
  fechaOperativa: string        // "2026-05-19"
  updatedAt: Timestamp
}
```

#### `conteos/{busId}/historial/{eventoId}`
```typescript
{
  tipo: "entrada" | "salida"
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

| Rol | Descripción |
|-----|-------------|
| `super_admin` | Acceso total. Gestiona catálogo, otros super_admins |
| `ops_admin` | Gestiona clientes, buses, cámaras, novedades. Ve todo |
| `analyst` | Revisa eventos, genera reportes, crea usuarios cliente |
| `support` | Solo lectura de todo |

### Roles de cliente (usuarios de empresas de buses)

| Rol | Descripción |
|-----|-------------|
| `client_admin` | Ve todos los buses de SU cliente. Gestiona viewers |
| `client_viewer` | Solo lectura. Puede estar limitado a sucursal/propietario |

### Matriz de permisos

| Acción | super_admin | ops_admin | analyst | support | client_admin | client_viewer |
|--------|:-----------:|:---------:|:-------:|:-------:|:------------:|:-------------:|
| clientes.create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| clientes.read | ✅ | ✅ | ✅ | ✅ | 🔒 | 🔒 |
| clientes.update | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| clientes.delete | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| buses.create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| buses.read | ✅ | ✅ | ✅ | ✅ | 🔒 | 🔒 |
| buses.update | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| camaras.configure | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| novedades.configure | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| eventos.read | ✅ | ✅ | ✅ | ✅ | 🔒 | 🔒 |
| eventos.resolve | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| reportes.generate | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| reportes.download | ✅ | ✅ | ✅ | ✅ | 🔒 | 🔒 |
| usuarios.create | ✅ | ❌ | ✅* | ❌ | ✅* | ❌ |
| usuarios.update | ✅ | ❌ | ❌ | ❌ | ✅* | ❌ |
| catalogo.manage | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| audit.read | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

🔒 = Solo su cliente | ✅* = Solo usuarios de su cliente con rol inferior

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
**Progreso general:** 0%

### Sprint 1: Fundamentos
- [x] Crear PROCESS.md base
- [ ] Setup Vite + React + TypeScript estricto
- [ ] Configurar Tailwind + globals.css con variables de tema
- [ ] Configurar ESLint flat config + Prettier + Husky + lint-staged
- [ ] Estructura de carpetas completa
- [ ] Configurar paths aliases en tsconfig y vite
- [ ] Instalar shadcn/ui base
- [ ] Configurar react-i18next
- [ ] Configurar Firebase SDK con env validadas
- [ ] Crear archivos base de tipos
- [ ] Configurar React Router v6 con layouts
- [ ] Implementar ThemeProvider
- [ ] Implementar LanguageProvider
- [ ] Commit inicial limpio

### Sprint 2: Autenticación y Layout
- [ ] LoginPage funcional
- [ ] AuthStore (Zustand)
- [ ] useAuth hook
- [ ] ProtectedRoute
- [ ] RoleGate component
- [ ] usePermissions hook
- [ ] AppShell con Sidebar + Header
- [ ] Navegación dinámica según rol
- [ ] UserMenu con logout
- [ ] ThemeToggle funcional
- [ ] LanguageToggle funcional
- [ ] Breadcrumbs dinámicos
- [ ] Páginas 404 y 403

### Sprint 3: Gestión de clientes
- [ ] CRUD de clientes
- [ ] CRUD de sucursales
- [ ] CRUD de propietarios
- [ ] CRUD de conductores
- [ ] DataTable component
- [ ] Validaciones Zod
- [ ] Servicios Firestore

### Sprint 4: Gestión de buses
- [ ] CRUD de buses
- [ ] BusWizard multi-step
- [ ] Configuración de cámaras
- [ ] Página detalle de bus
- [ ] CamarasGrid
- [ ] Validaciones
- [ ] ScreenshotCapture

### Sprint 5: Configuración de novedades
- [ ] Seed catálogo MVP
- [ ] Pantalla config cámara
- [ ] NovedadConfigForm dinámico
- [ ] LineaVirtualEditor
- [ ] ZonaPoligonoEditor
- [ ] Persistencia Firestore
- [ ] Preview tiempo real

### Sprint 6: Dashboard y eventos
- [ ] DashboardPage con KPIs
- [ ] Tabla buses tiempo real
- [ ] Pantalla eventos
- [ ] Modal detalle evento
- [ ] Cambio estado evento
- [ ] Filtros avanzados

### Sprint 7: Reportes
- [ ] ReportePDF component
- [ ] Reportes por evento
- [ ] Reporte consolidado
- [ ] ReporteConteoPage
- [ ] Exportación PDF/Excel
- [ ] Almacenamiento reportes

### Sprint 8: Usuarios y pulido
- [ ] Gestión usuarios
- [ ] Invitación email
- [ ] Audit log
- [ ] EmptyStates
- [ ] LoadingStates
- [ ] ErrorBoundaries
- [ ] Animaciones
- [ ] Responsive
- [ ] Smoke tests
- [ ] README completo

---

## 9. Decisiones técnicas (ADR ligero)

| # | Decisión | Justificación |
|---|----------|---------------|
| 1 | TypeScript strict sin any | Seguridad de tipos crítica para producción |
| 2 | pnpm sobre npm/yarn | Más rápido, mejor manejo de dependencias |
| 3 | Zustand sobre Redux | Más simple, suficiente para este scope |
| 4 | TanStack Query para servidor | Cache, revalidación, loading states automáticos |
| 5 | shadcn/ui sobre MUI/Chakra | Control total, menor bundle, mejor DX |
| 6 | Firebase sobre backend custom | Time-to-market, escalabilidad automática |
| 7 | Soft delete en todas partes | Recuperabilidad, auditoría, integridad referencial |
| 8 | Timestamps UTC + display Bogotá | Consistencia en datos, UX local |
| 9 | Conventional commits | Historial legible, posible changelog automático |
| 10 | PROCESS.md como fuente de verdad | Continuidad entre sesiones de desarrollo |

---

## 10. Próximos pasos

1. **[ACTUAL]** Setup Vite + React + TypeScript estricto
2. Configurar Tailwind con variables de tema
3. Configurar ESLint flat config + Prettier
4. Crear estructura de carpetas completa
5. Instalar y configurar shadcn/ui

---

## 11. Historial de sesiones

### Sesión 1 — 2026-05-19
- **Lo que se hizo:**
  - Inicialización del repositorio git
  - Creación de PROCESS.md completo con toda la documentación base
- **Decisiones tomadas:**
  - Seguir estructura de sprints definida
  - Priorizar fundamentos antes de features
- **Bloqueos encontrados:**
  - Ninguno
- **Lo que sigue:**
  - Setup de Vite + React + TypeScript
  - Configuración de Tailwind
  - Estructura de carpetas

---

## 12. Glosario y notas

| Término | Definición |
|---------|------------|
| **Novedad** | Evento detectado por IA (conteo, pasajero en cabina, etc.) |
| **Sucursal** | Sede física de un cliente (terminal, garaje) |
| **Propietario** | Dueño de buses dentro de un cliente (modelo afiliador) |
| **Perfil de cámara** | Tipo de ubicación: cabina, puerta, pasillo, etc. |
| **DVR** | Grabador de video digital en cada bus |
| **RUT200** | Router 4G Teltonika con ZeroTier |
| **Línea virtual** | Línea dibujada sobre frame para conteo de cruces |
| **Zona polígono** | Área delimitada para detección de presencia |
| **Aforo** | Cantidad actual de pasajeros en el bus |
| **Evento** | Instancia de una novedad detectada en timestamp específico |

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
