import React from 'react';
import { KeyboardSplitSettings, SoundLayer } from '../types/synth';
import { X, Check, Volume2, Divide, Layers } from 'lucide-react';

interface KeyboardSplitModalProps {
  splitSettings: KeyboardSplitSettings;
  onUpdateSplit: (updates: Partial<KeyboardSplitSettings>) => void;
  layers: SoundLayer[];
  onUpdateLayer: (layerId: number, updates: Partial<SoundLayer>) => void;
  onClose: () => void;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function midiToNoteName(midi: number): string {
  const note = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}`;
}

export const KeyboardSplitModal: React.FC<KeyboardSplitModalProps> = ({
  splitSettings,
  onUpdateSplit,
  layers,
  onUpdateLayer,
  onClose,
}) => {
  const { enabled, splitPoint, lowerLayers, upperLayers, lowerOctave, upperOctave } = splitSettings;

  const toggleLowerLayer = (layerId: number) => {
    let next: number[];
    if (lowerLayers.includes(layerId)) {
      if (lowerLayers.length === 1) return; // Keep at least one
      next = lowerLayers.filter((id) => id !== layerId);
    } else {
      next = [...lowerLayers, layerId];
    }
    onUpdateSplit({ lowerLayers: next });
  };

  const toggleUpperLayer = (layerId: number) => {
    let next: number[];
    if (upperLayers.includes(layerId)) {
      if (upperLayers.length === 1) return; // Keep at least one
      next = upperLayers.filter((id) => id !== layerId);
    } else {
      next = [...upperLayers, layerId];
    }
    onUpdateSplit({ upperLayers: next });
  };

  const setPreset = (preset: 'standard' | 'oriental' | 'dual') => {
    if (preset === 'standard') {
      onUpdateSplit({
        enabled: true,
        splitPoint: 48, // C3
        lowerLayers: [1],
        upperLayers: [2],
        lowerOctave: -1,
        upperOctave: 0,
      });
      // Enable layer 2 if disabled
      if (!layers[1]?.enabled) onUpdateLayer(2, { enabled: true });
    } else if (preset === 'oriental') {
      onUpdateSplit({
        enabled: true,
        splitPoint: 53, // F3
        lowerLayers: [1],
        upperLayers: [2, 3],
        lowerOctave: 0,
        upperOctave: 0,
      });
      if (!layers[1]?.enabled) onUpdateLayer(2, { enabled: true });
      if (!layers[2]?.enabled) onUpdateLayer(3, { enabled: true });
    } else if (preset === 'dual') {
      onUpdateSplit({
        enabled: true,
        splitPoint: 60, // C4
        lowerLayers: [1],
        upperLayers: [2, 3, 4],
        lowerOctave: -1,
        upperOctave: 0,
      });
      if (!layers[1]?.enabled) onUpdateLayer(2, { enabled: true });
      if (!layers[2]?.enabled) onUpdateLayer(3, { enabled: true });
      if (!layers[3]?.enabled) onUpdateLayer(4, { enabled: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 select-none">
      <div className="w-full max-w-lg bg-[#15171e] border-2 border-[#363e52] rounded-xl shadow-[0_0_35px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden font-mono text-zinc-100 max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#1c202a] via-[#171a22] to-[#12141a] border-b border-[#2b3140]">
          <div className="flex items-center gap-2">
            <Divide size={15} className="text-amber-400" />
            <span className="font-bold text-xs sm:text-sm tracking-wider text-zinc-100">
              KEYBOARD SPLIT SETTINGS (ARRANGER MODE)
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-6 h-6 rounded bg-[#202532] text-zinc-400 hover:text-white hover:bg-zinc-700 flex items-center justify-center transition-all"
          >
            <X size={14} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-2.5 sm:p-3 space-y-2.5 overflow-y-auto text-xs">
          
          {/* 1. Main ON/OFF Master Toggle & Split Point Readout */}
          <div className="flex items-center justify-between bg-[#0e1015] p-2 rounded-lg border border-[#262c3a]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateSplit({ enabled: !enabled })}
                className={`px-3 py-1.5 rounded font-black text-xs border transition-all flex items-center gap-1.5 shadow ${
                  enabled
                    ? 'bg-gradient-to-b from-amber-400 to-yellow-500 text-black border-yellow-200 shadow-[0_0_12px_#f59e0b]'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}
              >
                <span>SPLIT: {enabled ? 'ON' : 'OFF'}</span>
              </button>
              <span className="text-[10px] text-zinc-400">
                {enabled ? 'Keyboard dibagi 2 zona (Kiri & Kanan)' : 'Keyboard penuh memainkan semua layer'}
              </span>
            </div>

