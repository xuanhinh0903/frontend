import type { RouteObject } from 'react-router'
import { authRoutes } from '@/features/auth'

export const publicRoutes: RouteObject[] = [...authRoutes]
