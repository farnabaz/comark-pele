import type { ElementNode } from 'comark'
import type { NodeHandler } from 'comark/render'
import type { PeleNodeAttributes } from './index.ts'

export { default, searchProps } from './index.ts'
export type { PeleConfig, PeleNodeAttributes } from './index.ts'

const RESET = '\x1B[0m'
const BOLD = '\x1B[1m'
const DIM = '\x1B[2m'
const CYAN = '\x1B[36m'

/**
 * ANSI component for `pele` nodes.
 *
 * Pele only draws SVG, so terminals get the diagram source as a code block,
 * labelled with its language.
 *
 * @example
 * ```ts
 * import { createAnsiRenderer } from '@comark/ansi'
 * import pele, { Pele } from 'comark-pele/ansi'
 *
 * const renderAnsi = createAnsiRenderer({
 *   plugins: [pele()],
 *   components: { Pele },
 * })
 * ```
 */
export const Pele: NodeHandler = (node: ElementNode, state) => {
  const { content, language } = node[1] as PeleNodeAttributes
  const colors = Boolean(state.context.colors)
  const label = language ?? 'mermaid'
  const header = colors ? `${BOLD}${CYAN}${label}${RESET}${DIM}  diagram${RESET}` : `${label}  diagram`
  return '```' + header + '\n' + String(content ?? '').trim() + '\n```' + (state.context.blockSeparator ?? '\n\n')
}
