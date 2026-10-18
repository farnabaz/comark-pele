import type { MountOptions } from 'pele'

/** A renderer mounted into the output panel. */
export interface MountedRenderer {
  /** Render new markdown. */
  update(markdown: string): void | Promise<void>
  /** Remove everything the renderer added. */
  destroy(): void
}

/**
 * Mount a renderer. `options` go to `createPeleComponent()`; the playground
 * mounts again when they change.
 */
export type MountRenderer = (el: HTMLElement, markdown: string, options: MountOptions) => MountedRenderer | Promise<MountedRenderer>
