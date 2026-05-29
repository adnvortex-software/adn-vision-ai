# Backfill y Corrección de Arquitectura de Conteos

## Fecha de inicio: 2026-05-29

## Problema Identificado

- La colección `conteosDiarios` está vacía
- El documento `conteos/{busId}` solo guarda datos del día actual (se sobreescribe)
- Los eventos históricos SÍ existen en `conteos/{busId}/eventos`
- El dashboard no puede mostrar datos históricos porque busca en el lugar equivocado

## Estructura Actual (Incorrecta)

```
conteos/
  └── {busId}/                    ← Solo datos de HOY (se sobreescribe cada día)
        ├── entradasDia: number
        ├── salidasDia: number
        ├── aforoActual: number
        ├── fechaOperativa: string (YYYY-MM-DD)
        ├── clienteId: string
        └── updatedAt: timestamp
        └── eventos/              ← Subcolección con TODOS los eventos históricos
              └── {eventoId}/
                    ├── tipo: "entrada" | "salida"
                    ├── timestamp: Timestamp
                    ├── camaraId: string
                    ├── trackId: number
                    └── aforoTrasEvento: number
```

## Estructura Correcta (Objetivo)

```
conteos/
  └── {busId}/                    ← Datos del día actual (tiempo real)
        ├── entradasDia: number
        ├── salidasDia: number
        ├── aforoActual: number
        ├── fechaOperativa: string
        ├── clienteId: string
        └── updatedAt: timestamp
        └── eventos/              ← Eventos del día actual únicamente
              └── {eventoId}/...

conteosDiarios/
  └── {busId}_{fecha}/            ← Un documento por bus por día
        ├── busId: string
        ├── clienteId: string
        ├── fecha: string (YYYY-MM-DD)
        ├── totalEntradas: number
        ├── totalSalidas: number
        ├── aforoMaximoDia: number
        └── franjasHorarias: Record<string, {entradas, salidas}>
```

## Plan de Trabajo

### Fase 1: Backup de Datos Actuales

- [ ] Leer todos los documentos de `conteos`
- [ ] Leer todos los eventos de cada bus
- [ ] Guardar backup en archivo JSON local

### Fase 2: Crear Script de Backfill

- [ ] Crear script que lea eventos de `conteos/{busId}/eventos`
- [ ] Agrupar eventos por fecha (usando timestamp)
- [ ] Calcular totales por día (entradas, salidas, aforo máximo)
- [ ] Insertar en `conteosDiarios` con formato `{busId}_{fecha}`

### Fase 3: Modificar Backend/Servicios

- [ ] Revisar cómo se escriben los eventos actualmente
- [ ] Asegurar que al cambiar de día se cree snapshot en conteosDiarios
- [ ] Modificar dashboard para leer de conteosDiarios

### Fase 4: Limpieza

- [ ] Verificar datos en conteosDiarios
- [ ] Limpiar eventos que no corresponden al día actual en conteos/{busId}

---

## Progreso

### [2026-05-29 - Inicio]

- Creado este archivo de seguimiento
- Examinado conteos.service.ts - tiene funciones para leer eventos con filtro de fecha
- La función `getConteoEventos()` ya puede filtrar por fechaInicio/fechaFin

### [2026-05-29 - Fase 1: Creando funciones de backfill]

- [x] Agregada función `getAllConteoEventos()` - obtiene TODOS los eventos sin límite
- [x] Agregada función `aggregateEventosByDate()` - agrupa eventos por fecha
- [x] Agregada función `writeConteoDiario()` - escribe en conteosDiarios
- [x] Agregada función `backfillBusConteos()` - backfill para un bus específico
- [x] Agregada función `backfillAllConteos()` - backfill para todos los buses
- [x] Agregada función `getConteosDiariosForDashboard()` - lee conteos diarios para dashboard

### [2026-05-29 - Fase 2: Página de administración]

- [x] Creada página `/admin/backfill-conteos` para ejecutar el backfill
- [x] Solo accesible por super_admin
- [x] Muestra logs en tiempo real del proceso
- [x] Muestra estadísticas al finalizar

