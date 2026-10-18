import { createHtmlRenderer } from '@comark/html'
import pele, { Pele } from 'comark-pele/html'
import type { MountRenderer } from './types.ts'

const renderHtml = createHtmlRenderer({ plugins: [pele()], components: { Pele } })

const mount: MountRenderer = async (el, markdown) => {
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
