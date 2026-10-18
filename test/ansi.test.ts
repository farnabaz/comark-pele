import { renderAnsi } from '@comark/ansi'
import { describe, expect, it } from 'vitest'
import pele, { Pele } from '../src/ansi.ts'

describe('ansi component', () => {
  it('prints the diagram source as a labelled code block', async () => {
    const output = await renderAnsi('```mermaid\nflowchart LR\n  A --> B\n```', {
      plugins: [pele()],
      components: { Pele },
      colors: false,
    })
    expect(output.trim()).toBe('```mermaid  diagram\nflowchart LR\n  A --> B\n```')
  })
})
