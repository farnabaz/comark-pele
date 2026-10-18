<!--
@component
Renders a `pele` node from the Comark AST with Pele.

Renders the SVG on the server and on first render. In the browser it hands the
element to Pele's `mount()`, which adapts the layout to the container width,
enables zoom, and shows errors.

@example
```svelte
<script>
  import { Markdown } from '@comark/svelte'
  import pele, { Pele } from 'comark-pele/svelte'
</script>

<Markdown value={content} components={{ Pele }} plugins={[pele()]} />
```
-->
<script lang="ts">
  import { onMount, untrack } from 'svelte'
  import type { MountOptions } from 'pele'
  import { classNames, diagramInnerHtml, mountDiagram, renderDiagram, toErrorInfo, WRAPPER_CLASS } from 'comark-pele/render'
  import type { MountedDiagram } from 'comark-pele/render'

  let {
    content,
    language: _language,
    class: className = '',
    options,
    ...rest
  }: {
    content: string
    language?: string
    class?: string
    options?: MountOptions
    [key: string]: unknown
  } = $props()

  const uid = $props.id()

  // Rendered once. The `{@html}` below never changes, so after `mount()` Pele
  // owns the element's children.
  const initial = untrack(() => renderDiagram(content, { idPrefix: `pele-${uid}`, ...options }))
  const html = untrack(() => diagramInnerHtml(initial, content))

  let type = $state(initial.result?.type)
  let error = $state(initial.error?.message)

  let el: HTMLDivElement
  let mounted: MountedDiagram | undefined

  function mountOptions(): MountOptions {
    return {
      ...options,
      onRender(result) {
        type = result.type
        error = undefined
        options?.onRender?.(result)
      },
      onError(err) {
        error = toErrorInfo(err).message
        options?.onError?.(err)
      },
    }
  }

  onMount(() => {
    mounted = mountDiagram(el, content, mountOptions())
    return () => {
      mounted?.destroy()
      mounted = undefined
    }
  })

  let firstRun = true
  $effect(() => {
    // Track the inputs. The first run happens right after `mount()`, so skip it.
    const next = content
    void options
    if (firstRun) {
      firstRun = false
      return
    }
    untrack(() => mounted?.update(next, mountOptions()))
  })
</script>

<div
  {...rest}
  bind:this={el}
  class={classNames(WRAPPER_CLASS, className)}
  data-diagram={type}
  data-error={error}
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- Pele escapes diagram text, or the source is escaped -->
  {@html html}
</div>
