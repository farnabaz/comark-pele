// @vitest-environment happy-dom
import { Markdown } from '@comark/react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import './dom.ts'
import pele, { createPeleComponent, Pele } from '../src/react.tsx'

const flowchart = 'flowchart LR\n  A[Start] --> B[End]\n'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('react component', () => {
  it('renders SVG on the server through <Markdown>', async () => {
    const element = await Markdown({
      plugins: [pele()],
      components: { Pele },
      children: `\`\`\`mermaid {.wide}\n${flowchart}\`\`\``,
    })
    const html = renderToString(element)
    expect(html).toContain('class="pele-diagram wide"')
    expect(html).toContain('data-diagram="flowchart"')
    expect(html).toContain('>Start</text>')
  })

  it('shows the escaped source for invalid diagrams', () => {
    const html = renderToString(<Pele content="<b>nope</b>" />)
    expect(html).toContain('data-error="No diagram type detected')
    expect(html).toContain('<pre class="pele-source"><code>&lt;b&gt;nope&lt;/b&gt;</code></pre>')
  })

  it('mounts with Pele in the browser and updates when the content changes', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(() => root.render(<Pele content={flowchart} />))
    const el = container.querySelector('.pele-diagram')!
    expect(el.querySelector('svg')).not.toBeNull()
    expect(el.getAttribute('data-diagram')).toBe('flowchart')

    await act(() => root.render(<Pele content={'pie\n  "Dogs": 3\n  "Cats": 1\n'} />))
    expect(el.querySelector('svg.pele-pie')).not.toBeNull()
    expect(el.querySelectorAll('svg.pele')).toHaveLength(1)
    expect(el.getAttribute('data-diagram')).toBe('pie')

    await act(() => root.unmount())
    container.remove()
  })

  it('keeps the source for an invalid diagram in the browser and draws it once fixed', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(() => root.render(<Pele content="not a diagram" />))
    const el = container.querySelector('.pele-diagram')!
    expect(el.querySelector('pre.pele-source')?.textContent).toBe('not a diagram')
    expect(el.getAttribute('data-error')).toContain('No diagram type detected')

    await act(() => root.render(<Pele content={flowchart} />))
    expect(el.querySelector('svg.pele-flowchart')).not.toBeNull()
    expect(el.hasAttribute('data-error')).toBe(false)
    await act(() => root.unmount())
  })

  it('applies options from createPeleComponent, with the options prop on top', () => {
    const Fixed = createPeleComponent({ responsive: false })
    expect(renderToString(<Fixed content={flowchart} />)).not.toContain('max-width:100%')
    expect(renderToString(<Fixed content={flowchart} options={{ responsive: true }} />)).toContain('max-width:100%')
    expect(renderToString(<Pele content={flowchart} />)).toContain('max-width:100%')
  })
})
