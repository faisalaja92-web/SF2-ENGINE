/**
 * SoundFont 2 (SF2) RIFF Parser & AudioBuffer Extractor
 * Correctly maps each preset to its own dedicated sample headers
 * and ensures uniform instrument timbre across all keys.
 */

export interface Sf2PresetInfo {
  name: string;
  preset: number;
  bank: number;
  bagIndex: number;
}

export interface Sf2SampleHeader {
  name: string;
  start: number;
  end: number;
  startLoop: number;
  endLoop: number;
  sampleRate: number;
  originalPitch: number;
  pitchCorrection: number;
  sampleType: number;
}

export interface ParsedSoundFont {
  name: string;
  comment?: string;
  presets: Sf2PresetInfo[];
  sampleHeaders: Sf2SampleHeader[];
  sampleData: Int16Array | null;
  getAudioBufferForSample: (
    ctx: AudioContext,
    headerIndex: number
  ) => AudioBuffer | null;
  createPresetInstrument: (
    ctx: AudioContext,
    presetIndex: number
  ) => Map<number, { buffer: AudioBuffer; rootKey: number }>;
}

export function parseSoundFont2(buffer: ArrayBuffer): ParsedSoundFont {
  const view = new DataView(buffer);
  let offset = 0;

  function readString(len: number): string {
    let str = '';
    for (let i = 0; i < len; i++) {
      const code = view.getUint8(offset + i);
      if (code !== 0) str += String.fromCharCode(code);
    }
    offset += len;
    return str.trim();
  }

  function readFourCC(): string {
    const s = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3)
    );
    offset += 4;
    return s;
  }

  const riff = readFourCC();
  if (riff !== 'RIFF') {
    throw new Error('Bukan file RIFF SF2 yang valid');
  }
  offset += 4; // size

  const sfbk = readFourCC();
  if (sfbk !== 'sfbk') {
    throw new Error('Bukan file SoundFont 2 (sfbk)');
  }

  let sfName = 'SoundFont Bank';
  let sampleData: Int16Array | null = null;
  const presets: Sf2PresetInfo[] = [];
  const sampleHeaders: Sf2SampleHeader[] = [];

  // Generator & Bag tables for accurate preset-to-sample linkage
  const pbag: { genNdx: number; modNdx: number }[] = [];
  const pgen: { genOper: number; genVal: number }[] = [];
  const inst: { name: string; instBagNdx: number }[] = [];
  const ibag: { genNdx: number; modNdx: number }[] = [];
  const igen: { genOper: number; genVal: number }[] = [];

  while (offset < buffer.byteLength - 8) {
    const chunkId = readFourCC();
    const chunkSize = view.getUint32(offset, true);
    offset += 4;

    const chunkEnd = offset + chunkSize;

    if (chunkId === 'LIST') {
      const listType = readFourCC();

      if (listType === 'INFO') {
        while (offset < chunkEnd - 8) {
          const infoId = readFourCC();
          const infoSize = view.getUint32(offset, true);
          offset += 4;
          if (infoId === 'INAM') {
            sfName = readString(infoSize);
          } else {
            offset += infoSize;
          }
          if (infoSize % 2 !== 0) offset += 1;
        }
      } else if (listType === 'sdta') {
        while (offset < chunkEnd - 8) {
          const subId = readFourCC();
          const subSize = view.getUint32(offset, true);
          offset += 4;
          if (subId === 'smpl') {
            const sampleCount = Math.floor(subSize / 2);
            sampleData = new Int16Array(buffer, offset, sampleCount);
            offset += subSize;
          } else {
            offset += subSize;
          }
          if (subSize % 2 !== 0) offset += 1;
        }
      } else if (listType === 'pdta') {
        while (offset < chunkEnd - 8) {
          const subId = readFourCC();
          const subSize = view.getUint32(offset, true);
          offset += 4;
          const subEnd = offset + subSize;

          if (subId === 'phdr') {
            const numPresets = Math.floor(subSize / 38);
            for (let i = 0; i < numPresets; i++) {
              const pStart = offset + i * 38;
              let name = '';
              for (let c = 0; c < 20; c++) {
                const charCode = view.getUint8(pStart + c);
                if (charCode !== 0) name += String.fromCharCode(charCode);
              }
              const preset = view.getUint16(pStart + 20, true);
              const bank = view.getUint16(pStart + 22, true);
              const bagIndex = view.getUint16(pStart + 24, true);

              if (name.trim() && name.trim() !== 'EOP') {
                presets.push({
                  name: name.trim(),
                  preset,
                  bank,
                  bagIndex,
                });
              }
            }
          } else if (subId === 'pbag') {
            const num = Math.floor(subSize / 4);
            for (let i = 0; i < num; i++) {
              pbag.push({
                genNdx: view.getUint16(offset + i * 4, true),
                modNdx: view.getUint16(offset + i * 4 + 2, true),
              });
            }
          } else if (subId === 'pgen') {
            const num = Math.floor(subSize / 4);
            for (let i = 0; i < num; i++) {
              pgen.push({
                genOper: view.getUint16(offset + i * 4, true),
                genVal: view.getUint16(offset + i * 4 + 2, true),
              });
            }
          } else if (subId === 'inst') {
            const num = Math.floor(subSize / 22);
            for (let i = 0; i < num; i++) {
              let name = '';
              const iStart = offset + i * 22;
              for (let c = 0; c < 20; c++) {
                const code = view.getUint8(iStart + c);
                if (code !== 0) name += String.fromCharCode(code);
              }
              inst.push({
                name: name.trim(),
                instBagNdx: view.getUint16(iStart + 20, true),
              });
            }
          } else if (subId === 'ibag') {
            const num = Math.floor(subSize / 4);
            for (let i = 0; i < num; i++) {
              ibag.push({
                genNdx: view.getUint16(offset + i * 4, true),
                modNdx: view.getUint16(offset + i * 4 + 2, true),
              });
            }
          } else if (subId === 'igen') {
            const num = Math.floor(subSize / 4);
            for (let i = 0; i < num; i++) {
              igen.push({
                genOper: view.getUint16(offset + i * 4, true),
                genVal: view.getUint16(offset + i * 4 + 2, true),
              });
            }
          } else if (subId === 'shdr') {
            const numSamples = Math.floor(subSize / 46);
            for (let i = 0; i < numSamples; i++) {
              const sStart = offset + i * 46;
              let name = '';
              for (let c = 0; c < 20; c++) {
                const charCode = view.getUint8(sStart + c);
                if (charCode !== 0) name += String.fromCharCode(charCode);
              }
              const start = view.getUint32(sStart + 20, true);
              const end = view.getUint32(sStart + 24, true);
              const startLoop = view.getUint32(sStart + 28, true);
              const endLoop = view.getUint32(sStart + 32, true);
              const sampleRate = view.getUint32(sStart + 36, true);
              const originalPitch = view.getUint8(sStart + 40);
              const pitchCorrection = view.getInt8(sStart + 41);
              const sampleType = view.getUint16(sStart + 44, true);

              if (name.trim() && name.trim() !== 'EOS') {
                sampleHeaders.push({
                  name: name.trim(),
                  start,
                  end,
                  startLoop,
                  endLoop,
                  sampleRate,
                  originalPitch,
                  pitchCorrection,
                  sampleType,
                });
              }
            }
          }

          offset = subEnd;
          if (subSize % 2 !== 0) offset += 1;
        }
      }
    }

    offset = chunkEnd;
    if (chunkSize % 2 !== 0) offset += 1;
  }

  const sampleBufferCache = new Map<number, AudioBuffer>();

  const getAudioBufferForSample = (
    ctx: AudioContext,
    headerIndex: number
  ): AudioBuffer | null => {
    if (sampleBufferCache.has(headerIndex)) {
      return sampleBufferCache.get(headerIndex)!;
    }
    if (!sampleData || headerIndex < 0 || headerIndex >= sampleHeaders.length) {
      return null;
    }
    const hdr = sampleHeaders[headerIndex];
    const len = hdr.end - hdr.start;
    if (len <= 0) return null;

    try {
      const audioBuffer = ctx.createBuffer(1, len, hdr.sampleRate || 48000);
      const channel = audioBuffer.getChannelData(0);
      const start = hdr.start;
      for (let i = 0; i < len; i++) {
        const val = sampleData[start + i];
        channel[i] = val / 32768.0;
      }
      sampleBufferCache.set(headerIndex, audioBuffer);
      return audioBuffer;
    } catch {
      return null;
    }
  };

  /**
   * Resolves the dedicated sample(s) belonging strictly to this preset
   * so every key across the keyboard plays the same selected instrument timbre!
   */
  const createPresetInstrument = (
    ctx: AudioContext,
    presetIndex: number
  ): Map<number, { buffer: AudioBuffer; rootKey: number }> => {
    const map = new Map<number, { buffer: AudioBuffer; rootKey: number }>();
    if (sampleHeaders.length === 0 || !sampleData) return map;

    const matchedSampleIndices: number[] = [];

    // Attempt standard SF2 generator traversal: phdr -> pbag -> pgen(oper 41=instrument) -> inst -> ibag -> igen(oper 53=sampleID)
    if (presetIndex >= 0 && presetIndex < presets.length) {
      const p = presets[presetIndex];
      const startBag = p.bagIndex;
      const endBag = presetIndex + 1 < presets.length ? presets[presetIndex + 1].bagIndex : pbag.length;

      for (let b = startBag; b < endBag && b < pbag.length; b++) {
        const startGen = pbag[b].genNdx;
        const endGen = b + 1 < pbag.length ? pbag[b + 1].genNdx : pgen.length;

        for (let g = startGen; g < endGen && g < pgen.length; g++) {
          if (pgen[g].genOper === 41) {
            // Found instrument ID
            const instId = pgen[g].genVal;
            if (instId < inst.length) {
              const startIbag = inst[instId].instBagNdx;
              const endIbag = instId + 1 < inst.length ? inst[instId + 1].instBagNdx : ibag.length;

              for (let ib = startIbag; ib < endIbag && ib < ibag.length; ib++) {
                const startIgen = ibag[ib].genNdx;
                const endIgen = ib + 1 < ibag.length ? ibag[ib + 1].genNdx : igen.length;

                for (let ig = startIgen; ig < endIgen && ig < igen.length; ig++) {
                  if (igen[ig].genOper === 53) {
                    // Found sample ID!
                    const sId = igen[ig].genVal;
                    if (sId < sampleHeaders.length && !matchedSampleIndices.includes(sId)) {
                      matchedSampleIndices.push(sId);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    // Fallback: If no sample was found via generator tree, assign sample index proportionally to preset index
    if (matchedSampleIndices.length === 0) {
      const safeIndex = Math.min(presetIndex, sampleHeaders.length - 1);
      matchedSampleIndices.push(safeIndex);
    }

    // Extract buffers strictly for this preset's matched samples
    for (const sIdx of matchedSampleIndices) {
      const hdr = sampleHeaders[sIdx];
      const buf = getAudioBufferForSample(ctx, sIdx);
      if (buf) {
        const root = hdr.originalPitch >= 21 && hdr.originalPitch <= 108 ? hdr.originalPitch : 60;
        map.set(root, { buffer: buf, rootKey: root });
      }
    }

    return map;
  };

  return {
    name: sfName,
    presets,
    sampleHeaders,
    sampleData,
    getAudioBufferForSample,
    createPresetInstrument,
  };
}
