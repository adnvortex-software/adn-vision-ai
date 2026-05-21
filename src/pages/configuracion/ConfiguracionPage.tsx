import { useState } from 'react'
import { Moon, Sun, Globe, Bell, Shield, Palette, HelpCircle, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTheme } from '@/hooks/useTheme'
import { useTranslation } from 'react-i18next'
import { useTriggerOnboarding } from '@/components/onboarding'

export default function ConfiguracionPage() {
  const { theme, toggleTheme } = useTheme()
  const { i18n } = useTranslation()
  const [notificaciones, setNotificaciones] = useState(true)
  const [sonidos, setSonidos] = useState(true)
  const [isRestartingTour, setIsRestartingTour] = useState(false)
  const { triggerTour } = useTriggerOnboarding()

  const handleLanguageChange = (lang: string) => {
    void i18n.changeLanguage(lang)
  }

  const handleRestartTour = async () => {
    setIsRestartingTour(true)
    await triggerTour()
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-6 py-6">
      <PageHeader title="Configuracion" description="Personaliza tu experiencia en la plataforma" />

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
            <Button variant="outline">Cambiar</Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sesiones Activas</Label>
              <p className="text-sm text-muted-foreground">Ver y gestionar sesiones abiertas</p>
            </div>
            <Button variant="outline">Ver Sesiones</Button>
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
    </div>
  )
}
