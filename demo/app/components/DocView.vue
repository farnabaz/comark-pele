<script setup lang="ts">
/** Rendered / source switch. Both panes render once; switching only hides one. */
defineProps<{ lines: number }>()

const view = ref<'rendered' | 'source'>('rendered')
</script>

<template>
  <div>
    <div class="tabs">
      <button :aria-pressed="view === 'rendered'" class="tab" type="button" @click="view = 'rendered'">
        {{ view === 'rendered' ? '[ Rendered ]' : 'Rendered' }}
      </button>
      <button :aria-pressed="view === 'source'" class="tab" type="button" @click="view = 'source'">
        {{ view === 'source' ? `[ Source · ${lines} lines ]` : `Source · ${lines} lines` }}
      </button>
    </div>
    <div v-show="view === 'rendered'">
      <slot name="rendered" />
    </div>
    <div v-show="view === 'source'">
      <slot name="source" />
    </div>
  </div>
</template>
