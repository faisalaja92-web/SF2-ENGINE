import React, { useRef, useState } from 'react';
import { KeyboardSplitSettings, SoundLayer, SoundPreset } from '../../types/synth';

interface ListViewProps {
  layers: SoundLayer[];
  allPresets: SoundPreset[];
  currentPage: number;
  onSelectSingleSound: (preset: SoundPreset) => void;
  onToggleLayerSound: (preset: SoundPreset) => void;
  onToggleLayerSolo: (layerId: number) => void;
  masterOctave?: number;
  onOctaveChange?: (delta: number) => void;
  onOctaveReset?: () => void;
  masterTranspose?: number;
  onTransposeChange?: (delta: number) => void;
  onTransposeReset?: () => void;
  isTransposeActive?: boolean;
  onToggleTransposeActive?: () => void;
  splitSettings?: KeyboardSplitSettings;
  onToggleSplit?: () => void;
  onOpenSplitModal?: () => void;
}

export const ListView: React.FC<ListViewProps> = ({
  layers,
  allPresets,
  currentPage,
  onSelectSingleSound,
  onToggleLayerSound,
  masterOctave = 0,
  onOctaveChange,
  onOctaveReset,
  masterTranspose = 0,
  onTransposeChange,
  onTransposeReset,
  isTransposeActive = false,
  onToggleTransposeActive,
  splitSettings,
  onToggleSplit,
  onOpenSplitModal,
}) => {
  const [holdingPresetId, setHoldingPresetId] = useState<string | null>(null);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [feedback, setFeedback] = useState<{ presetId: string; message: string } | null>(null);

  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Split long-press / touch handler refs
  const splitHoldTimerRef = useRef<NodeJS.Timeout | null>(null);
  const splitHoldStartRef = useRef<number>(0);
  const [isHoldingSplit, setIsHoldingSplit] = useState<boolean>(false);
  const didTriggerSplitLongPress = useRef<boolean>(false);

  const handleSplitPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    splitHoldStartRef.current = Date.now();
    didTriggerSplitLongPress.current = false;
    setIsHoldingSplit(true);

    splitHoldTimerRef.current = setTimeout(() => {
      didTriggerSplitLongPress.current = true;
      setIsHoldingSplit(false);
      if (onOpenSplitModal) {
        onOpenSplitModal();
      }
    }, 450);
  };

  const handleSplitPointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    if (splitHoldTimerRef.current) {
      clearTimeout(splitHoldTimerRef.current);
      splitHoldTimerRef.current = null;
    }
    setIsHoldingSplit(false);

    if (!didTriggerSplitLongPress.current) {
      // Short tap: Toggle Split ON / OFF directly!
      if (onToggleSplit) {
        onToggleSplit();
      }
    }
    didTriggerSplitLongPress.current = false;
  };

  const handleSplitPointerCancel = () => {
    if (splitHoldTimerRef.current) {
      clearTimeout(splitHoldTimerRef.current);
      splitHoldTimerRef.current = null;
    }
    setIsHoldingSplit(false);
    didTriggerSplitLongPress.current = false;
  };

  // 1-second hold to toggle layer ON / OFF
  const HOLD_DURATION_MS = 1000;

  // Four built-in instruments per page.
  const startIndex = (currentPage - 1) * 4;
  const pagePresets = allPresets.slice(startIndex, startIndex + 4);

  // Active preset IDs
  const activePresetMap = new Map<string, number>();
  layers.forEach((l) => {
    if (l.enabled && l.presetId) {
      activePresetMap.set(l.presetId, l.id);
    }
  });

  const handlePointerDown = (preset: SoundPreset) => {
    setHoldingPresetId(preset.id);
    startTimeRef.current = Date.now();
    setHoldProgress(0);

    const isCurrentlyActive = activePresetMap.has(preset.id);

    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, Math.round((elapsed / HOLD_DURATION_MS) * 100));
      setHoldProgress(pct);
    }, 25);

    holdTimerRef.current = setTimeout(() => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setHoldProgress(100);

      onToggleLayerSound(preset);
      setFeedback({
        presetId: preset.id,
        message: isCurrentlyActive ? 'LAYER OFF' : 'LAYER ON',
      });
      setHoldingPresetId(null);
      setHoldProgress(0);

      setTimeout(() => setFeedback(null), 1200);
    }, HOLD_DURATION_MS);
  };

  const handlePointerUp = (preset: SoundPreset, triggeredClick = true) => {
    const elapsed = Date.now() - startTimeRef.current;
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);

    setHoldingPresetId(null);
    setHoldProgress(0);

    // Quick tap (< 350ms): Single sound selection
    if (triggeredClick && elapsed < 350) {
      onSelectSingleSound(preset);
    }
  };

  const slots = pagePresets.map((preset, i) => ({ index: i + 1, preset }));

  return (
    <div className="w-full h-full min-h-0 flex flex-col gap-1 p-1 bg-[#111a29] text-zinc-100 font-mono overflow-hidden">
      {/* Top Banner (Identical to BankView / MAIN) */}
      <div className="flex items-center justify-between pb-1 border-b border-[#2b2f3a] text-xs shrink-0 px-0.5">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 font-bold text-[9px] sm:text-[10px] tracking-wide">
            HALAMAN {currentPage} · {allPresets.length} SOUNDFONT
          </span>
        </div>
        <div className="text-[10px] font-bold text-amber-400 bg-[#202530] px-2 py-0.5 rounded border border-[#353d50]">
          AKTIF: {layers.filter((l) => l.enabled).length} / 4 LAYER
        </div>
      </div>

      {/* Main 8 Preset Slots Grid - Exactly matched with BankView (MAIN) layout */}
      <div className="grid grid-cols-2 grid-rows-2 gap-1 flex-1 min-h-0 py-1 overflow-hidden">
        {slots.map((slot) => {
          const preset = slot.preset;
          const isSlotActive = preset && activePresetMap.has(preset.id);
          const layerNumber = preset ? activePresetMap.get(preset.id) : undefined;
          const isHolding = preset && holdingPresetId === preset.id;
          const activeFeedback = preset && feedback?.presetId === preset.id ? feedback.message : null;


          // Empty slot displays exactly like BankView
          if (!preset) {
            return (
              <div
                key={slot.index}
                className="relative flex items-center justify-between min-h-0 px-2 py-0.5 rounded-md border border-[#2b2f38] bg-[#1d1f27]/80 select-none shadow-sm overflow-hidden"
              >
                <div className="flex items-center gap-2 truncate z-10 mr-1">
<div className="truncate">
                    <span className="font-mono text-xs font-bold tracking-wide text-zinc-500">
                      [KOSONG]
                    </span>
                  </div>
                </div>

                <div className="shrink-0 text-right z-10">
                  <span className="text-[8px] text-zinc-500 bg-[#12141a] px-1.5 py-0.5 rounded border border-[#262933]">
                    EMPTY
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div
              key={preset.id}
              onPointerDown={() => handlePointerDown(preset)}
              onPointerUp={() => handlePointerUp(preset, true)}
              onPointerLeave={() => handlePointerUp(preset, false)}
              onContextMenu={(e) => e.preventDefault()}
              className={`relative flex items-center justify-between px-2.5 py-1 sm:py-1.5 rounded-lg border-2 cursor-pointer select-none transition-all overflow-hidden ${
                activeFeedback
                  ? activeFeedback === 'LAYER ON'
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black border-white font-extrabold shadow-[0_0_20px_#f59e0b]'
                    : 'bg-zinc-800 text-amber-300 border-amber-500 font-extrabold'
                  : isSlotActive
                  ? 'bg-gradient-to-r from-white via-zinc-100 to-zinc-200 text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.7)] font-black'
                  : 'bg-gradient-to-r from-[#2f2b38] to-[#3a3545] border-[#4b4356] text-zinc-100 hover:border-[#6f6380] hover:brightness-110 shadow-md'
              }`}
            >
              {/* 1-Second Hold Progress Bar */}
              {isHolding && (
                <div
                  className={`absolute inset-0 transition-all pointer-events-none ${
                    isSlotActive ? 'bg-amber-500/40' : 'bg-emerald-500/40'
                  }`}
                  style={{ width: `${holdProgress}%` }}
                />
              )}

              {/* Instrument name only */}
              <div className="flex items-center gap-2 truncate mr-1 z-10">
<div className="truncate flex flex-col">
{/* Preset Name */}
                  <span
                    className={`font-sans text-[10px] sm:text-xs font-semibold tracking-normal truncate ${
                      isSlotActive ? 'text-black font-extrabold' : 'text-zinc-100'
                    }`}
                  >
                    {preset.name}
                  </span>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="shrink-0 z-10 text-right">
                {isHolding ? (
                  <span
                    className={`text-[9px] font-extrabold animate-pulse ${
                      isSlotActive ? 'text-red-600' : 'text-amber-300'
                    }`}
                  >
                    {isSlotActive ? 'OFF...' : 'ON...'}
                  </span>
                ) : activeFeedback ? (
                  <span className="text-[9px] font-extrabold font-mono">
                    {activeFeedback}
                  </span>
                ) : isSlotActive ? (
                  <span className="text-[8px] sm:text-[9px] bg-black text-yellow-300 font-extrabold px-1.5 py-0.5 rounded shadow-[0_0_6px_rgba(0,0,0,0.5)]">
                    LAYER {layerNumber}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Hardware Control Bar: Split (Tap ON/OFF, Hold Setup), Transpose Button, [- 0 +] Semitone/Octave Bar, Engine Info */}
      <div className="flex items-center justify-between pt-1 border-t border-[#252834] text-xs shrink-0 px-0.5 sm:px-1 gap-1">
        {/* Left Side: Split Button & Transpose Button side by side */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Split Button: Tap to Toggle ON/OFF, Hold for Settings Modal */}
          <button
            onPointerDown={handleSplitPointerDown}
            onPointerUp={handleSplitPointerUp}
            onPointerLeave={handleSplitPointerCancel}
            onPointerCancel={handleSplitPointerCancel}
            onContextMenu={(e) => e.preventDefault()}
            className={`relative flex items-center gap-1 sm:gap-1.5 px-1.5 py-0.5 rounded border transition-all active:scale-95 shadow select-none ${
              splitSettings?.enabled
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black border-yellow-200 font-black shadow-[0_0_10px_#f59e0b]'
                : 'bg-[#181a22] text-zinc-300 border-[#2b3140] hover:border-zinc-400'
            }`}
            title="Sentuh untuk ON/OFF. Tahan lama untuk pengaturan Split"
          >
            <div
              className={`w-2 h-2 rounded-full border border-black shrink-0 ${
                splitSettings?.enabled ? 'bg-black animate-ping' : 'bg-red-500'
              }`}
            />
            <span className="text-[9px] sm:text-[10px] font-mono font-bold tracking-tight">
              {isHoldingSplit ? 'SETUP...' : `SPLIT: ${splitSettings?.enabled ? 'ON' : 'OFF'}`}
            </span>
          </button>

          {/* Transpose Activator Button (Sebelah Split): Pengaktif saja, proses transpose via tombol -+ */}
          <button
            onClick={onToggleTransposeActive}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded border transition-all active:scale-95 shadow select-none ${
              isTransposeActive
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black border-yellow-200 font-black shadow-[0_0_10px_#f59e0b]'
                : 'bg-[#181a22] text-zinc-300 border-[#2b3140] hover:border-zinc-400'
            }`}
            title="Pengaktif Mode Transpose. Saat aktif, tombol [-][+] di samping mengatur Transpose Semitone"
          >
            <div
              className={`w-2 h-2 rounded-full border border-black shrink-0 ${
                isTransposeActive ? 'bg-black animate-ping' : 'bg-zinc-600'
              }`}
            />
            <span className="text-[9px] sm:text-[10px] font-mono font-bold tracking-tight">
              TRNS: {isTransposeActive ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Center: Dedicated [- 0 +] Bar (Transpose Semitone when TRNS active, or Master Octave when inactive) */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-[#0c0d12] p-0.5 rounded-md border border-[#2b303d] shadow-inner shrink-0">
          {/* Minus Button */}
          <button
            onClick={() => {
              if (isTransposeActive) {
                onTransposeChange?.(-1);
              } else {
                onOctaveChange?.(-1);
              }
            }}
            className="w-6 h-6 rounded bg-gradient-to-b from-[#2b2f3c] to-[#1a1c24] hover:from-[#3a3f50] hover:to-[#222530] active:scale-95 text-zinc-100 border border-[#3d4455] font-black text-xs sm:text-sm flex items-center justify-center shadow transition-all select-none"
            title={isTransposeActive ? 'Turunkan 1 Semitone (-1st)' : 'Turunkan 1 Oktaf (-12 Semitone)'}
          >
            -
          </button>

          {/* Center Display: Shows Transpose or Octave value, tap to reset */}
          <button
            onClick={() => {
              if (isTransposeActive) {
                onTransposeReset?.();
              } else {
                onOctaveReset?.();
              }
            }}
            className={`min-w-11 h-6 px-1.5 rounded font-mono font-black text-[10px] sm:text-xs flex items-center justify-center border transition-all select-none ${
              (isTransposeActive ? masterTranspose !== 0 : masterOctave !== 0)
                ? 'bg-gradient-to-b from-amber-400 to-yellow-500 text-black border-yellow-200 shadow-[0_0_10px_#f59e0b]'
                : 'bg-[#15171f] text-zinc-200 border-[#2b303c]'
            }`}
            title={
              isTransposeActive
                ? `Transpose: ${masterTranspose > 0 ? `+${masterTranspose}` : masterTranspose}st. Klik untuk reset`
                : `Oktaf: ${masterOctave > 0 ? `+${masterOctave}` : masterOctave}. Klik untuk reset`
            }
          >
            {isTransposeActive
              ? `TR: ${masterTranspose > 0 ? `+${masterTranspose}` : masterTranspose}`
              : `OCT: ${masterOctave > 0 ? `+${masterOctave}` : masterOctave}`}
          </button>

          {/* Plus Button */}
          <button
            onClick={() => {
              if (isTransposeActive) {
                onTransposeChange?.(1);
              } else {
                onOctaveChange?.(1);
              }
            }}
            className="w-7 sm:w-8 h-6 rounded bg-gradient-to-b from-[#2b2f3c] to-[#1a1c24] hover:from-[#3a3f50] hover:to-[#222530] active:scale-95 text-zinc-100 border border-[#3d4455] font-black text-xs sm:text-sm flex items-center justify-center shadow transition-all select-none"
            title={isTransposeActive ? 'Naikkan 1 Semitone (+1st)' : 'Naikkan 1 Oktaf (+12 Semitone)'}
          >
            +
          </button>
        </div>

        {/* Right: Layer Engine Badge */}
        <div className="hidden sm:block text-[9px] font-mono text-[#86e2a2] bg-[#12161f] px-2 py-0.5 rounded border border-[#252f42] font-bold shrink-0">
          4 LAYER ENGINE
        </div>
      </div>
    </div>
  );
};
