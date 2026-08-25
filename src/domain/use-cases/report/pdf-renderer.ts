export interface PdfRenderOptions {
  timeoutMs: number
  signal: AbortSignal
}

export abstract class PdfRenderer {
  abstract render(html: string, options: PdfRenderOptions): Promise<Buffer>
}
