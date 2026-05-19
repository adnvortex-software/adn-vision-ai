import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { LoadingState } from '@/components/common/LoadingState'

// Lazy load pages para mejor performance
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

// Router con data API (loaders, actions)
const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<LoadingState fullScreen />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingState fullScreen />}>
        <DashboardPage />
      </Suspense>
    ),
  },
  {
    path: '*',
    element: (
      <Suspense fallback={<LoadingState fullScreen />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
