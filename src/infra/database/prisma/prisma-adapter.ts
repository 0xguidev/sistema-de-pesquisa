import { PrismaPg } from '@prisma/adapter-pg'

/**
 * Builds the PostgreSQL driver adapter required by Prisma 7.
 *
 * Prisma-specific URL parameters (`schema`, `connection_limit`) are not
 * understood by the `pg` driver, so they are translated into adapter options.
 * The schema also becomes the session `search_path`, so raw SQL relying on
 * `current_schema()` targets the same schema as generated queries.
 */
export function createPrismaPgAdapter(databaseUrl: string): PrismaPg {
  const url = new URL(databaseUrl)
  const schema = url.searchParams.get('schema') ?? undefined
  const connectionLimit = url.searchParams.get('connection_limit')

  url.searchParams.delete('schema')
  url.searchParams.delete('connection_limit')

  return new PrismaPg(
    {
      connectionString: url.toString(),
      ...(connectionLimit ? { max: Number(connectionLimit) } : {}),
      ...(schema ? { options: `-c search_path="${schema}"` } : {}),
    },
    schema ? { schema } : undefined,
  )
}
