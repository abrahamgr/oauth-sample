import { RouterProvider, createBrowserRouter } from 'react-router'
import Callback from './pages/Callback.js'
import Home from './pages/Home.js'
import Profile from './pages/Profile.js'
import Success from './pages/Success.js'

const router = createBrowserRouter([
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
])

export default function App() {
  return <RouterProvider router={router} />
}
