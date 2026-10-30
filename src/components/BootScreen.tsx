import React, { useState, useEffect } from 'react';

interface BootScreenProps {
  onComplete: () => void;
}

export const BootScreen: React.FC<BootScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 14 + 10;
      if (current >= 100) {
        current = 100;
        setProgress(100);
        clearInterval(interval);
        setTimeout(() => {
          onComplete();
        }, 350);
      } else {
        setProgress(Math.floor(current));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div
      onClick={onComplete}
      className="fixed inset-0 z-50 bg-[#040605] flex flex-col items-center justify-center select-none cursor-pointer overflow-hidden px-4 py-2 font-mono"
    >
      {/* Subtle warm glow background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(234,179,8,0.1)_0%,_transparent_70%)] pointer-events-none" />

      {/* Main compact center container (Optimized for Mobile Landscape) */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-3 max-w-xs sm:max-w-sm w-full">
        {/* Title: SoundFont Engine in clean gold */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-wider bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] uppercase">
          SoundFont Engine
        </h1>

        {/* Minimalist Arranger Loading Bar */}
        <div className="w-full space-y-1.5">
          <div className="relative h-2 w-full bg-zinc-950 border border-amber-600/50 rounded-full p-[1px] overflow-hidden shadow-[0_0_10px_rgba(234,179,8,0.2)]">
            <div
              className="h-full bg-gradient-to-r from-yellow-600 via-amber-400 to-yellow-200 rounded-full transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-amber-400/80 font-bold tracking-widest">
            <span>LOADING...</span>
            <span>{progress}%</span>
          </div>
        </div>

        {/* Subtitle / Creator Signature: Created by BangFai 2026 */}
        <div className="pt-1 text-xs text-amber-400/90 tracking-wide font-medium">
          Created by BangFai 2026
        </div>
      </div>
    </div>
  );
};
