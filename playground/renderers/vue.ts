import { Markdown } from '@comark/vue'
import pele, { Pele } from 'comark-pele/vue'
import { createApp, h, ref, Suspense } from 'vue'
import type { MountRenderer } from './types.ts'

const plugins = [pele()]
const components = { Pele }

const mount: MountRenderer = (el, markdown) => {
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
