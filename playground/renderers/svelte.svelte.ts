import { mount as mountSvelte, unmount } from 'svelte'
import { createPeleComponent } from 'comark-pele/svelte'
import SvelteApp from './SvelteApp.svelte'
import type { MountRenderer } from './types.ts'

const mount: MountRenderer = (el, markdown, options) => {
  const props = $state({ value: markdown, Pele: createPeleComponent(options) })
  const app = mountSvelte(SvelteApp, { target: el, props })
  return {
    update: (next) => {
      props.value = next
    },
    destroy: () => void unmount(app),
  }
}

export default mount
