import React from 'react';

interface TerciaViewProps {
  enabled: boolean;
  interval: number;
  onEnabledChange: (value: boolean) => void;
  onIntervalChange: (value: number) => void;
}

const intervals = [
  { value: 3, label: 'Minor 3rd' },
  { value: 4, label: 'Major 3rd' },
  { value: 5, label: 'Perfect 4th' },
  { value: 7, label: 'Perfect 5th' },
  { value: 8, label: 'Minor 6th' },
  { value: 9, label: 'Major 6th' },
  { value: 12, label: 'Octave' },
];

export const TerciaView: React.FC<TerciaViewProps> = ({ enabled, interval, onEnabledChange, onIntervalChange }) => (
  <div className="h-full w-full flex flex-col bg-[#111419] text-zinc-200 p-2 sm:p-3 gap-3 overflow-y-auto">
    <div className="flex items-center justify-between border-b border-[#343943] pb-2">
      <div>
        <div className="text-xs font-bold tracking-[0.18em] text-amber-300">HARMONY GENERATOR</div>
        <div className="text-[10px] text-zinc-500 mt-1">TERCIA / NOTE INTERVAL</div>
      </div>
      <button onClick={() => onEnabledChange(!enabled)} className={`px-5 py-2 rounded-[3px] border text-xs font-black tracking-wider shadow-md ${enabled ? 'bg-gradient-to-b from-[#f4d36a] to-[#a87518] text-black border-[#ffe69a]' : 'bg-gradient-to-b from-[#292d34] to-[#171a20] text-zinc-400 border-[#454b55]'}`}>
        {enabled ? 'HARMONY ON' : 'HARMONY OFF'}
      </button>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {intervals.map((item) => (
        <button key={item.value} onClick={() => onIntervalChange(item.value)} className={`min-h-14 rounded-[3px] border px-2 py-2 text-left shadow-inner ${interval === item.value ? 'border-amber-300 bg-gradient-to-b from-[#5b4924] to-[#282016] text-amber-100' : 'border-[#3a4049] bg-gradient-to-b from-[#292d34] to-[#181b21] text-zinc-300'}`}>
          <span className="block text-[10px] font-bold">{item.label}</span>
          <span className="block text-[9px] text-zinc-500 mt-1">+{item.value} semitones</span>
        </button>
      ))}
    </div>
    <div className="mt-auto border border-[#303640] bg-[#0b0e12] p-2 rounded-[3px] text-[10px] leading-relaxed text-zinc-500">
      When enabled, each played note triggers a second note at the selected interval. The harmony follows the played pitch and transpose setting.
    </div>
  </div>
);
