import { ThemeProvider } from '@oauth-sample/ui'
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
  useRouteError,
} from 'react-router'
import AppLayout from './components/AppLayout'
import Callback from './pages/Callback'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import Profile from './pages/Profile'
import RouteError from './pages/RouteError'
import Success from './pages/Success'
import { ProfileProvider, useProfile } from './profile-context'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { loading, loggedIn } = useProfile()

  if (loading) {
    return (
      <div className="page-shell page-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[color:var(--border)] border-t-indigo-400" />
      </div>
    )
  }

  if (!loggedIn) {
    return <Navigate replace to="/" />
  }

  return children
}

function RootErrorBoundary() {
  const error = useRouteError()

  return <RouteError error={error} />
}

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <RootErrorBoundary />,
    children: [
      {
        path: '/',
        element: <Home />,
      },
      {
        path: '/callback',
        element: <Callback />,
      },
      {
        path: '/success',
        element: <Success />,
      },
      {
        path: '/profile',
        element: (
          <RequireAuth>
            <Profile />
          </RequireAuth>
        ),
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
])

export default function App() {
  return (
    <ThemeProvider>
      <ProfileProvider>
        <RouterProvider router={router} />
      </ProfileProvider>
    </ThemeProvider>
  )
}
