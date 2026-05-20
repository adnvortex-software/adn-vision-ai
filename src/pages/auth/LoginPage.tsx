import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Shield, BarChart, Eye } from 'lucide-react'
import { LoginForm } from '@/components/auth/LoginForm'
import { login, getMockUsers } from '@/services/auth.service'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { env } from '@/config/env'
import type { LoginFormData } from '@/schemas/auth.schema'

const ROLE_ICONS: Record<string, typeof User> = {
  super_admin: Shield,
  ops_admin: User,
  analyst: BarChart,
  client_admin: Eye,
}

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
  ops_admin: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  analyst: 'bg-green-100 text-green-700 hover:bg-green-200',
  client_admin: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const { setLoading } = useAuthStore()

  const mockUsers = getMockUsers()

  const handleLogin = async (data: LoginFormData) => {
    setError(null)
    setIsLoggingIn(true)
    setLoading(true)

    try {
      await login(data.email, data.password)
      // Navigation will happen automatically via ProtectedLayout when auth state changes
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesion'
      setError(message)
      setLoading(false)
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleMockLogin = async (email: string, password: string) => {
    setError(null)
    setIsLoggingIn(true)
    setLoading(true)

    try {
      await login(email, password)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesion'
      setError(message)
      setLoading(false)
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleForgotPassword = () => {
    navigate('/recuperar-password')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <LoginForm onSubmit={handleLogin} onForgotPassword={handleForgotPassword} error={error} />

        {/* Mock users section (only in development with mock auth) */}
        {env.VITE_MOCK_AUTH && mockUsers.length > 0 && (
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Usuarios de Prueba</CardTitle>
              <CardDescription className="text-xs">
                Haz clic para iniciar sesion automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {mockUsers.map((user) => {
                const Icon = ROLE_ICONS[user.rol] ?? User
                const colorClass =
                  ROLE_COLORS[user.rol] ?? 'bg-gray-100 text-gray-700 hover:bg-gray-200'

                return (
                  <Button
                    key={user.email}
                    variant="ghost"
                    className={`h-auto justify-start p-3 ${colorClass}`}
                    disabled={isLoggingIn}
                    onClick={() => {
                      void handleMockLogin(user.email, user.password)
                    }}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">{user.nombre}</div>
                      <div className="text-xs opacity-80">{user.email}</div>
                    </div>
                    <span className="ml-auto rounded-full bg-white/50 px-2 py-0.5 text-xs">
                      {user.rol.replace('_', ' ')}
                    </span>
                  </Button>
                )
              })}
            </CardContent>
          </Card>
        )}

        {/* Development mode indicator */}
        {env.VITE_MOCK_AUTH && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Modo desarrollo - Autenticacion simulada
          </p>
        )}
      </div>
    </div>
  )
}
