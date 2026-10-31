import React, { useEffect, useRef, useState } from 'react';
import { ViewMenu } from '../types/synth';
import { audioEngine } from '../audio/audioEngine';
import { Keyboard, ChevronLeft, ChevronRight } from 'lucide-react';

interface WorkstationFrameProps {
  currentView: ViewMenu;
  onSelectView: (view: ViewMenu) => void;
  currentPage: number;
  totalPages: number;
  onSelectPage: (page: number) => void;
  isPianoVisible: boolean;
  onTogglePiano: () => void;
  children: React.ReactNode;
  midiActive: boolean;
  masterOctave?: number;
  masterTranspose?: number;
}

export const WorkstationFrame: React.FC<WorkstationFrameProps> = ({
  currentView,
  onSelectView,
  currentPage,
  totalPages,
  onSelectPage,
  isPianoVisible,
  onTogglePiano,
  children,
  midiActive,
  masterOctave = 0,
  masterTranspose = 0,
}) => {
  const [meterL, setMeterL] = useState(0);
  const [meterR, setMeterR] = useState(0);
  const meterEnvelope = useRef({ left: 0, right: 0 });
  const pageScrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animId: number;
    const updateMeters = () => {
      const levels = audioEngine.getMeterLevels();
      const smooth = (current: number, target: number) => target >= current
        ? current + (target - current) * 0.72
        : Math.max(0, current - Math.max(0.10, current * 0.012));
      const left = smooth(meterEnvelope.current.left, levels.left);
      const right = smooth(meterEnvelope.current.right, levels.right);
      meterEnvelope.current = { left, right };
      setMeterL(Math.round(left));
      setMeterR(Math.round(right));
      animId = requestAnimationFrame(updateMeters);
    };
    animId = requestAnimationFrame(updateMeters);
    return () => cancelAnimationFrame(animId);
  }, []);



  const scrollPages = (direction: 'left' | 'right') => {
    if (pageScrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -140 : 140;
      pageScrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Right sidebar menu exactly modeled after Juzisound in Image 1 & 2
  const rightMenuItems: { id: ViewMenu; label: string; badge?: string }[] = [
    { id: 'MP3', label: 'MP3' },
    { id: 'SCALE', label: 'SCALE', badge: 'yellow' },
    { id: 'EFX', label: 'EFX' },
    { id: 'MIXER', label: 'MIX' },
    { id: 'LOAD', label: 'LOAD' },
    { id: 'BANK', label: 'BANK' },
    { id: 'LIST', label: 'LIST' },
  ];

  const pageNumbers = Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1);

  return (
    <div className="w-screen h-[100dvh] bg-[#080f0b] text-zinc-100 font-sans flex flex-col select-none overflow-hidden p-1">
      {/* Outer Heavy Bezel (Juzisound dark brushed metal styling from Image 1 & 2) */}
      <div className="flex-1 border border-[#303b4d] rounded-[7px] bg-[#101b16] shadow-[0_12px_36px_rgba(0,0,0,0.45)] flex flex-col overflow-hidden relative lcd-pixel-screen">
        
        {/* TOP HARDWARE BAR (Modeled exactly after Image 1) */}
        <div className="h-9 min-h-9 bg-[#17251b] border-b border-[#3b5540] flex items-center justify-between gap-1 px-1.5 sm:px-2 relative z-10 shrink-0">
          
          {/* Left: Branding & Hardware Status Box */}
          <div className="flex items-center gap-1 shrink-0 min-w-0">
            {/* Red / Yellow Hardware Status Box (as in Image 1 top left) */}
            <div className="flex items-center gap-1 bg-[#0f1115] px-1.5 py-0.5 rounded border border-[#373c47]">
              <span className="text-[9px] font-mono text-zinc-300 font-bold tracking-tight">
                {masterTranspose !== 0
                  ? `TR:${masterTranspose > 0 ? '+' : ''}${masterTranspose}`
                  : `OCT:${masterOctave > 0 ? '+' : ''}${masterOctave}`}
              </span>
              <div className="w-px h-3 bg-[#2d313b]" />
              <div
                className={`w-2 h-2 rounded-full transition-all duration-75 ${
                  midiActive
                    ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                    : 'bg-red-700/80 shadow-[0_0_4px_#ef4444]'
                }`}
              />
              <span className="text-[8px] font-mono font-bold tracking-wider text-zinc-300">MIDI</span>
            </div>

            {/* Gold Title: SF2 Engine */}
            <span className="font-black text-[10px] sm:text-xs tracking-wide bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(245,158,11,0.6)] ml-1">
              SF2 Engine
            </span>
          </div>

          {/* Center: Juzisound Dynamic Pagination (1 in Yellow, 2 3 4... in Deep Cobalt Blue) */}
          <div className="flex items-center gap-1 max-w-[48%] sm:max-w-[58%] md:max-w-[62%] overflow-hidden">
            {totalPages > 6 && (
              <button
                onClick={() => scrollPages('left')}
                className="w-5 h-6 rounded bg-[#20232b] hover:bg-[#2b303b] text-zinc-300 border border-[#3a3f4d] flex items-center justify-center shrink-0 active:scale-95"
                title="Scroll Halaman"
              >
                <ChevronLeft size={12} />
              </button>
            )}

            <div
              ref={pageScrollContainerRef}
              className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth py-0.5"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {pageNumbers.map((num) => {
                const isCurrent = currentPage === num;
                return (
                  <button
                    key={num}
                    onClick={() => onSelectPage(num)}
                    className={`w-6 sm:w-7 h-6 sm:h-7 rounded text-[10px] sm:text-xs font-mono font-extrabold flex items-center justify-center shrink-0 transition-all ${
                      isCurrent
                        ? 'bg-[#8eae5b] text-[#101a10] border border-[#c4dfa0] font-black'
                        : 'bg-[#203c2a] text-[#d4e2d0] border border-[#456447] hover:bg-[#2c4c32]'
                    }`}
                    title={`Halaman Sound ${num}`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>

            {totalPages > 6 && (
              <button
                onClick={() => scrollPages('right')}
                className="w-5 h-6 rounded bg-[#20232b] hover:bg-[#2b303b] text-zinc-300 border border-[#3a3f4d] flex items-center justify-center shrink-0 active:scale-95"
                title="Scroll Halaman"
              >
                <ChevronRight size={12} />
              </button>
            )}

            {/* Juzisound Bank Selector Badge (e.g. 0000 v) */}
            <div className="hidden md:flex items-center gap-0.5 px-2 py-0.5 rounded bg-[#101b33] border border-[#203a70] text-[#7ea5f8] text-[10px] font-mono font-bold">
              <span>{String(currentPage * 8 - 7).padStart(4, '0')}</span>
              <span className="text-[8px]">▾</span>
            </div>
          </div>

          {/* Top Right: KEY & Fullscreen Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Keyboard Controller Button (KEY) */}
            <button
              onClick={onTogglePiano}
              className={`px-2 py-0.5 rounded border text-xs flex items-center gap-1 transition-all ${
                isPianoVisible
                  ? 'bg-gradient-to-b from-amber-400 to-yellow-500 text-black border-yellow-200 font-black shadow-[0_0_10px_rgba(245,158,11,0.6)]'
                  : 'bg-[#1e222a] text-zinc-300 border-[#383d4a] hover:border-zinc-500'
              }`}
              title="Toggle Keyboard Controller"
            >
              <Keyboard size={12} />
              <span className="text-[10px] font-bold font-mono">KEY</span>
            </button>


          </div>
        </div>

        {/* WORKSTATION MAIN BODY */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* LEFT SIDE: Authentic Juzisound Dual Channel Full-Height Peak Meter */}
          <div className="w-12 sm:w-14 bg-gradient-to-r from-[#080d0a] via-[#18241a] to-[#0a100c] border-r border-[#405b43] shadow-[inset_-3px_0_6px_rgba(0,0,0,0.65),2px_0_5px_rgba(0,0,0,0.35)] flex flex-col justify-between items-center py-1 px-0.5 select-none shrink-0">
            {/* Top Peak Value Header */}
            <span className="text-[8px] font-mono font-black text-red-500 tracking-tighter">
              -10
            </span>

            {/* Segmented Dual LED Meter Bars (Green -> Yellow -> Red -> Striped Peak at top) */}
            <div className="flex-1 flex justify-center items-end gap-1.5 my-1 w-full px-1">
              {/* L Channel */}
              <div className="flex-1 h-full bg-[#080d09] rounded-[1px] border border-[#1f222a] relative overflow-hidden flex flex-col justify-end">
                <div className="absolute inset-0 flex flex-col-reverse gap-[1px] p-[2px] bg-[#071009]">
                  {Array.from({ length: 32 }, (_, i) => {
                    const lit = meterL >= ((i + 1) / 24) * 100;
                    const color = i >= 20 ? '#ff3434' : i >= 15 ? '#ffd52e' : '#21f078';
                    const idle = i >= 20 ? '#351416' : i >= 15 ? '#393216' : '#10301e';
                    return <div key={i} className="w-full flex-1 min-h-[1px]" style={{ backgroundColor: lit ? color : idle }} />;
                  })}
                </div>
              </div>

              {/* R Channel */}
              <div className="flex-1 h-full bg-[#080d09] rounded-[1px] border border-[#1f222a] relative overflow-hidden flex flex-col justify-end">
                <div className="absolute inset-0 flex flex-col-reverse gap-[2px] p-[3px] bg-[#071009]">
                  {Array.from({ length: 24 }, (_, i) => {
                    const lit = meterR >= ((i + 1) / 24) * 100;
                    const color = i >= 20 ? '#ff3434' : i >= 15 ? '#ffd52e' : '#21f078';
                    const idle = i >= 20 ? '#351416' : i >= 15 ? '#393216' : '#10301e';
                    return <div key={i} className="w-full flex-1 min-h-[2px]" style={{ backgroundColor: lit ? color : idle }} />;
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Channel Labels */}
            <div className="flex justify-around w-full text-[8px] font-mono font-bold text-zinc-400 border-t border-[#222630] pt-0.5">
              <span>L</span>
              <span>R</span>
            </div>
          </div>

          {/* CENTER VIEWPORT (Dark gunmetal tone, smooth scrolling when KEY is open) */}
          <div
            className={`flex-1 min-w-0 min-h-0 bg-[#101b16] flex flex-col relative transition-all ${
              isPianoVisible
                ? 'overflow-y-auto pb-28 sm:pb-32 scroll-smooth'
                : 'overflow-hidden'
            }`}
          >
            {children}
          </div>

          {/* RIGHT SIDE MENU (Exact Juzisound Bevelled Metallic Buttons from Image 1 & 2) */}
          <div className="w-[60px] sm:w-[68px] bg-gradient-to-b from-[#1c3021] via-[#142419] to-[#0b150e] border-l border-[#49634b] shadow-[inset_2px_0_5px_rgba(255,255,255,0.035),-3px_0_8px_rgba(0,0,0,0.35)] flex flex-col justify-between p-1 gap-1 select-none shrink-0">
            {rightMenuItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  className={`relative flex-1 min-h-0 flex flex-col items-center justify-center rounded-[5px] font-mono text-[8px] sm:text-[9px] tracking-tight transition-all border-t border-l ${
                    isActive
                      ? 'bg-gradient-to-b from-[#a8c879] via-[#668f4c] to-[#355b35] text-[#101a10] font-black border-[#c4dfa0] shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_-2px_3px_rgba(0,0,0,0.45),0_2px_3px_rgba(0,0,0,0.5)] translate-y-[1px]'
                      : 'bg-gradient-to-b from-[#304b35] via-[#203a27] to-[#14251a] text-[#d1dfca] border-[#4d6a4e] shadow-[inset_0_1px_1px_rgba(255,255,255,0.10),inset_0_-2px_3px_rgba(0,0,0,0.55),0_2px_3px_rgba(0,0,0,0.5)] hover:from-[#3b5b40] hover:text-white font-bold active:translate-y-[2px] active:shadow-inner'
                  }`}
                >
                  {/* Yellow dash LED on Scala like in Image 1 */}
                  {item.badge === 'yellow' && !isActive && (
                    <div className="w-3 h-0.5 bg-yellow-400 rounded-full mb-0.5 shadow-[0_0_4px_#facc15]" />
                  )}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
