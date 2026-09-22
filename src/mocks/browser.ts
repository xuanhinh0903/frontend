import { setupWorker } from 'msw/browser'
import { handlers } from '@/mocks/handlers'

// Only loaded through enableMocking(); never import this from app code.
export const worker = setupWorker(...handlers)
