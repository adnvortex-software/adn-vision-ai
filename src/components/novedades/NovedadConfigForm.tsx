import { useForm } from 'react-hook-form'
import { Loader2, Settings, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { NovedadCatalogoSelect, NovedadIcon } from './NovedadCatalogoSelect'
import type { NovedadCatalogo, NovedadParams, CreateNovedadConfigData } from '@/types/novedad'
import type { Entity } from '@/types/firestore'

interface NovedadConfigFormProps {
  catalogo: Entity<NovedadCatalogo>[]
  camaraPerfil?: string
  initialConfig?: CreateNovedadConfigData
  onSubmit: (data: CreateNovedadConfigData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

interface FormData {
  tipoNovedad: string
  tiempoMinimoSeg: number
  cantidadMaxima: number
  sensibilidad: number
}

export function NovedadConfigForm({
  catalogo,
  camaraPerfil,
  initialConfig,
  onSubmit,
  onCancel,
  isLoading = false,
}: NovedadConfigFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      tipoNovedad: initialConfig?.tipoNovedad ?? '',
      tiempoMinimoSeg: initialConfig?.params.tiempoMinimoSeg ?? 10,
      cantidadMaxima: initialConfig?.params.cantidadMaxima ?? 0,
      sensibilidad: initialConfig?.params.sensibilidad ?? 50,
    },
  })

  const selectedTipo = watch('tipoNovedad')
  const selectedNovedad = catalogo.find((item) => item.codigo === selectedTipo)

  const handleFormSubmit = async (data: FormData) => {
    const params: NovedadParams = {}

    if (selectedNovedad) {
      // Build params based on what the novedad type requires
      const schema = selectedNovedad.paramsSchema
      if ('tiempoMinimoSeg' in schema) {
        params.tiempoMinimoSeg = data.tiempoMinimoSeg
      }
      if ('cantidadMaxima' in schema) {
        params.cantidadMaxima = data.cantidadMaxima
      }
      if ('sensibilidad' in schema) {
        params.sensibilidad = data.sensibilidad
      }
    }

    await onSubmit({
      tipoNovedad: data.tipoNovedad,
      params,
    })
  }

  // Filter catalogo by camera profile if provided
  const compatibleNovedades = camaraPerfil
    ? catalogo.filter((item) => item.perfilesCompatibles.includes(camaraPerfil))
    : catalogo

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <CardTitle>Configurar Novedad</CardTitle>
        </div>
        <CardDescription>Selecciona y configura una novedad para esta camara</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Tipo de novedad */}
          <div className="space-y-2">
            <Label>Tipo de Novedad</Label>
            <NovedadCatalogoSelect
              value={selectedTipo}
              onValueChange={(value) => {
                setValue('tipoNovedad', value)
              }}
              catalogo={compatibleNovedades}
              disabled={isLoading}
              filterByPerfil={camaraPerfil}
            />
            {errors.tipoNovedad && (
              <p className="text-sm text-destructive">{errors.tipoNovedad.message}</p>
            )}
          </div>

          {/* Selected novedad info */}
          {selectedNovedad && (
            <Alert>
              <NovedadIcon categoria={selectedNovedad.categoria} />
              <AlertDescription className="ml-2">
                <strong>{selectedNovedad.nombre}:</strong> {selectedNovedad.descripcion}
                {selectedNovedad.generaPDF && (
                  <span className="ml-2 text-xs text-muted-foreground">(Genera PDF)</span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Dynamic parameters based on selected type */}
          {selectedNovedad && (
            <div className="space-y-4 rounded-lg border p-4">
              <h4 className="text-sm font-medium">Parametros</h4>

              {/* Tiempo minimo */}
              {selectedNovedad.codigo !== 'conteo_pasajeros' && (
                <div className="space-y-2">
                  <Label htmlFor="tiempoMinimoSeg">Tiempo minimo (segundos)</Label>
                  <Input
                    id="tiempoMinimoSeg"
                    type="number"
                    min={1}
                    max={300}
                    disabled={isLoading}
                    {...register('tiempoMinimoSeg', {
                      valueAsNumber: true,
                      min: { value: 1, message: 'Minimo 1 segundo' },
                      max: { value: 300, message: 'Maximo 300 segundos' },
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tiempo que debe persistir la condicion antes de generar alerta
                  </p>
                  {errors.tiempoMinimoSeg && (
                    <p className="text-sm text-destructive">{errors.tiempoMinimoSeg.message}</p>
                  )}
                </div>
              )}

              {/* Cantidad maxima (for sobrecupo, pasajero_en_cabina) */}
              {(selectedNovedad.codigo === 'sobrecupo' ||
                selectedNovedad.codigo === 'pasajero_en_cabina') && (
                <div className="space-y-2">
                  <Label htmlFor="cantidadMaxima">Cantidad maxima permitida</Label>
                  <Input
                    id="cantidadMaxima"
                    type="number"
                    min={0}
                    max={100}
                    disabled={isLoading}
                    {...register('cantidadMaxima', {
                      valueAsNumber: true,
                      min: { value: 0, message: 'Minimo 0' },
                      max: { value: 100, message: 'Maximo 100' },
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    0 significa que no debe haber ninguna persona en la zona
                  </p>
                </div>
              )}

              {/* Zona/Linea virtual notice */}
              {(selectedNovedad.codigo === 'conteo_pasajeros' ||
                'zonaPoligono' in selectedNovedad.paramsSchema ||
                'lineaVirtual' in selectedNovedad.paramsSchema) && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {selectedNovedad.codigo === 'conteo_pasajeros'
                      ? 'La linea virtual se configura en el editor visual despues de guardar.'
                      : 'La zona de deteccion se configura en el editor visual despues de guardar.'}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={isLoading || !selectedTipo}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : initialConfig ? (
                'Guardar Cambios'
              ) : (
                'Agregar Novedad'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
