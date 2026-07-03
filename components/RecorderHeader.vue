<template>
  <header class="h">
    <h1>Voice Recorder</h1>
    <p :class="['s', { a: isRecording }]">
      {{ statusMessage }}
    </p>
  </header>
</template>

<script setup>
defineProps({
  statusMessage: { type: String, required: true },
  isRecording: { type: Boolean, required: true }
})
</script>

<style scoped>
.h {
  text-align: center;
  margin-bottom: 24px;
}
.h h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #f8fafc;
  margin-bottom: 4px;
}
.s {
  font-size: .875rem;
  color: #94a3b8;
  transition: color .3s;
}
.a {
  color: #ef4444;
}
</style>

