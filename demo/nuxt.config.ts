import { fileURLToPath } from 'node:url'

/**
 * Set the theme before first paint. Reads a stored choice, falls back to the
 * OS preference.
 */
const themeScript = `
try {
  var stored = localStorage.getItem("theme")
  var dark = stored ? stored === "dark" : matchMedia("(prefers-color-scheme: dark)").matches
  if (dark) document.documentElement.classList.add("dark")
} catch (e) {}
`

export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: false },
  css: ['~/assets/main.css'],
  // Use the plugin source directly, so edits show up without a build.
  alias: {
    'comark-pele/vue': fileURLToPath(new URL('../src/vue.ts', import.meta.url)),
    'comark-pele': fileURLToPath(new URL('../src/index.ts', import.meta.url)),
  },
  app: {
    head: {
      title: 'Comark × Pele',
      meta: [{ name: 'description', content: 'Mermaid diagrams in a plain .md file, parsed by Comark and drawn by Pele.' }],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/icon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap' },
      ],
      script: [{ innerHTML: themeScript }],
    },
  },
  nitro: {
    // Bundle `content/` with the server, so the pages can read it on any host.
    serverAssets: [{ baseName: 'content', dir: '../content' }],
  },
})
