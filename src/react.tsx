import { useEffect, useId, useRef, useState } from 'react'
import type { HTMLAttributes } from 'react'
import type { MountOptions } from 'pele'
import { classNames, diagramInnerHtml, mergeOptions, mountDiagram, renderDiagram, toErrorInfo, WRAPPER_CLASS } from './render.ts'
import type { MountedDiagram } from './render.ts'

export { default, searchProps } from './index.ts'
export type { PeleConfig, PeleNodeAttributes } from './index.ts'
export type { MountOptions, PeleDiagramError } from './render.ts'

export interface PeleProps extends Omit<HTMLAttributes<HTMLDivElement>, 'content' | 'dangerouslySetInnerHTML'> {
  /** Diagram source (Mermaid syntax). Set by the `pele` node. */
  content: string
  /** Language of the original code block. Set by the `pele` node. */
  language?: string
  /** Options passed to Pele's `render()` and, in the browser, `mount()`. */
  options?: MountOptions
}

/**
 * Create the React component for `pele` nodes with default
 * [Pele options](https://pele.run/api#mount), such as `zoom`, `fontSize`,
 * `icons`, or `onRender`. A component's own `options` prop is merged on top.
 *
 * Call it once, outside components, so the component type stays stable.
 *
 * @example
 * ```tsx
 * import pele, { createPeleComponent } from 'comark-pele/react'
 *
 * const Pele = createPeleComponent({ zoom: false, fontSize: 14 })
 * // <Markdown components={{ Pele }} plugins={[pele()]}>{content}</Markdown>
 * ```
 */
export function createPeleComponent(defaults?: MountOptions) {
  return function Pele({ content, language: _language, options, className, ...rest }: PeleProps) {
    const ref = useRef<HTMLDivElement>(null)
    const mounted = useRef<MountedDiagram | undefined>(undefined)
    const id = useId().replace(/[^\w-]/g, '')

    // Rendered once. React only patches `innerHTML` when `__html` changes, so
    // after `mount()` Pele owns the element's children.
    const [initial] = useState(() => {
      const rendered = renderDiagram(content, { idPrefix: `pele-${id}`, ...mergeOptions(defaults, options) })
      return { rendered, html: { __html: diagramInnerHtml(rendered, content) } }
    })
    const [type, setType] = useState(initial.rendered.result?.type)
    const [error, setError] = useState(initial.rendered.error?.message)

    const latestOptions = useRef(options)
    latestOptions.current = options

    const mountOptions = (): MountOptions => mergeOptions(defaults, latestOptions.current, {
      onRender(result) {
        setType(result.type)
        setError(undefined)
      },
      onError(err) {
        setError(toErrorInfo(err).message)
      },
    })

    useEffect(() => {
      if (!ref.current) return
      mounted.current = mountDiagram(ref.current, content, mountOptions())
      return () => {
        mounted.current?.destroy()
        mounted.current = undefined
      }
      // Mount once; later changes go through `update()` below.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const isFirstRun = useRef(true)
    useEffect(() => {
      if (isFirstRun.current) {
        isFirstRun.current = false
        return
      }
      mounted.current?.update(content, mountOptions())
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [content, options])

    return (
      <div
        {...rest}
        ref={ref}
        className={classNames(WRAPPER_CLASS, className)}
        data-diagram={type}
        data-error={error}
        dangerouslySetInnerHTML={initial.html}
      />
    )
  }
}

/**
 * React component for `pele` nodes.
 *
 * Renders the SVG on the server and on first render. In the browser it hands
 * the element to Pele's `mount()`, which adapts the layout to the container
 * width, enables zoom, and shows errors.
 *
 * @example
 * ```tsx
 * import { Markdown } from '@comark/react'
 * import pele, { Pele } from 'comark-pele/react'
 *
 * <Markdown components={{ Pele }} plugins={[pele()]}>{content}</Markdown>
 * ```
 */
export const Pele = createPeleComponent()
