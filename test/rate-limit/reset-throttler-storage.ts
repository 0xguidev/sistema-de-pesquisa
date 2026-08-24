import { ThrottlerStorageService } from '@nestjs/throttler'

/**
 * Clears the public storage exposed by Nest's in-memory throttler and cancels
 * its pending expiration timers. Keeping this adapter in test code avoids
 * coupling individual specs to the package's internal fields.
 */
export function resetThrottlerStorage(storage: ThrottlerStorageService): void {
  storage.onApplicationShutdown()
  storage.storage.clear()
}
