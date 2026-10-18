import { Markdown } from '@comark/vue'
import pele, { createPeleComponent } from 'comark-pele/vue'
import { createApp, h, ref, Suspense } from 'vue'
import type { MountRenderer } from './types.ts'

const plugins = [pele()]

const mount: MountRenderer = (el, markdown, options) => {
  const components = { Pele: createPeleComponent(options) }
  const value = ref(markdown)
  const app = createApp({
    render: () => h(Suspense, null, { default: () => h(Markdown, { value: value.value, plugins, components }) }),
  })
  app.mount(el)
  return {
    update: (next) => {
      value.value = next
    },
    destroy: () => app.unmount(),
  }
}

export default mount
