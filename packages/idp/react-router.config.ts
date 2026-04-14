import type { Config } from '@react-router/dev/config'

export default {
  // Enable server-side rendering — this is the Identity Provider UI,
  // which runs on the server and handles login form submissions.
  ssr: true,
  basename: '/idp',
} satisfies Config
