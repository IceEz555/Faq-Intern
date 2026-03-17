<template>
  <div class="page-container">
    <main class="content">
      <div class="voice-interface">
        <div class="status-message">
          <p>{{ statusMessage }}</p>
        </div>

        <button 
          class="mic-button" 
          :class="{ 'listening': isListening, 'processing': isProcessing }"
          @click="toggleListening"
          :disabled="isProcessing"
        >
          <span class="mic-icon">{{ isProcessing ? '⏳' : '🎙️' }}</span>
        </button>
        
        <p class="instruction" v-if="!isProcessing && !isListening">Tap to speak</p>
        <p class="instruction" v-if="isListening">Tap to stop</p>

        <div v-if="transcript" class="transcript-box">
          <h3>You said:</h3>
          <p>"{{ transcript }}"</p>
        </div>

        <div v-if="responseText" class="response-box">
          <h3>Answer:</h3>
          <p>{{ responseText }}</p>
          <button v-if="currentAudioBase64" @click="playAudio" class="replay-btn">🔊 Replay Answer</button>
        </div>
        
         <div v-if="errorMessage" class="error-box">
          <p>{{ errorMessage }}</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import { apiFetch } from '@/utils/api.js';

const isListening = ref(false);
const isProcessing = ref(false);
const statusMessage = ref('Ready to listen');
const transcript = ref('');
const responseText = ref('');
const errorMessage = ref('');
const currentAudioBase64 = ref(null);

let mediaRecorder = null;
let audioChunks = [];
let audioStream = null;

const toggleListening = () => {
  if (isListening.value) {
    stopListening();
  } else {
    startListening();
  }
};

const startListening = async () => {
  try {
    errorMessage.value = '';
    transcript.value = '';
    responseText.value = '';
    currentAudioBase64.value = null;
    
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(audioStream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = processAudio;

    mediaRecorder.start();
    isListening.value = true;
    statusMessage.value = 'Listening...';
  } catch (error) {
    console.error('Error accessing microphone:', error);
    errorMessage.value = 'Could not access microphone. Please check permissions.';
    statusMessage.value = 'Error';
  }
};

const stopListening = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    isListening.value = false;
    statusMessage.value = 'Processing...';
    isProcessing.value = true;
    
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      audioStream = null;
    }
  }
};

const processAudio = async () => {
    const mimeType = mediaRecorder.mimeType;
    const audioBlob = new Blob(audioChunks, { type: mimeType });
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.audio');

  try {
    const response = await apiFetch('/llm/voice-chat', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
       const errData = await response.json();
       throw new Error(errData.detail || `Server error: ${response.status}`);
    }

    const data = await response.json();
    
    transcript.value = data.transcript || '(No transcript)';
    responseText.value = data.response;
    
    if (data.audio_base64) {
      currentAudioBase64.value = data.audio_base64;
      playAudio();
    } else {
       statusMessage.value = 'Response received (no audio)';
    }

  } catch (error) {
    console.error('Error processing audio:', error);
    errorMessage.value = error.message || 'Failed to process audio.';
    statusMessage.value = 'Error';
  } finally {
    isProcessing.value = false;
    if (statusMessage.value === 'Processing...') {
       statusMessage.value = 'Ready to listen';
    }
  }
};

const playAudio = () => {
  if (!currentAudioBase64.value) return;
  
  const audio = new Audio(`data:audio/mp3;base64,${currentAudioBase64.value}`);
  audio.play();
  statusMessage.value = 'Playing response...';
  audio.onended = () => {
    statusMessage.value = 'Ready to listen';
  };
};

onUnmounted(() => {
  if (audioStream) {
    audioStream.getTracks().forEach(track => track.stop());
  }
});
</script>

<style scoped>
@import '../assets/css/VoiceFAQ.css';

.processing {
  opacity: 0.7;
  cursor: wait;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.error-box {
  color: #ff4d4d;
  margin-top: 20px;
  background: #ffe6e6;
  padding: 10px;
  border-radius: 8px;
}

.replay-btn {
  margin-top: 10px;
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

.replay-btn:hover {
  background-color: #45a049;
}
</style>
