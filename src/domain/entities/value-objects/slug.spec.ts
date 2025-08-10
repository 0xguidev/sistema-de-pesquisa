import { expect, test } from 'vitest'
import { Slug } from './slug'

test('it should be able to create a new slug from text', () => {
  const slug = Slug.createFromText('Example question title')

  // O valor deve começar com 'example-question-title-' e terminar com 3 dígitos
  expect(slug.value).toMatch(/^example-question-title-\d{3}$/)
})
