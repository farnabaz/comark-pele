import type { PropType } from 'vue'
import { defineComponent, h, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import type { MountOptions } from 'pele'
import { classNames, diagramInnerHtml, mountDiagram, renderDiagram, toErrorInfo, WRAPPER_CLASS } from './render.ts'
import type { MountedDiagram } from './render.ts'

export { default, searchProps } from './index.ts'
export type { PeleConfig, PeleNodeAttributes } from './index.ts'
export type { MountOptions, PeleComponentProps, PeleDiagramError } from './render.ts'

/**
 * Vue component for `pele` nodes.
 *
 * Renders the SVG on the server and on first render. In the browser it hands
 * the element to Pele's `mount()`, which adapts the layout to the container
 * width, enables zoom, and shows errors.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { Markdown } from '@comark/vue'
 * import pele, { Pele } from 'comark-pele/vue'
 * </script>
 *
 * <template>
 *   <Suspense>
 *     <Markdown :components="{ Pele }" :plugins="[pele()]">{{ content }}</Markdown>
 *   </Suspense>
 * </template>
 * ```
 */
export const Pele = defineComponent({
  name: 'Pele',
  props: {
    content: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      default: undefined,
    },
    class: {
      type: String,
      default: '',
    },
    options: {
      type: Object as PropType<MountOptions>,
      default: undefined,
    },
  },
  setup(props) {
    const el = ref<HTMLElement>()
    const id = useId()

    // Rendered once. Vue only patches `innerHTML` when the string changes, so
    // after `mount()` Pele owns the element's children.
    const initial = renderDiagram(props.content, { idPrefix: `pele-${id}`, ...props.options })
    const innerHTML = diagramInnerHtml(initial, props.content)
    const type = ref(initial.result?.type)
    const error = ref(initial.error?.message)

    let mounted: MountedDiagram | undefined

    const mountOptions = (): MountOptions => ({
      ...props.options,
      onRender(result) {
        type.value = result.type
        error.value = undefined
        props.options?.onRender?.(result)
      },
      onError(err) {
        error.value = toErrorInfo(err).message
        props.options?.onError?.(err)
      },
    })

    onMounted(() => {
      if (el.value) mounted = mountDiagram(el.value, props.content, mountOptions())
    })

    watch(
      () => [props.content, props.options] as const,
      () => mounted?.update(props.content, mountOptions()),
      { deep: true },
    )

    onBeforeUnmount(() => {
      mounted?.destroy()
      mounted = undefined
    })

    return () =>
      h('div', {
        'ref': el,
        'class': classNames(WRAPPER_CLASS, props.class),
        'data-diagram': type.value,
        'data-error': error.value,
        innerHTML,
      })
  },
})
