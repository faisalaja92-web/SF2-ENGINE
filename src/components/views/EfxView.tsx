import React from 'react';
import { EfxSettings } from '../../types/synth';
import { Power, Activity, Wind, Radio } from 'lucide-react';

interface EfxViewProps {
  efx: EfxSettings;
  onUpdateEfx: (updates: Partial<EfxSettings>) => void;
}

export const EfxView: React.FC<EfxViewProps> = ({ efx, onUpdateEfx }) => {
  const acoustic = efx.acousticEngine;

  return (
    <div className="w-full h-full min-h-0 flex flex-col gap-1 p-1 bg-[#111a29] text-zinc-100 font-sans select-none overflow-hidden">
      {/* Top Header Row (Juzisound style with quick switches) */}
      <div className="flex items-center justify-between pb-1 border-b border-[#2b303d] text-[10px] shrink-0 px-1">
        <div className="flex items-center gap-1.5">
          <Activity size={14} className="text-amber-400" />
          <span className="font-mono font-bold text-xs tracking-wider text-zinc-200">
            DSP EFFECTS &amp; ACOUSTIC ENGINE
          </span>
        </div>

        <div className="flex items-center gap-1 text-[9px] font-mono">
          {/* Mono / Poly Switch */}
          <button
            onClick={() => onUpdateEfx({ mono: !efx.mono })}
            className={`px-2.5 py-0.5 rounded font-bold border transition-all ${
              efx.mono
                ? 'bg-gradient-to-b from-amber-400 to-yellow-500 text-black border-yellow-200 font-black shadow-[0_0_8px_#f59e0b]'
                : 'bg-[#1e222b] text-zinc-400 border-[#2d323f]'
            }`}
          >
            {efx.mono ? 'MONO LEAD' : 'POLY'}
          </button>

          {/* Portamento Switch */}
          <button
            onClick={() => onUpdateEfx({ portamento: !efx.portamento })}
            className={`px-2.5 py-0.5 rounded font-bold border transition-all ${
              efx.portamento
                ? 'bg-gradient-to-b from-amber-400 to-yellow-500 text-black border-yellow-200 font-black shadow-[0_0_8px_#f59e0b]'
                : 'bg-[#1e222b] text-zinc-400 border-[#2d323f]'
            }`}
          >
            PORTA: {efx.portamento ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Terca harmony: compact, touch-friendly performance controls */}
      <section className="shrink-0 grid grid-cols-12 gap-1 my-0.5 rounded-md border border-[#34415a] bg-[#101a2b] px-1.5 py-1">
        <div className="col-span-12 sm:col-span-3 flex items-center gap-2">
          <span className="text-sm font-black tracking-wide text-amber-300">TERCA</span>
          <span className="text-[9px] text-slate-400">HARMONY</span>
          <button
            onClick={() => onUpdateEfx({ tercaEnabled: !efx.tercaEnabled })}
            aria-pressed={!!efx.tercaEnabled}
            className={`ml-auto sm:ml-0 min-w-[48px] min-h-[26px] rounded border px-2 text-[10px] font-black tracking-wide transition-colors ${efx.tercaEnabled ? 'bg-amber-400 text-black border-amber-200' : 'bg-slate-800 text-slate-300 border-slate-600'}`}
          >{efx.tercaEnabled ? 'ON' : 'OFF'}</button>
        </div>
        <div className="col-span-6 sm:col-span-4 flex items-center gap-2">
          <label htmlFor="terca-interval" className="text-[10px] font-bold text-slate-400 whitespace-nowrap">INTERVAL</label>
          <select id="terca-interval" value={efx.tercaInterval || 'minor3'} onChange={(e) => onUpdateEfx({ tercaInterval: e.target.value as EfxSettings['tercaInterval'] })} className="min-h-[26px] flex-1 rounded border border-slate-600 bg-[#1b2638] px-2 text-[11px] font-bold text-white">
            <option value="minor3">Minor 3rd (+3)</option>
            <option value="major3">Major 3rd (+4)</option>
            <option value="perfect5">Perfect 5th (+7)</option>
            <option value="octave">Octave (+12)</option>
          </select>
        </div>
        <div className="col-span-6 sm:col-span-5 flex items-center gap-2">
          <label htmlFor="terca-volume" className="text-[10px] font-bold text-slate-400 whitespace-nowrap">LEVEL</label>
          <input id="terca-volume" aria-label="Terca volume" type="range" min="0" max="1" step="0.05" value={efx.tercaVolume ?? 0.65} onChange={(e) => onUpdateEfx({ tercaVolume: parseFloat(e.target.value) })} className="min-w-0 flex-1 accent-amber-400" />
          <span className="w-9 text-right text-[10px] font-bold text-amber-300">{Math.round((efx.tercaVolume ?? 0.65) * 100)}%</span>
        </div>
      </section>

      {/* Main Grid: 2 Panels styled after Image 2 CRT Screen & Rotary Knobs */}
      <div className="grid grid-cols-2 gap-2 flex-1 min-h-0 py-0.5 overflow-y-auto sm:overflow-hidden">
        
        {/* Left Panel: Legato & Acoustic Modeling (6 Cols) */}
        <div className="col-span-1 min-w-0 min-h-0 bg-[#101318] border border-[#262c38] rounded-md p-1.5 flex flex-col justify-between overflow-y-auto shadow-inner">
          {/* Panel Header */}
          <div className="flex items-center justify-between pb-1 border-b border-[#222836]">
            <div className="flex items-center gap-1.5">
              <Wind size={13} className="text-amber-400" />
              <span className="text-[10px] sm:text-xs font-bold text-zinc-200 font-mono">LEGATO &amp; GLIDE ENGINE</span>
            </div>
            
            <button
              onClick={() => onUpdateEfx({ legato: !efx.legato })}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                efx.legato
                  ? 'bg-gradient-to-b from-amber-400 to-yellow-500 text-black border-yellow-200 shadow-[0_0_8px_#f59e0b]'
                  : 'bg-zinc-800 text-zinc-500 border-zinc-700'
              }`}
            >
              LEGATO: {efx.legato ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Blue CRT Graphic Curve Preview (Dynamically shaped by Speed, Attack, and Release) */}
          <div className="h-12 sm:h-14 bg-[#081232] rounded border border-[#16275c] p-1.5 flex flex-col justify-between my-1 relative overflow-hidden shadow-inner">
            <div className="flex justify-between text-[8px] font-mono text-[#5b7fc4] z-10">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                GLIDE RESPONSE
              </span>
              <button
                onClick={() =>
                  onUpdateEfx({
                    legatoCurve: efx.legatoCurve === 'exponential' ? 'linear' : 'exponential',
                  })
                }
                className="text-yellow-300 font-bold hover:underline cursor-pointer bg-[#10204d] px-1 rounded border border-[#1b347a]"
                title="Klik untuk ganti model kurva"
              >
                {efx.legatoCurve.toUpperCase()} CURVE
              </button>
              <span>{Math.round((efx.legatoSpeed || 0.05) * 1000)}ms</span>
            </div>

            {/* Dynamic Interactive SVG Curve */}
            {(() => {
              const speed = efx.legatoSpeed || 0.05;
              const attack = efx.legatoAttack || 0.008;
              const release = efx.legatoRelease || 0.22;

              const normSpeed = Math.max(0, Math.min(1, (speed - 0.01) / 0.24));
              const normAttack = Math.max(0, Math.min(1, (attack - 0.002) / 0.048));
              const normRelease = Math.max(0, Math.min(1, (release - 0.05) / 0.55));

              const cp1X = Math.round(15 + normAttack * 45);
              const cp1Y = Math.round(26 - normAttack * 10);
              const cp2X = Math.round(30 + normSpeed * 90);
              const cp2Y = Math.round(7 + (1 - normSpeed) * 10);
              const endX = Math.round(120 + normRelease * 35);
              const endY = 6;

              const dynamicCurve =
                efx.legatoCurve === 'exponential'
                  ? `M 0 26 C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY} L 160 ${endY}`
                  : `M 0 26 L ${cp2X} ${endY} L 160 ${endY}`;
              const fillArea = `${dynamicCurve} L 160 30 L 0 30 Z`;

              return (
                <svg className="w-full h-9 my-auto" viewBox="0 0 160 30" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="15" x2="160" y2="15" stroke="#122456" strokeWidth="0.7" strokeDasharray="3 3" />
                  <line x1="40" y1="0" x2="40" y2="30" stroke="#122456" strokeWidth="0.5" strokeDasharray="2 2" />
                  <line x1="80" y1="0" x2="80" y2="30" stroke="#122456" strokeWidth="0.5" strokeDasharray="2 2" />
                  <line x1="120" y1="0" x2="120" y2="30" stroke="#122456" strokeWidth="0.5" strokeDasharray="2 2" />

                  {/* Gradient Area under dynamic curve */}
                  <path d={fillArea} fill="url(#legatoGlow)" opacity="0.3" />

                  {/* Main Line with real-time responsive shape */}
                  <path
                    d={dynamicCurve}
                    fill="none"
                    stroke="#ffeb3b"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    className="transition-all duration-75"
                  />

                  {/* Dynamic Control Point Nodes */}
                  <circle cx={cp1X} cy={cp1Y} r="2.5" fill="#38bdf8" />
                  <circle cx={cp2X} cy={cp2Y} r="2.5" fill="#f59e0b" />
                  <circle cx={endX} cy={endY} r="2.5" fill="#a855f7" />

                  <defs>
                    <linearGradient id="legatoGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                </svg>
              );
            })()}

            <div className="flex justify-between text-[7px] font-mono text-[#446bb3] border-t border-[#122456] pt-0.5">
              <span>NOTE 1 (START)</span>
              <span>PORTA GLIDE</span>
              <span>NOTE 2 (TARGET)</span>
            </div>
          </div>

          {/* Rotary Knobs & Sliders */}
          <div className="space-y-1 text-[10px] font-mono">
            {/* Speed */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-zinc-400">SPEED:</span>
              <input
                type="range"
                min="0.01"
                max="0.25"
                step="0.005"
                value={efx.legatoSpeed || 0.05}
                onChange={(e) => onUpdateEfx({ legatoSpeed: parseFloat(e.target.value) })}
                className="flex-1 accent-amber-400 h-1.5 bg-[#0a0c10] rounded"
              />
              <span className="text-[10px] font-bold text-amber-400 w-12 text-right">
                {Math.round((efx.legatoSpeed || 0.05) * 1000)}ms
              </span>
            </div>

            {/* Attack */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-zinc-400">ATTACK:</span>
              <input
                type="range"
                min="0.002"
                max="0.05"
                step="0.002"
                value={efx.legatoAttack || 0.008}
                onChange={(e) => onUpdateEfx({ legatoAttack: parseFloat(e.target.value) })}
                className="flex-1 accent-amber-400 h-1.5 bg-[#0a0c10] rounded"
              />
              <span className="text-[10px] font-bold text-amber-400 w-12 text-right">
                {Math.round((efx.legatoAttack || 0.008) * 1000)}ms
              </span>
            </div>

            {/* Release */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-zinc-400">RELEASE:</span>
              <input
                type="range"
                min="0.05"
                max="0.6"
                step="0.02"
                value={efx.legatoRelease || 0.22}
                onChange={(e) => onUpdateEfx({ legatoRelease: parseFloat(e.target.value) })}
                className="flex-1 accent-amber-400 h-1.5 bg-[#0a0c10] rounded"
              />
              <span className="text-[10px] font-bold text-amber-400 w-12 text-right">
                {Math.round((efx.legatoRelease || 0.22) * 1000)}ms
              </span>
            </div>
          </div>
        </div>

        {/* Right Panel: Reverb & Delay Console (6 Cols) */}
        <div className="col-span-1 min-w-0 min-h-0 bg-[#101318] border border-[#262c38] rounded-md p-1.5 flex flex-col justify-between overflow-y-auto shadow-inner">
          {/* Header */}
          <div className="flex items-center justify-between pb-1 border-b border-[#222836]">
            <div className="flex items-center gap-1.5">
              <Radio size={13} className="text-amber-400" />
              <span className="text-[10px] sm:text-xs font-bold text-zinc-200 font-mono">STUDIO REVERB &amp; DELAY</span>
            </div>

            <div className="flex items-center gap-1">
              {/* Reverb Toggle */}
              <button
                onClick={() => onUpdateEfx({ reverbEnabled: !efx.reverbEnabled })}
                className={`p-1 rounded border ${
                  efx.reverbEnabled
                    ? 'bg-gradient-to-b from-amber-400 to-yellow-500 text-black border-yellow-200 shadow-[0_0_6px_#f59e0b]'
                    : 'bg-zinc-800 text-zinc-600 border-zinc-700'
                }`}
                title="Reverb On/Off"
              >
                <Power size={11} className={efx.reverbEnabled ? 'stroke-[2.5]' : ''} />
              </button>
              {/* Delay Toggle */}
              <button
                onClick={() => onUpdateEfx({ delayEnabled: !efx.delayEnabled })}
                className={`p-1 rounded border ${
                  efx.delayEnabled
                    ? 'bg-gradient-to-b from-amber-400 to-yellow-500 text-black border-yellow-200 shadow-[0_0_6px_#f59e0b]'
                    : 'bg-zinc-800 text-zinc-600 border-zinc-700'
                }`}
                title="Delay On/Off"
              >
                <Power size={11} className={efx.delayEnabled ? 'stroke-[2.5]' : ''} />
              </button>
            </div>
          </div>

          {/* 4 Rotary / Fader Knobs for FX Space */}
          <div className="grid grid-cols-2 gap-1 my-0.5">
            {/* Reverb Mix */}
            <div className="bg-[#0b0e14] p-1 rounded border border-[#1d222e]">
              <div className="flex justify-between text-[8px] font-mono text-zinc-400 mb-0.5">
                <span>REVERB WET</span>
                <span className="text-amber-400 font-bold">{Math.round((efx.reverbWet ?? 0.2) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.01"
                value={efx.reverbWet ?? 0.2}
                onChange={(e) => onUpdateEfx({ reverbWet: parseFloat(e.target.value) })}
                className="w-full accent-amber-400 h-3 bg-zinc-900 rounded touch-none"
              />
            </div>

            {/* Reverb Decay */}
            <div className="bg-[#0b0e14] p-1.5 rounded border border-[#1d222e]">
              <div className="flex justify-between text-[9px] font-mono text-zinc-400 mb-1">
                <span>DECAY TIME</span>
                <span className="text-amber-400 font-bold">{(efx.reverbDecay || 1.8).toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="4.0"
                step="0.1"
                value={efx.reverbDecay || 1.8}
                onChange={(e) => onUpdateEfx({ reverbDecay: parseFloat(e.target.value) })}
                className="w-full accent-amber-400 h-3 bg-zinc-900 rounded touch-none"
              />
            </div>

            {/* Delay Wet */}
            <div className="bg-[#0b0e14] p-1.5 rounded border border-[#1d222e]">
              <div className="flex justify-between text-[9px] font-mono text-zinc-400 mb-1">
                <span>DELAY WET</span>
                <span className="text-amber-400 font-bold">{Math.round((efx.delayWet ?? 0.15) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.6"
                step="0.01"
                value={efx.delayWet ?? 0.15}
                onChange={(e) => onUpdateEfx({ delayWet: parseFloat(e.target.value) })}
                className="w-full accent-amber-400 h-1.5 bg-zinc-900 rounded"
              />
            </div>

            {/* Delay Feedback */}
            <div className="bg-[#0b0e14] p-1.5 rounded border border-[#1d222e]">
              <div className="flex justify-between text-[9px] font-mono text-zinc-400 mb-1">
                <span>FEEDBACK</span>
                <span className="text-amber-400 font-bold">{Math.round((efx.delayFeedback ?? 0.3) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.75"
                step="0.01"
                value={efx.delayFeedback ?? 0.3}
                onChange={(e) => onUpdateEfx({ delayFeedback: parseFloat(e.target.value) })}
                className="w-full accent-amber-400 h-1.5 bg-zinc-900 rounded"
              />
            </div>
          </div>

          {/* Bottom Acoustic Resonance Indicator */}
          <div className="flex items-center justify-between text-[8px] font-mono bg-[#0c1017] px-1.5 py-0.5 rounded border border-[#1e2330]">
            <span className="text-zinc-400">ACOUSTIC BODY RESONANCE:</span>
            <span className="text-amber-400 font-bold">
              {acoustic?.enabled ? 'ACTIVE (WOODWIND/STRINGS)' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
