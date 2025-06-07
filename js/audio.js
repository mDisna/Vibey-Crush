export const SOUND_ENABLED_KEY = "vibey_sound_enabled";
let soundEnabled = true;
try {
  const saved = localStorage.getItem(SOUND_ENABLED_KEY);
  if (saved !== null) soundEnabled = saved === "true";
} catch {}

// Tone.js setup
let noteSynth = null;
let jingleSynth = null;
let audioReady = false;
const notes = ["C4", "D4", "E4", "G4", "A4", "B4", "C5"];
let lastScheduled = 0;

export function initAudio() {
  if (typeof Tone === "undefined") return;
  noteSynth = new Tone.Synth().toDestination();
  jingleSynth = new Tone.Synth().toDestination();
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
  noteSynth.triggerAttackRelease(note, "8n");
}

export function playJingle() {
  if (!audioReady || !soundEnabled) return;
  const now = Tone.now();
  const start = Math.max(now, lastScheduled + 0.01);
  jingleSynth.triggerAttackRelease("C5", "8n", start);
  jingleSynth.triggerAttackRelease("E5", "8n", start + 0.15);
  jingleSynth.triggerAttackRelease("G5", "8n", start + 0.3);
  lastScheduled = start + 0.3;
}
