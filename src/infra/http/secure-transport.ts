import { NextFunction, Request, Response } from 'express'

export function requireHttps(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  if (!request.secure) {
    response.status(426).send('HTTPS is required')
    return
  }

  response.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains',
  )
  next()
}
