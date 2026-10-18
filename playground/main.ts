import { sample } from './sample.ts'
import type { MountedRenderer, MountRenderer } from './renderers/types.ts'

// Each renderer loads on demand, so only the selected framework is downloaded.
const renderers: Record<string, () => Promise<{ default: MountRenderer }>> = {
  html: () => import('./renderers/html.ts'),
  vue: () => import('./renderers/vue.ts'),
  react: () => import('./renderers/react.tsx'),
  svelte: () => import('./renderers/svelte.svelte.ts'),
  angular: () => import('./renderers/angular.ts'),
  ansi: () => import('./renderers/ansi.ts'),
  markdown: () => import('./renderers/markdown.ts'),
}

const STORAGE_MARKDOWN = 'comark-pele:markdown'
const STORAGE_RENDERER = 'comark-pele:renderer'

const textarea = document.querySelector<HTMLTextAreaElement>('#markdown')!
const select = document.querySelector<HTMLSelectElement>('#renderer')!
const output = document.querySelector<HTMLDivElement>('#output')!
const status = document.querySelector<HTMLSpanElement>('#status')!
const reset = document.querySelector<HTMLButtonElement>('#reset')!

textarea.value = localStorage.getItem(STORAGE_MARKDOWN) ?? sample
const initialRenderer = new URLSearchParams(location.search).get('renderer') ?? localStorage.getItem(STORAGE_RENDERER)
if (initialRenderer && initialRenderer in renderers) select.value = initialRenderer

let current: MountedRenderer | undefined
// Increases on every switch, so a slow renderer that loads late is discarded.
let generation = 0

function setStatus(text: string, isError = false) {
  status.textContent = text
  status.classList.toggle('error', isError)
}

async function timed(task: () => void | Promise<void>) {
  const start = performance.now()
  try {
    await task()
    setStatus(`${(performance.now() - start).toFixed(1)} ms`)
  }
  catch (error) {
    console.error(error)
    setStatus(error instanceof Error ? error.message : String(error), true)
  }
}

async function switchRenderer(name: string) {
  const id = ++generation
  current?.destroy()
  current = undefined
  output.replaceChildren()
  setStatus(`Loading ${name}…`)

  const url = new URL(location.href)
  url.searchParams.set('renderer', name)
  history.replaceState(null, '', url)
  localStorage.setItem(STORAGE_RENDERER, name)

  await timed(async () => {
    const { default: mount } = await renderers[name]!()
    if (id !== generation) return
    const target = document.createElement('div')
    output.append(target)
    const mounted = await mount(target, textarea.value)
    if (id !== generation) {
      mounted.destroy()
      return
    }
    current = mounted
  })
}

let timer: ReturnType<typeof setTimeout> | undefined
textarea.addEventListener('input', () => {
  localStorage.setItem(STORAGE_MARKDOWN, textarea.value)
  clearTimeout(timer)
  timer = setTimeout(() => {
    if (current) void timed(() => current!.update(textarea.value))
  }, 150)
})

textarea.addEventListener('keydown', (event) => {
  // Insert two spaces instead of moving focus.
  if (event.key === 'Tab' && !event.shiftKey) {
    event.preventDefault()
    textarea.setRangeText('  ', textarea.selectionStart, textarea.selectionEnd, 'end')
    textarea.dispatchEvent(new Event('input'))
  }
})

select.addEventListener('change', () => void switchRenderer(select.value))

reset.addEventListener('click', () => {
  textarea.value = sample
  textarea.dispatchEvent(new Event('input'))
})

void switchRenderer(select.value)
