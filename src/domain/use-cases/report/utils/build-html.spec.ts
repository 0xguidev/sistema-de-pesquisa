import { describe, expect, it } from 'vitest'
import { buildHtml } from './build-html'

describe('buildHtml', () => {
  it('renders persisted content as text instead of executable markup', () => {
    const payloads = [
      '<script>alert(1)</script>',
      '</script><script>alert(2)</script>',
      '<span onmouseover="alert(3)">evento</span>',
      '<img src=x onerror=alert(4)>',
      '<iframe src="javascript:alert(5)"></iframe>',
      'Ação & opinião < 10 > 2 "aspas" \'apóstrofo\'',
    ]

    const html = buildHtml([
      {
        questionNum: 1,
        questionTitle: payloads[0],
        options: payloads.slice(1).map((answer, index) => ({
          num: index + 1,
          answer,
          percentage: 20,
          count: 1,
        })),
      },
    ])

    expect(html).not.toMatch(/<script\b/i)
    expect(html).not.toMatch(/<img\b/i)
    expect(html).not.toMatch(/<iframe\b/i)
    expect(html).not.toMatch(/<[a-z][^>]*\sonmouseover\s*=/i)
    expect(html).not.toMatch(/<[a-z][^>]*\sonerror\s*=/i)
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).toContain(
      '&lt;/script&gt;&lt;script&gt;alert(2)&lt;/script&gt;',
    )
    expect(html).toContain('&lt;img src=x onerror=alert(4)&gt;')
    expect(html).toContain(
      '&lt;iframe src=&quot;javascript:alert(5)&quot;&gt;&lt;/iframe&gt;',
    )
    expect(html).toContain(
      'Ação &amp; opinião &lt; 10 &gt; 2 &quot;aspas&quot; &#39;apóstrofo&#39;',
    )
  })

  it('does not create a JavaScript context for persisted data', () => {
    const lineSeparator = String.fromCodePoint(0x2028)
    const paragraphSeparator = String.fromCodePoint(0x2029)
    const html = buildHtml([
      {
        questionNum: 1,
        questionTitle: `linha${lineSeparator}outra${paragraphSeparator}'</script><script>alert(1)</script>`,
        options: [],
      },
    ])

    expect(html).not.toContain('<script')
    expect(html).toContain(
      `linha${lineSeparator}outra${paragraphSeparator}&#39;&lt;/script&gt;&lt;script&gt;alert(1)&lt;/script&gt;`,
    )
  })
})
