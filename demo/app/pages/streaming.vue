<script setup lang="ts">
useHead({ title: 'Streaming' })

const { data } = await useFetch('/api/sources/streaming')
</script>

<template>
  <div>
    <div class="prose intro">
      <h1>Streaming</h1>
      <p>
        The same kind of <code>.md</code> file, revealed a few characters at a
        time and parsed again on every frame, the way Markdown arrives from a
        model.
      </p>
      <p>
        Comark closes the open <code>```mermaid</code> fence, so a half-written
        diagram is still a <code>pele</code> node, with half its source. The
        component keeps one element mounted and hands each new source to
        Pele&rsquo;s <code>update()</code>, so a flowchart grows a node at a
        time. When a frame cuts a line in half and Pele can&rsquo;t draw it, the
        last diagram that worked stays on screen.
      </p>
    </div>
    <StreamingDemo v-if="data" :source="data.source" />
  </div>
</template>
