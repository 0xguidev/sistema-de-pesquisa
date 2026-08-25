import { Injectable, Optional } from '@nestjs/common'
import puppeteer from 'puppeteer'
import type { Browser, HTTPRequest, Page } from 'puppeteer'
import {
  PdfRenderer,
  PdfRenderOptions,
} from '@/domain/use-cases/report/pdf-renderer'
import { SecurityLogger } from '@/infra/observability/security-logger.service'
import { SecurityMetrics } from '@/infra/observability/security-metrics.service'
import { SecurityEvent } from '@/infra/observability/security-events'

export function isAllowedPdfResource(url: string): boolean {
  if (url === 'about:blank') return true

  try {
    return new URL(url).protocol === 'data:'
  } catch {
    return false
  }
}

function interceptPdfRequest(
  request: HTTPRequest,
  logger?: SecurityLogger,
  metrics?: SecurityMetrics,
): void {
  const allowed = isAllowedPdfResource(request.url())
  if (!allowed) {
    let scheme = 'invalid'
    try {
      scheme = new URL(request.url()).protocol.replace(':', '')
    } catch {
      scheme = 'invalid'
    }
    logger?.audit(SecurityEvent.RENDERER_REQUEST_BLOCKED, {
      url_id: logger?.pseudonym(request.url()),
      scheme,
    })
    metrics?.increment('ssrf_block_total')
  }
  const action = allowed ? request.continue() : request.abort('blockedbyclient')
  void action.catch(() => undefined)
}

@Injectable()
export class PuppeteerPdfRenderer extends PdfRenderer {
  constructor(
    @Optional() private securityLogger?: SecurityLogger,
    @Optional() private metrics?: SecurityMetrics,
  ) {
    super()
  }

  async render(html: string, options: PdfRenderOptions): Promise<Buffer> {
    let browser: Browser | undefined
    let rejectOnAbort!: (reason?: unknown) => void
    const aborted = new Promise<never>((_, reject) => {
      rejectOnAbort = reject
    })
    const closeOnAbort = () => {
      rejectOnAbort(options.signal.reason)
      if (browser) void browser.close().catch(() => undefined)
    }
    options.signal.addEventListener('abort', closeOnAbort, { once: true })

    const launching = puppeteer.launch({
      executablePath:
        process.env.CHROMIUM_EXECUTABLE_PATH ?? '/usr/bin/chromium',
      headless: true,
      timeout: options.timeoutMs,
    })
    void launching
      .then((launchedBrowser) => {
        if (options.signal.aborted)
          return launchedBrowser.close().catch(() => undefined)
      })
      .catch(() => undefined)

    let page: Page | undefined

    try {
      options.signal.throwIfAborted()
      browser = await Promise.race([launching, aborted])
      options.signal.throwIfAborted()
      page = await browser.newPage()
      page.setDefaultNavigationTimeout(options.timeoutMs)
      page.setDefaultTimeout(options.timeoutMs)
      await page.setRequestInterception(true)
      page.on('request', (request) =>
        interceptPdfRequest(request, this.securityLogger, this.metrics),
      )
      await page.setContent(html, {
        waitUntil: 'load',
        timeout: options.timeoutMs,
      })
      return Buffer.from(
        await page.pdf({
          format: 'A4',
          printBackground: true,
          displayHeaderFooter: false,
          timeout: options.timeoutMs,
          margin: {
            top: '20px',
            bottom: '20px',
            left: '20px',
            right: '20px',
          },
        }),
      )
    } finally {
      options.signal.removeEventListener('abort', closeOnAbort)
      try {
        if (page && !page.isClosed()) await page.close()
      } finally {
        if (browser) await browser.close().catch(() => undefined)
      }
    }
  }
}
