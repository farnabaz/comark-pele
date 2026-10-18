import type { MountOptions } from 'pele'
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

// Renderers that print text, so Pele options don't apply.
const TEXT_RENDERERS: Record<string, string> = { ansi: 'ANSI', markdown: 'Markdown' }

// Pele's defaults, so the first render matches `Pele` without options.
const DEFAULT_OPTIONS = `{
  "fontSize": 16,
  "zoom": "auto",
  "autoDirection": true,
  "responsive": true
}
`

const STORAGE_MARKDOWN = 'comark-pele:markdown'
const STORAGE_RENDERER = 'comark-pele:renderer'
const STORAGE_OPTIONS = 'comark-pele:options'

const textarea = document.querySelector<HTMLTextAreaElement>('#markdown')!
const select = document.querySelector<HTMLSelectElement>('#renderer')!
const output = document.querySelector<HTMLDivElement>('#output')!
const status = document.querySelector<HTMLSpanElement>('#status')!
const reset = document.querySelector<HTMLButtonElement>('#reset')!
const optionsInput = document.querySelector<HTMLTextAreaElement>('#options')!
const optionsStatus = document.querySelector<HTMLSpanElement>('#options-status')!
const resetOptions = document.querySelector<HTMLButtonElement>('#reset-options')!

textarea.value = localStorage.getItem(STORAGE_MARKDOWN) ?? sample
const initialRenderer = new URLSearchParams(location.search).get('renderer') ?? localStorage.getItem(STORAGE_RENDERER)
if (initialRenderer && initialRenderer in renderers) select.value = initialRenderer
optionsInput.value = localStorage.getItem(STORAGE_OPTIONS) ?? DEFAULT_OPTIONS

/** Parse the options editor. Returns an error message when it isn't a JSON object. */
function parseOptions(text: string): { options: MountOptions } | { error: string } {
  if (!text.trim()) return { options: {} }
  try {
    const value: unknown = JSON.parse(text)
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { error: 'Options must be a JSON object' }
    return { options: value as MountOptions }
  }
  catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

const initialOptions = parseOptions(optionsInput.value)
// The last valid options. Invalid JSON keeps these until it's fixed.
let appliedOptions: MountOptions = 'options' in initialOptions ? initialOptions.options : {}

function showOptionsStatus() {
  const parsed = parseOptions(optionsInput.value)
  const textRenderer = TEXT_RENDERERS[select.value]
  const text = 'error' in parsed
    ? parsed.error
    : textRenderer ? `Not used by the ${textRenderer} renderer` : ''
  optionsStatus.textContent = text
  optionsStatus.title = text
  optionsStatus.classList.toggle('error', 'error' in parsed)
}

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
    const mounted = await mount(target, textarea.value, appliedOptions)
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

select.addEventListener('change', () => {
  showOptionsStatus()
  void switchRenderer(select.value)
})

let optionsTimer: ReturnType<typeof setTimeout> | undefined
optionsInput.addEventListener('input', () => {
  localStorage.setItem(STORAGE_OPTIONS, optionsInput.value)
  clearTimeout(optionsTimer)
  optionsTimer = setTimeout(() => {
    showOptionsStatus()
    const parsed = parseOptions(optionsInput.value)
    if ('error' in parsed || JSON.stringify(parsed.options) === JSON.stringify(appliedOptions)) return
    appliedOptions = parsed.options
    // `createPeleComponent()` takes options once, so mount the renderer again.
    void switchRenderer(select.value)
  }, 300)
})

optionsInput.addEventListener('keydown', (event) => {
  if (event.key === 'Tab' && !event.shiftKey) {
    event.preventDefault()
    optionsInput.setRangeText('  ', optionsInput.selectionStart, optionsInput.selectionEnd, 'end')
    optionsInput.dispatchEvent(new Event('input'))
  }
})

resetOptions.addEventListener('click', () => {
  optionsInput.value = DEFAULT_OPTIONS
  optionsInput.dispatchEvent(new Event('input'))
})

reset.addEventListener('click', () => {
  textarea.value = sample
  textarea.dispatchEvent(new Event('input'))
})

showOptionsStatus()
void switchRenderer(select.value)
