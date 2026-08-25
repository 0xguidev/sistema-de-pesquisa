import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PuppeteerPdfRenderer } from './puppeteer-pdf-renderer'

const chromium = vi.hoisted(() => {
  let requestHandler: ((request: any) => void) | undefined
  const page = {
    setDefaultNavigationTimeout: vi.fn(),
    setDefaultTimeout: vi.fn(),
    setRequestInterception: vi.fn().mockResolvedValue(undefined),
    on: vi.fn((event: string, handler: (request: any) => void) => {
      if (event === 'request') requestHandler = handler
    }),
    setContent: vi.fn().mockResolvedValue(undefined),
    pdf: vi.fn().mockResolvedValue(Buffer.from('%PDF-1.7 test')),
    isClosed: vi.fn().mockReturnValue(false),
    close: vi.fn().mockResolvedValue(undefined),
  }
  const browser = {
    newPage: vi.fn().mockResolvedValue(page),
    close: vi.fn().mockResolvedValue(undefined),
  }
  return {
    page,
    browser,
    launch: vi.fn().mockResolvedValue(browser),
    requestHandler: () => requestHandler,
    reset: () => {
      requestHandler = undefined
    },
  }
})

vi.mock('puppeteer', () => ({ default: { launch: chromium.launch } }))

describe('PuppeteerPdfRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chromium.reset()
    chromium.page.pdf.mockResolvedValue(Buffer.from('%PDF-1.7 test'))
    chromium.page.isClosed.mockReturnValue(false)
    chromium.page.close.mockResolvedValue(undefined)
    chromium.browser.newPage.mockResolvedValue(chromium.page)
    chromium.browser.close.mockResolvedValue(undefined)
    chromium.launch.mockResolvedValue(chromium.browser)
  })

  async function render() {
    return new PuppeteerPdfRenderer().render('<html>safe</html>', {
      timeoutMs: 1000,
      signal: new AbortController().signal,
    })
  }

  it('renders with interception enabled and the configured executable', async () => {
    process.env.CHROMIUM_EXECUTABLE_PATH = '/configured/chromium'
    await expect(render()).resolves.toEqual(Buffer.from('%PDF-1.7 test'))

    expect(chromium.launch).toHaveBeenCalledWith({
      executablePath: '/configured/chromium',
      headless: true,
      timeout: 1000,
    })
    expect(chromium.page.setRequestInterception).toHaveBeenCalledWith(true)
    expect(chromium.page.setContent).toHaveBeenCalledWith('<html>safe</html>', {
      waitUntil: 'load',
      timeout: 1000,
    })
    delete process.env.CHROMIUM_EXECUTABLE_PATH
  })

  it.each([
    'https://example.com/tracker.png',
    'http://example.com/redirect-to-private',
    'ws://example.com/socket',
    'wss://example.com/socket',
    'file:///etc/passwd',
    'http://localhost/admin',
    'http://127.0.0.1/admin',
    'http://127.1/admin',
    'http://10.0.0.1/internal',
    'http://172.16.0.1/internal',
    'http://192.168.0.1/internal',
    'http://169.254.169.254/latest/meta-data',
    'http://metadata.google.internal/computeMetadata/v1',
    'http://[::1]/admin',
    'http://[fc00::1]/internal',
    'http://[fe80::1]/internal',
    'http://2130706433/admin',
  ])('blocks renderer requests to %s', async (url) => {
    await render()
    const request = createRequest(url)
    chromium.requestHandler()?.(request)
    expect(request.abort).toHaveBeenCalledWith('blockedbyclient')
    expect(request.continue).not.toHaveBeenCalled()
  })

  it.each(['about:blank', 'data:image/png;base64,AA=='])(
    'allows the self-contained resource %s',
    async (url) => {
      await render()
      const request = createRequest(url)
      chromium.requestHandler()?.(request)
      expect(request.continue).toHaveBeenCalledOnce()
      expect(request.abort).not.toHaveBeenCalled()
    },
  )

  it('closes the page and browser after a rendering failure', async () => {
    chromium.page.pdf.mockRejectedValueOnce(new Error('PDF timeout'))
    await expect(render()).rejects.toThrow('PDF timeout')
    expect(chromium.page.close).toHaveBeenCalledOnce()
    expect(chromium.browser.close).toHaveBeenCalledOnce()
  })

  it('still closes the browser when closing the page fails', async () => {
    chromium.page.pdf.mockRejectedValueOnce(new Error('PDF timeout'))
    chromium.page.close.mockRejectedValueOnce(new Error('Page close failed'))
    await expect(render()).rejects.toThrow('Page close failed')
    expect(chromium.browser.close).toHaveBeenCalledOnce()
  })

  it('cancels immediately while Chromium is still launching', async () => {
    let finishLaunch!: (browser: typeof chromium.browser) => void
    chromium.launch.mockReturnValueOnce(
      new Promise((resolve) => {
        finishLaunch = resolve
      }),
    )
    const abort = new AbortController()
    const rendering = new PuppeteerPdfRenderer().render('<html>safe</html>', {
      timeoutMs: 1000,
      signal: abort.signal,
    })

    abort.abort()
    await expect(rendering).rejects.toMatchObject({ name: 'AbortError' })

    finishLaunch(chromium.browser)
    await vi.waitFor(() => expect(chromium.browser.close).toHaveBeenCalledOnce())
    expect(chromium.browser.newPage).not.toHaveBeenCalled()
  })
})

function createRequest(url: string) {
  return {
    url: vi.fn().mockReturnValue(url),
    continue: vi.fn().mockResolvedValue(undefined),
    abort: vi.fn().mockResolvedValue(undefined),
  }
}
