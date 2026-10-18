// @vitest-environment happy-dom
import '@angular/compiler'
import { createComponent, PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core'
import type { ApplicationRef, Type } from '@angular/core'
import { createApplication } from '@angular/platform-browser'
import { describe, expect, it } from 'vitest'
import './dom.ts'
import { createPeleComponent, Pele } from '../src/angular/index.ts'

const flowchart = 'flowchart LR\n  A[Start] --> B[End]\n'

async function setup(platform: 'browser' | 'server', inputs: Record<string, unknown>, component: Type<Pele> = Pele) {
  const app: ApplicationRef = await createApplication({
    providers: [provideZonelessChangeDetection(), { provide: PLATFORM_ID, useValue: platform }],
  })
  const hostElement = document.createElement('comark-pele')
  document.body.append(hostElement)
  const ref = createComponent(component, { environmentInjector: app.injector, hostElement })
  for (const [key, value] of Object.entries(inputs)) ref.setInput(key, value)
  app.attachView(ref.hostView)
  ref.changeDetectorRef.detectChanges()
  return { app, ref, hostElement }
}

describe('angular component', () => {
  it('renders SVG on the server', async () => {
    const { app, hostElement } = await setup('server', { content: flowchart, class: 'wide' })
    const el = hostElement.querySelector('.pele-diagram')!

    expect(el.getAttribute('class')).toBe('pele-diagram wide')
    expect(el.getAttribute('data-diagram')).toBe('flowchart')
    expect(el.innerHTML).toContain('>Start</text>')
    app.destroy()
  })

  it('shows the escaped source for invalid diagrams on the server', async () => {
    const { app, hostElement } = await setup('server', { content: '<b>nope</b>' })
    const el = hostElement.querySelector('.pele-diagram')!

    expect(el.getAttribute('data-error')).toContain('No diagram type detected')
    expect(el.innerHTML).toBe('<pre class="pele-source"><code>&lt;b&gt;nope&lt;/b&gt;</code></pre>')
    app.destroy()
  })

  it('mounts with Pele in the browser and updates when the content changes', async () => {
    const { app, ref, hostElement } = await setup('browser', { content: flowchart })
    const el = hostElement.querySelector('.pele-diagram')!
    expect(el.querySelector('svg.pele-flowchart')).not.toBeNull()
    expect(el.getAttribute('data-diagram')).toBe('flowchart')

    ref.setInput('content', 'pie\n  "Dogs": 3\n  "Cats": 1\n')
    ref.changeDetectorRef.detectChanges()
    expect(el.querySelector('svg.pele-pie')).not.toBeNull()
    expect(el.querySelectorAll('svg.pele')).toHaveLength(1)
    expect(el.getAttribute('data-diagram')).toBe('pie')

    app.destroy()
  })

  it('keeps the source for an invalid diagram in the browser and draws it once fixed', async () => {
    const { app, ref, hostElement } = await setup('browser', { content: 'not a diagram' })
    const el = hostElement.querySelector('.pele-diagram')!
    expect(el.querySelector('pre.pele-source')?.textContent).toBe('not a diagram')
    expect(el.getAttribute('data-error')).toContain('No diagram type detected')

    ref.setInput('content', flowchart)
    ref.changeDetectorRef.detectChanges()
    expect(el.querySelector('svg.pele-flowchart')).not.toBeNull()
    expect(el.hasAttribute('data-error')).toBe(false)
    app.destroy()
  })

  it('applies options from createPeleComponent, with the options input on top', async () => {
    const Fixed = createPeleComponent({ responsive: false })
    const fixed = await setup('server', { content: flowchart }, Fixed)
    expect(fixed.hostElement.innerHTML).toContain('<svg')
    expect(fixed.hostElement.innerHTML).not.toContain('max-width:100%')
    fixed.app.destroy()

    const overridden = await setup('server', { content: flowchart, options: { responsive: true } }, Fixed)
    expect(overridden.hostElement.innerHTML).toContain('max-width:100%')
    overridden.app.destroy()
  })

  it('calls onRender from createPeleComponent in the browser', async () => {
    const rendered: string[] = []
    const { app } = await setup('browser', { content: flowchart }, createPeleComponent({ onRender: result => rendered.push(result.type) }))
    expect(rendered).toEqual(['flowchart'])
    app.destroy()
  })
})
