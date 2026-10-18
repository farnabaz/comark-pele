import { defineComarkPlugin } from 'comark'
import type { ComarkPluginFactory, ElementNode, MarkdownItPlugin } from 'comark'
import type { NodeHandler } from 'comark/render'
import { searchProps } from 'comark/plugins/mermaid'

export { searchProps }

/** Options accepted by the `comark-pele` plugin factory. */
export interface PeleConfig {
  /**
   * Code block languages turned into `pele` nodes.
   * @default ['mermaid', 'pele']
   */
  languages?: string[]
}

/** Attributes of a `pele` node, received as props by the renderer components. */
export interface PeleNodeAttributes {
  /** Diagram source (Mermaid syntax). */
  content: string
  /** Language of the original code block, such as `mermaid`. */
  language?: string
  /** Classes set with fence props: ```` ```mermaid {.wide} ````. */
  class?: string
  /** Id set with fence props: ```` ```mermaid {#flow} ````. */
  id?: string
  [key: string]: unknown
}

const DEFAULT_LANGUAGES = ['mermaid', 'pele']

// Minimal shape of the markdown-exit API this plugin uses.
interface FenceToken {
  type: string
  tag: string
  info: string
  content: string
  attrSet(name: string, value: string): void
  attrJoin(name: string, value: string): void
}
interface MarkdownLike {
  core: { ruler: { after(after: string, name: string, rule: (state: { tokens: FenceToken[] }) => void): void } }
}

/**
 * markdown-it plugin that turns diagram code blocks into `pele` tokens.
 * Works like Comark's mermaid plugin: the token keeps the source in its
 * `content` attribute and renderer components draw it.
 */
function markdownItPele(md: MarkdownLike, config: PeleConfig) {
  const languages = new Set(config.languages ?? DEFAULT_LANGUAGES)

  md.core.ruler.after('block', 'comark_pele', (state) => {
    for (const token of state.tokens) {
      if (token.type !== 'fence') continue

      const info = token.info?.trim() ?? ''
      const language = info.match(/^[^\s{]+/)?.[0]
      if (!language || !languages.has(language)) continue

      let rest = info.slice(language.length).trim()
      let props: [string, string][] = []
      // extract props from info: ```mermaid {.class #id key="value"}
      const curlyBraceIndex = rest.indexOf('{')
      if (curlyBraceIndex !== -1) {
        const result = searchProps(rest.substring(curlyBraceIndex))
        if (result) {
          props = result.props
          rest = rest.substring(curlyBraceIndex + result.index).trim()
        }
      }

      token.type = 'pele'
      token.tag = 'pele'
      for (const [key, value] of props) {
        token.attrJoin(key, value)
      }
      token.attrSet('language', language)
      token.info = rest
      token.attrSet('content', token.content)
    }
  })
}

/**
 * Create the Pele plugin for Comark.
 *
 * It turns ```` ```mermaid ```` code blocks into `pele` nodes. Render them with
 * the `Pele` component for your renderer:
 * `comark-pele/html`, `comark-pele/vue`, `comark-pele/react`,
 * `comark-pele/svelte`, `comark-pele/angular`, or `comark-pele/ansi`.
 *
 * @example
 * ```ts
 * import { parseMarkdown } from 'comark'
 * import pele from 'comark-pele'
 *
 * const tree = await parseMarkdown('```mermaid\ngraph TD; A-->B;\n```', {
 *   plugins: [pele()],
 * })
 * // tree.nodes → [['pele', { content: 'graph TD; A-->B;\n', language: 'mermaid' }]]
 * ```
 */
const pele: ComarkPluginFactory<PeleConfig> = defineComarkPlugin<PeleConfig>((config = {}) => ({
  name: 'pele',
  markdownItPlugins: [((md: MarkdownLike) => markdownItPele(md, config)) as unknown as MarkdownItPlugin],
}))

export default pele

function pickFence(body: string): string {
  const longest = Math.max(2, ...[...body.matchAll(/^ {0,3}(`{3,})/gm)].map(match => match[1]!.length))
  return '`'.repeat(longest + 1)
}

function quote(value: string): string {
  return /^[\w-]+$/.test(value) ? value : JSON.stringify(value)
}

function fenceProps(attributes: Record<string, unknown>): string {
  const parts: string[] = []
  for (const [key, value] of Object.entries(attributes)) {
    if (key === '$' || value === undefined || value === null) continue
    if (key === 'class') {
      parts.push(...String(value).split(/\s+/).filter(Boolean).map(name => `.${name}`))
    }
    else if (key === 'id') {
      parts.push(`#${value}`)
    }
    else if (value === true || value === 'true') {
      parts.push(key)
    }
    else {
      parts.push(`${key}=${quote(typeof value === 'string' ? value : JSON.stringify(value))}`)
    }
  }
  return parts.length ? ` {${parts.join(' ')}}` : ''
}

/**
 * Markdown renderer handler that writes `pele` nodes back as fenced code blocks.
 *
 * @example
 * ```ts
 * import { renderMarkdown } from 'comark/render'
 * import { Pele } from 'comark-pele'
 *
 * await renderMarkdown(tree, { components: { Pele } })
 * ```
 */
export const Pele: NodeHandler = (node: ElementNode, state) => {
  const { content, language, ...rest } = node[1] as PeleNodeAttributes
  // Fence bodies keep one trailing newline. Drop it so round trips stay stable.
  const body = String(content ?? '').replace(/\n$/, '')
  const fence = pickFence(body)
  return `${fence}${language ?? 'mermaid'}${fenceProps(rest)}\n${body}\n${fence}${state.context.blockSeparator ?? '\n\n'}`
}
