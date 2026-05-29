import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, User, Shield, Building2, MapPin, Pencil, UserX, UserCheck } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RoleBadge, AsignarRolForm, type UsuarioConDetalles } from '@/components/usuarios'
import type { Role } from '@/config/constants'
import { useToast } from '@/hooks/use-toast'

// Mock data - replace with actual data fetching
const mockUsuario: UsuarioConDetalles | null = null

export default function UsuarioDetailPage() {
  const { usuarioId } = useParams<{ usuarioId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { toast } = useToast()
  const [isLoading] = useState(false)
  const [showRolForm, setShowRolForm] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  if (isLoading) {
    return <LoadingState fullScreen />
  }

  if (!mockUsuario) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center rounded-lg border py-12">
          <User className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-semibold">{t('usuarios.notFound')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('usuarios.notFoundWithId', { id: usuarioId })}
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => {
              navigate('/usuarios')
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('usuarios.backToList')}
          </Button>
        </div>
      </div>
    )
  }

  const handleToggleActive = async () => {
    setIsProcessing(true)
    try {
      // TODO: Implement actual toggle
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({
        title: mockUsuario.activo ? t('usuarios.deactivated') : t('usuarios.activated'),
        description: mockUsuario.activo
          ? t('usuarios.deactivatedDesc', { name: mockUsuario.nombre })
          : t('usuarios.activatedDesc', { name: mockUsuario.nombre }),
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleChangeRole = async (_userId: string, _newRol: Role) => {
    setIsProcessing(true)
    try {
      // TODO: Implement actual role change
      // TODO: Change role in Firebase
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({
        title: t('usuarios.roleUpdated'),
        description: t('usuarios.roleUpdatedDesc', { name: mockUsuario.nombre }),
      })
      setShowRolForm(false)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <PageHeader
        title={mockUsuario.nombre}
        description={mockUsuario.email}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                navigate('/usuarios')
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                void handleToggleActive()
              }}
              disabled={isProcessing}
            >
              {mockUsuario.activo ? (
                <>
                  <UserX className="mr-2 h-4 w-4" />
                  {t('usuarios.deactivate')}
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  {t('usuarios.activate')}
                </>
              )}
            </Button>
            <Button
              onClick={() => {
                navigate(`/usuarios/${usuarioId ?? ''}/editar`)
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              {t('common.edit')}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informacion General */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('usuarios.generalInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{mockUsuario.nombre}</p>
                <p className="text-sm text-muted-foreground">{mockUsuario.email}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">{t('common.status')}</p>
              <Badge variant={mockUsuario.activo ? 'default' : 'secondary'}>
                {mockUsuario.activo ? t('common.active') : t('common.inactive')}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Rol y Permisos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('usuarios.roleAndPermissions')}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowRolForm(true)
              }}
            >
              {t('usuarios.changeRole')}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('usuarios.currentRole')}</p>
              <div className="mt-1">
                <RoleBadge rol={mockUsuario.rol} />
              </div>
            </div>

            {mockUsuario.clienteNombre && (
              <div>
                <p className="text-sm text-muted-foreground">{t('usuarios.cliente')}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{mockUsuario.clienteNombre}</span>
                </div>
              </div>
            )}

            {mockUsuario.sucursalesNombres && mockUsuario.sucursalesNombres.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">{t('usuarios.sucursales')}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {mockUsuario.sucursalesNombres.map((sucursal) => (
                    <Badge key={sucursal} variant="outline">
                      <MapPin className="mr-1 h-3 w-3" />
                      {sucursal}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Asignar Rol Dialog */}
      <AsignarRolForm
        usuario={mockUsuario}
        open={showRolForm}
        onOpenChange={setShowRolForm}
        onSubmit={handleChangeRole}
        isLoading={isProcessing}
      />
    </div>
  )
}
