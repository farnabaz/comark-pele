// JIT mode: compiles Angular components in the browser, so the playground
// needs no Angular build step.
import '@angular/compiler'
import { createComponent, provideZonelessChangeDetection } from '@angular/core'
import { createApplication } from '@angular/platform-browser'
import { Markdown } from '@comark/angular'
import pele, { Pele } from 'comark-pele/angular'
import type { MountRenderer } from './types.ts'

const plugins = [pele()]
const components = { Pele }

const mount: MountRenderer = async (el, markdown) => {
  const app = await createApplication({ providers: [provideZonelessChangeDetection()] })
  const hostElement = document.createElement('comark-markdown')
  el.append(hostElement)

  const ref = createComponent(Markdown, { environmentInjector: app.injector, hostElement })
  ref.setInput('plugins', plugins)
  ref.setInput('components', components)
  ref.setInput('value', markdown)
  app.attachView(ref.hostView)
  ref.changeDetectorRef.detectChanges()

  return {
    update: (next) => {
      ref.setInput('value', next)
    },
    destroy: () => {
      app.destroy()
      el.replaceChildren()
    },
  }
}

export default mount
