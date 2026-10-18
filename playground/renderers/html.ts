import { createHtmlRenderer } from '@comark/html'
import pele, { createPeleComponent } from 'comark-pele/html'
import type { MountRenderer } from './types.ts'

const mount: MountRenderer = async (el, markdown, options) => {
  const renderHtml = createHtmlRenderer({ plugins: [pele()], components: { Pele: createPeleComponent(options) } })
  const update = async (value: string) => {
    el.innerHTML = await renderHtml(value)
  }
  await update(markdown)
  return {
    update,
    destroy: () => el.replaceChildren(),
  }
}

export default mount
