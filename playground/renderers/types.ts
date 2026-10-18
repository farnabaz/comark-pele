/** A renderer mounted into the output panel. */
export interface MountedRenderer {
  /** Render new markdown. */
  update(markdown: string): void | Promise<void>
  /** Remove everything the renderer added. */
  destroy(): void
}

export type MountRenderer = (el: HTMLElement, markdown: string) => MountedRenderer | Promise<MountedRenderer>
