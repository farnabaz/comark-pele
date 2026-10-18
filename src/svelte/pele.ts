import type { Component } from 'svelte'
import type { MountOptions } from 'pele'
import PeleView from './PeleView.svelte'

export interface PeleProps {
  /** Diagram source (Mermaid syntax). Set by the `pele` node. */
  content: string
  /** Language of the original code block. Set by the `pele` node. */
  language?: string
  /** Extra classes for the wrapper element. */
  class?: string
  /** Options passed to Pele's `render()` and, in the browser, `mount()`. */
  options?: MountOptions
  [key: string]: unknown
}

const View = PeleView as Component<PeleProps>

/** Add `defaults` to the props without reading them, so the props stay reactive. */
function withDefaults(props: PeleProps, defaults: MountOptions): PeleProps {
  return new Proxy(props, {
    get: (target, key, receiver) => (key === 'defaults' ? defaults : Reflect.get(target, key, receiver)),
    has: (target, key) => key === 'defaults' || Reflect.has(target, key),
  })
}

/**
 * Create the Svelte component for `pele` nodes with default
 * [Pele options](https://pele.run/api#mount), such as `zoom`, `fontSize`,
 * `icons`, or `onRender`. A component's own `options` prop is merged on top.
 *
 * @example
 * ```svelte
 * <script>
 *   import { Markdown } from '@comark/svelte'
 *   import pele, { createPeleComponent } from 'comark-pele/svelte'
 *
 *   const Pele = createPeleComponent({ zoom: false, fontSize: 14 })
 * </script>
 *
 * <Markdown value={content} components={{ Pele }} plugins={[pele()]} />
 * ```
 */
export function createPeleComponent(defaults?: MountOptions): Component<PeleProps> {
  if (!defaults) return View
  // Svelte 5 components are functions called with `(internals, props)`, on the
  // client and on the server.
  return (internals, props) => View(internals, withDefaults(props, defaults))
}

/**
 * Svelte component for `pele` nodes.
 *
 * Renders the SVG on the server and on first render. In the browser it hands
 * the element to Pele's `mount()`, which adapts the layout to the container
 * width, enables zoom, and shows errors.
 *
 * @example
 * ```svelte
 * <script>
 *   import { Markdown } from '@comark/svelte'
 *   import pele, { Pele } from 'comark-pele/svelte'
 * </script>
 *
 * <Markdown value={content} components={{ Pele }} plugins={[pele()]} />
 * ```
 */
export const Pele: Component<PeleProps> = createPeleComponent()
