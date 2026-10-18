import type { ElementNode } from 'comark'
import type { RenderOptions } from 'pele'
import { classNames, diagramInnerHtml, nextIdPrefix, renderDiagram, WRAPPER_CLASS } from './render.ts'
import type { PeleNodeAttributes } from './index.ts'

export { default, searchProps } from './index.ts'
export type { PeleConfig, PeleNodeAttributes } from './index.ts'
export type { PeleDiagramError, RenderOptions } from './render.ts'

const SKIP = new Set(['content', 'language', 'class', '$'])

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function attributes(values: Record<string, string | undefined>): string {
  return Object.entries(values)
    .filter((entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== '')
    .map(([key, value]) => ` ${key}="${escapeAttribute(value)}"`)
    .join('')
}

/**
 * Create an HTML component for `pele` nodes with custom Pele render options.
 *
 * @example
 * ```ts
 * import { createHtmlRenderer } from '@comark/html'
 * import pele, { createPele } from 'comark-pele/html'
 *
 * const renderHtml = createHtmlRenderer({
 *   plugins: [pele()],
 *   components: { Pele: createPele({ fontSize: 14 }) },
 * })
 * ```
 */
export function createPele(options: RenderOptions = {}) {
  return ([, attrs]: ElementNode): string => {
    const { content: rawContent, class: className } = attrs as PeleNodeAttributes
    const content = String(rawContent ?? '')
    const rendered = renderDiagram(content, { idPrefix: nextIdPrefix(), ...options })

    // Pass other fence props (such as `id` or `title`) through as attributes.
    const extra: Record<string, string | undefined> = {}
    for (const [key, value] of Object.entries(attrs)) {
      if (!SKIP.has(key) && (typeof value === 'string' || typeof value === 'number')) extra[key] = String(value)
    }

    return `<div${attributes({
      ...extra,
      'class': classNames(WRAPPER_CLASS, className as string | undefined),
      'data-diagram': rendered.result?.type,
      'data-error': rendered.error?.message,
    })}>${diagramInnerHtml(rendered, content)}</div>`
  }
}

/**
 * HTML component for `pele` nodes. Renders diagrams to inline SVG.
 * Diagrams that can't be drawn show their source in `pre.pele-source`, and the
 * wrapper gets a `data-error` attribute.
 *
 * @example
 * ```ts
 * import { createHtmlRenderer } from '@comark/html'
 * import pele, { Pele } from 'comark-pele/html'
 *
 * const renderHtml = createHtmlRenderer({
 *   plugins: [pele()],
 *   components: { Pele },
 * })
 * ```
 */
export const Pele = createPele()
