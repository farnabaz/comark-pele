import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Input,
  PLATFORM_ID,
  Renderer2,
} from '@angular/core'
import type { OnChanges, OnDestroy, Type } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import type { MountOptions } from 'pele'
import { classNames, diagramInnerHtml, mergeOptions, mountDiagram, renderDiagram, toErrorInfo, WRAPPER_CLASS } from 'comark-pele/render'
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
  /** Default options, set by `createPeleComponent(options)`. */
  protected defaults?: MountOptions
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
    const rendered = renderDiagram(this.content, mergeOptions({ idPrefix: this.idPrefix }, this.defaults, this.options))
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
    return mergeOptions({ idPrefix: this.idPrefix }, this.defaults, this.options, {
      onRender: (result) => {
        this.setAttribute('data-diagram', result.type)
        this.setAttribute('data-error', undefined)
      },
      onError: (error) => {
        this.setAttribute('data-error', toErrorInfo(error).message)
      },
    })
  }
}

/**
 * Create the Angular component for `pele` nodes with default
 * [Pele options](https://pele.run/api#mount), such as `zoom`, `fontSize`,
 * `icons`, or `onRender`. A component's own `options` input is merged on top.
 *
 * @example
 * ```ts
 * import { Markdown } from '@comark/angular'
 * import pele, { createPeleComponent } from 'comark-pele/angular'
 *
 * @Component({
 *   imports: [Markdown],
 *   template: `<comark-markdown [value]="content" [plugins]="plugins" [components]="components" />`,
 * })
 * export class AppComponent {
 *   plugins = [pele()]
 *   components = { Pele: createPeleComponent({ zoom: false, fontSize: 14 }) }
 * }
 * ```
 */
export function createPeleComponent(options?: MountOptions): Type<Pele> {
  @Component({
    selector: 'comark-pele',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: '',
    host: { ngSkipHydration: 'true', style: 'display: block' },
  })
  class ConfiguredPele extends Pele {
    protected override defaults = options
  }
  return ConfiguredPele
}
