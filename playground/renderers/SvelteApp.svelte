<script lang="ts">
  import type { Component } from 'svelte'
  import { Markdown } from '@comark/svelte'
  import pele from 'comark-pele/svelte'

  let { value, Pele }: { value: string, Pele: Component<any> } = $props()

  const plugins = [pele()]
  const components = $derived({ Pele })
</script>

<Markdown {value} {plugins} {components} />
