// @vitest-environment happy-dom
import { flushSync, mount, unmount } from 'svelte'
import { describe, expect, it } from 'vitest'
import './dom.ts'
import { createPeleComponent, Pele } from '../src/svelte/index.ts'

describe('svelte component (browser)', () => {
  it('mounts with Pele and updates when the content changes', () => {
    const target = document.createElement('div')
    document.body.append(target)
    const props = $state({ content: 'flowchart LR\n  A[Start] --> B[End]\n' })
    const component = mount(Pele, { target, props })
    flushSync()

    const el = target.querySelector('.pele-diagram')!
    expect(el.querySelector('svg')).not.toBeNull()
    expect(el.getAttribute('data-diagram')).toBe('flowchart')

    props.content = 'pie\n  "Dogs": 3\n  "Cats": 1\n'
    flushSync()
    expect(el.querySelector('svg.pele-pie')).not.toBeNull()
    expect(el.querySelectorAll('svg.pele')).toHaveLength(1)
    expect(el.getAttribute('data-diagram')).toBe('pie')

    unmount(component)
    flushSync()
    expect(target.querySelector('.pele-diagram')).toBeNull()
    target.remove()
  })

  it('keeps the source for an invalid diagram and draws it once fixed', () => {
    const target = document.createElement('div')
    const props = $state({ content: 'not a diagram' })
    const component = mount(Pele, { target, props })
    flushSync()

    const el = target.querySelector('.pele-diagram')!
    expect(el.querySelector('pre.pele-source')?.textContent).toBe('not a diagram')
    expect(el.getAttribute('data-error')).toContain('No diagram type detected')

    props.content = 'flowchart LR\n  A --> B\n'
    flushSync()
    expect(el.querySelector('svg.pele-flowchart')).not.toBeNull()
    expect(el.hasAttribute('data-error')).toBe(false)
    unmount(component)
  })

  it('stays reactive with createPeleComponent and calls its onRender', () => {
    const target = document.createElement('div')
    const rendered: string[] = []
    const props = $state({ content: 'flowchart LR\n  A --> B\n' })
    const component = mount(createPeleComponent({ onRender: result => rendered.push(result.type) }), { target, props })
    flushSync()

    props.content = 'pie\n  "Dogs": 3\n'
    flushSync()
    expect(target.querySelector('.pele-diagram svg.pele-pie')).not.toBeNull()
    expect(rendered).toEqual(['flowchart', 'pie'])
    unmount(component)
  })
})
