export const SOUND_ENABLED_KEY = "vibey_sound_enabled";
let soundEnabled = true;
try {
  const saved = localStorage.getItem(SOUND_ENABLED_KEY);
  if (saved !== null) soundEnabled = saved === "true";
} catch {}

// Tone.js setup
let synth = null;
const notes = ["C4", "D4", "E4", "G4", "A4", "B4", "C5"];
if (typeof Tone !== "undefined") {
  synth = new Tone.Synth().toDestination();
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
  if (!synth || !soundEnabled) return;
  const note = notes[Math.floor(Math.random() * notes.length)];
  synth.triggerAttackRelease(note, "8n");
}

export function playJingle() {
  if (!synth || !soundEnabled) return;
  synth.triggerAttackRelease("C5", "8n");
  setTimeout(() => synth.triggerAttackRelease("E5", "8n"), 150);
  setTimeout(() => synth.triggerAttackRelease("G5", "8n"), 300);
}
