import { type RouteConfig, layout, route } from '@react-router/dev/routes'

export default [
  layout('components/IdpLayout.tsx', [
    route('/login', 'routes/login.tsx'),
    route('/consent', 'routes/consent.tsx'),
    route('/register', 'routes/register.tsx'),
    route('/forgot-password', 'routes/forgot-password.tsx'),
    route('/reset-password', 'routes/reset-password.tsx'),
  ]),
  route('/logout', 'routes/logout.ts'),
] satisfies RouteConfig
