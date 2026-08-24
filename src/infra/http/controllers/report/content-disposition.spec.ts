import { BadRequestException } from '@nestjs/common'
import { attachmentContentDisposition } from './content-disposition'

describe('attachmentContentDisposition', () => {
  it('creates an ASCII fallback and RFC 5987 filename for Unicode', () => {
    expect(attachmentContentDisposition('relatório São Paulo.pdf')).toBe(
      `attachment; filename="relatorio-Sao-Paulo.pdf"; filename*=UTF-8''relat%C3%B3rio%20S%C3%A3o%20Paulo.pdf`,
    )
  })

  it.each(['report\rInjected.pdf', 'report\nInjected.pdf'])(
    'rejects CR/LF in filenames',
    (filename) => {
      expect(() => attachmentContentDisposition(filename)).toThrow(
        BadRequestException,
      )
    },
  )
})
