import { expect, test } from 'vitest'
import { Slug } from './slug'

test('it should be able to create a new slug from text', () => {
  const slug = Slug.createFromText('Example question title')

  expect(slug.value).toMatch(
    /^example-question-title-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  )
})

test('it should create unique slugs for the same text', () => {
  const firstSlug = Slug.createFromText('Repeated option')
  const secondSlug = Slug.createFromText('Repeated option')

  expect(firstSlug.value).not.toBe(secondSlug.value)
})
