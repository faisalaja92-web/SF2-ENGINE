import {
  ArabicScaleTuning,
  EfxSettings,
  EqualizerSettings,
  SoundLayer,
  SoundPreset,
} from '../types/synth';
import { generateSoundFontBuffers, INITIAL_SF2_PRESETS } from './builtInSounds';
import { ParsedSoundFont, parseSoundFont2 } from './sf2Parser';
import { acousticEngine } from './acousticEngine';

export interface ActiveVoice {
  id: string;
  layerId: number;
  note: number;
  startTime: number;
  gainNode: GainNode;
  sourceNode?: AudioBufferSourceNode;
  oscNode?: OscillatorNode;
  subOscNode?: OscillatorNode;
  filterNode?: BiquadFilterNode;
  acousticFilter1?: BiquadFilterNode;
  acousticFilter2?: BiquadFilterNode;
  lfoNode?: OscillatorNode;
  lfoGain?: GainNode;
  targetFreq: number;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  public isAudioStarted = false;

  // Master bus
  private masterGain: GainNode | null = null;
  private masterLimiter: DynamicsCompressorNode | null = null;
  private eq80: BiquadFilterNode | null = null;
  private eq400: BiquadFilterNode | null = null;
  private eq1k: BiquadFilterNode | null = null;
  private eq3k: BiquadFilterNode | null = null;
  private eq10k: BiquadFilterNode | null = null;

  // Metering
  private splitter: ChannelSplitterNode | null = null;
  private analyserL: AnalyserNode | null = null;
  private analyserR: AnalyserNode | null = null;
  private dataArrayL: Uint8Array<ArrayBuffer> | null = null;
  private dataArrayR: Uint8Array<ArrayBuffer> | null = null;

  // Effects
  private reverbNode: ConvolverNode | null = null;
  private reverbWetGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedbackGain: GainNode | null = null;
  private delayWetGain: GainNode | null = null;

  // Layer buses (Layer 1..4)
  private layerBuses: Map<number, { gain: GainNode; panner: StereoPannerNode }> = new Map();

  // Active voices tracking
  private activeVoices: Map<string, ActiveVoice> = new Map();
  private heldKeys: Set<number> = new Set();
  private lastNotePlayed: number | null = null;
  private lastFreqPlayed: number | null = null;
  private tercaHarmonyNotes: Map<number, number> = new Map();

  // Controllers
  public pitchBend = 0; // -1.0 to +1.0
  public modWheel = 0;   // 0.0 to 1.0
  public breathControl = 1.0; // 0.0 to 1.0 (CC2)
  public expression = 1.0;    // 0.0 to 1.0 (CC11)
  public filterCutoffOffset = 0; // -1.0 to +1.0 (CC74)
  public aftertouch = 0;      // 0.0 to 1.0
  public sustainPedal = false;
  private sustainedNotes: Set<number> = new Set();

  // Peak Meter Envelope Follower
  private smoothMeterL = 0;
  private smoothMeterR = 0;

  // Cache
  private presetBuffers: Map<string, Map<number, { buffer: AudioBuffer; rootKey: number }>> = new Map();
  public loadedSoundFonts: ParsedSoundFont[] = [];
  public customPresets: SoundPreset[] = [...INITIAL_SF2_PRESETS];

  // MIDI
  public midiAccess: MIDIAccess | null = null;
  public midiDevices: string[] = [];
  public onMidiActivity: (() => void) | null = null;

  // MP3 Player
  private mp3Audio: HTMLAudioElement | null = null;

