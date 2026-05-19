import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Video, Settings } from 'lucide-react'
import { createCamaraSchema, type CreateCamaraFormData } from '@/schemas/camara.schema'
import { DEFAULT_INFERENCE_CONFIG } from '@/config/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PerfilCamaraSelect } from './PerfilCamaraSelect'
import type { Camara } from '@/types/bus'
import type { Entity } from '@/types/firestore'

interface CamaraFormProps {
  camara?: Entity<Camara>
  busPlaca?: string
  canalSugerido?: number
  onSubmit: (data: CreateCamaraFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export function CamaraForm({
  camara,
  busPlaca,
  canalSugerido = 1,
  onSubmit,
  onCancel,
  isLoading = false,
}: CamaraFormProps) {
  const form = useForm<CreateCamaraFormData>({
    resolver: zodResolver(createCamaraSchema),
    defaultValues: {
      nombre: camara?.nombre ?? '',
      perfil: camara?.perfil ?? 'cabina',
      canal: camara?.canal ?? canalSugerido,
      rtspUrl: camara?.rtspUrl ?? '',
      rtspSubstreamUrl: camara?.rtspSubstreamUrl,
      resolucionInferenciaW: camara?.resolucionInferenciaW ?? DEFAULT_INFERENCE_CONFIG.width,
      resolucionInferenciaH: camara?.resolucionInferenciaH ?? DEFAULT_INFERENCE_CONFIG.height,
      fpsInferencia: camara?.fpsInferencia ?? DEFAULT_INFERENCE_CONFIG.fps,
    },
  })

  const handleSubmit = async (data: CreateCamaraFormData) => {
    await onSubmit(data)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          <CardTitle>{camara ? 'Editar Camara' : 'Nueva Camara'}</CardTitle>
        </div>
        <CardDescription>
          {busPlaca
            ? `Camara para el bus ${busPlaca}`
            : camara
              ? 'Modifica la configuracion de la camara'
              : 'Configura una nueva camara para el bus'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Datos basicos */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Camara Cabina" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormDescription>Nombre descriptivo de la camara</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="perfil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Perfil</FormLabel>
                    <FormControl>
                      <PerfilCamaraSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>Tipo de vista de la camara</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="canal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Canal DVR</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={16}
                        disabled={isLoading}
                        {...field}
                        onChange={(e) => {
                          field.onChange(parseInt(e.target.value, 10) || 1)
                        }}
                      />
                    </FormControl>
                    <FormDescription>Canal del DVR (1-16)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* URLs RTSP */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Conexion RTSP</h3>
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="rtspUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL RTSP Principal</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="rtsp://admin:password@192.168.1.64:554/cam/realmonitor?channel=1"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Stream principal de alta resolucion</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rtspSubstreamUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL RTSP Secundario (Opcional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="rtsp://admin:password@192.168.1.64:554/cam/realmonitor?channel=1&subtype=1"
                          disabled={isLoading}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormDescription>Stream secundario de baja resolucion</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Configuracion de inferencia */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground">
                  Configuracion de Inferencia
                </h3>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="resolucionInferenciaW"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ancho (px)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={160}
                          max={1920}
                          disabled={isLoading}
                          {...field}
                          onChange={(e) => {
                            field.onChange(
                              parseInt(e.target.value, 10) || DEFAULT_INFERENCE_CONFIG.width
                            )
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="resolucionInferenciaH"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alto (px)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={120}
                          max={1080}
                          disabled={isLoading}
                          {...field}
                          onChange={(e) => {
                            field.onChange(
                              parseInt(e.target.value, 10) || DEFAULT_INFERENCE_CONFIG.height
                            )
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fpsInferencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FPS</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          disabled={isLoading}
                          {...field}
                          onChange={(e) => {
                            field.onChange(
                              parseInt(e.target.value, 10) || DEFAULT_INFERENCE_CONFIG.fps
                            )
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Resolucion y FPS usados para el procesamiento de IA. Valores mas bajos reducen el
                uso de recursos.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : camara ? (
                  'Guardar Cambios'
                ) : (
                  'Crear Camara'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
