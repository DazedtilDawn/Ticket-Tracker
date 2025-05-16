// Audio playback utilities for reliable audio across browsers

/** Source paths for different sound effects with fallbacks */
export const SOURCES = {
  wheel: ['/sounds/wheelspin.mp3', '/sounds/wheel.mp3', '/sounds/tick.mp3'],
  cheer: ['/sounds/celebration.mp3', '/sounds/tick.mp3'],
};

/** Choose the first codec this browser can play */
export function pickAudio(srcs: string[]): string | null {
  try {
    const test = document.createElement('audio');
    return srcs.find((s) => test.canPlayType(typeFromExt(s))) ?? null;
  } catch (e) {
    console.error('Error testing audio support:', e);
    return null;
  }
}

/** Convert file extension to MIME type */
function typeFromExt(url: string): string {
  return url.endsWith('.ogg') ? 'audio/ogg' :
         url.endsWith('.mp3') ? 'audio/mpeg' :
         url.endsWith('.wav') ? 'audio/wav' : '';
}

/** 
 * Play audio once with graceful degradation 
 * Falls back to a beep tone if the audio file can't be played
 */
export function playOnce(src: string | null, options?: {
  volume?: number;
  fallbackToneHz?: number;
}): Promise<void> {
  const { volume = 0.5, fallbackToneHz = 600 } = options || {};
  
  return new Promise((resolve) => {
    if (!src) {
      // No supported codec – use tone fallback
      beep(fallbackToneHz);
      resolve();
      return;
    }
    
    const audio = new Audio(src);
    audio.volume = volume;
    
    audio.onended = () => resolve();
    
    audio.play().catch((error) => {
      console.log(`Couldn't play ${src}:`, error);
      beep(fallbackToneHz);
      resolve();
    });
  });
}

/**
 * Create a looping audio player that can be controlled
 * Returns functions to start, stop, and clean up
 */
export function createLoopingAudio(src: string | null, options?: { 
  volume?: number; 
  fallbackTickInterval?: number;
  fallbackToneHz?: number;
}) {
  const { 
    volume = 0.3, 
    fallbackTickInterval = 90,
    fallbackToneHz = 600
  } = options || {};
  
  let audio: HTMLAudioElement | null = null;
  let tickTimer: NodeJS.Timeout | null = null;
  
  const start = () => {
    if (!src) {
      // No audio source - use ticking fallback
      tickTimer = setInterval(() => beep(fallbackToneHz), fallbackTickInterval);
      return;
    }
    
    try {
      audio = new Audio(src);
      audio.volume = volume;
      audio.loop = true;
      
      audio.play().catch(error => {
        console.log(`Couldn't play looping audio ${src}:`, error);
        // Fall back to interval ticking
        tickTimer = setInterval(() => beep(fallbackToneHz), fallbackTickInterval);
      });
    } catch (e) {
      console.error('Error creating audio:', e);
      tickTimer = setInterval(() => beep(fallbackToneHz), fallbackTickInterval);
    }
  };
  
  const stop = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    
    if (tickTimer) {
      clearInterval(tickTimer);
      tickTimer = null;
    }
  };
  
  const cleanup = () => {
    stop();
    if (audio) {
      audio.src = '';
      audio = null;
    }
  };
  
  return { start, stop, cleanup };
}

/** Minimal Web Audio beep used as last-ditch fallback */
export function beep(hz = 600, duration = 80) {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    gain.gain.value = 0.1;  // quiet beep
    osc.frequency.value = hz;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    
    setTimeout(() => { 
      osc.stop(); 
      ctx.close().catch(e => console.log('Error closing audio context:', e)); 
    }, duration);
  } catch (e) { 
    console.log('Beep fallback failed:', e);
    /* Ignore - no audio device or permission */ 
  }
}