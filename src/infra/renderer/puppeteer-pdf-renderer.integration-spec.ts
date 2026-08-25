import { describe, expect, it } from 'vitest'
import { access } from 'node:fs/promises'
import { PuppeteerPdfRenderer } from './puppeteer-pdf-renderer'

describe('PuppeteerPdfRenderer with real Chromium', () => {
  it('renders one self-contained PDF with the explicitly configured binary', async () => {
    const executable = process.env.CHROMIUM_EXECUTABLE_PATH
    if (!executable) {
      throw new Error(
        'CHROMIUM_EXECUTABLE_PATH is required for the renderer integration test',
      )
    }
    await access(executable)

    const renderer = new PuppeteerPdfRenderer()
    const result = await renderer.render(
      '<!doctype html><html><body>renderer integration</body></html>',
      { timeoutMs: 15_000, signal: new AbortController().signal },
    )

    expect(result.subarray(0, 5).toString()).toBe('%PDF-')
    expect(result.length).toBeGreaterThan(1_000)
  })
})
