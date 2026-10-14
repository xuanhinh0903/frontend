import { useCallback, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { demoUsersRequested } from '../slices'
import {
  selectDemoError,
  selectDemoStatus,
  selectDemoUsers,
} from '../selectors'

export function useDemoUsers() {
  const dispatch = useAppDispatch()
  const users = useAppSelector(selectDemoUsers)
  const status = useAppSelector(selectDemoStatus)
  const error = useAppSelector(selectDemoError)

  // useCallback: returned from a shared hook and a dependency of the load effect.
  const reload = useCallback(() => {
    dispatch(demoUsersRequested())
  }, [dispatch])

  // Load once; users stay in Redux when the page is revisited.
  useEffect(() => {
    if (status === 'idle') reload()
  }, [status, reload])

  return {
    users,
    error,
    isLoading: status === 'idle' || status === 'loading',
    isFailed: status === 'failed',
    isEmpty: status === 'succeeded' && users.length === 0,
    reload,
  }
}
