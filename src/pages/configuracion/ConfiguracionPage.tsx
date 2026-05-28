import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Moon,
  Sun,
  Globe,
  Bell,
  Shield,
  Palette,
  HelpCircle,
  Loader2,
  User,
  Camera,
  Eye,
  EyeOff,
} from 'lucide-react'
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, storage } from '@/config/firebase'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useTheme } from '@/hooks/useTheme'
import { useTranslation } from 'react-i18next'
import { useTriggerOnboarding } from '@/components/onboarding'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/hooks/use-toast'
import { updateUsuario } from '@/services/usuarios.service'
import {
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileFormData,
  type ChangePasswordFormData,
} from '@/schemas/auth.schema'

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function ConfiguracionPage() {
  const { theme, toggleTheme } = useTheme()
  const { i18n } = useTranslation()
  const { toast } = useToast()
  const { usuario, refreshUsuario } = useAuthStore()
  const [notificaciones, setNotificaciones] = useState(true)
  const [sonidos, setSonidos] = useState(true)
  const [isRestartingTour, setIsRestartingTour] = useState(false)
  const { triggerTour } = useTriggerOnboarding()

  // Profile editing
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Password change
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Profile form
  const profileForm = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      nombre: usuario?.nombre ?? '',
      telefono: (usuario as { telefono?: string }).telefono ?? '',
    },
  })

  // Password form
  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const handleLanguageChange = (lang: string) => {
    void i18n.changeLanguage(lang)
  }

  const handleRestartTour = async () => {
    setIsRestartingTour(true)
    await triggerTour()
  }

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !usuario) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Solo se permiten archivos de imagen',
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'La imagen no debe superar los 5MB',
      })
      return
    }

    setIsUploadingPhoto(true)
    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `usuarios/${usuario.uid}/foto.jpg`)
      await uploadBytes(storageRef, file)
      const fotoUrl = await getDownloadURL(storageRef)

      // Update user document
      await updateUsuario(usuario.uid, { fotoUrl } as Record<string, unknown>)

      // Refresh user data
      await refreshUsuario()

      toast({
        title: 'Foto actualizada',
        description: 'Tu foto de perfil ha sido actualizada',
      })
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo subir la foto',
      })
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleProfileSubmit = async (data: UpdateProfileFormData) => {
    if (!usuario) return

    try {
      await updateUsuario(usuario.uid, {
        nombre: data.nombre,
        telefono: data.telefono ?? null,
      } as Record<string, unknown>)

      await refreshUsuario()

      toast({
        title: 'Perfil actualizado',
        description: 'Tus datos han sido actualizados',
      })
      setIsEditingProfile(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el perfil',
      })
    }
  }

  const handlePasswordSubmit = async (data: ChangePasswordFormData) => {
    const user = auth.currentUser
    if (!user?.email) return

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, data.currentPassword)
      await reauthenticateWithCredential(user, credential)

      // Update password
      await updatePassword(user, data.newPassword)

      toast({
        title: 'Contraseña actualizada',
        description: 'Tu contraseña ha sido cambiada exitosamente',
      })
      setShowPasswordDialog(false)
      passwordForm.reset()
    } catch (error: unknown) {
      console.error('Error changing password:', error)
      const firebaseError = error as { code?: string }
      if (firebaseError.code === 'auth/wrong-password') {
        passwordForm.setError('currentPassword', {
          message: 'La contraseña actual es incorrecta',
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo cambiar la contraseña',
        })
      }
    }
  }

  const fotoUrl = (usuario as { fotoUrl?: string }).fotoUrl

  return (
    <div className="container mx-auto max-w-3xl space-y-6 py-6">
      <PageHeader title="Configuracion" description="Personaliza tu experiencia en la plataforma" />

      {/* Perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Perfil
          </CardTitle>
          <CardDescription>Administra tu informacion personal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Photo */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={fotoUrl ?? undefined} alt={usuario?.nombre} />
                <AvatarFallback className="bg-primary text-lg text-primary-foreground">
                  {usuario ? getInitials(usuario.nombre) : '??'}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="secondary"
                size="icon"
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                onClick={handlePhotoClick}
                disabled={isUploadingPhoto}
              >
                {isUploadingPhoto ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  void handlePhotoChange(e)
                }}
              />
            </div>
            <div>
              <p className="font-medium">{usuario?.nombre}</p>
              <p className="text-sm text-muted-foreground">{usuario?.email}</p>
            </div>
          </div>

          {/* Profile Form */}
          {isEditingProfile ? (
            <Form {...profileForm}>
              <form
                onSubmit={(e) => {
                  void profileForm.handleSubmit(handleProfileSubmit)(e)
                }}
                className="space-y-4"
              >
                <FormField
                  control={profileForm.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre completo</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefono (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          placeholder="+57 300 123 4567"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                    {profileForm.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      'Guardar'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditingProfile(false)
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Correo electronico</Label>
                <p className="text-sm">{usuario?.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Telefono</Label>
                <p className="text-sm">
                  {(usuario as { telefono?: string }).telefono ?? 'No configurado'}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  profileForm.reset({
                    nombre: usuario?.nombre ?? '',
                    telefono: (usuario as { telefono?: string }).telefono ?? '',
                  })
                  setIsEditingProfile(true)
                }}
              >
                Editar Perfil
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Apariencia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Apariencia
          </CardTitle>
          <CardDescription>Personaliza el aspecto de la interfaz</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                Tema Oscuro
              </Label>
              <p className="text-sm text-muted-foreground">Cambia entre el tema claro y oscuro</p>
            </div>
            <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Idioma
              </Label>
              <p className="text-sm text-muted-foreground">Selecciona el idioma de la interfaz</p>
            </div>
            <Select value={i18n.language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Espanol</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
          </CardTitle>
          <CardDescription>Configura las alertas y notificaciones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificaciones Push</Label>
              <p className="text-sm text-muted-foreground">Recibe alertas de novedades criticas</p>
            </div>
            <Switch checked={notificaciones} onCheckedChange={setNotificaciones} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sonidos de Alerta</Label>
              <p className="text-sm text-muted-foreground">Reproduce sonido al recibir alertas</p>
            </div>
            <Switch checked={sonidos} onCheckedChange={setSonidos} />
          </div>
        </CardContent>
      </Card>

      {/* Seguridad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Seguridad
          </CardTitle>
          <CardDescription>Gestiona la seguridad de tu cuenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Cambiar Contrasena</Label>
              <p className="text-sm text-muted-foreground">Actualiza tu contrasena de acceso</p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(true)
              }}
            >
              Cambiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ayuda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Ayuda
          </CardTitle>
          <CardDescription>Recursos de ayuda y tutoriales</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Tour de la Aplicacion</Label>
              <p className="text-sm text-muted-foreground">
                Vuelve a ver el recorrido guiado por la plataforma
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                void handleRestartTour()
              }}
              disabled={isRestartingTour}
            >
              {isRestartingTour ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reiniciando...
                </>
              ) : (
                'Ver Tour'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
            <DialogDescription>
              Ingresa tu contraseña actual y la nueva contraseña
            </DialogDescription>
          </DialogHeader>
          <Form {...passwordForm}>
            <form
              onSubmit={(e) => {
                void passwordForm.handleSubmit(handlePasswordSubmit)(e)
              }}
              className="space-y-4"
            >
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña actual</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showCurrentPassword ? 'text' : 'password'} {...field} />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => {
                            setShowCurrentPassword(!showCurrentPassword)
                          }}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showNewPassword ? 'text' : 'password'} {...field} />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => {
                            setShowNewPassword(!showNewPassword)
                          }}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar nueva contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPasswordDialog(false)
                    passwordForm.reset()
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                  {passwordForm.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cambiando...
                    </>
                  ) : (
                    'Cambiar Contraseña'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
