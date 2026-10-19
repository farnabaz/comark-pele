<script setup lang="ts">
/**
 * No state: the label comes from the `dark` class this sets, so the button is
 * right on first paint. Pele colors are CSS variables, so the diagrams follow
 * the class without being drawn again.
 */
function toggle() {
  const next = !document.documentElement.classList.contains('dark')
  document.documentElement.classList.toggle('dark', next)
  try {
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }
  catch {
    // Private mode or blocked storage: the toggle still works for this visit.
  }
}
</script>

<template>
  <button aria-label="Toggle dark mode" class="nav-link" type="button" @click="toggle">
    <span class="only-light">dark</span>
    <span class="only-dark">light</span>
  </button>
</template>
