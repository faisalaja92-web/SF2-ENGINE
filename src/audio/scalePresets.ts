import { ArabicScaleTuning, NoteName } from '../types/synth';

export const NOTE_NAMES: NoteName[] = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];

export const NOTE_IS_BLACK: boolean[] = [
  false, true, false, true, false, false, true, false, true, false, true, false
];

export interface MaqamPreset {
  id: string;
  name: string;
  description: string;
  offsets: Record<number, number>; // pitchClass -> cents
}

export const MAQAM_PRESETS: MaqamPreset[] = [
  {
    id: 'equal',
    name: 'Standard (Equal 12TET)',
    description: 'Natural Western tuning (all notes 0 cent)',
    offsets: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0 }
  },
  {
    id: 'bayati',
    name: 'Maqam Bayati (D)',
    description: 'E half-flat (-50) and B half-flat (-50) quarter tones',
    offsets: { 0: 0, 1: 0, 2: 0, 3: 0, 4: -50, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: -50 }
  },
  {
    id: 'rast',
    name: 'Maqam Rast (C)',
    description: 'Classic Arabic Rast: E -50 cents, B -50 cents',
    offsets: { 0: 0, 1: 0, 2: 0, 3: 0, 4: -50, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: -50 }
  },
  {
    id: 'hijaz',
    name: 'Maqam Hijaz (D)',
    description: 'Characteristic oriental augmented second (D, Eb, F#, G, A, Bb, C)',
    offsets: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0 }
  },
  {
    id: 'saba',
    name: 'Maqam Saba (D)',
    description: 'Soulful mournful maqam: E -50 cents, Gb/F# -30 cents, Bb natural',
    offsets: { 0: 0, 1: 0, 2: 0, 3: 0, 4: -50, 5: 0, 6: -30, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0 }
  },
  {
    id: 'sikah',
    name: 'Maqam Sikah (E half-flat)',
    description: 'Rooted on E half-flat (-50) with B half-flat (-50)',
    offsets: { 0: 0, 1: 0, 2: 0, 3: 0, 4: -50, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: -50 }
  },
  {
    id: 'kurd',
    name: 'Maqam Kurd (D)',
    description: 'Natural Phrygian minor mode (D, Eb, F, G, A, Bb, C)',
    offsets: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0 }
  },
  {
    id: 'nahawand',
    name: 'Maqam Nahawand (C)',
    description: 'Harmonic / melodic minor with Middle Eastern color',
    offsets: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0 }
  },
  {
    id: 'suznak',
    name: 'Maqam Suznak (C)',
    description: 'Rast lower tetrachord (E -50) with Hijaz upper trichord',
    offsets: { 0: 0, 1: 0, 2: 0, 3: 0, 4: -50, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0 }
  },
  {
    id: 'huzam',
    name: 'Maqam Huzam (E half-flat)',
    description: 'Sikah with Hijaz upper structure (E -50, G# -10, B -50)',
    offsets: { 0: 0, 1: 0, 2: 0, 3: 0, 4: -50, 5: 0, 6: 0, 7: 0, 8: -10, 9: 0, 10: 0, 11: -50 }
  }
];

export const DEFAULT_SCALE_TUNING: ArabicScaleTuning = {
  name: 'Standard (Equal 12TET)',
  enabled: true,
  offsets: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0 }
};
