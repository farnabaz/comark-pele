<script setup lang="ts">
import { MarkdownDocument } from '@comark/vue'
import { parseMarkdown } from 'comark'
import type { MarkdownDocument as Doc } from 'comark'
import { plugins } from '#shared/comark'
import { components } from '~/comark'

/**
 * Reveals the Markdown a few characters at a time and parses it again on
 * every frame.
 *
 * Comark closes the dangling ```` ```mermaid ```` fence, so a half-written
 * diagram is a `pele` node with half its source. The `Pele` component keeps
 * the same element mounted and passes each new source to Pele's `update()`,
 * so a flowchart grows a node at a time. When a prefix can't be drawn (an
 * arrow with no target yet), Pele keeps the last diagram that worked on
 * screen.
 */
const props = defineProps<{ source: string }>()

const SPEEDS = [
  { label: '1×', chars: 4 },
  { label: '3×', chars: 12 },
  { label: '8×', chars: 32 },
] as const

const TICK_MS = 24

const cursor = ref(0)
const playing = ref(true)
const speed = ref(0)
const doc = shallowRef<Doc | null>(null)

const done = computed(() => cursor.value >= props.source.length)
const partial = computed(() => props.source.slice(0, cursor.value))
const progress = computed(() => (props.source.length ? cursor.value / props.source.length : 0))

let timer: ReturnType<typeof setInterval> | undefined
watchEffect((onCleanup) => {
  if (import.meta.server || !playing.value || done.value) return
  const step = SPEEDS[speed.value]!.chars
  timer = setInterval(() => {
    cursor.value = Math.min(props.source.length, cursor.value + step)
  }, TICK_MS)
  onCleanup(() => clearInterval(timer))
})

watch(partial, (text, _, onCleanup) => {
  if (!text) return
  let cancelled = false
  onCleanup(() => {
    cancelled = true
  })
  parseMarkdown(text, { plugins })
    .then((next) => {
      if (!cancelled) doc.value = next
    })
    // Keep the last good tree on screen.
    .catch(() => {})
})

function restart() {
  doc.value = null
  cursor.value = 0
  playing.value = true
}
</script>

<template>
  <div>
    <div class="tabs">
      <button aria-pressed="true" class="tab" type="button" @click="done ? restart() : (playing = true)">
        [ {{ done ? 'Replay' : playing ? 'Streaming' : 'Resume' }} ]
      </button>
      <button class="tab" :disabled="done || !playing" type="button" @click="playing = false">
        Pause
      </button>
      <span aria-hidden="true" class="separator">|</span>
      <button
        v-for="(option, index) in SPEEDS"
        :key="option.label"
        :aria-pressed="speed === index"
        class="tab"
        type="button"
        @click="speed = index"
      >
        {{ option.label }}
      </button>
      <span class="counter">{{ cursor }}/{{ source.length }} chars</span>
    </div>

    <div aria-hidden="true" class="progress frame">
      <div :style="{ width: `${progress * 100}%` }" />
    </div>

    <MarkdownDocument v-if="doc" :caret="!done" class="prose" :components="components" :streaming="!done" :value="doc" />
    <p v-else class="muted mono">
      Waiting for output…
    </p>
  </div>
</template>
