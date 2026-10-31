import React, { useEffect, useRef, useState } from 'react';
import { ViewMenu } from '../types/synth';
import { audioEngine } from '../audio/audioEngine';
import { Maximize2, Minimize2, Keyboard, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const pageScrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animId: number;
    const updateMeters = () => {
      const levels = audioEngine.getMeterLevels();
      setMeterL(levels.left);
      setMeterR(levels.right);
      animId = requestAnimationFrame(updateMeters);
    };
    animId = requestAnimationFrame(updateMeters);
    return () => cancelAnimationFrame(animId);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

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
    <div className="w-screen h-[100dvh] bg-[#0b1019] text-zinc-100 font-sans flex flex-col select-none overflow-hidden p-1">
      {/* Outer Heavy Bezel (Juzisound dark brushed metal styling from Image 1 & 2) */}
      <div className="flex-1 border border-[#303b4d] rounded-xl bg-[#121a27] shadow-[0_12px_36px_rgba(0,0,0,0.45)] flex flex-col overflow-hidden relative">
        
        {/* TOP HARDWARE BAR (Modeled exactly after Image 1) */}
        <div className="h-9 min-h-9 bg-[#182235] border-b border-[#34415a] flex items-center justify-between gap-1 px-1.5 sm:px-2 relative z-10 shrink-0">
          
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
                        ? 'bg-gradient-to-b from-yellow-300 to-amber-400 text-black border border-yellow-200 shadow-[0_0_10px_rgba(250,204,21,0.7)] font-black scale-105'
                        : 'bg-[#1a388b] text-white border border-[#2b4fae] hover:bg-[#2246a8]'
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

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-1 rounded bg-[#1e222a] text-zinc-300 border border-[#383d4a] hover:border-zinc-500 active:scale-95"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            </button>
          </div>
        </div>

        {/* WORKSTATION MAIN BODY */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* LEFT SIDE: Authentic Juzisound Dual Channel Full-Height Peak Meter */}
          <div className="w-3.5 bg-[#0d0e12] border-r border-[#262a33] flex flex-col justify-between items-center py-1 px-0.5 select-none shrink-0">
            {/* Top Peak Value Header */}
            <span className="text-[8px] font-mono font-black text-red-500 tracking-tighter">
              -10
            </span>

            {/* Segmented Dual LED Meter Bars (Green -> Yellow -> Red -> Striped Peak at top) */}
            <div className="flex-1 flex justify-center items-end gap-1 my-1 w-full px-0.5">
              {/* L Channel */}
              <div className="flex-1 h-full bg-[#08090b] rounded-[1px] border border-[#1f222a] relative overflow-hidden flex flex-col justify-end">
                {/* Diagonal warning stripes top zone (lights up when signal reaches peak) */}
                <div
                  className={`absolute top-0 inset-x-0 h-3 pointer-events-none z-10 transition-opacity duration-100 ${
                    meterL > 88
                      ? 'opacity-100 bg-[repeating-linear-gradient(45deg,#ff1744,#ff1744_2px,#000_2px,#000_4px)] shadow-[0_0_8px_#ff1744]'
                      : 'opacity-35 bg-[repeating-linear-gradient(45deg,#ef4444,#ef4444_2px,#000_2px,#000_4px)]'
                  }`}
                />
                
                {/* Dynamic LED Fill with full-height responsiveness reaching 100% */}
                <div
                  className="w-full bg-gradient-to-t from-[#00e676] via-[#ffeb3b] to-[#ff1744] transition-all duration-75 shadow-[0_0_8px_rgba(255,23,68,0.7)]"
                  style={{ height: `${Math.min(100, meterL)}%` }}
                />

                {/* Horizontal LED tick segmentation overlay */}
                <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent,transparent_2px,#000_2px,#000_3px)] opacity-55 pointer-events-none" />
              </div>

              {/* R Channel */}
              <div className="flex-1 h-full bg-[#08090b] rounded-[1px] border border-[#1f222a] relative overflow-hidden flex flex-col justify-end">
                {/* Diagonal warning stripes top zone */}
                <div
                  className={`absolute top-0 inset-x-0 h-3 pointer-events-none z-10 transition-opacity duration-100 ${
                    meterR > 88
                      ? 'opacity-100 bg-[repeating-linear-gradient(45deg,#ff1744,#ff1744_2px,#000_2px,#000_4px)] shadow-[0_0_8px_#ff1744]'
                      : 'opacity-35 bg-[repeating-linear-gradient(45deg,#ef4444,#ef4444_2px,#000_2px,#000_4px)]'
                  }`}
                />

                {/* Dynamic LED Fill */}
                <div
                  className="w-full bg-gradient-to-t from-[#00e676] via-[#ffeb3b] to-[#ff1744] transition-all duration-75 shadow-[0_0_8px_rgba(255,23,68,0.7)]"
                  style={{ height: `${Math.min(100, meterR)}%` }}
                />

                {/* Horizontal LED tick segmentation overlay */}
                <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent,transparent_2px,#000_2px,#000_3px)] opacity-55 pointer-events-none" />
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
            className={`flex-1 min-w-0 min-h-0 bg-[#121a27] flex flex-col relative transition-all ${
              isPianoVisible
                ? 'overflow-y-auto pb-28 sm:pb-32 scroll-smooth'
                : 'overflow-hidden'
            }`}
          >
            {children}
          </div>

          {/* RIGHT SIDE MENU (Exact Juzisound Bevelled Metallic Buttons from Image 1 & 2) */}
          <div className="w-[48px] sm:w-[52px] bg-[#111a29] border-l border-[#34415a] flex flex-col justify-between p-1 gap-1 select-none shrink-0">
            {rightMenuItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  className={`relative flex-1 min-h-0 flex flex-col items-center justify-center rounded-md font-mono text-[8px] sm:text-[9px] tracking-tight transition-all ${
                    isActive
                      ? 'bg-amber-400 text-[#111827] font-black border border-amber-200 shadow-[0_3px_12px_rgba(245,158,11,0.22)]'
                      : 'bg-[#202d42] text-[#c5d2e4] border border-[#3a4b65] hover:bg-[#293a55] hover:text-white font-bold active:scale-95'
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
