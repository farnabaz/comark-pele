import { MarkdownClient } from '@comark/react'
import pele, { createPeleComponent } from 'comark-pele/react'
import { createRoot } from 'react-dom/client'
import type { MountRenderer } from './types.ts'

const plugins = [pele()]

const mount: MountRenderer = (el, markdown, options) => {
  const components = { Pele: createPeleComponent(options) }
  const root = createRoot(el)
  const render = (value: string) =>
    root.render(<MarkdownClient value={value} plugins={plugins} components={components} />)
  render(markdown)
  return {
    update: render,
    destroy: () => root.unmount(),
  }
}

export default mount
