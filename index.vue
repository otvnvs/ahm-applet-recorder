<template>
  <div class="c">
    <main class="k">
      <RecorderHeader 
        :status-message="statusMessage" 
        :is-recording="isRecording" 
      />

      <RecorderVisualizer 
        :formatted-time="formattedTime" 
        :is-recording="isRecording" 
        :analyser="audioAnalyser"
      />

      <div class="o">
        <button 
          v-if="!isRecording" 
          @click="startRecording" 
          class="n n-r" 
          aria-label="Record"
        >
          <svg class="i" viewBox="0 0 24 24">
            <path d="M12 14c1.7 0 3-1.3 3-3V5c0-1.7-1.3-3-3-3S9 3.3 9 5v6c0 1.7 1.3 3 3 3zm5.3-3c0 3-2.5 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.4 2.7 6.2 6 6.7V21h2v-3.3c3.3-.5 6-3.3 6-6.7h-1.7z"/>
          </svg>
        </button>
        <button 
          v-else 
          @click="stopRecording" 
          class="n n-s" 
          aria-label="Stop"
        >
          <svg class="i" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        </button>
      </div>

      <TrackList 
        :tracks="trackList" 
        @play="togglePlayback" 
        @delete="deleteTrack" 
        @rename="renameTrack"
      />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import RecorderHeader from './components/RecorderHeader.vue'
import RecorderVisualizer from './components/RecorderVisualizer.vue'
import TrackList from './components/TrackList.vue'
import { 
  initAudioDb, 
  saveAudioTrack, 
  getAudioTrack, 
  deleteAudioTrack 
} from './util/audioDb'

const isRecording = ref(false)
const statusMessage = ref('Ready to record')
const elapsedSeconds = ref(0)
const trackList = ref([])
const audioAnalyser = ref(null)

let mediaRecorder = null
let audioChunks = []
let timerInterval = null
let audioContext = null
let mediaStreamSource = null
let streamReference = null

const formattedTime = computed(() => {
  const minutes = Math.floor(elapsedSeconds.value / 60)
  const seconds = elapsedSeconds.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const loadTracksFromStorage = () => {
  const localTracks = JSON.parse(localStorage.getItem('m') || '[]')
  trackList.value = localTracks.map(track => ({
    ...track,
    p: false,
    el: null,
    u: ''
  }))
}

const syncTracksToStorage = () => {
  const rawList = trackList.value.map(track => ({
    id: track.id,
    n: track.n,
    d: track.d
  }))
  localStorage.setItem('m', JSON.stringify(rawList))
}

async function startRecording() {
  audioChunks = []
  try {
    streamReference = await navigator.mediaDevices.getUserMedia({ audio: true })
    
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    audioAnalyser.value = audioContext.createAnalyser()
    audioAnalyser.value.fftSize = 256
    
    mediaStreamSource = audioContext.createMediaStreamSource(streamReference)
    mediaStreamSource.connect(audioAnalyser.value)
    
    mediaRecorder = new MediaRecorder(streamReference)
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data)
    }
    
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
      const duration = formattedTime.value
      const trackId = Date.now()
      const arrayBuffer = await audioBlob.arrayBuffer()
      
      await saveAudioTrack(trackId, arrayBuffer)
      
      trackList.value.push({
        id: trackId,
        n: `Track ${trackList.value.length + 1}`,
        d: duration,
        p: false,
        el: null,
        u: ''
      })
      
      syncTracksToStorage()
      cleanupRecordingStreams()
    }
    
    mediaRecorder.start()
    isRecording.value = true
    statusMessage.value = 'Recording active...'
    elapsedSeconds.value = 0
    timerInterval = setInterval(() => elapsedSeconds.value++, 1000)
    
  } catch (err) {
    statusMessage.value = 'Microphone access denied'
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
    isRecording.value = false
    statusMessage.value = 'Recording saved'
  }
}

function cleanupRecordingStreams() {
  if (streamReference) {
    streamReference.getTracks().forEach(track => track.stop())
  }
  if (audioContext) {
    audioContext.close()
    audioContext = null
  }
  audioAnalyser.value = null
  clearInterval(timerInterval)
}

function renameTrack({ id, name }) {
  const track = trackList.value.find(t => t.id === id)
  if (track) {
    track.n = name
    syncTracksToStorage()
  }
}

async function togglePlayback(track) {
  trackList.value.forEach(item => {
    if (item.id !== track.id && item.p) {
      item.el.pause()
      item.p = false
    }
  })

  if (track.p) {
    track.el.pause()
    track.p = false
    statusMessage.value = 'Playback paused'
  } else if (track.el) {
    track.el.play()
    track.p = true
    statusMessage.value = `Playing ${track.n}`
  } else {
    try {
      const arrayBuffer = await getAudioTrack(track.id)
      if (!arrayBuffer) return
      
      const audioBlob = new Blob([arrayBuffer], { type: 'audio/webm' })
      track.u = URL.createObjectURL(audioBlob)
      track.el = new Audio(track.u)
      
      track.el.play()
      track.p = true
      statusMessage.value = `Playing ${track.n}`
      
      track.el.onended = () => {
        track.p = false
        statusMessage.value = 'Playback finished'
      }
    } catch (err) {
      statusMessage.value = 'Error playing track'
    }
  }
}

async function deleteTrack(id) {
  const index = trackList.value.findIndex(t => t.id === id)
  if (index === -1) return
  
  const track = trackList.value[index]
  if (track.el) {
    track.el.pause()
    if (track.u) URL.revokeObjectURL(track.u)
  }
  
  try {
    await deleteAudioTrack(id)
    trackList.value.splice(index, 1)
    syncTracksToStorage()
    statusMessage.value = 'Track deleted'
  } catch (err) {
    statusMessage.value = 'Error deleting track'
  }
}

onMounted(async () => {
  try {
    await initAudioDb()
    loadTracksFromStorage()
  } catch (err) {
    statusMessage.value = 'Database initialization failed'
  }
})

onBeforeUnmount(() => {
  cleanupRecordingStreams()
  trackList.value.forEach(track => {
    if (track.u) URL.revokeObjectURL(track.u)
  })
})
</script>

<style scoped>
.c {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #0f1115;
  color: #e2e8f0;
  font-family: system-ui;
  padding: 16px;
}
.k {
  width: 100%;
  max-width: 420px;
  background: #1a1d24;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, .4);
}
.o {
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
}
.n {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.n:active {
  transform: scale(.92);
}
.n-r {
  background: #3b82f6;
}
.n-s {
  background: #ef4444;
}
.i {
  width: 32px;
  height: 32px;
  fill: #fff;
}
</style>

