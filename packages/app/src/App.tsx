import { ThemeProvider } from '@ui'
import { RouterProvider, createBrowserRouter } from 'react-router'
import AppLayout from './components/AppLayout'
import Callback from './pages/Callback'
import Home from './pages/Home'
import Profile from './pages/Profile'
import Success from './pages/Success'

const router = createBrowserRouter([
  {
    element: <AppLayout />,
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
        element: <Profile />,
      },
    ],
  },
])

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}
