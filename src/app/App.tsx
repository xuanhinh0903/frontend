import { RouterProvider } from 'react-router'
import { AuthProvider } from '@/shared'
import { router } from './router'

export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
