import pele from 'comark-pele'

/**
 * Comark plugins, shared by the server route that parses the pages and the
 * streaming demo, which parses in the browser. `pele()` turns
 * ```` ```mermaid ```` blocks into `pele` nodes.
 */
export const plugins = [pele()]
