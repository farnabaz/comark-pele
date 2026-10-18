import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Input,
  PLATFORM_ID,
  Renderer2,
} from '@angular/core'
import type { OnChanges, OnDestroy } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import type { MountOptions } from 'pele'
import { classNames, diagramInnerHtml, mountDiagram, renderDiagram, toErrorInfo, WRAPPER_CLASS } from 'comark-pele/render'
import type { MountedDiagram } from 'comark-pele/render'

let nextId = 0

/**
 * Angular component for `pele` nodes.
 *
 * Renders the SVG on the server. In the browser it hands the element to Pele's
 * `mount()`, which adapts the layout to the container width, enables zoom, and
 * shows errors.
 *
 * @example
 * ```ts
 * import { Markdown } from '@comark/angular'
 * import pele, { Pele } from 'comark-pele/angular'
 *
 * @Component({
 *   imports: [Markdown],
 *   template: `<comark-markdown [value]="content" [plugins]="plugins" [components]="components" />`,
 * })
 * export class AppComponent {
 *   plugins = [pele()]
 *   components = { Pele }
 * }
 * ```
 */
@Component({
  selector: 'comark-pele',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  // The diagram is written outside Angular's template, so hydration can't match it.
  host: { ngSkipHydration: 'true', style: 'display: block' },
})
export class Pele implements OnChanges, OnDestroy {
  /** Diagram source (Mermaid syntax). Set by the `pele` node. */
  @Input({ required: true }) content!: string
  /** Language of the original code block. Set by the `pele` node. */
  @Input() language?: string
  /** Extra classes for the wrapper element. */
  @Input() class: string = ''
  /** Id of the wrapper element. */
  @Input() id?: string
  /** Options passed to Pele's `render()` and, in the browser, `mount()`. */
  @Input() options?: MountOptions

  private readonly host = inject(ElementRef).nativeElement as HTMLElement
  private readonly renderer = inject(Renderer2)
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID))
  private readonly idPrefix = `pele-ng${nextId++}`
  private wrapper?: HTMLElement
  private mounted?: MountedDiagram

  ngOnChanges(): void {
    const wrapper = this.ensureWrapper()
    this.renderer.setAttribute(wrapper, 'class', classNames(WRAPPER_CLASS, this.class))
    this.setAttribute('id', this.id)

    if (this.mounted) {
      this.mounted.update(this.content, this.mountOptions())
      return
    }

    // First render, on the server or in the browser: the SVG, or the escaped
    // source when the diagram can't be drawn.
    const rendered = renderDiagram(this.content, { idPrefix: this.idPrefix, ...this.options })
    this.renderer.setProperty(wrapper, 'innerHTML', diagramInnerHtml(rendered, this.content))
    this.setAttribute('data-diagram', rendered.result?.type)
    this.setAttribute('data-error', rendered.error?.message)

    if (this.isBrowser) this.mounted = mountDiagram(wrapper, this.content, this.mountOptions())
  }

  ngOnDestroy(): void {
    this.mounted?.destroy()
    this.mounted = undefined
  }

  private ensureWrapper(): HTMLElement {
    if (!this.wrapper) {
      this.wrapper = this.renderer.createElement('div') as HTMLElement
      this.renderer.appendChild(this.host, this.wrapper)
    }
    return this.wrapper
  }

  private setAttribute(name: string, value: string | undefined): void {
    if (value) this.renderer.setAttribute(this.wrapper, name, value)
    else this.renderer.removeAttribute(this.wrapper, name)
  }

  private mountOptions(): MountOptions {
    const options = this.options
    return {
      idPrefix: this.idPrefix,
      ...options,
      onRender: (result) => {
        this.setAttribute('data-diagram', result.type)
        this.setAttribute('data-error', undefined)
        options?.onRender?.(result)
      },
      onError: (error) => {
        this.setAttribute('data-error', toErrorInfo(error).message)
        options?.onError?.(error)
      },
    }
  }
}
