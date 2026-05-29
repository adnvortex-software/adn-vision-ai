import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, ClipboardList, Loader2, Search, X } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DespachosTable } from '@/components/despachos/DespachosTable'
import { DespachoTirillaModal } from '@/components/despachos/DespachoTirillaModal'
import { listDespachos, updateDespachoEstado } from '@/services/despachos.service'
import { useAuthStore } from '@/stores/auth.store'
import { useDataStore } from '@/stores/data.store'
import { useToast } from '@/hooks/use-toast'
import { DESPACHO_STATES } from '@/types/despacho'
import type { Entity } from '@/types/firestore'
import type { Despacho, DespachoState } from '@/types/despacho'

export default function DespachosListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { usuario } = useAuthStore()
  const { clientes, getClienteById } = useDataStore()

  const [despachos, setDespachos] = useState<Entity<Despacho>[]>([])
  const [filteredDespachos, setFilteredDespachos] = useState<Entity<Despacho>[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDespacho, setSelectedDespacho] = useState<Entity<Despacho> | null>(null)
  const [tirillaOpen, setTirillaOpen] = useState(false)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState<string>('todos')
  const [filterClienteId, setFilterClienteId] = useState<string>('todos')

  const isInternal =
    usuario?.rol === 'super_admin' || usuario?.rol === 'ops_admin' || usuario?.rol === 'analyst'
  const isClient = usuario?.rol === 'client_admin' || usuario?.rol === 'client_viewer'
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const userClienteId = isClient ? (usuario?.clienteId ?? undefined) : undefined

  const loadDespachos = async () => {
    setIsLoading(true)
    try {
      // For client users, always filter by their clienteId
      const result = await listDespachos({
        clienteId: userClienteId,
        limit: 200,
      })
      setDespachos(result.data)
      setFilteredDespachos(result.data)
    } catch (err) {
      console.error('Error loading despachos:', err)
      toast({
        title: t('common.error'),
        description: t('despachos.errorLoading'),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadDespachos()
  }, [userClienteId])

  // Apply filters
  useEffect(() => {
    let result = [...despachos]

    // Filter by search term (placa, conductor, ruta)
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (d) =>
          d.placa.toLowerCase().includes(term) ||
          d.conductor.toLowerCase().includes(term) ||
          d.ruta.toLowerCase().includes(term) ||
          d.clienteNombre.toLowerCase().includes(term)
      )
    }

    // Filter by estado
    if (filterEstado !== 'todos') {
      result = result.filter((d) => d.estado === filterEstado)
    }

    // Filter by cliente (only for internal users)
    if (isInternal && filterClienteId !== 'todos') {
      result = result.filter((d) => d.clienteId === filterClienteId)
    }

    setFilteredDespachos(result)
  }, [despachos, searchTerm, filterEstado, filterClienteId, isInternal])

  const handleViewTirilla = (despacho: Entity<Despacho>) => {
    setSelectedDespacho(despacho)
    setTirillaOpen(true)
  }

  const handleUpdateEstado = async (despacho: Entity<Despacho>, estado: DespachoState) => {
    try {
      await updateDespachoEstado(despacho.id, estado)
      toast({
        title: t('despachos.estadoActualizado'),
        description: t('despachos.estadoActualizadoDesc', {
          estado: t(`despachos.estados.${estado}`),
        }),
      })
      await loadDespachos()
    } catch {
      toast({
        title: t('common.error'),
        description: t('despachos.errorUpdateEstado'),
        variant: 'destructive',
      })
    }
  }

  const getClienteLogo = (clienteId: string): string | undefined => {
    const cliente = getClienteById(clienteId)
    return (cliente as { logoUrl?: string } | undefined)?.logoUrl ?? undefined
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilterEstado('todos')
    setFilterClienteId('todos')
  }

  const hasActiveFilters = searchTerm || filterEstado !== 'todos' || filterClienteId !== 'todos'

  return (
    <div className="container mx-auto space-y-6 py-6">
      <PageHeader
        title={t('nav.despachos')}
        description={t('despachos.description')}
        actions={
          <Button
            data-tour="new-despacho-btn"
            onClick={() => {
              navigate('/despachos/nuevo')
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('despachos.nuevo')}
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('despachos.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                }}
                className="pl-9"
              />
            </div>

            {/* Estado filter */}
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t('despachos.estado')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">{t('despachos.todosEstados')}</SelectItem>
                {DESPACHO_STATES.map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {t(`despachos.estados.${estado}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Cliente filter (only for internal users) */}
            {isInternal && (
              <Select value={filterClienteId} onValueChange={setFilterClienteId}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder={t('despachos.cliente')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">{t('despachos.todosClientes')}</SelectItem>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Clear filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                {t('common.clear')}
              </Button>
            )}
          </div>

          {/* Results count */}
          {!isLoading && (
            <p className="mt-4 text-sm text-muted-foreground">
              {t('despachos.resultsCount', { count: filteredDespachos.length })}
              {hasActiveFilters &&
                ` ${t('common.of')} ${String(despachos.length)} ${t('common.total').toLowerCase()}`}
            </p>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredDespachos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <ClipboardList className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-semibold">
            {hasActiveFilters ? t('common.noResults') : t('despachos.sinDespachos')}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasActiveFilters ? t('despachos.ajustarFiltros') : t('despachos.comienzaCreando')}
          </p>
          {hasActiveFilters ? (
            <Button className="mt-4" variant="outline" onClick={clearFilters}>
              {t('despachos.limpiarFiltros')}
            </Button>
          ) : (
            <Button
              className="mt-4"
              onClick={() => {
                navigate('/despachos/nuevo')
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('despachos.crearDespacho')}
            </Button>
          )}
        </div>
      ) : (
        <DespachosTable
          despachos={filteredDespachos}
          onViewTirilla={handleViewTirilla}
          onUpdateEstado={handleUpdateEstado}
        />
      )}

      {selectedDespacho && (
        <DespachoTirillaModal
          open={tirillaOpen}
          onOpenChange={setTirillaOpen}
          despacho={selectedDespacho}
          clienteLogo={getClienteLogo(selectedDespacho.clienteId)}
        />
      )}
    </div>
  )
}