            {/* Split Point Value */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-zinc-400 mr-1">POINT:</span>
              <button
                disabled={!enabled}
                onClick={() => onUpdateSplit({ splitPoint: Math.max(36, splitPoint - 1) })}
                className="w-6 h-6 rounded bg-[#202532] hover:bg-[#2c3345] disabled:opacity-40 text-zinc-200 border border-[#374055] font-black"
              >
                -
              </button>
              <div className="min-w-14 px-1.5 py-0.5 rounded bg-black border border-amber-400/50 text-center font-bold text-amber-400">
                {midiToNoteName(splitPoint)} ({splitPoint})
              </div>
              <button
                disabled={!enabled}
                onClick={() => onUpdateSplit({ splitPoint: Math.min(84, splitPoint + 1) })}
                className="w-6 h-6 rounded bg-[#202532] hover:bg-[#2c3345] disabled:opacity-40 text-zinc-200 border border-[#374055] font-black"
              >
                +
              </button>
            </div>
          </div>

          {/* Quick Split Note Presets */}
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-zinc-400 text-[9px]">PILIH TITIK STANDAR:</span>
            <div className="flex gap-1">
              {[
                { label: 'C2 (36)', midi: 36 },
                { label: 'F#2 (42)', midi: 42 },
                { label: 'C3 (48)', midi: 48 },
                { label: 'F3 (53)', midi: 53 },
                { label: 'C4 (60)', midi: 60 },
              ].map((p) => (
                <button
                  key={p.midi}
                  disabled={!enabled}
                  onClick={() => onUpdateSplit({ splitPoint: p.midi })}
                  className={`px-1.5 py-0.5 rounded border text-[9px] transition-all ${
                    splitPoint === p.midi
                      ? 'bg-amber-400 text-black border-yellow-200 font-bold'
                      : 'bg-[#1a1d26] text-zinc-400 border-[#2d3342] hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mini Visual Keyboard Split Diagram */}
          <div className="h-8 bg-[#090b10] rounded border border-[#222734] relative overflow-hidden flex items-end px-1">
            {/* Lower Keys Zone Fill */}
            <div
              className="h-full bg-emerald-500/25 border-r-2 border-yellow-400 flex items-center justify-center transition-all relative"
              style={{ width: `${Math.round(((splitPoint - 24) / 72) * 100)}%` }}
            >
              <span className="text-[8px] font-bold text-emerald-300 truncate px-1">
                LOWER (TANGAN KIRI)
              </span>
              <div className="absolute top-0 right-0 h-full w-0.5 bg-yellow-400 shadow-[0_0_8px_#facc15]" />
            </div>

            {/* Upper Keys Zone Fill */}
            <div className="flex-1 h-full bg-amber-500/25 flex items-center justify-center transition-all">
              <span className="text-[8px] font-bold text-amber-300 truncate px-1">
                UPPER (TANGAN KANAN / SOLO)
              </span>
            </div>
          </div>

          {/* 2. Lower & Upper Zone Configuration Cards */}
          <div className="grid grid-cols-2 gap-2">
            
            {/* LOWER ZONE (Left Hand) */}
            <div className="p-2 bg-[#101218] border border-emerald-900/60 rounded-lg flex flex-col justify-between">
              <div className="flex items-center justify-between pb-1 border-b border-[#1f262e]">
                <span className="font-bold text-[11px] text-emerald-400">LOWER (KIRI)</span>
                <span className="text-[8px] text-zinc-400">&lt; {midiToNoteName(splitPoint)}</span>
              </div>

              {/* Layer Selection */}
              <div className="my-1.5 space-y-1">
                <span className="text-[8px] text-zinc-400 block">LAYER AKTIF:</span>
                <div className="grid grid-cols-2 gap-1">
                  {layers.map((l) => {
                    const isLower = lowerLayers.includes(l.id);
                    return (
                      <button
                        key={l.id}
                        disabled={!enabled}
                        onClick={() => toggleLowerLayer(l.id)}
                        className={`p-1 rounded text-[9px] font-bold border truncate text-left transition-all ${
                          isLower
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm'
                            : 'bg-[#161820] text-zinc-500 border-zinc-800'
                        }`}
                      >
                        L{l.id}: {l.presetName ? l.presetName.slice(0, 8) : 'Off'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lower Octave Shift */}
              <div className="flex items-center justify-between pt-1 border-t border-[#1a1f28] text-[9px]">
                <span className="text-zinc-400">OKTAF:</span>
                <div className="flex gap-0.5">
                  {[-2, -1, 0, 1].map((oct) => (
                    <button
                      key={oct}
                      disabled={!enabled}
                      onClick={() => onUpdateSplit({ lowerOctave: oct })}
                      className={`px-1.5 py-0.2 rounded border ${
                        lowerOctave === oct
                          ? 'bg-emerald-400 text-black border-emerald-200 font-bold'
                          : 'bg-[#181a22] text-zinc-400 border-zinc-800'
                      }`}
                    >
                      {oct > 0 ? `+${oct}` : oct}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* UPPER ZONE (Right Hand / Solo) */}
            <div className="p-2 bg-[#101218] border border-amber-900/60 rounded-lg flex flex-col justify-between">
              <div className="flex items-center justify-between pb-1 border-b border-[#2e261f]">
                <span className="font-bold text-[11px] text-amber-400">UPPER (KANAN)</span>
                <span className="text-[8px] text-zinc-400">&ge; {midiToNoteName(splitPoint)}</span>
              </div>

              {/* Layer Selection */}
              <div className="my-1.5 space-y-1">
                <span className="text-[8px] text-zinc-400 block">LAYER AKTIF:</span>
                <div className="grid grid-cols-2 gap-1">
                  {layers.map((l) => {
                    const isUpper = upperLayers.includes(l.id);
                    return (
                      <button
                        key={l.id}
                        disabled={!enabled}
                        onClick={() => toggleUpperLayer(l.id)}
                        className={`p-1 rounded text-[9px] font-bold border truncate text-left transition-all ${
                          isUpper
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-sm'
                            : 'bg-[#161820] text-zinc-500 border-zinc-800'
                        }`}
                      >
                        L{l.id}: {l.presetName ? l.presetName.slice(0, 8) : 'Off'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Upper Octave Shift */}
              <div className="flex items-center justify-between pt-1 border-t border-[#28211a] text-[9px]">
                <span className="text-zinc-400">OKTAF:</span>
                <div className="flex gap-0.5">
                  {[-1, 0, 1, 2].map((oct) => (
                    <button
                      key={oct}
                      disabled={!enabled}
                      onClick={() => onUpdateSplit({ upperOctave: oct })}
                      className={`px-1.5 py-0.2 rounded border ${
                        upperOctave === oct
                          ? 'bg-amber-400 text-black border-yellow-200 font-bold'
                          : 'bg-[#181a22] text-zinc-400 border-zinc-800'
                      }`}
                    >
                      {oct > 0 ? `+${oct}` : oct}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3. One-Touch Keyboard Music Presets */}
          <div className="pt-1 border-t border-[#252b38]">
            <span className="text-[9px] text-zinc-400 block mb-1">PRESET STANDAR KEYBOARD MUSIK:</span>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => setPreset('standard')}
                className="p-1 rounded bg-[#161922] hover:bg-[#202432] text-zinc-200 border border-[#2b3345] text-[8px] font-bold truncate active:scale-95"
              >
                1. Standar (L1 Bass / L2 Solo)
              </button>
              <button
                onClick={() => setPreset('oriental')}
                className="p-1 rounded bg-[#161922] hover:bg-[#202432] text-zinc-200 border border-[#2b3345] text-[8px] font-bold truncate active:scale-95"
              >
                2. Oriental (L1 Pad / L2-3 Flute)
              </button>
              <button
                onClick={() => setPreset('dual')}
                className="p-1 rounded bg-[#161922] hover:bg-[#202432] text-zinc-200 border border-[#2b3345] text-[8px] font-bold truncate active:scale-95"
              >
                3. Dual Upper (L1 Bass / L2-4 Solo)
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-3 py-2 bg-[#111318] border-t border-[#262c3a] flex items-center justify-between">
          <span className="text-[9px] text-zinc-500">
            {enabled ? `Split Aktif pada ${midiToNoteName(splitPoint)}` : 'Split Dinonaktifkan'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1 rounded bg-gradient-to-b from-amber-400 to-yellow-500 text-black font-black text-xs shadow-[0_0_10px_#f59e0b] hover:brightness-110 active:scale-95"
          >
            SELESAI (OK)
          </button>
        </div>
      </div>
    </div>
  );
};
