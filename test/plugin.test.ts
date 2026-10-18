import { parseMarkdown } from 'comark'
import type { ElementNode } from 'comark'
import { renderMarkdown } from 'comark/render'
import { describe, expect, it } from 'vitest'
import pele, { Pele } from '../src/index.ts'

describe('pele plugin', () => {
  it('turns mermaid code blocks into pele nodes', async () => {
    const tree = await parseMarkdown('```mermaid\nflowchart LR\n  A --> B\n```', { plugins: [pele()] })

    expect(tree.nodes).toEqual([
      ['pele', { language: 'mermaid', content: 'flowchart LR\n  A --> B\n' }],
    ])
  })

  it('also handles `pele` code blocks and nested blocks', async () => {
    const tree = await parseMarkdown('> ```pele\n> pie\n> ```', { plugins: [pele()] })
    expect(tree.nodes).toEqual([
      ['blockquote', {}, ['pele', { language: 'pele', content: 'pie\n' }]],
    ])
  })

  it('reads fence props', async () => {
    const tree = await parseMarkdown('```mermaid {.wide .dark #flow title="My flow"}\ngraph TD\n```', {
      plugins: [pele()],
    })
    expect((tree.nodes[0] as ElementNode)[1]).toEqual({
      class: 'wide dark',
      id: 'flow',
      title: 'My flow',
      language: 'mermaid',
      content: 'graph TD\n',
    })
  })

  it('leaves other code blocks alone', async () => {
    const tree = await parseMarkdown('```js\nx\n```\n\n```mermaidx\ny\n```', { plugins: [pele()] })
    expect(tree.nodes.map(node => (node as ElementNode)[0])).toEqual(['pre', 'pre'])
  })

  it('supports custom languages', async () => {
    const tree = await parseMarkdown('```diagram\npie\n```\n\n```mermaid\npie\n```', {
      plugins: [pele({ languages: ['diagram'] })],
    })
    expect(tree.nodes.map(node => (node as ElementNode)[0])).toEqual(['pele', 'pre'])
  })
})

describe('markdown renderer', () => {
  it('round-trips pele nodes back to fenced code blocks', async () => {
    const markdown = '# Title\n\n```mermaid {.wide #flow title="My flow"}\nflowchart LR\n  A --> B\n```\n\n```pele\npie\n```\n'
    const tree = await parseMarkdown(markdown, { plugins: [pele()] })
    expect(await renderMarkdown(tree, { components: { Pele } })).toBe(markdown.trimEnd())
  })

  it('uses a longer fence when the body contains one', async () => {
    const tree = { nodes: [['pele', { language: 'mermaid', content: 'a\n```\nb\n' }]] } as never
    expect(await renderMarkdown(tree, { components: { Pele } })).toBe('````mermaid\na\n```\nb\n````')
  })
})
