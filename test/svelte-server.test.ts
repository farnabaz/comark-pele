import { parseMarkdown } from 'comark'
import { render } from 'svelte/server'
import { describe, expect, it } from 'vitest'
import pele, { Pele } from '../src/svelte/index.ts'

const flowchart = 'flowchart LR\n  A[Start] --> B[End]\n'

describe('svelte component (server)', () => {
  it('renders SVG from a parsed pele node', async () => {
    const tree = await parseMarkdown(`\`\`\`mermaid {.wide}\n${flowchart}\`\`\``, { plugins: [pele()] })
    const props = (tree.nodes[0] as [string, { content: string }])[1]
    const { body } = render(Pele, { props })

    expect(body).toContain('class="pele-diagram wide"')
    expect(body).toContain('data-diagram="flowchart"')
    expect(body).toContain('>Start</text>')
  })

  it('shows the escaped source for invalid diagrams', () => {
    const { body } = render(Pele, { props: { content: '<b>nope</b>' } })
    expect(body).toContain('data-error="No diagram type detected')
    expect(body).toContain('<pre class="pele-source"><code>&lt;b&gt;nope&lt;/b&gt;</code></pre>')
  })
})
