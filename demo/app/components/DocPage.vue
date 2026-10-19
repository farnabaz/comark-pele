<script setup lang="ts">
import { MarkdownDocument } from '@comark/vue'
import type { MarkdownDocument as Doc } from 'comark'
import { components } from '~/comark'

/** A page made of one `.md` file in `content/`, with a source tab. */
const props = defineProps<{ slug: string }>()

// Parsed by the server route. `MarkdownDocument` renders the parsed tree, so
// the Comark parser stays out of the browser bundle on these pages.
// The tree is plain JSON, so it arrives as the type it left the server with.
const { data } = await useFetch<{ source: string, document: Doc }>(`/api/docs/${props.slug}`)

useHead({ title: () => (data.value?.document.frontmatter?.title as string | undefined) })
</script>

<template>
  <DocView v-if="data" :lines="data.source.split('\n').length">
    <template #rendered>
      <MarkdownDocument class="prose" :components="components" :value="data.document" />
    </template>
    <template #source>
      <MarkdownSource :source="data.source" />
    </template>
  </DocView>
</template>
