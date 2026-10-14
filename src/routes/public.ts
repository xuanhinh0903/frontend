import type { RouteObject } from 'react-router'
import { loginRoutes } from '@/features/login'

export const publicRoutes: RouteObject[] = [...loginRoutes]
