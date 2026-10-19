<script setup lang="ts">
/**
 * A small line-based highlighter for the source pane. It only needs to make
 * the diagram blocks stand out from the prose: the fences, the diagram source,
 * and the frontmatter.
 */

type LineKind = 'fence' | 'diagram' | 'frontmatter' | 'heading' | 'text'

const props = defineProps<{ source: string }>()

const rows = computed(() => {
  const lines = props.source.replace(/\n$/, '').split('\n')
  const rows: { line: string, kind: LineKind }[] = []
  let fence: string | undefined
  let diagram = false
  let frontmatter = lines[0] === '---'

  lines.forEach((line, index) => {
    if (frontmatter) {
      rows.push({ line, kind: 'frontmatter' })
      if (index > 0 && line === '---') frontmatter = false
      return
    }
    const marker = line.match(/^\s*(`{3,})(\S*)/)
    if (marker && !fence) {
      fence = marker[1]
      diagram = marker[2] === 'mermaid' || marker[2] === 'pele'
      rows.push({ line, kind: diagram ? 'fence' : 'text' })
      return
    }
    if (marker && fence && marker[1] === fence && !marker[2]) {
      rows.push({ line, kind: diagram ? 'fence' : 'text' })
      fence = undefined
      diagram = false
      return
    }
    if (fence) rows.push({ line, kind: diagram ? 'diagram' : 'text' })
    else rows.push({ line, kind: line.startsWith('#') ? 'heading' : 'text' })
  })

  return rows
})

const gutter = computed(() => `${String(rows.value.length).length}ch`)
</script>

<template>
  <pre class="source frame"><code><span v-for="(row, index) in rows" :key="index" class="source-line"><span aria-hidden="true" class="source-number" :style="{ width: gutter }">{{ index + 1 }}</span><span :class="`source-${row.kind}`">{{ row.line || ' ' }}</span></span></code></pre>
</template>
