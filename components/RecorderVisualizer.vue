<template>
  <div class="v-container">
    <div :class="['timer-display', { pulse: isRecording }]">
      {{ formattedTime }}
    </div>
    
    <div class="canvas-wrapper">
      <canvas ref="canvasRef" width="200" height="48" class="wave-canvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  formattedTime: { type: String, required: true },
  isRecording: { type: Boolean, required: true },
  analyser: { type: Object, default: null }
})

const canvasRef = ref(null)
let animationFrameId = null

const clearCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#2d3139'
  ctx.fillRect(0, canvas.height / 2 - 1, canvas.width, 2)
}

const drawWaveform = () => {
  if (!props.isRecording || !props.analyser) return
  
  animationFrameId = requestAnimationFrame(drawWaveform)
  
  const canvas = canvasRef.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height
  const bufferLength = props.analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)
  
  props.analyser.getByteTimeDomainData(dataArray)
  
  ctx.fillStyle = '#1a1d24'
  ctx.fillRect(0, 0, width, height)
  ctx.lineWidth = 2
  ctx.strokeStyle = '#ef4444'
  ctx.beginPath()
  
  const sliceWidth = width / bufferLength
  let x = 0
  
  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0
    const y = (v * height) / 2
    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
    x += sliceWidth
  }
  
  ctx.lineTo(width, height / 2)
  ctx.stroke()
}

watch(() => props.isRecording, (recording) => {
  if (recording) {
    drawWaveform()
  } else {
    cancelAnimationFrame(animationFrameId)
    clearCanvas()
  }
})

onMounted(() => {
  clearCanvas()
})
</script>

<style scoped>
.v-container {
  width: 100%;
}
.timer-display {
  text-align: center;
  font-size: 3.5rem;
  font-weight: 300;
  color: #f8fafc;
  margin-bottom: 16px;
  font-variant-numeric: tabular-nums;
}
.pulse {
  animation: pl 2s infinite ease-in-out;
}
@keyframes pl {
  0%, 100% { opacity: 1 }
  50% { opacity: .7 }
}
.canvas-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 48px;
  margin-bottom: 32px;
}
.wave-canvas {
  width: 200px;
  height: 48px;
  display: block;
  background: #1a1d24;
}
</style>

