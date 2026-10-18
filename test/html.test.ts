import { createHtmlRenderer } from '@comark/html'
import { describe, expect, it } from 'vitest'
import pele, { createPele, Pele } from '../src/html.ts'

const renderHtml = createHtmlRenderer({ plugins: [pele()], components: { Pele } })

describe('html component', () => {
  it('renders diagrams to inline SVG', async () => {
    const html = await renderHtml('```mermaid {.wide #flow}\nflowchart LR\n  A[Start] --> B[End]\n```')

    expect(html).toMatch(/^<div id="flow" class="pele-diagram wide" data-diagram="flowchart"><svg /)
    expect(html).toContain('>Start</text>')
    expect(html).not.toContain('content=')
    expect(html).not.toContain('language=')
  })

  it('gives each diagram its own id prefix', async () => {
    const diagram = '```mermaid\nflowchart LR\n  accTitle: Flow\n  A --> B\n```'
    const html = await renderHtml(`${diagram}\n\n${diagram}`)
    const ids = [...html.matchAll(/id="(pele-\d+-title)"/g)].map(match => match[1])
    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(2)
  })

  it('shows the escaped source when the diagram is invalid', async () => {
    const html = await renderHtml('```mermaid\n<script>alert(1)</script>\n```')

    expect(html).toContain('data-error="No diagram type detected')
    expect(html).toContain('<pre class="pele-source"><code>&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).not.toContain('<script>')
  })

  it('accepts render options', async () => {
    const render = createHtmlRenderer({
      plugins: [pele()],
      components: { Pele: createPele({ responsive: false }) },
    })
    const html = await render('```mermaid\nflowchart LR\n  A --> B\n```')
    expect(html).not.toContain('max-width:100%')
  })
})
