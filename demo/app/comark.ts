import { createPeleComponent } from 'comark-pele/vue'

/**
 * The tag → component map handed to Comark. `pele` nodes come from
 * ```` ```mermaid ```` blocks. Everything else is plain Markdown.
 *
 * `Pele` renders the SVG on the server, so the diagrams are in the HTML. In
 * the browser it switches to Pele's `mount()`, which fits each diagram to its
 * column and adds zoom when one has to shrink.
 */
export const components = {
  Pele: createPeleComponent({ zoom: 'auto' }),
}
