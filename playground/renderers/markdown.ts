import { parseMarkdown } from 'comark'
import { renderMarkdown } from 'comark/render'
import pele, { Pele } from 'comark-pele'
import type { MountRenderer } from './types.ts'

const plugins = [pele()]

/** Parse, then write the document back to markdown: `pele` nodes become fences again. */
const mount: MountRenderer = async (el, markdown) => {
  const pre = document.createElement('pre')
  pre.className = 'raw'
  el.append(pre)
  const update = async (value: string) => {
    const tree = await parseMarkdown(value, { plugins })
    pre.textContent = await renderMarkdown(tree, { components: { Pele } })
  }
  await update(markdown)
  return {
    update,
    destroy: () => el.replaceChildren(),
  }
}

export default mount
