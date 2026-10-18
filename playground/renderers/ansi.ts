import { createAnsiRenderer } from '@comark/ansi'
import pele, { Pele } from 'comark-pele/ansi'
import type { MountRenderer } from './types.ts'

const renderAnsi = createAnsiRenderer({ plugins: [pele()], components: { Pele }, colors: true })

const BASIC_COLORS: Record<number, string> = {
  30: '#100f0f', 31: '#d14d41', 32: '#879a39', 33: '#d0a215',
  34: '#4385be', 35: '#ce5d97', 36: '#3aa99f', 37: '#cecdc3',
  90: '#6f6e69', 91: '#d14d41', 92: '#879a39', 93: '#d0a215',
  94: '#4385be', 95: '#ce5d97', 96: '#3aa99f', 97: '#fffcf0',
}

function escape(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Convert the SGR escape codes Comark's ANSI renderer emits to HTML spans. */
function ansiToHtml(input: string): string {
  let html = ''
  let classes = new Set<string>()
  let color: string | undefined
  const open = () => {
    if (!classes.size && !color) return ''
    const cls = classes.size ? ` class="${[...classes].join(' ')}"` : ''
    const style = color ? ` style="color:${color}"` : ''
    return `<span${cls}${style}>`
  }
  let isOpen = false

  for (const part of input.split(/(\x1B\[[\d;]*m)/)) {
    const match = part.match(/^\x1B\[([\d;]*)m$/)
    if (!match) {
      if (part) html += escape(part)
      continue
    }
    const codes = (match[1] || '0').split(';').map(Number)
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i]!
      if (code === 0) {
        classes = new Set()
        color = undefined
      }
      else if (code === 1) classes.add('ansi-bold')
      else if (code === 2) classes.add('ansi-dim')
      else if (code === 3) classes.add('ansi-italic')
      else if (code === 4) classes.add('ansi-underline')
      else if (code === 9) classes.add('ansi-strike')
      else if (code === 39) color = undefined
      else if (code === 38 && codes[i + 1] === 2) {
        color = `rgb(${codes[i + 2]},${codes[i + 3]},${codes[i + 4]})`
        i += 4
      }
      else if (BASIC_COLORS[code]) color = BASIC_COLORS[code]
    }
    if (isOpen) html += '</span>'
    const tag = open()
    html += tag
    isOpen = Boolean(tag)
  }
  if (isOpen) html += '</span>'
  return html
}

const mount: MountRenderer = async (el, markdown) => {
  const pre = document.createElement('pre')
  pre.className = 'raw'
  el.append(pre)
  const update = async (value: string) => {
    pre.innerHTML = ansiToHtml(await renderAnsi(value))
  }
  await update(markdown)
  return {
    update,
    destroy: () => el.replaceChildren(),
  }
}

export default mount
