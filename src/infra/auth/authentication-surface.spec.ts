import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function controllerSources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return controllerSources(path)
    return entry.name.endsWith('.controller.ts')
      ? [readFileSync(path, 'utf8')]
      : []
  })
}

describe('authentication surface', () => {
  const controllers = controllerSources(
    join(process.cwd(), 'src/infra/http/controllers'),
  )

  it('has no administrative route until stronger admin authentication exists', () => {
    expect(controllers.some((source) => source.includes('@Roles('))).toBe(false)
  })

  it('does not log credentials in authentication controllers', () => {
    const authenticationSources = controllerSources(
      join(process.cwd(), 'src/infra/http/controllers/authenticate'),
    ).join('\n')

    expect(authenticationSources).not.toMatch(/console\.|new Logger\b/)
    expect(authenticationSources).not.toMatch(
      /import\s*\{[^}]*Logger[^}]*\}\s*from ['"]@nestjs\/common['"]/s,
    )
  })
})
