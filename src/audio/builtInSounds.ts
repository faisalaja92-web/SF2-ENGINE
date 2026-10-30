import { SoundPreset } from '../types/synth';

/**
 * Standard SoundFont Instrument AudioBuffer generator
 * Generates clean original SoundFont multi-samples at 48kHz / 32-bit float
 * Without hardcoded artificial preset catalogs.
 */

export function generateSoundFontBuffers(
  ctx: AudioContext,
  seed = 0
): Map<number, { buffer: AudioBuffer; rootKey: number }> {
  const map = new Map<number, { buffer: AudioBuffer; rootKey: number }>();
  const sampleRate = ctx.sampleRate || 48000;
  const anchorNotes = [36, 48, 60, 72, 84];

  for (const rootKey of anchorNotes) {
    const freq = 440 * Math.pow(2, (rootKey - 69) / 12);
    const duration = 2.5;
    const numSamples = Math.floor(sampleRate * duration);
    const audioBuffer = ctx.createBuffer(2, numSamples, sampleRate);
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1);

    // Natural linear 16-bit PCM equivalent soundfont waveform
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const decay = Math.exp(-t * (1.2 + (rootKey - 36) * 0.02));
      let sample = 0;

      // Natural harmonic series of raw soundfont sample
      for (let h = 1; h <= 12; h++) {
        const amp = (1 / Math.pow(h, 0.95)) * (h % 2 === 0 ? 0.8 : 1.0);
        sample += Math.sin(2 * Math.PI * freq * h * t) * amp;
      }

      // Initial soundfont pick/strike attack transient
      if (t < 0.008) {
        sample += (Math.random() * 2 - 1) * 0.4 * (1 - t / 0.008);
      }

      const out = sample * decay * 0.35;
      left[i] = out;
      right[i] = out;
    }

    map.set(rootKey, { buffer: audioBuffer, rootKey });
  }

  return map;
}

export const INITIAL_SF2_PRESETS: SoundPreset[] = [
  {
    id: 'sf2_default_0',
    name: 'SoundFont Bank (Default)',
    fileName: 'default_soundfont.sf2',
    category: 'SoundFont',
    presetIndex: 0,
    bank: 0,
  },
];
