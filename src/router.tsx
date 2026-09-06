import { createBrowserRouter } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminGate } from './components/AdminGate'
import { HomePage } from './pages/HomePage'
import { EventHistoryPage } from './pages/EventHistoryPage'
import { EventDetailPage } from './pages/EventDetailPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { ConferencePage } from './pages/ConferencePage'
import { SchedulePage } from './pages/SchedulePage'
import { AttendancePage } from './pages/AttendancePage'
import { ReviewPaperPage } from './pages/ReviewPaperPage'
import { AssignReviewerPage } from './pages/AssignReviewerPage'
import { SettingsPage } from './pages/SettingsPage'
import { UserManagementPage } from './pages/UserManagementPage'
import { ComingSoonPage } from './pages/ComingSoonPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { MENU } from './config/menu'

// Halaman yang sudah nyata dibangun — sisanya di config/menu.ts otomatis
// dapat ComingSoonPage sampai giliran dibangun, supaya sidebar & routing
// selalu konsisten, nggak ada menu yang nabrak 404.
const builtRoutes: Record<string, React.ReactNode> = {
  '/dashboard': <DashboardPage />,
  '/conferences': <ConferencePage />,
  '/schedules': <SchedulePage />,
  '/attendance': <AttendancePage />,
  '/papers/review': <ReviewPaperPage />,
  '/papers/assign-reviewer': <AssignReviewerPage />,
  '/admin/settings': <SettingsPage />,
  '/admin/roles': <UserManagementPage />,
}

const allPaths = [...new Set(MENU.flatMap((g) => g.items.map((i) => i.path)))]

// Route /admin/* dipisah, dibungkus AdminGate (password kedua khusus
// role Admin) sebelum sampai ke Layout+halaman aslinya.
const adminRoutes = allPaths
  .filter((path) => path.startsWith('/admin'))
  .map((path) => ({ path, element: builtRoutes[path] ?? <ComingSoonPage /> }))

const domainRoutes = allPaths
  .filter((path) => !path.startsWith('/admin'))
  .map((path) => ({ path, element: builtRoutes[path] ?? <ComingSoonPage /> }))

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/event-history', element: <EventHistoryPage /> },
  { path: '/event-history/:id', element: <EventDetailPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          ...domainRoutes,
          {
            element: <AdminGate />,
            children: adminRoutes,
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
