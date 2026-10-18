import { defineConfig } from 'tsdown'

export default defineConfig({
  // Svelte and Angular entries are built separately with `svelte-package` and
  // `ngc`, because they need their framework compilers.
  entry: ['src/index.ts', 'src/render.ts', 'src/html.ts', 'src/ansi.ts', 'src/vue.ts', 'src/react.tsx'],
  // ESM only — Comark is a pure-ESM package.
  format: ['esm'],
  dts: true,
  // Keep frameworks, Comark, and Pele external. They are peer dependencies.
  deps: { neverBundle: [/^comark(\/|$)/, /^pele(\/|$)/, /^vue(\/|$)/, /^react(\/|$)/] },
})
