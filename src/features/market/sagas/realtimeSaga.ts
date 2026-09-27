import { eventChannel, type EventChannel, type SagaIterator } from 'redux-saga'
import { call, put, race, select, take } from 'redux-saga/effects'
import { WS_URL, getAccessToken } from '@/shared/api'
import { createRealtimeClient } from '../services'
import type { RealtimeClient, RealtimeEvent } from '../types'
import {
  connectionChanged,
  quoteUpdated,
  realtimeStarted,
  realtimeStopped,
  symbolSubscriptionRequested,
  symbolUnsubscriptionRequested,
} from '../slices'
import { selectSubscribedSymbols, selectSubscriptionCount } from '../selectors'

function createRealtimeChannel(client: RealtimeClient) {
  return eventChannel<RealtimeEvent>((emit) => {
    const unsubscribe = client.onMessage(emit)
    return () => {
      unsubscribe()
      client.disconnect()
    }
  })
}

function* realtimeWorker(): SagaIterator {
  if (!WS_URL) {
    console.warn(
      '[realtime] VITE_WS_URL is not set; realtime quotes are disabled',
    )
    yield put(connectionChanged('disconnected'))
    return
  }
  const client = createRealtimeClient({ url: WS_URL, getAccessToken })
  let channel: EventChannel<RealtimeEvent> | undefined
  try {
    yield put(connectionChanged('connecting'))
    yield call(client.connect)
    const activeChannel = (yield call(
      createRealtimeChannel,
      client,
    )) as EventChannel<RealtimeEvent>
    channel = activeChannel
    // Replay subscriptions requested while disconnected or connecting.
    const pending: string[] = yield select(selectSubscribedSymbols)
    for (const symbol of pending) yield call(client.subscribe, symbol)
    yield put(connectionChanged('connected'))
    while (true) {
      const result: {
        event?: RealtimeEvent
        subscribe?: ReturnType<typeof symbolSubscriptionRequested>
        unsubscribe?: ReturnType<typeof symbolUnsubscriptionRequested>
      } = yield race({
        event: take(activeChannel),
        subscribe: take(symbolSubscriptionRequested.type),
        unsubscribe: take(symbolUnsubscriptionRequested.type),
      })
      const event = result.event
      if (event?.type === 'quoteUpdated') yield put(quoteUpdated(event.payload))
      if (event?.type === 'connectionChanged')
        yield put(connectionChanged(event.payload))
      // Reducers run first, so the count already reflects this action: only
      // the first consumer subscribes and only the last one unsubscribes.
      if (result.subscribe) {
        const symbol = result.subscribe.payload
        const count: number = yield select(selectSubscriptionCount, symbol)
        if (count === 1) yield call(client.subscribe, symbol)
      }
      if (result.unsubscribe) {
        const symbol = result.unsubscribe.payload
        const count: number = yield select(selectSubscriptionCount, symbol)
        if (count === 0) yield call(client.unsubscribe, symbol)
      }
    }
  } catch (error) {
    console.error('[realtime]', error)
    yield put(connectionChanged('disconnected'))
  } finally {
    if (channel) channel.close()
    else client.disconnect()
  }
}

export function* realtimeSaga(): SagaIterator {
  while (true) {
    yield take(realtimeStarted.type)
    yield race({ run: call(realtimeWorker), stop: take(realtimeStopped.type) })
  }
}
