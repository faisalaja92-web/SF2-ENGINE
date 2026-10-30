export type WaveformType = 'sawtooth' | 'square' | 'triangle' | 'sine' | 'supersaw';

export interface AdsrEnvelope {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface OscillatorConfig {
  enabled: boolean;
  waveform: WaveformType;
  filterType: 'lowpass' | 'highpass' | 'bandpass';
  filterCutoff: number;
  filterResonance: number;
  envelope: AdsrEnvelope;
  lfoRate: number;
  lfoDepth: number;
  lfoTarget: 'pitch' | 'filter' | 'volume';
}

export interface SoundPreset {
  id: string;
  name: string;
  fileName?: string;
  category?: string;
  presetIndex?: number;
  bank?: number;
  sampleBuffers?: Map<number, AudioBuffer>;
  rootNotes?: Map<number, number>;
}

export interface LayerEqSettings {
  band80: number;   // -12 to +12 dB (LOW)
  band400: number;  // -12 to +12 dB (LMID)
  band1k: number;   // -12 to +12 dB (HMID)
  band10k: number;  // -12 to +12 dB (HIGH)
  eqPower: boolean;
}

export interface LayerEfxSettings {
  reverbSend: number; // 0.0 - 1.0
  delaySend: number;  // 0.0 - 1.0
}

export interface SoundLayer {
  id: number; // 1, 2, 3, 4
  name: string;
  enabled: boolean;
  presetId: string;
  presetName: string;
  volume: number; // 0.0 - 1.0
  pan: number;    // -1.0 to 1.0
  transpose: number; // -24 to +24 semitones
  fineTune: number;  // -100 to +100 cents
  lowKey: number;    // 0 - 127
  highKey: number;   // 0 - 127
  mute: boolean;
  solo: boolean;
  oscillatorMode: boolean;
  oscillator: OscillatorConfig;
  eq?: LayerEqSettings;
  efxSend?: LayerEfxSettings;
}

export interface AcousticExpressionSettings {
  enabled: boolean;
  instrumentMode: 'pure' | 'woodwind' | 'bowed_strings' | 'brass_reed';
  breathBowPressure: number; // 0.0 - 1.0
  bodyResonance: number;     // 0.0 - 1.0
  humanVibrato: number;      // 0.0 - 1.0
  continuousLegato: boolean;
}

export interface EfxSettings {
  portamento: boolean;
  glideTime: number; // seconds
  legato: boolean;
  // Advanced Legato customization
  legatoSpeed: number;   // 0.01 - 0.25 seconds (transition speed)
  legatoAttack: number;  // 0.001 - 0.1 seconds (smoothness of new note onset)
  legatoRelease: number; // 0.05 - 0.5 seconds (release blend time)
  legatoCurve: 'linear' | 'exponential';
  mono: boolean;
  acousticEngine: AcousticExpressionSettings;
  reverbEnabled: boolean;
  reverbWet: number;
  reverbDecay: number;
  delayEnabled: boolean;
  delayTime: number;
  delayFeedback: number;
  delayWet: number;
}

export interface EqualizerSettings {
  band80: number;
  band400: number;
  band1k: number;
  band3k: number;
  band10k: number;
  masterVolume: number;
  masterLimiter: boolean;
}

export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export interface ArabicScaleTuning {
  name: string;
  enabled: boolean;
  offsets: Record<number, number>;
}

export interface KeyboardSplitSettings {
  enabled: boolean;
  splitPoint: number; // MIDI note (e.g. 48 = C3)
  lowerLayers: number[]; // layers for left hand (e.g. [1])
  upperLayers: number[]; // layers for right hand (e.g. [2, 3, 4])
  lowerOctave: number; // -2 to +2
  upperOctave: number; // -2 to +2
}

export interface SoundBank {
  id: number; // 1 to 8
  name: string;
  isEmpty: boolean;
  savedPresetNames?: string[];
  layers: SoundLayer[];
  efx: EfxSettings;
  equalizer: EqualizerSettings;
  scale: ArabicScaleTuning;
  split?: KeyboardSplitSettings;
}

export interface Mp3Track {
  id: string;
  title: string;
  artist?: string;
  duration: number;
  url: string;
  coverUrl?: string;
  isCustom?: boolean;
}

export type ViewMenu = 'LIST' | 'BANK' | 'LOAD' | 'MIXER' | 'EFX' | 'SCALE' | 'MP3';
