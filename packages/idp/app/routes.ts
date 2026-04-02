import { type RouteConfig, route } from '@react-router/dev/routes'

export default [
  route('/login', 'routes/login.tsx'),
  route('/consent', 'routes/consent.tsx'),
  route('/register', 'routes/register.tsx'),
] satisfies RouteConfig
