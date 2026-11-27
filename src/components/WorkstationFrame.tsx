import React, { useEffect, useRef, useState } from 'react';
import { ViewMenu } from '../types/synth';
import { audioEngine } from '../audio/audioEngine';
import { Keyboard, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface WorkstationFrameProps {
  currentView: ViewMenu;
  onSelectView: (view: ViewMenu) => void;
  currentPage: number;
  totalPages: number;
  onSelectPage: (page: number) => void;
  isPianoVisible: boolean;
  onTogglePiano: () => void;
  onOpenSplit: () => void;
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
  onOpenSplit,
  children,
  midiActive,
  masterOctave = 0,
  masterTranspose = 0,
}) => {
  const [meterL, setMeterL] = useState(0);
  const [meterR, setMeterR] = useState(0);
  const [peakL, setPeakL] = useState(0);
  const [peakR, setPeakR] = useState(0);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const pageScrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animId: number;
    const updateMeters = () => {
      const levels = audioEngine.getMeterLevels();
      setMeterL(levels.left);
      setMeterR(levels.right);
      setPeakL((peak) => levels.left >= peak ? levels.left : Math.max(0, peak - 0.65));
      setPeakR((peak) => levels.right >= peak ? levels.right : Math.max(0, peak - 0.65));
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
    { id: 'MP3', label: 'Mp3' },
    { id: 'SCALE', label: 'Scala', badge: 'yellow' },
    { id: 'EFX', label: 'Effects' },
    { id: 'TERCIA', label: 'Terca' },
    { id: 'MIXER', label: 'Mixer' },
    { id: 'LOAD', label: 'LOAD' },
    { id: 'BANK', label: 'MAIN' },
    { id: 'LIST', label: 'LIST' },
  ];

  const pageNumbers = Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1);

  return (
    <div className="w-screen h-screen bg-[#141619] text-zinc-100 font-sans flex flex-col select-none overflow-hidden p-1 sm:p-1.5">
      {/* Outer Heavy Bezel (Juzisound dark brushed metal styling from Image 1 & 2) */}
      <div className="flex-1 border-2 sm:border-[3px] border-[#252830] rounded-lg sm:rounded-xl bg-[#181a20] shadow-[0_0_35px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden relative">
        
        {/* TOP HARDWARE BAR (Modeled exactly after Image 1) */}
        <div className="h-7 sm:h-8 bg-gradient-to-b from-[#22242a] via-[#1c1e24] to-[#16171d] border-b border-[#2d313b] flex items-center justify-between px-1.5 sm:px-2 relative z-10 shrink-0">
          
          {/* Left: Branding & Hardware Status Box */}
          <div className="flex items-center gap-1.5 shrink-0">
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

          </div>

          {/* Center: Juzisound Dynamic Pagination (1 in Yellow, 2 3 4... in Deep Cobalt Blue) */}
          <div className="flex items-center gap-1 max-w-[50%] sm:max-w-[58%] md:max-w-[65%] overflow-hidden">
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
              <span>{String(currentPage * 10 - 9).padStart(4, '0')}</span>
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

            <button onClick={() => setShowMoreMenu(v => !v)} className={`p-1.5 border ${showMoreMenu ? 'bg-emerald-500 text-black border-emerald-200' : 'bg-[#1e222a] text-zinc-200 border-[#383d4a]'}`} title="Menu tambahan" aria-label="Buka menu tambahan"><ChevronDown size={14} /></button>
          </div>
        </div>

        {showMoreMenu && <div className="absolute top-8 right-2 z-40 w-48 border border-[#4d936b] bg-gradient-to-b from-[#202a25] to-[#101713] p-1.5 shadow-[0_8px_25px_rgba(0,0,0,.8)]"><div className="px-2 py-1 text-[8px] font-bold tracking-widest text-emerald-300 border-b border-[#344b3d]">MENU TAMBAHAN</div>{[{label:'SYNTH / SOUND EDITOR',action:()=>onSelectView('SYNTH')},{label:'FX RACK',action:()=>onSelectView('EFX')},{label:'MIXER / MASTER EQ',action:()=>onSelectView('MIXER')},{label:'KEYBOARD SPLIT',action:onOpenSplit},{label:'SCALE TUNING',action:()=>onSelectView('SCALE')}].map(item=><button key={item.label} onClick={()=>{item.action();setShowMoreMenu(false)}} className="w-full text-left px-2 py-2 mt-1 border border-[#3f6c50] bg-gradient-to-b from-[#2d7048] to-[#17432e] text-[9px] font-bold text-emerald-50 hover:brightness-125">{item.label}</button>)}</div>}
        {/* WORKSTATION MAIN BODY */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* LEFT SIDE: slim Juzisound-style stereo LED meter with white peak-hold caps */}
          <div className="w-[15px] sm:w-[17px] bg-[#08090b] border-r border-[#292b30] flex flex-col items-center justify-between py-1 px-[2px] select-none shrink-0">
            <span className="text-[6px] leading-none font-mono font-bold text-zinc-500">0</span>
            <div className="flex-1 flex items-stretch justify-center gap-[2px] w-full my-1">
              {[{label:'L',level:meterL,peak:peakL},{label:'R',level:meterR,peak:peakR}].map((channel) => (
                <div key={channel.label} className="relative flex-1 h-full bg-[#101713] border border-[#202a24] overflow-hidden flex flex-col-reverse justify-start">
                  {Array.from({length:32},(_,i)=>{
                    const threshold=(i+1)/32*100;
                    const lit=channel.level>=threshold;
                    const color=i>=28?'#f04444':i>=22?'#e7d34b':'#43b86b';
                    return <div key={i} className="w-full flex-1 border-t border-black/70" style={{background:lit?color:"#172019",boxShadow:lit?"0 0 3px "+color:"none"}} />;
                  })}
                  <div className="absolute left-0 right-0 h-[2px] bg-white shadow-[0_0_4px_#fff] z-10" style={{bottom:(Math.min(100,channel.peak)-1)+"%"}} />
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-1 w-full text-[6px] leading-none font-mono font-bold text-zinc-400"><span>L</span><span>R</span></div>
          </div>
          {/* CENTER VIEWPORT (Dark gunmetal tone, smooth scrolling when KEY is open) */}
          <div
            className={`flex-1 bg-[#16181f] flex flex-col relative transition-all ${
              isPianoVisible
                ? 'overflow-y-auto pb-28 sm:pb-32 scroll-smooth'
                : 'overflow-hidden'
            }`}
          >
            {children}
          </div>

          {/* RIGHT SIDE MENU (Exact Juzisound Bevelled Metallic Buttons from Image 1 & 2) */}
          <div className="w-14 sm:w-[68px] md:w-[76px] bg-gradient-to-b from-[#181a20] via-[#14161b] to-[#101215] border-l border-[#262a33] flex flex-col justify-between p-1 sm:p-1 gap-0.5 select-none shrink-0 shadow-inner">
            {rightMenuItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  className={`relative flex-1 flex flex-col items-center justify-center rounded-[3px] font-mono text-[9px] sm:text-[10px] tracking-tight transition-all shadow-md border-b-2 ${
                    isActive
                      ? 'bg-gradient-to-b from-[#65c58b] via-[#27965a] to-[#17663d] text-white font-black border border-[#9be7b6] shadow-[0_0_10px_rgba(34,197,94,0.35)] transform scale-[1.02]'
                      : 'bg-gradient-to-b from-[#397d57] via-[#286b47] to-[#17452f] text-[#e2f5e8] border border-[#4d936b] hover:brightness-110 hover:text-white font-bold active:scale-98'
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
