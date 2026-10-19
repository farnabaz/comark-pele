<script setup lang="ts">
useHead({
  titleTemplate: title => (title && title !== 'Comark × Pele' ? `${title} · Comark × Pele` : 'Comark × Pele'),
})
</script>

<template>
  <SiteHeader />
  <main class="site-main">
    <NuxtPage />
  </main>
</template>
