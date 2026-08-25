import { AsyncLocalStorage } from 'node:async_hooks'

export type RequestContextValue = {
  requestId: string
  method?: string
  path?: string
  userId?: string
}

export const requestContext = new AsyncLocalStorage<RequestContextValue>()
