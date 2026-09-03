import { createBrowserRouter } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ComingSoonPage } from './pages/ComingSoonPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { MENU } from './config/menu'

// Semua path di config/menu.ts otomatis dapat route, defaultnya
// ComingSoonPage sampai halaman aslinya dibangun — supaya sidebar
// dan routing selalu konsisten, nggak ada menu yang nabrak 404.
const allPaths = new Set(MENU.flatMap((g) => g.items.map((i) => i.path)))
allPaths.delete('/')
const placeholderRoutes = [...allPaths].map((path) => ({ path, element: <ComingSoonPage /> }))

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [{ path: '/', element: <DashboardPage /> }, ...placeholderRoutes],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
