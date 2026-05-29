import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Building2, Upload, X, Image } from 'lucide-react'
import { createClienteSchema, type CreateClienteFormData } from '@/schemas/cliente.schema'
import { PLANS } from '@/config/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import type { Cliente } from '@/types/cliente'
import type { Entity } from '@/types/firestore'

interface ClienteFormProps {
  cliente?: Entity<Cliente>
  onSubmit: (data: CreateClienteFormData, logoFile?: File) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export function ClienteForm({ cliente, onSubmit, onCancel, isLoading = false }: ClienteFormProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(cliente?.logoUrl ?? null)

  const form = useForm<CreateClienteFormData>({
    resolver: zodResolver(createClienteSchema),
    defaultValues: {
      nombre: cliente?.nombre ?? '',
      nit: cliente?.nit ?? '',
      contactoEmail: cliente?.contactoEmail ?? '',
      contactoTelefono: cliente?.contactoTelefono ?? '',
      planContratado: cliente?.planContratado ?? 'basico',
    },
  })

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: t('common.error'),
        description: t('clientes.onlyImagesAllowed'),
        variant: 'destructive',
      })
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: t('common.error'),
        description: t('clientes.fileTooLarge'),
        variant: 'destructive',
      })
      return
    }

    setLogoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(cliente?.logoUrl ?? null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (data: CreateClienteFormData) => {
    await onSubmit(data, logoFile ?? undefined)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          <CardTitle>{cliente ? t('clientes.editCliente') : t('clientes.nuevo')}</CardTitle>
        </div>
        <CardDescription>
          {cliente ? t('clientes.editDescription') : t('clientes.formDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>{t('clientes.companyLogo')}</Label>
              <div className="flex items-start gap-4">
                {/* Preview */}
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Image className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>

                {/* Upload controls */}
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {logoPreview ? t('clientes.changeLogo') : t('clientes.uploadLogo')}
                  </Button>
                  {logoFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveLogo}
                      disabled={isLoading}
                    >
                      <X className="mr-2 h-4 w-4" />
                      {t('common.remove')}
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">{t('clientes.logoFormats')}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t('clientes.companyName')}</FormLabel>
                    <FormControl>
                      <Input placeholder="Transportes XYZ S.A.S." disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('clientes.nit')}</FormLabel>
                    <FormControl>
                      <Input placeholder="900.123.456-7" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormDescription>{t('clientes.nitDescription')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="planContratado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('clientes.plan')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('clientes.selectPlan')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PLANS.map((plan) => (
                          <SelectItem key={plan} value={plan}>
                            {t(`clientes.planes.${plan}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>{t('clientes.planDescription')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactoEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('clientes.email')}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="contacto@empresa.com"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactoTelefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('clientes.telefono')}</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="(601) 123-4567"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                  {t('common.cancel')}
                </Button>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.saving')}
                  </>
                ) : cliente ? (
                  t('common.saveChanges')
                ) : (
                  t('clientes.createCliente')
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
