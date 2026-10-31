import React, { useState } from 'react';
import { ArabicScaleTuning } from '../../types/synth';
import { NOTE_IS_BLACK, NOTE_NAMES } from '../../audio/scalePresets';
import { RotateCcw } from 'lucide-react';

interface ScaleViewProps {
  scaleTuning: ArabicScaleTuning;
  onUpdateScale: (newScale: ArabicScaleTuning) => void;
}

export const ScaleView: React.FC<ScaleViewProps> = ({ scaleTuning, onUpdateScale }) => {
  const [selectedKey, setSelectedKey] = useState<number>(4); // default E (pitchClass 4)
  // Persistent active detune tool: User requested that when -50 is chosen, selecting other keys keeps -50 active!
  const [activeToolOffset, setActiveToolOffset] = useState<number>(-50);

  const handleKeyClick = (pitchClass: number) => {
    setSelectedKey(pitchClass);
    const currentKeyCents = scaleTuning.offsets[pitchClass] ?? 0;

    // If key already has this offset, toggle to 0; otherwise apply activeToolOffset
    const targetCents = currentKeyCents === activeToolOffset ? 0 : activeToolOffset;

    onUpdateScale({
      ...scaleTuning,
      enabled: true, // Auto-enable scale when tuning
      offsets: {
        ...scaleTuning.offsets,
        [pitchClass]: targetCents,
      },
    });
  };

  const handleSelectTool = (cents: number) => {
    setActiveToolOffset(cents);
    // Also apply to currently selected key immediately
    onUpdateScale({
      ...scaleTuning,
      enabled: true,
      offsets: {
        ...scaleTuning.offsets,
        [selectedKey]: cents,
      },
    });
  };

  const resetAll = () => {
    const zero: Record<number, number> = {};
    for (let i = 0; i < 12; i++) zero[i] = 0;
    onUpdateScale({
      ...scaleTuning,
      offsets: zero,
    });
  };

  const selectedCents = scaleTuning.offsets[selectedKey] ?? 0;

  return (
    <div className="w-full h-full min-h-0 flex flex-col gap-1 p-1 bg-[#111a29] text-zinc-100 font-mono overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-1 border-b border-[#2b303d] text-xs shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateScale({ ...scaleTuning, enabled: !scaleTuning.enabled })}
            className={`px-3 py-1 rounded text-[10px] sm:text-xs font-bold border transition-all ${
              scaleTuning.enabled
                ? 'bg-gradient-to-b from-amber-400 to-yellow-500 text-black border-yellow-200 font-black shadow-[0_0_10px_rgba(250,204,21,0.6)]'
                : 'bg-[#1e222b] text-zinc-500 border-[#2d323f]'
            }`}
          >
            SCALE: {scaleTuning.enabled ? 'ACTIVE' : 'BYPASS'}
          </button>
          <span className="text-[10px] text-zinc-400 hidden sm:inline">
            ORIENTAL MICROTONAL TUNING (BAYATI / SIKAH / RAST)
          </span>
        </div>

        <button
          onClick={resetAll}
          className="flex items-center gap-1 px-2.5 py-1 text-[10px] bg-[#1e222b] hover:bg-[#2b303d] text-zinc-300 border border-[#343a49] rounded active:scale-95 transition-all"
        >
          <RotateCcw size={11} />
          <span>RESET 0</span>
        </button>
      </div>

      {/* Main Center: 1-Octave Keyboard with Detune Cents Directly on Tuts */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center py-0.5 overflow-hidden">
        <div className="relative flex h-24 sm:h-28 md:h-32 bg-[#0a0c10] border-2 border-[#2f3545] rounded-lg p-1.5 shadow-2xl select-none max-w-full">
          {NOTE_NAMES.map((name, pitchClass) => {
            const isBlack = NOTE_IS_BLACK[pitchClass];
            const cents = scaleTuning.offsets[pitchClass] ?? 0;
            const isSelected = selectedKey === pitchClass;

            if (isBlack) return null;

            const blackPitch = pitchClass + 1 < 12 && NOTE_IS_BLACK[pitchClass + 1] ? pitchClass + 1 : null;
            const blackCents = blackPitch !== null ? (scaleTuning.offsets[blackPitch] ?? 0) : 0;
            const isBlackSelected = blackPitch !== null && selectedKey === blackPitch;

            return (
              <div key={pitchClass} className="relative flex flex-col justify-end w-7 sm:w-9 md:w-11">
                {/* White Key */}
                <div
                  onClick={() => handleKeyClick(pitchClass)}
                  className={`w-full h-20 sm:h-24 md:h-28 rounded-b border border-zinc-600 cursor-pointer flex flex-col justify-end items-center pb-1.5 transition-all ${
                    isSelected
                      ? 'bg-gradient-to-b from-yellow-200 via-amber-300 to-yellow-400 text-black font-black border-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.8)] scale-[1.02] z-10'
                      : 'bg-gradient-to-b from-white via-zinc-100 to-zinc-300 hover:bg-zinc-200 text-black'
                  }`}
                >
                  <span className="text-[10px] sm:text-xs font-black">{name}</span>
                  <div
                    className={`mt-1 px-1 py-0.2 rounded text-[9px] sm:text-[10px] font-mono font-black tracking-tighter ${
                      cents !== 0
                        ? 'bg-black text-amber-400 border border-yellow-500/50 shadow-sm'
                        : 'bg-zinc-300 text-zinc-700'
                    }`}
                  >
                    {cents > 0 ? `+${cents}` : cents}
                  </div>
                </div>

                {/* Black Key */}
                {blackPitch !== null && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleKeyClick(blackPitch);
                    }}
                    className={`absolute top-0 -right-3 sm:-right-3.5 md:-right-4 w-5 sm:w-6 md:w-7 h-12 sm:h-16 md:h-20 z-20 rounded-b cursor-pointer flex flex-col justify-end items-center pb-1 transition-all border border-black ${
                      isBlackSelected
                        ? 'bg-gradient-to-b from-yellow-300 to-amber-500 text-black font-black border-yellow-200 shadow-[0_0_15px_rgba(250,204,21,0.8)]'
                        : 'bg-gradient-to-b from-[#2b2d34] via-[#1a1c22] to-black hover:bg-zinc-800 text-white'
                    }`}
                  >
                    <span className="text-[9px] sm:text-[10px] font-bold">{NOTE_NAMES[blackPitch]}</span>
                    <div
                      className={`mt-0.5 px-0.5 rounded text-[8px] sm:text-[9px] font-mono font-black ${
                        blackCents !== 0
                          ? 'bg-black text-amber-400 border border-yellow-500/50'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {blackCents > 0 ? `+${blackCents}` : blackCents}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Detune Controls: Persistent -50 / 0 / +50 Selection (never resets to 0 when picking other keys!) */}
      <div className="bg-[#101217] border border-[#262b37] rounded-lg px-1.5 py-1 flex items-center justify-between gap-2 text-xs shrink-0 shadow-inner">
        <div className="flex items-center gap-2 truncate">
          <span className="text-zinc-400 font-bold text-[10px]">TUTS TERPILIH:</span>
          <span className="text-xs sm:text-sm font-black text-black bg-gradient-to-r from-yellow-300 to-amber-400 px-2 py-0.5 rounded shadow-sm">
            {NOTE_NAMES[selectedKey]}
          </span>
          <span className="text-amber-400 font-mono font-black text-xs sm:text-sm ml-1">
            {selectedCents > 0 ? `+${selectedCents}` : selectedCents} Cents
          </span>
        </div>

        {/* Quick -50 / 0 / +50 Tool Buttons (Stays active on selected tool!) */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-500 font-mono mr-1 hidden sm:inline">MODE SCALE:</span>

          {[-50, 0, 50].map((val) => {
            const isToolActive = activeToolOffset === val;
            return (
              <button
                key={val}
                onClick={() => handleSelectTool(val)}
                className={`px-2 py-0.5 rounded font-mono font-black text-[11px] sm:text-xs border transition-all ${
                  isToolActive
                    ? 'bg-gradient-to-b from-amber-400 to-yellow-500 text-black border-yellow-200 shadow-[0_0_12px_rgba(250,204,21,0.7)] scale-105'
                    : 'bg-[#1f232c] text-zinc-300 border-[#323847] hover:border-zinc-500 active:scale-95'
                }`}
              >
                {val > 0 ? `+${val}` : val}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
