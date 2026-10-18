<script lang="ts">
  import { Markdown } from '@comark/svelte'
  import pele, { Pele } from 'comark-pele/svelte'

  let { value }: { value: string } = $props()

  const plugins = [pele()]
  const components = { Pele }
</script>

<Markdown {value} {plugins} {components} />
