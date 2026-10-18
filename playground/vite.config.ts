import { fileURLToPath } from 'node:url'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

const src = (path: string) => fileURLToPath(new URL(`../src/${path}`, import.meta.url))

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [svelte()],
  resolve: {
    // Use the plugin source directly, so edits show up without a build.
    alias: [
      { find: /^comark-pele$/, replacement: src('index.ts') },
      { find: /^comark-pele\/svelte$/, replacement: src('svelte/index.ts') },
      { find: /^comark-pele\/angular$/, replacement: src('angular/index.ts') },
      { find: /^comark-pele\/react$/, replacement: src('react.tsx') },
      { find: /^comark-pele\/(.*)$/, replacement: src('$1.ts') },
    ],
  },
  build: {
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: true,
    // Angular runs in JIT mode and Pele includes every diagram type, so a few
    // lazy-loaded chunks are large. That's fine for a playground.
    chunkSizeWarningLimit: 1500,
  },
})
