// @vitest-environment happy-dom
import { Markdown } from '@comark/vue'
import { describe, expect, it } from 'vitest'
import './dom.ts'
import { createApp, h, nextTick, reactive, Suspense } from 'vue'
import { renderToString } from 'vue/server-renderer'
import pele, { createPeleComponent, Pele } from '../src/vue.ts'

const flowchart = 'flowchart LR\n  A[Start] --> B[End]\n'

describe('vue component', () => {
  it('renders SVG on the server through <Markdown>', async () => {
    const html = await renderToString(
      h(Suspense, null, {
        default: () => h(Markdown, { plugins: [pele()], components: { Pele } }, () => `\`\`\`mermaid {.wide}\n${flowchart}\`\`\``),
      }),
    )
    expect(html).toContain('class="pele-diagram wide"')
    expect(html).toContain('data-diagram="flowchart"')
    expect(html).toContain('>Start</text>')
  })

  it('shows the escaped source for invalid diagrams', async () => {
    const html = await renderToString(h(Pele, { content: '<b>nope</b>' }))
    expect(html).toContain('data-error="No diagram type detected')
    expect(html).toContain('<pre class="pele-source"><code>&lt;b&gt;nope&lt;/b&gt;</code></pre>')
  })

  it('mounts with Pele in the browser and updates when the content changes', async () => {
    const props = reactive({ content: flowchart })
    const root = document.createElement('div')
    document.body.append(root)
    const app = createApp({ render: () => h(Pele, { content: props.content }) })
    app.mount(root)

    const el = root.querySelector('.pele-diagram')!
    expect(el.querySelector('svg')).not.toBeNull()
    expect(el.getAttribute('data-diagram')).toBe('flowchart')

    props.content = 'pie\n  "Dogs": 3\n  "Cats": 1\n'
    await nextTick()
    await nextTick()
    expect(el.querySelector('svg.pele-pie')).not.toBeNull()
    expect(el.querySelectorAll('svg.pele')).toHaveLength(1)
    expect(el.getAttribute('data-diagram')).toBe('pie')

    app.unmount()
    root.remove()
  })

  it('keeps the source for an invalid diagram in the browser and draws it once fixed', async () => {
    const props = reactive({ content: 'not a diagram' })
    const root = document.createElement('div')
    const app = createApp({ render: () => h(Pele, { content: props.content }) })
    app.mount(root)
    await nextTick()

    const el = root.querySelector('.pele-diagram')!
    expect(el.querySelector('pre.pele-source')?.textContent).toBe('not a diagram')
    expect(el.getAttribute('data-error')).toContain('No diagram type detected')

    props.content = flowchart
    await nextTick()
    await nextTick()
    expect(el.querySelector('svg.pele-flowchart')).not.toBeNull()
    expect(el.hasAttribute('data-error')).toBe(false)
    app.unmount()
  })

  it('applies options from createPeleComponent, with the options prop on top', async () => {
    const Fixed = createPeleComponent({ responsive: false })
    expect(await renderToString(h(Fixed, { content: flowchart }))).not.toContain('max-width:100%')
    expect(await renderToString(h(Fixed, { content: flowchart, options: { responsive: true } }))).toContain('max-width:100%')
    expect(await renderToString(h(Pele, { content: flowchart }))).toContain('max-width:100%')
  })

  it('calls onRender from createPeleComponent in the browser', async () => {
    const rendered: string[] = []
    const Configured = createPeleComponent({ onRender: result => rendered.push(result.type) })
    const root = document.createElement('div')
    const app = createApp({ render: () => h(Configured, { content: flowchart }) })
    app.mount(root)
    await nextTick()
    expect(rendered).toEqual(['flowchart'])
    app.unmount()
  })
})
