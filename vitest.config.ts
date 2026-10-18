import { fileURLToPath } from 'node:url'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'

const src = (path: string) => fileURLToPath(new URL(`./src/${path}`, import.meta.url))

const alias = [
  { find: /^comark-pele$/, replacement: src('index.ts') },
  { find: /^comark-pele\/(.*)$/, replacement: src('$1.ts') },
]

export default defineConfig({
  plugins: [svelte()],
  resolve: { alias },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          include: ['test/**/*.test.{ts,tsx}'],
          exclude: ['test/**/*.svelte.test.ts'],
        },
      },
      {
        // Svelte client tests need Svelte's browser build.
        extends: true,
        resolve: { alias, conditions: ['browser'] },
        test: {
          name: 'svelte-browser',
          include: ['test/**/*.svelte.test.ts'],
          environment: 'happy-dom',
        },
      },
    ],
  },
})
