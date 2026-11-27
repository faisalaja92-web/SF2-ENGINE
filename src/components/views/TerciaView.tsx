import React from 'react';
import { HarmonyMode, HarmonyScale } from '../../audio/terciaHarmony';

interface TerciaViewProps {
  enabled: boolean;
  mode: HarmonyMode;
  root: number;
  scale: HarmonyScale;
  onEnabledChange: (value: boolean) => void;
  onModeChange: (value: HarmonyMode) => void;
  onRootChange: (value: number) => void;
  onScaleChange: (value: HarmonyScale) => void;
}

const ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const panel = 'rounded-[3px] border border-[#3a4049] bg-gradient-to-b from-[#292d34] to-[#181b21] text-zinc-300 shadow-inner';
const active = 'border-amber-300 bg-gradient-to-b from-[#5b4924] to-[#282016] text-amber-100';

export const TerciaView: React.FC<TerciaViewProps> = ({
  enabled, mode, root, scale, onEnabledChange, onModeChange, onRootChange, onScaleChange,
}) => (
  <div className="h-full w-full flex flex-col bg-[#111419] text-zinc-200 p-2 sm:p-3 gap-2 overflow-y-auto font-mono">
    <div className="flex items-center justify-between border-b border-[#343943] pb-2 shrink-0">
      <div>
        <div className="text-xs font-bold tracking-[0.18em] text-amber-300">TERCIA HARMONY</div>
        <div className="text-[9px] text-zinc-500 mt-1">DIATONIC NOTE GENERATOR</div>
      </div>
      <button onClick={() => onEnabledChange(!enabled)} className={`px-4 py-2 rounded-[3px] border text-[10px] font-black tracking-wider shadow-md ${enabled ? 'bg-gradient-to-b from-[#f4d36a] to-[#a87518] text-black border-[#ffe69a]' : panel}`}>
        {enabled ? 'HARMONY ON' : 'HARMONY OFF'}
      </button>
    </div>
    <section className="grid grid-cols-2 gap-2 shrink-0">
      <div className="flex flex-col gap-1">
        <label className="text-[9px] text-zinc-500 font-bold">HARMONY MODE</label>
        <button onClick={() => onModeChange(mode === 'SCALE' ? 'CHORD' : 'SCALE')} className={`${panel} px-2 py-3 text-[11px] font-bold ${active}`}>
          {mode === 'SCALE' ? 'SCALE 3RD' : 'CHORD 3RD + 5TH'}
        </button>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[9px] text-zinc-500 font-bold">SCALE TYPE</label>
        <button onClick={() => onScaleChange(scale === 'MAJOR' ? 'MINOR' : 'MAJOR')} className={`${panel} px-2 py-3 text-[11px] font-bold `}>
          {scale === 'MAJOR' ? 'MAJOR' : 'NATURAL MINOR'}
        </button>
      </div>
    </section>
    <section className="flex flex-col gap-1 shrink-0">
      <label className="text-[9px] text-zinc-500 font-bold">ROOT KEY</label>
      <div className="grid grid-cols-6 gap-1">
        {ROOTS.map((name, index) => (
          <button key={name} onClick={() => onRootChange(index)} className={`py-2 rounded-[3px] border text-[10px] font-bold ${root === index ? 'border-amber-300 bg-gradient-to-b from-[#f4d36a] to-[#a87518] text-black' : panel}`}>{name}</button>
        ))}
      </div>
    </section>
    <div className="mt-auto border border-[#303640] bg-[#0b0e12] p-2 rounded-[3px] text-[9px] leading-relaxed text-zinc-500">
      SCALE 3RD adds one diatonic third. CHORD 3RD + 5TH adds two harmony notes. Notes follow the selected major or natural minor scale and root key. Notes outside the scale are harmonized from the nearest lower scale degree.
    </div>
  </div>
);
