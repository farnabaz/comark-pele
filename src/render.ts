import { mount, PeleError, render } from 'pele'
import type { Mounted, MountOptions, RenderOptions, RenderResult } from 'pele'
import { escapeHtml } from 'comark/utils'

export type { MountOptions, Mounted, RenderOptions, RenderResult } from 'pele'

/** Info about a diagram that failed to render. */
export interface PeleDiagramError {
  message: string
  code?: string
  line?: number
  column?: number
}

export type RenderDiagramResult =
  | { result: RenderResult, error?: undefined }
  | { result?: undefined, error: PeleDiagramError }

/** Props shared by every renderer component. */
export interface PeleComponentProps {
  /** Diagram source (Mermaid syntax). Set by the `pele` node. */
  content: string
  /** Language of the original code block. Set by the `pele` node. */
  language?: string
  /** Extra classes for the wrapper element. */
  class?: string
  /** Options passed to Pele's `render()` and, in the browser, `mount()`. */
  options?: MountOptions
}

/** Class names used by the components. */
export const WRAPPER_CLASS = 'pele-diagram'
export const SOURCE_CLASS = 'pele-source'

/** Convert anything thrown by Pele into plain, serializable error info. */
export function toErrorInfo(error: unknown): PeleDiagramError {
  // Check fields instead of `instanceof`: errors from `pele/core` come from a
  // different module instance than the `PeleError` exported by `pele`.
  if (error instanceof PeleError || (error instanceof Error && typeof (error as PeleError).code === 'string')) {
    const { message, code, line, column } = error as PeleError
    return { message, code, line, column }
  }
  return { message: error instanceof Error ? error.message : String(error) }
}

/**
 * Merge Pele options. Later sources win, except `onRender` and `onError`:
 * the callbacks from every source are called, in order.
 */
export function mergeOptions(...sources: (MountOptions | null | undefined)[]): MountOptions {
  const merged: MountOptions = {}
  const onRender: NonNullable<MountOptions['onRender']>[] = []
  const onError: NonNullable<MountOptions['onError']>[] = []
  for (const source of sources) {
    if (!source) continue
    Object.assign(merged, source)
    if (source.onRender) onRender.push(source.onRender)
    if (source.onError) onError.push(source.onError)
  }
  if (onRender.length) merged.onRender = result => onRender.forEach(callback => callback(result))
  else delete merged.onRender
  if (onError.length) merged.onError = error => onError.forEach(callback => callback(error))
  else delete merged.onError
  return merged
}

/** Render a diagram with Pele without throwing. */
export function renderDiagram(content: string, options?: RenderOptions): RenderDiagramResult {
  try {
    return { result: render(content, options) }
  }
  catch (error) {
    return { error: toErrorInfo(error) }
  }
}

/** A diagram mounted in the browser. */
export interface MountedDiagram {
  /** Draw new source. Errors go to `options.onError` instead of being thrown. */
  update(content: string, options?: MountOptions): void
  /** Stop observing the container. Leaves the diagram in place. */
  destroy(): void
}

/**
 * Mount a diagram with Pele's `mount()` without throwing.
 *
 * Some Pele versions throw from `mount()` when the first source can't be
 * drawn. Then the element keeps its current content (such as the server
 * rendered source), the error goes to `options.onError`, and the next
 * `update()` tries to mount again.
 */
export function mountDiagram(el: HTMLElement, content: string, options: MountOptions = {}): MountedDiagram {
  let mounted: Mounted | undefined

  const update = (next: string, nextOptions: MountOptions = options) => {
    try {
      if (mounted) mounted.update(next, nextOptions)
      else mounted = mount(el, next, nextOptions)
    }
    catch (error) {
      nextOptions.onError?.(error)
    }
  }

  update(content, options)

  return {
    update,
    destroy() {
      mounted?.destroy()
      mounted = undefined
    },
  }
}

/**
 * HTML for the inside of the wrapper element: the SVG, or the escaped source
 * when the diagram can't be drawn.
 */
export function diagramInnerHtml(rendered: RenderDiagramResult, content: string): string {
  if (rendered.result) return rendered.result.svg
  return `<pre class="${SOURCE_CLASS}"><code>${escapeHtml(content)}</code></pre>`
}

/** Join class names, skipping empty values. */
export function classNames(...names: (string | undefined | null | false)[]): string {
  return names.filter(Boolean).join(' ')
}

let counter = 0
/** A unique `idPrefix` for diagrams rendered outside a framework. */
export function nextIdPrefix(): string {
  return `pele-${counter++}`
}
