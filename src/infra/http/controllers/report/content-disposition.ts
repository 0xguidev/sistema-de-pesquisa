import { BadRequestException } from '@nestjs/common'

function encodeRFC5987(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  )
}

export function attachmentContentDisposition(filename: string): string {
  if (/\r|\n/.test(filename)) {
    throw new BadRequestException('Invalid filename')
  }

  const fallback =
    filename
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x20-\x7e]/g, '-')
      .replace(/["\\/;=]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'download'

  const disposition = `attachment; filename="${fallback}"`

  return filename === fallback
    ? disposition
    : `${disposition}; filename*=UTF-8''${encodeRFC5987(filename)}`
}