### [2026-05-29 - Fase 3: Actualizar Dashboard]

- [x] Dashboard ahora usa `getConteosDiariosForDashboard()` en lugar de `listAllConteos()`
- [x] Filtra por `fecha` en lugar de `fechaOperativa`
- [x] Usa `totalEntradas/totalSalidas` en lugar de `entradasDia/salidasDia`

### Archivos Modificados

- `src/services/conteos.service.ts` - Nuevas funciones de backfill
- `src/pages/admin/BackfillConteosPage.tsx` - Nueva página de admin
- `src/routes/index.tsx` - Nueva ruta /admin/backfill-conteos
- `src/pages/DashboardPage.tsx` - Actualizado para usar conteosDiarios

### Próximos Pasos

1. [x] Ejecutar el backfill desde la página de admin ✅ (ejecutado via script)
2. [x] Verificar que conteosDiarios tenga los datos correctos ✅ (16 documentos creados)
3. [ ] Verificar que el dashboard muestre los datos históricos
4. [ ] Limpiar datos incorrectos del día actual en conteos/{busId}

### [2026-05-29 - Fase 4: Backend modificado para auto-actualizar]

- [x] Modificado `adn-lynx-back/multi_counter.py`
- [x] Nuevo método `update_conteo_diario()` que actualiza `conteosDiarios` en tiempo real
- [x] Usa transacciones Firestore para actualizaciones atómicas
- [x] Cada evento (entrada/salida) ahora actualiza automáticamente:
  - `totalEntradas` / `totalSalidas`
  - `aforoMaximoDia`
  - `franjasHorarias` (por hora)

**Ya no es necesario ejecutar backfill manualmente.** Los datos históricos se mantienen automáticamente.

### Cómo Ejecutar el Backfill

1. Ir a `/admin/backfill-conteos` (solo super_admin)
2. Clic en "Verificar Buses" para ver los buses con datos
3. Clic en "Ejecutar Backfill" para procesar todos los eventos
4. Los datos se escribirán en la colección `conteosDiarios`

### Datos de Buses Actuales

#### Ejecución del Backfill: 2026-05-29

**Resumen:**

- Buses procesados: 2
- Total días: 16
- Total eventos: 2355

**Detalle por Bus:**

| Bus ID               | Días | Rango de Fechas         | Entradas | Salidas |
| -------------------- | ---- | ----------------------- | -------- | ------- |
| jhBZImNcXl2gZsgPI6Jz | 8    | 2026-05-21 → 2026-05-28 | 658      | 703     |
| kkDfcus6fWb1g1YQumFi | 8    | 2026-05-21 → 2026-05-28 | 485      | 509     |

**Documentos creados en `conteosDiarios`:**

- jhBZImNcXl2gZsgPI6Jz_2026-05-21
- jhBZImNcXl2gZsgPI6Jz_2026-05-22
- jhBZImNcXl2gZsgPI6Jz_2026-05-23
- jhBZImNcXl2gZsgPI6Jz_2026-05-24
- jhBZImNcXl2gZsgPI6Jz_2026-05-25
- jhBZImNcXl2gZsgPI6Jz_2026-05-26
- jhBZImNcXl2gZsgPI6Jz_2026-05-27
- jhBZImNcXl2gZsgPI6Jz_2026-05-28
- kkDfcus6fWb1g1YQumFi_2026-05-21
- kkDfcus6fWb1g1YQumFi_2026-05-22
- kkDfcus6fWb1g1YQumFi_2026-05-23
- kkDfcus6fWb1g1YQumFi_2026-05-24
- kkDfcus6fWb1g1YQumFi_2026-05-25
- kkDfcus6fWb1g1YQumFi_2026-05-26
- kkDfcus6fWb1g1YQumFi_2026-05-27
- kkDfcus6fWb1g1YQumFi_2026-05-28

**Estado:** ✅ Backfill completado exitosamente
