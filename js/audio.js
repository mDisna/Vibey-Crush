export const SOUND_ENABLED_KEY = "vibey_sound_enabled";
let soundEnabled = true;
try {
  const saved = localStorage.getItem(SOUND_ENABLED_KEY);
  if (saved !== null) soundEnabled = saved === "true";
} catch {}

// Tone.js setup
let synth = null;
let audioReady = false;
const notes = ["C4", "D4", "E4", "G4", "A4", "B4", "C5"];

export function initAudio() {
  if (typeof Tone === "undefined") return;
  synth = new Tone.Synth().toDestination();
  audioReady = true;
}

export function isSoundEnabled() {
  return soundEnabled;
}

export function toggleSoundEnabled() {
  soundEnabled = !soundEnabled;
  try {
    localStorage.setItem(SOUND_ENABLED_KEY, soundEnabled);
  } catch {}
  return soundEnabled;
}

export function playRandomTone() {
  if (!audioReady || !soundEnabled) return;
  const note = notes[Math.floor(Math.random() * notes.length)];
  const now = Tone.now();
  synth.triggerAttackRelease(note, "8n", now);
}

export function playJingle() {
  if (!audioReady || !soundEnabled) return;
  const now = Tone.now();
  synth.triggerAttackRelease("C5", "8n", now);
  synth.triggerAttackRelease("E5", "8n", now + 0.15);
  synth.triggerAttackRelease("G5", "8n", now + 0.3);
}
