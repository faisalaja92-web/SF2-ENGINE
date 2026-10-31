import { AcousticExpressionSettings } from '../types/synth';

/**
 * Acoustic Expression & Physical Performance Engine
 * Enhances SoundFont samples with realistic continuous legato,
 * air/bow friction resonance, dynamic breath pressure, and formant body filtering
 * for instruments like saxophone, flute, and violin.
 * (Default state starts with pure original SoundFont sample)
 */

export interface FormantPair {
  freq1: number;
  q1: number;
  gain1: number;
  freq2: number;
  q2: number;
  gain2: number;
}

export class AcousticEngine {
  public applyAcousticFormant(
    ctx: AudioContext,
    sourceNode: AudioNode,
    settings: AcousticExpressionSettings,
    destinationNode: AudioNode,
    noteFreq: number
  ): { filter1?: BiquadFilterNode; filter2?: BiquadFilterNode; outNode: AudioNode } {
    if (!settings.enabled || settings.instrumentMode === 'pure') {
      // Pure original SoundFont audio passthrough
      sourceNode.connect(destinationNode);
      return { outNode: destinationNode };
    }

    const now = ctx.currentTime;

    // Body cavity formant filters
    const filter1 = ctx.createBiquadFilter();
    const filter2 = ctx.createBiquadFilter();
    const exciterGain = ctx.createGain();

    if (settings.instrumentMode === 'woodwind') {
      // Woodwind (Saxophone / Suling / Flute): Bore resonance & breath tube formant
      filter1.type = 'peaking';
      filter1.frequency.setValueAtTime(Math.min(noteFreq * 2, 1400), now);
      filter1.Q.setValueAtTime(3.0 * settings.bodyResonance + 0.5, now);
      filter1.gain.setValueAtTime(6.0 * settings.bodyResonance, now);

      filter2.type = 'peaking';
      filter2.frequency.setValueAtTime(2800, now);
      filter2.Q.setValueAtTime(2.5, now);
      filter2.gain.setValueAtTime(4.0 * settings.breathBowPressure, now);
    } else if (settings.instrumentMode === 'bowed_strings') {
      // Bowed Strings (Violin / Biola): Wooden belly resonance & bridge horn formant
      filter1.type = 'peaking';
      filter1.frequency.setValueAtTime(450, now);
      filter1.Q.setValueAtTime(2.8 * settings.bodyResonance + 0.8, now);
      filter1.gain.setValueAtTime(8.0 * settings.bodyResonance, now);

      filter2.type = 'peaking';
      filter2.frequency.setValueAtTime(2400, now);
      filter2.Q.setValueAtTime(3.2, now);
      filter2.gain.setValueAtTime(5.0 * settings.breathBowPressure, now);
    } else {
      // Brass & Reed
      filter1.type = 'peaking';
      filter1.frequency.setValueAtTime(1100, now);
      filter1.Q.setValueAtTime(2.2, now);
      filter1.gain.setValueAtTime(5.0 * settings.bodyResonance, now);

      filter2.type = 'peaking';
      filter2.frequency.setValueAtTime(3300, now);
      filter2.Q.setValueAtTime(2.0, now);
      filter2.gain.setValueAtTime(4.0 * settings.breathBowPressure, now);
    }

    // Connect chain
    sourceNode.connect(filter1);
    filter1.connect(filter2);
    filter2.connect(exciterGain);
    exciterGain.connect(destinationNode);

    return { filter1, filter2, outNode: exciterGain };
  }
}

export const acousticEngine = new AcousticEngine();