  public initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx({
        sampleRate: 48000,
        latencyHint: 'interactive',
      });
      this.setupMasterGraph();
      this.initMidi();
      this.preloadDefaultSoundFont();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isAudioStarted = true;
    return this.ctx;
  }

  public getContext(): AudioContext | null {
    return this.ctx;
  }

  private setupMasterGraph() {
    if (!this.ctx) return;
    const ctx = this.ctx;

    // Master Gain
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, ctx.currentTime);

    // Master Limiter
    this.masterLimiter = ctx.createDynamicsCompressor();
    this.masterLimiter.threshold.setValueAtTime(-1.0, ctx.currentTime);
    this.masterLimiter.knee.setValueAtTime(2.0, ctx.currentTime);
    this.masterLimiter.ratio.setValueAtTime(20.0, ctx.currentTime);
    this.masterLimiter.attack.setValueAtTime(0.001, ctx.currentTime);
    this.masterLimiter.release.setValueAtTime(0.05, ctx.currentTime);

    // 5-Band Equalizer
    this.eq80 = ctx.createBiquadFilter();
    this.eq80.type = 'lowshelf';
    this.eq80.frequency.setValueAtTime(80, ctx.currentTime);
    this.eq80.gain.setValueAtTime(0, ctx.currentTime);

    this.eq400 = ctx.createBiquadFilter();
    this.eq400.type = 'peaking';
    this.eq400.frequency.setValueAtTime(400, ctx.currentTime);
    this.eq400.Q.setValueAtTime(1.0, ctx.currentTime);
    this.eq400.gain.setValueAtTime(0, ctx.currentTime);

    this.eq1k = ctx.createBiquadFilter();
    this.eq1k.type = 'peaking';
    this.eq1k.frequency.setValueAtTime(1000, ctx.currentTime);
    this.eq1k.Q.setValueAtTime(1.0, ctx.currentTime);
    this.eq1k.gain.setValueAtTime(0, ctx.currentTime);

    this.eq3k = ctx.createBiquadFilter();
    this.eq3k.type = 'peaking';
    this.eq3k.frequency.setValueAtTime(3000, ctx.currentTime);
    this.eq3k.Q.setValueAtTime(1.0, ctx.currentTime);
    this.eq3k.gain.setValueAtTime(0, ctx.currentTime);

    this.eq10k = ctx.createBiquadFilter();
    this.eq10k.type = 'highshelf';
    this.eq10k.frequency.setValueAtTime(10000, ctx.currentTime);
    this.eq10k.gain.setValueAtTime(0, ctx.currentTime);

    // Chain EQ
    this.eq80.connect(this.eq400);
    this.eq400.connect(this.eq1k);
    this.eq1k.connect(this.eq3k);
    this.eq3k.connect(this.eq10k);
    this.eq10k.connect(this.masterLimiter);
    this.masterLimiter.connect(this.masterGain);

    // Stereo Analysers for VU meters
    this.splitter = ctx.createChannelSplitter(2);
    this.analyserL = ctx.createAnalyser();
    this.analyserL.fftSize = 256;
    this.analyserL.smoothingTimeConstant = 0.8;
    this.analyserR = ctx.createAnalyser();
    this.analyserR.fftSize = 256;
    this.analyserR.smoothingTimeConstant = 0.8;

    this.dataArrayL = new Uint8Array(this.analyserL.frequencyBinCount);
    this.dataArrayR = new Uint8Array(this.analyserR.frequencyBinCount);

    this.masterGain.connect(this.splitter);
    this.splitter.connect(this.analyserL, 0);
    this.splitter.connect(this.analyserR, 1);
    this.masterGain.connect(ctx.destination);

    // Setup Reverb & Delay nodes
    this.reverbWetGain = ctx.createGain();
    this.reverbWetGain.gain.setValueAtTime(0.2, ctx.currentTime);
    this.reverbNode = ctx.createConvolver();
    this.createSyntheticImpulseResponse(1.8, 1.8);
    this.reverbNode.connect(this.reverbWetGain);
    this.reverbWetGain.connect(this.eq80);

    this.delayNode = ctx.createDelay();
    this.delayNode.delayTime.setValueAtTime(0.25, ctx.currentTime);
    this.delayFeedbackGain = ctx.createGain();
    this.delayFeedbackGain.gain.setValueAtTime(0.3, ctx.currentTime);
    this.delayWetGain = ctx.createGain();
    this.delayWetGain.gain.setValueAtTime(0.15, ctx.currentTime);

    this.delayNode.connect(this.delayFeedbackGain);
    this.delayFeedbackGain.connect(this.delayNode);
    this.delayNode.connect(this.delayWetGain);
    this.delayWetGain.connect(this.eq80);

    // Setup 4 Layer Channel Strips
    for (let layerId = 1; layerId <= 4; layerId++) {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(layerId === 1 ? 0.85 : 0, ctx.currentTime);
      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(0, ctx.currentTime);

      gain.connect(panner);
      panner.connect(this.eq80);
      panner.connect(this.reverbNode);
      panner.connect(this.delayNode);

      this.layerBuses.set(layerId, { gain, panner });
    }
  }

  private createSyntheticImpulseResponse(duration: number, decay: number) {
    if (!this.ctx || !this.reverbNode) return;
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const n = (Math.random() * 2 - 1) * Math.pow(1 - t / duration, decay);
      left[i] = n;
      right[i] = (Math.random() * 2 - 1) * Math.pow(1 - t / duration, decay);
    }
    this.reverbNode.buffer = impulse;
  }

  private preloadDefaultSoundFont() {
    if (!this.ctx) return;
    const buffers = generateSoundFontBuffers(this.ctx, 0);
    this.presetBuffers.set('sf2_default_0', buffers);
  }

  public getInstrumentBuffers(presetId: string): Map<number, { buffer: AudioBuffer; rootKey: number }> {
    if (this.presetBuffers.has(presetId)) {
      return this.presetBuffers.get(presetId)!;
    }
    if (this.ctx) {
      const buffers = generateSoundFontBuffers(this.ctx, 0);
      this.presetBuffers.set(presetId, buffers);
      return buffers;
    }
    return new Map();
  }

  // SoundFont 2 File Importer
  public async loadSoundFontFile(file: File): Promise<ParsedSoundFont> {
    const arrayBuffer = await file.arrayBuffer();
    const sf = parseSoundFont2(arrayBuffer);
    this.loadedSoundFonts.push(sf);

    const ctx = this.initContext();

    sf.presets.forEach((p, idx) => {
      const presetId = `sf2_${sf.name}_${p.preset}_${idx}`;
      const buffers = sf.createPresetInstrument(ctx, idx);
      if (buffers.size > 0) {
        this.presetBuffers.set(presetId, buffers);
      }
      this.customPresets.push({
        id: presetId,
        name: p.name,
        fileName: file.name,
        category: sf.name,
        presetIndex: idx,
        bank: p.bank,
      });
    });

    return sf;
  }

  private async initMidi() {
    if (typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator) {
      try {
        const access = await navigator.requestMIDIAccess({ sysex: false });
        this.midiAccess = access;
        this.updateMidiDevices();
        access.onstatechange = () => this.updateMidiDevices();

        access.inputs.forEach((input) => {
          input.onmidimessage = (msg) => this.handleMidiMessage(msg);
        });
      } catch {}
    }
  }

  private updateMidiDevices() {
    if (!this.midiAccess) return;
    const names: string[] = [];
    this.midiAccess.inputs.forEach((input) => {
      if (input.name) names.push(input.name);
      input.onmidimessage = (msg) => this.handleMidiMessage(msg);
    });
    this.midiDevices = names;
  }

  public handleMidiMessage(event: MIDIMessageEvent) {
    if (!event.data) return;
    const [status, data1, data2] = event.data;
    const command = status >> 4;

    if (this.onMidiActivity) {
      this.onMidiActivity();
    }

    if (command === 0x9) {
      const velocity = data2;
      if (velocity > 0) {
        window.dispatchEvent(new CustomEvent('sf2-midi-noteon', { detail: { note: data1, velocity: velocity / 127 } }));
      } else {
        window.dispatchEvent(new CustomEvent('sf2-midi-noteoff', { detail: { note: data1 } }));
      }
    } else if (command === 0x8) {
      window.dispatchEvent(new CustomEvent('sf2-midi-noteoff', { detail: { note: data1 } }));
    } else if (command === 0xe) {
      const bend14 = (data2 << 7) | data1;
      const bendNorm = (bend14 - 8192) / 8192;
      this.pitchBend = bendNorm;
      window.dispatchEvent(new CustomEvent('sf2-midi-pitchbend', { detail: { value: bendNorm } }));
      this.updateActiveVoicesPitch();
    } else if (command === 0xb) {
      const cc = data1;
      const val = data2;
      if (cc === 1) {
        this.modWheel = val / 127;
        window.dispatchEvent(new CustomEvent('sf2-midi-modwheel', { detail: { value: this.modWheel } }));
        this.updateActiveVoicesModulation();
      } else if (cc === 2) {
        // Breath Controller (Low Latency Realtime Response)
        this.breathControl = val / 127;
        window.dispatchEvent(new CustomEvent('sf2-midi-breath', { detail: { value: this.breathControl } }));
        this.updateActiveVoicesDynamics();
      } else if (cc === 11) {
        // Expression Controller
        this.expression = val / 127;
        window.dispatchEvent(new CustomEvent('sf2-midi-expression', { detail: { value: this.expression } }));
        this.updateActiveVoicesDynamics();
      } else if (cc === 7) {
        // Channel Volume
        const vol = val / 127;
        if (this.masterGain && this.ctx) {
          this.masterGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.02);
        }
      } else if (cc === 74) {
        // Brightness / Cutoff
        this.filterCutoffOffset = (val - 64) / 64;
        this.updateActiveVoicesFilter();
      } else if (cc === 64) {
        this.sustainPedal = val >= 64;
        window.dispatchEvent(new CustomEvent('sf2-midi-sustain', { detail: { value: this.sustainPedal } }));
        if (!this.sustainPedal) {
          this.releaseSustainedNotes();
        }
      }
    } else if (command === 0xd) {
      // Channel Pressure / Aftertouch
      this.aftertouch = data1 / 127;
      window.dispatchEvent(new CustomEvent('sf2-midi-aftertouch', { detail: { value: this.aftertouch } }));
    }
  }

  public updateActiveVoicesDynamics() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const dynamics = Math.max(0.01, this.breathControl * this.expression);
    this.activeVoices.forEach((voice) => {
      if (voice.gainNode) {
        voice.gainNode.gain.cancelScheduledValues(now);
        voice.gainNode.gain.setTargetAtTime(dynamics, now, 0.015);
      }
      if (voice.acousticFilter1) {
        voice.acousticFilter1.frequency.setTargetAtTime(Math.max(400, 4800 * dynamics), now, 0.02);
      }
    });
  }

  public updateActiveVoicesFilter() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const multiplier = Math.pow(2, this.filterCutoffOffset * 1.5);
    this.activeVoices.forEach((voice) => {
      if (voice.filterNode) {
        voice.filterNode.frequency.setTargetAtTime(Math.max(200, Math.min(18000, 4000 * multiplier)), now, 0.02);
      }
    });
  }

  public calculateNoteFrequency(
    midiNote: number,
    scaleTuning: ArabicScaleTuning,
    fineTuneCents = 0,
    transposeSemis = 0
  ): number {
    const pitchClass = ((midiNote % 12) + 12) % 12;
    let scaleOffset = 0;
    if (scaleTuning.enabled && scaleTuning.offsets[pitchClass] !== undefined) {
      scaleOffset = scaleTuning.offsets[pitchClass];
    }

    const totalCents = scaleOffset + fineTuneCents + this.pitchBend * 200;
    const effectiveMidi = midiNote + transposeSemis + totalCents / 100;
    return 440 * Math.pow(2, (effectiveMidi - 69) / 12);
  }

  // Smooth Note Triggering across activated layers
  public triggerNoteOn(
    note: number,
    velocity: number,
    layers: SoundLayer[],
    efx: EfxSettings,
    scaleTuning: ArabicScaleTuning,
    isHarmonyVoice = false
  ) {
    const ctx = this.initContext();
    this.heldKeys.add(note);

    if (this.onMidiActivity) {
      this.onMidiActivity();
    }

    if (efx.mono && !isHarmonyVoice) {
      this.stopAllVoices(false);
    }

    const now = ctx.currentTime;
    const baseFreq = this.calculateNoteFrequency(note, scaleTuning);

    const isGliding = (efx.portamento || efx.acousticEngine.continuousLegato) &&
      this.lastFreqPlayed !== null && this.lastNotePlayed !== note;
    const startFreq = isGliding ? this.lastFreqPlayed! : baseFreq;

    for (const layer of layers) {
      if (!layer.enabled || layer.mute) continue; // Only play if activated!
      if (note < layer.lowKey || note > layer.highKey) continue;

      const layerBus = this.layerBuses.get(layer.id);
      if (!layerBus) continue;

      const voiceKey = `${layer.id}_${note}`;
      if (this.activeVoices.has(voiceKey)) {
        const oldVoice = this.activeVoices.get(voiceKey)!;
        oldVoice.gainNode.gain.cancelScheduledValues(now);
        oldVoice.gainNode.gain.setValueAtTime(oldVoice.gainNode.gain.value, now);
        oldVoice.gainNode.gain.linearRampToValueAtTime(0.0001, now + 0.006);
        setTimeout(() => this.cleanupVoice(oldVoice), 12);
      }

      const layerFreq = this.calculateNoteFrequency(
        note,
        scaleTuning,
        layer.fineTune,
        layer.transpose
      );

      const voiceGain = ctx.createGain();
      const targetVolume = layer.volume * velocity * 0.85;

      if (layer.oscillatorMode && layer.oscillator.enabled) {
        const oscConfig = layer.oscillator;
        const osc = ctx.createOscillator();
        osc.type = oscConfig.waveform === 'supersaw' ? 'sawtooth' : oscConfig.waveform;

        let subOsc: OscillatorNode | undefined;
        if (oscConfig.waveform === 'supersaw') {
          subOsc = ctx.createOscillator();
          subOsc.type = 'sawtooth';
          subOsc.detune.setValueAtTime(14, now);
        }

        if (isGliding) {
          const glideDuration = efx.portamento ? efx.glideTime : 0.04;
          osc.frequency.setValueAtTime(startFreq, now);
          osc.frequency.exponentialRampToValueAtTime(layerFreq, now + glideDuration);
          if (subOsc) {
            subOsc.frequency.setValueAtTime(startFreq, now);
            subOsc.frequency.exponentialRampToValueAtTime(layerFreq, now + glideDuration);
          }
        } else {
          osc.frequency.setValueAtTime(layerFreq, now);
          if (subOsc) subOsc.frequency.setValueAtTime(layerFreq, now);
        }

        const filter = ctx.createBiquadFilter();
        filter.type = oscConfig.filterType;
        filter.frequency.setValueAtTime(oscConfig.filterCutoff, now);
        filter.Q.setValueAtTime(oscConfig.filterResonance, now);

        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(oscConfig.lfoRate + (this.modWheel * 8), now);

        if (oscConfig.lfoTarget === 'filter') {
          lfoGain.gain.setValueAtTime(oscConfig.lfoDepth * 800 + (this.modWheel * 1200), now);
          lfo.connect(lfoGain);
          lfoGain.connect(filter.frequency);
        } else if (oscConfig.lfoTarget === 'pitch') {
          lfoGain.gain.setValueAtTime(oscConfig.lfoDepth * 35 + (this.modWheel * 60), now);
          lfo.connect(lfoGain);
          lfoGain.connect(osc.detune);
        } else {
          lfoGain.gain.setValueAtTime(oscConfig.lfoDepth * 0.3 + (this.modWheel * 0.4), now);
          lfo.connect(lfoGain);
          lfoGain.connect(voiceGain.gain);
        }
        lfo.start(now);

        const env = oscConfig.envelope;
        voiceGain.gain.setValueAtTime(0.0001, now);
        voiceGain.gain.linearRampToValueAtTime(targetVolume, now + Math.max(0.003, env.attack));
        voiceGain.gain.exponentialRampToValueAtTime(
          Math.max(0.0001, targetVolume * env.sustain),
          now + env.attack + env.decay
        );

        osc.connect(filter);
        if (subOsc) {
          subOsc.connect(filter);
          subOsc.start(now);
        }

        // Connect through Acoustic Modeling Formant Node or directly
        const { filter1, filter2, outNode } = acousticEngine.applyAcousticFormant(
          ctx,
          filter,
          efx.acousticEngine,
          voiceGain,
          layerFreq
        );

        voiceGain.connect(layerBus.gain);
        osc.start(now);

        const voice: ActiveVoice = {
          id: voiceKey,
          layerId: layer.id,
          note,
          startTime: now,
          gainNode: voiceGain,
          oscNode: osc,
          subOscNode: subOsc,
          filterNode: filter,
          acousticFilter1: filter1,
          acousticFilter2: filter2,
          lfoNode: lfo,
          lfoGain,
          targetFreq: layerFreq,
        };
        this.activeVoices.set(voiceKey, voice);
      } else {
        // SoundFont Sample Playback (Starts with pure original SoundFont sample!)
        const buffers = this.getInstrumentBuffers(layer.presetId);
        let selectedBuffer: { buffer: AudioBuffer; rootKey: number } | null = null;
        let minDiff = 999;

        buffers.forEach((val, root) => {
          const diff = Math.abs(root - note);
          if (diff < minDiff) {
            minDiff = diff;
            selectedBuffer = val;
          }
        });

        if (selectedBuffer) {
          const src = ctx.createBufferSource();
          src.buffer = (selectedBuffer as { buffer: AudioBuffer; rootKey: number }).buffer;

          const rootFreq = 440 * Math.pow(2, ((selectedBuffer as { buffer: AudioBuffer; rootKey: number }).rootKey - 69) / 12);
          const targetRate = layerFreq / rootFreq;

          const glideDuration = efx.portamento
            ? efx.glideTime
            : efx.legato
            ? (efx.legatoSpeed || 0.05)
            : 0.04;

          if (isGliding) {
            const startRate = startFreq / rootFreq;
            src.playbackRate.setValueAtTime(startRate, now);
            if (efx.legatoCurve === 'linear') {
              src.playbackRate.linearRampToValueAtTime(targetRate, now + glideDuration);
            } else {
              src.playbackRate.exponentialRampToValueAtTime(targetRate, now + glideDuration);
            }
          } else {
            src.playbackRate.setValueAtTime(targetRate, now);
          }

          // Anti-click attack ramp with configurable legato attack
          const attackTime = efx.legato ? (efx.legatoAttack || 0.008) : 0.004;
          voiceGain.gain.setValueAtTime(0.0001, now);
          voiceGain.gain.linearRampToValueAtTime(targetVolume, now + attackTime);

          // Real-time Pitch Bend & Modulation (CC1) Vibrato LFO
          const vibratoLfo = ctx.createOscillator();
          const vibratoGain = ctx.createGain();
          vibratoLfo.frequency.setValueAtTime(5.5, now);
          vibratoGain.gain.setValueAtTime(this.modWheel * 50, now);
          vibratoLfo.connect(vibratoGain);
          vibratoGain.connect(src.detune);
          src.detune.setValueAtTime(this.pitchBend * 200, now);
          vibratoLfo.start(now);

          // Apply Acoustic Expression Engine (if enabled by user, otherwise pure soundfont)
          const { filter1, filter2 } = acousticEngine.applyAcousticFormant(
            ctx,
            src,
            efx.acousticEngine,
            voiceGain,
            layerFreq
          );

          voiceGain.connect(layerBus.gain);
          src.start(now);

          const voice: ActiveVoice = {
            id: voiceKey,
            layerId: layer.id,
            note,
            startTime: now,
            gainNode: voiceGain,
            sourceNode: src,
            lfoNode: vibratoLfo,
            lfoGain: vibratoGain,
            acousticFilter1: filter1,
            acousticFilter2: filter2,
            targetFreq: layerFreq,
          };
          this.activeVoices.set(voiceKey, voice);
        }
      }
    }

    // Terca adds a second note using the currently selected SoundFont/layers.
    // The harmony voice is marked internally so it cannot recursively spawn more notes.
    if (!isHarmonyVoice && efx.tercaEnabled) {
      const interval = ({ minor3: 3, major3: 4, perfect5: 7, octave: 12 } as const)[efx.tercaInterval || 'minor3'];
      const harmonyNote = note + interval;
      if (harmonyNote <= 127) {
        this.tercaHarmonyNotes.set(note, harmonyNote);
        this.triggerNoteOn(
          harmonyNote,
          velocity * Math.max(0, Math.min(1, efx.tercaVolume ?? 0.65)),
          layers,
          { ...efx, tercaEnabled: false },
          scaleTuning,
          true
        );
      }
    }

    if (!isHarmonyVoice) {
      this.lastNotePlayed = note;
      this.lastFreqPlayed = baseFreq;
    }
  }

  public triggerNoteOff(note: number, layers: SoundLayer[], efx: EfxSettings) {
    this.heldKeys.delete(note);
    const harmonyNote = this.tercaHarmonyNotes.get(note);
    if (harmonyNote !== undefined) {
      this.tercaHarmonyNotes.delete(note);
      this.heldKeys.delete(harmonyNote);
      this.releaseNoteVoices(harmonyNote, layers, efx);
    }
    if (this.sustainPedal) {
      this.sustainedNotes.add(note);
      return;
    }
    this.releaseNoteVoices(note, layers, efx);
  }

  private releaseNoteVoices(note: number, layers: SoundLayer[], efx?: EfxSettings) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    for (const layer of layers) {
      const voiceKey = `${layer.id}_${note}`;
      const voice = this.activeVoices.get(voiceKey);
      if (voice) {
        const releaseTime = layer.oscillatorMode
          ? Math.max(0.04, layer.oscillator.envelope.release)
          : efx && efx.legato
          ? (efx.legatoRelease || 0.22)
          : 0.25;

        voice.gainNode.gain.cancelScheduledValues(now);
        voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
        voice.gainNode.gain.linearRampToValueAtTime(0.0001, now + releaseTime);

        setTimeout(() => this.cleanupVoice(voice), (releaseTime + 0.04) * 1000);
        this.activeVoices.delete(voiceKey);
      }
    }
  }

  private releaseSustainedNotes() {
    this.sustainedNotes.forEach((note) => {
      if (!this.heldKeys.has(note)) {
        window.dispatchEvent(new CustomEvent('sf2-release-sustained-note', { detail: { note } }));
      }
    });
    this.sustainedNotes.clear();
  }

  public stopAllVoices(immediate = false) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const fade = immediate ? 0.005 : 0.02;

    this.activeVoices.forEach((voice) => {
      try {
        voice.gainNode.gain.cancelScheduledValues(now);
        voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
        voice.gainNode.gain.linearRampToValueAtTime(0.0001, now + fade);
        setTimeout(() => this.cleanupVoice(voice), (fade + 0.02) * 1000);
      } catch {}
    });
    this.activeVoices.clear();
    this.sustainedNotes.clear();
    this.tercaHarmonyNotes.clear();
  }

  private cleanupVoice(voice: ActiveVoice) {
    try {
      if (voice.sourceNode) {
        voice.sourceNode.stop();
        voice.sourceNode.disconnect();
      }
      if (voice.oscNode) {
        voice.oscNode.stop();
        voice.oscNode.disconnect();
      }
      if (voice.subOscNode) {
        voice.subOscNode.stop();
        voice.subOscNode.disconnect();
      }
      if (voice.lfoNode) {
        voice.lfoNode.stop();
        voice.lfoNode.disconnect();
      }
      if (voice.acousticFilter1) voice.acousticFilter1.disconnect();
      if (voice.acousticFilter2) voice.acousticFilter2.disconnect();
      if (voice.filterNode) voice.filterNode.disconnect();
      if (voice.gainNode) voice.gainNode.disconnect();
    } catch {}
  }

  public updateActiveVoicesPitch() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const bendMultiplier = Math.pow(2, (this.pitchBend * 2) / 12);
    const bendCents = this.pitchBend * 200;

    this.activeVoices.forEach((voice) => {
      if (voice.oscNode) {
        voice.oscNode.frequency.setValueAtTime(voice.targetFreq * bendMultiplier, now);
        if (voice.subOscNode) {
          voice.subOscNode.frequency.setValueAtTime(voice.targetFreq * bendMultiplier, now);
        }
      }
      if (voice.sourceNode) {
        try {
          voice.sourceNode.detune.setValueAtTime(bendCents, now);
        } catch {
          if (voice.sourceNode.playbackRate) {
            voice.sourceNode.playbackRate.setValueAtTime(bendMultiplier, now);
          }
        }
      }
    });
  }

  public updateActiveVoicesModulation() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const modDepth = this.modWheel * 50;

    this.activeVoices.forEach((voice) => {
      if (voice.lfoGain) {
        voice.lfoGain.gain.setValueAtTime(modDepth, now);
      }
    });
  }

  public updateMixer(layers: SoundLayer[], eq: EqualizerSettings, efx: EfxSettings) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const hasSolo = layers.some((l) => l.solo && l.enabled);

    layers.forEach((layer) => {
      const bus = this.layerBuses.get(layer.id);
      if (bus) {
        const isMuted = layer.mute || (hasSolo && !layer.solo);
        const gainVal = isMuted || !layer.enabled ? 0 : layer.volume;
        bus.gain.gain.setValueAtTime(gainVal, now);
        bus.panner.pan.setValueAtTime(layer.pan, now);
      }
    });

    if (this.eq80) this.eq80.gain.setValueAtTime(eq.band80, now);
    if (this.eq400) this.eq400.gain.setValueAtTime(eq.band400, now);
    if (this.eq1k) this.eq1k.gain.setValueAtTime(eq.band1k, now);
    if (this.eq3k) this.eq3k.gain.setValueAtTime(eq.band3k, now);
    if (this.eq10k) this.eq10k.gain.setValueAtTime(eq.band10k, now);
    if (this.masterGain) this.masterGain.gain.setValueAtTime(eq.masterVolume, now);

    if (this.reverbWetGain) {
      this.reverbWetGain.gain.setValueAtTime(efx.reverbEnabled ? efx.reverbWet : 0, now);
    }
    if (this.delayWetGain && this.delayFeedbackGain && this.delayNode) {
      this.delayWetGain.gain.setValueAtTime(efx.delayEnabled ? efx.delayWet : 0, now);
      this.delayFeedbackGain.gain.setValueAtTime(efx.delayFeedback, now);
      this.delayNode.delayTime.setValueAtTime(efx.delayTime, now);
    }
  }

  public getMeterLevels(): { left: number; right: number } {
    if (!this.analyserL || !this.analyserR || !this.dataArrayL || !this.dataArrayR) {
      return { left: 0, right: 0 };
    }
    this.analyserL.getByteTimeDomainData(this.dataArrayL);
    this.analyserR.getByteTimeDomainData(this.dataArrayR);

    let peakL = 0;
    let peakR = 0;
    let sumL = 0;
    let sumR = 0;
    const len = this.dataArrayL.length;

    for (let i = 0; i < len; i++) {
      const vL = Math.abs((this.dataArrayL[i] - 128) / 128);
      const vR = Math.abs((this.dataArrayR[i] - 128) / 128);
      sumL += vL * vL;
      sumR += vR * vR;
      if (vL > peakL) peakL = vL;
      if (vR > peakR) peakR = vR;
    }

    const rmsL = Math.sqrt(sumL / len);
    const rmsR = Math.sqrt(sumR / len);

    // Dynamic responsive envelope: loud chords/notes smoothly hit 100% (top red warning zone)
    const combinedL = peakL * 0.75 + rmsL * 1.1;
    const combinedR = peakR * 0.75 + rmsR * 1.1;

    const targetL = Math.min(100, Math.round(Math.pow(combinedL * 1.85, 0.65) * 100));
    const targetR = Math.min(100, Math.round(Math.pow(combinedR * 1.85, 0.65) * 100));

    // Instant attack, silky smooth logarithmic decay for hardware-like VU response
    if (targetL >= this.smoothMeterL) {
      this.smoothMeterL = targetL;
    } else {
      this.smoothMeterL = Math.max(0, this.smoothMeterL * 0.92 - 0.25);
    }

    if (targetR >= this.smoothMeterR) {
      this.smoothMeterR = targetR;
    } else {
      this.smoothMeterR = Math.max(0, this.smoothMeterR * 0.92 - 0.25);
    }

    return {
      left: Math.round(this.smoothMeterL),
      right: Math.round(this.smoothMeterR),
    };
  }

  public getOrCreateMp3Player(): HTMLAudioElement {
    if (!this.mp3Audio) {
      this.mp3Audio = new Audio();
      this.mp3Audio.crossOrigin = 'anonymous';
    }
    return this.mp3Audio;
  }
}

export const audioEngine = new AudioEngine();
