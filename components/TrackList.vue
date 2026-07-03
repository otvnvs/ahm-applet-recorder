<template>
  <section v-if="tracks.length" class="g">
    <h2>Saved Tracks</h2>
    <ul class="u">
      <li v-for="track in tracks" :key="track.id" class="x">
        <div class="j">
          <input 
            v-if="editingId === track.id" 
            ref="inputRef" 
            v-model="editingName" 
            @blur="finishRename(track)" 
            @keyup.enter="finishRename(track)" 
            class="rn-i"
          />
          <span v-else @click="startRename(track)" class="y">
            {{ track.n }}
          </span>
          <span class="z">{{ track.d }}</span>
        </div>
        
        <div class="q">
          <button @click="$emit('play', track)" class="a-b" :aria-label="track.p ? 'Pause' : 'Play'">
            <svg v-if="!track.p" class="i-s" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <svg v-else class="i-s" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          </button>
          <button @click="$emit('delete', track.id)" class="a-b d-b" aria-label="Delete">
            <svg class="i-s" viewBox="0 0 24 24">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { ref, nextTick } from 'vue'

defineProps({
  tracks: { type: Array, required: true }
})

const emit = defineEmits(['play', 'delete', 'rename'])

const editingId = ref(null)
const editingName = ref('')
const inputRef = ref(null)

const startRename = (track) => {
  editingId.value = track.id
  editingName.value = track.n
  nextTick(() => {
    if (inputRef.value && inputRef.value[0]) {
      inputRef.value[0].focus()
    }
  })
}

const finishRename = (track) => {
  if (editingId.value === null) return
  const trimmedName = editingName.value.trim()
  if (trimmedName) {
    emit('rename', { id: track.id, name: trimmedName })
  }
  editingId.value = null
}
</script>

<style scoped>
.g {
  border-top: 1px solid #2d3139;
  padding-top: 20px;
}
.g h2 {
  font-size: 1rem;
  color: #94a3b8;
  margin-bottom: 12px;
}
.u {
  list-style: none;
  max-height: 200px;
  overflow-y: auto;
}
.x {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #22262f;
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 8px;
}
.j {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
  margin-right: 12px;
}
.y {
  font-size: .935rem;
  font-weight: 500;
  color: #f1f5f9;
  cursor: pointer;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space:nowrap;
}
.rn-i {
  background: #1a1d24;
  border: 1px solid #3b82f6;
  border-radius: 4px;
  color: #f1f5f9;
  font-size: .935rem;
  font-weight: 500;
  padding: 2px 6px;
  outline: none;
  width: 100%;
  font-family: inherit;
}
.z {
  font-size: .75rem;
  color: #64748b;
}
.q {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.a-b {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #2d3139;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.d-b:hover {
  background: #7f1d1d;
}
.i-s {
  width: 18px;
  height: 18px;
  fill: #94a3b8;
}
.a-b:hover .i-s {
  fill: #f8fafc;
}
.d-b:hover .i-s {
  fill: #f87171;
}
</style>

