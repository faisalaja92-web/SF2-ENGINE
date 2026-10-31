import React, { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../../audio/audioEngine';
import { EfxSettings, EqualizerSettings, LayerEqSettings, LayerEfxSettings, SoundLayer } from '../../types/synth';
import { Power, Sliders, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface MixerViewProps {
  layers: SoundLayer[];
  onUpdateLayer: (layerId: number, updates: Partial<SoundLayer>) => void;
  equalizer: EqualizerSettings;
  onUpdateEqualizer: (updates: Partial<EqualizerSettings>) => void;
  efx?: EfxSettings;
  onUpdateEfx?: (updates: Partial<EfxSettings>) => void;
  isPianoVisible?: boolean;
}

interface DraggableKnobProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  title?: string;
  size?: number;
  unit?: string;
  color?: string;
}

const DraggableKnob: React.FC<DraggableKnobProps> = ({
  value,
  min,
  max,
  step = 0.5,
  onChange,
  title,
  size = 36,
  unit = 'dB',
  color = '#facc15',
}) => {
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startVal = useRef(0);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startVal.current = value;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const deltaY = startY.current - e.clientY; // upward increases
    const range = max - min;
    const change = (deltaY / 100) * range;
    const rawVal = startVal.current + change;
    const clamped = Math.max(min, Math.min(max, Math.round(rawVal / step) * step));
    onChange(Number(clamped.toFixed(2)));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? step : -step;
    const newVal = Math.max(min, Math.min(max, Math.round((value + delta) / step) * step));
    onChange(Number(newVal.toFixed(2)));
  };

  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const angle = -135 + pct * 270;

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      onDoubleClick={() => onChange(min + (max - min) * 0.85)}
      className="relative rounded-full bg-[radial-gradient(circle_at_32%_24%,#758196_0%,#465165_23%,#252e3e_54%,#111925_79%,#080d15_100%)] border-2 border-[#69778d] flex items-center justify-center cursor-ns-resize shadow-[inset_0_2px_3px_rgba(255,255,255,0.3),inset_0_-5px_7px_rgba(0,0,0,0.9),0_3px_7px_rgba(0,0,0,0.85)] hover:border-yellow-400 active:border-amber-300 touch-none select-none shrink-0"
      style={{ width: size, height: size }}
      title={title || `Tahan & seret ke atas/bawah untuk atur (${min} s/d ${max} ${unit})`}
    >
      <div
        className="w-1 h-3.5 rounded-full absolute top-1 shadow-[0_0_5px_#facc15,0_1px_1px_rgba(0,0,0,0.8)] pointer-events-none border border-[#fff2b0]/60"
        style={{
          backgroundColor: color,
          transform: `rotate(${angle}deg)`,
          transformOrigin: 'bottom center',
        }}
      />
      <div className="w-3 h-3 rounded-full bg-[radial-gradient(circle_at_35%_30%,#687386,#222936_58%,#080c13)] border border-[#667184] shadow-[inset_0_1px_2px_rgba(255,255,255,0.2),0_1px_2px_#000] pointer-events-none" />
    </div>
  );
};

export const MixerView: React.FC<MixerViewProps> = ({
  layers,
  onUpdateLayer,
  equalizer,
  onUpdateEqualizer,
  efx,
  onUpdateEfx,
  isPianoVisible = false,
}) => {
  const [selectedLayerId, setSelectedLayerId] = useState<number>(1);
  const [layerMeters, setLayerMeters] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0 });
  useEffect(() => {
    let frame = 0;
    const refresh = () => {
      setLayerMeters({ 1: audioEngine.getLayerMeterLevel(1), 2: audioEngine.getLayerMeterLevel(2), 3: audioEngine.getLayerMeterLevel(3), 4: audioEngine.getLayerMeterLevel(4) });
      frame = requestAnimationFrame(refresh);
    };
    frame = requestAnimationFrame(refresh);
    return () => cancelAnimationFrame(frame);
  }, []);
  const [activeTab, setActiveTab] = useState<'EQ' | 'EFX'>('EQ');
  const [showEqPanel, setShowEqPanel] = useState<boolean>(false);
  const faderStyle = 'rotary' as const;

  const currentLayer = layers.find((l) => l.id === selectedLayerId) || layers[0];

  // Read current layer's individual EQ settings
  const layerEq: LayerEqSettings = currentLayer?.eq || {
    band80: equalizer.band80 || 0,
    band400: equalizer.band400 || 0,
    band1k: equalizer.band1k || 0,
    band10k: equalizer.band10k || 0,
    eqPower: true,
  };

  // Read current layer's individual EFX sends
  const layerEfx: LayerEfxSettings = currentLayer?.efxSend || {
    reverbSend: efx?.reverbWet ?? 0.3,
    delaySend: efx?.delayWet ?? 0.2,
  };

  const handleUpdateCurrentLayerEq = (updates: Partial<LayerEqSettings>) => {
    const newEq = { ...layerEq, ...updates };
    onUpdateLayer(selectedLayerId, { eq: newEq });

    if (selectedLayerId === 1) {
      onUpdateEqualizer(updates);
    }
  };

  const handleUpdateCurrentLayerEfx = (updates: Partial<LayerEfxSettings>) => {
    const newEfx = { ...layerEfx, ...updates };
    onUpdateLayer(selectedLayerId, { efxSend: newEfx });

    if (selectedLayerId === 1 && onUpdateEfx) {
      if (updates.reverbSend !== undefined) {
        onUpdateEfx({ reverbWet: updates.reverbSend });
      }
      if (updates.delaySend !== undefined) {
        onUpdateEfx({ delayWet: updates.delaySend });
      }
    }
  };

  // Dynamic SVG curve for the central Parametric EQ display
  const y1 = Math.round(25 - (layerEq.eqPower ? layerEq.band80 : 0) * 1.8);
  const y2 = Math.round(25 - (layerEq.eqPower ? layerEq.band400 : 0) * 1.8);
  const y3 = Math.round(25 - (layerEq.eqPower ? layerEq.band1k : 0) * 1.8);
  const y4 = Math.round(25 - (layerEq.eqPower ? layerEq.band10k : 0) * 1.8);

  const mainEqCurvePath = `M 0 25 C 25 ${y1}, 45 ${y1}, 70 ${y2} C 100 ${y2}, 115 ${y3}, 145 ${y3} C 170 ${y4}, 185 ${y4}, 200 25`;
  const mainEqFillPath = `${mainEqCurvePath} L 200 50 L 0 50 Z`;

  return (
    <div className="w-full h-full min-h-0 flex flex-col gap-1 p-1 bg-[#111a29] text-zinc-200 font-sans select-none overflow-hidden">
      
      {/* 1. TOP HEADER BAR: TITLE, ACTIVE COUNT, STYLE TOGGLE & EQ DRAWER BUTTON */}
      <div className="flex items-center justify-between pb-1 px-1 border-b border-[#292e3c] text-xs shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Sliders size={13} className="text-amber-400 shrink-0" />
          <span className="font-mono font-bold text-xs text-zinc-100 tracking-wider">
            MIXER CONSOLE (L1 - L4)
          </span>
          <span className="text-[8px] sm:text-[9px] font-mono font-bold text-amber-400 bg-[#1c202a] px-1.5 py-0.5 rounded border border-[#32394a]">
            {layers.filter((l) => l.enabled && !l.mute).length}/4 AKTIF
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Toggle Parametric EQ & EFX Drawer */}
          <button
            onClick={() => setShowEqPanel(!showEqPanel)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-mono font-bold border transition-all active:scale-95 ${
              showEqPanel
                ? 'bg-gradient-to-b from-amber-400 to-yellow-500 text-black border-yellow-200 font-black shadow-[0_0_8px_#f59e0b]'
                : 'bg-[#1e222d] text-zinc-300 border-[#32384a] hover:border-zinc-400'
            }`}
            title="Buka / Tutup Pengaturan Parametric EQ & EFX Send"
          >
            <span>{showEqPanel ? 'TUTUP EQ' : 'EQ / EFX'}</span>
            {showEqPanel ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        </div>
      </div>

      {/* 2. OPTIONAL EXPANDABLE EQ & EFX SEND SECTION */}
      {showEqPanel && (
        <div className="grid grid-cols-12 gap-1.5 h-24 sm:h-28 shrink-0 py-1 bg-[#0d1016] rounded-md border border-[#252c3c] px-1.5 my-1 overflow-hidden transition-all">
          {/* Left: Layer Selector & Power */}
          <div className="col-span-3 flex flex-col justify-between border-r border-[#222836] pr-1">
            <div className="flex items-center justify-between">
              <span className="text-[7px] font-mono text-zinc-400 font-bold">
                PILIH LAYER:
              </span>
              <button
                onClick={() => handleUpdateCurrentLayerEq({ eqPower: !layerEq.eqPower })}
                className={`px-1.5 py-0.5 rounded text-[7px] font-mono font-bold border ${
                  layerEq.eqPower
                    ? 'bg-amber-400 text-black border-yellow-200 font-black'
                    : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                }`}
              >
                {layerEq.eqPower ? 'EQ ON' : 'EQ OFF'}
              </button>
            </div>

            {/* Layer tabs L1 - L4 */}
            <div className="grid grid-cols-4 gap-0.5 my-0.5">
              {[1, 2, 3, 4].map((id) => (
                <button
                  key={id}
                  onClick={() => setSelectedLayerId(id)}
                  className={`py-0.5 rounded text-[8px] font-mono font-bold border transition-all ${
                    selectedLayerId === id
                      ? 'bg-amber-400 text-black border-yellow-200 font-black'
                      : 'bg-[#171a22] text-zinc-400 border-[#2a303e]'
                  }`}
                >
                  L{id}
                </button>
              ))}
            </div>

            {/* Mode: EQ or EFX */}
            <div className="grid grid-cols-2 gap-0.5">
              <button
                onClick={() => setActiveTab('EQ')}
                className={`py-0.5 rounded text-[7px] font-mono font-bold border ${
                  activeTab === 'EQ'
                    ? 'bg-yellow-400 text-black border-yellow-200 font-black'
                    : 'bg-[#151821] text-zinc-400 border-[#272d3b]'
                }`}
              >
                EQ 4-BAND
              </button>
              <button
                onClick={() => setActiveTab('EFX')}
                className={`py-0.5 rounded text-[7px] font-mono font-bold border ${
                  activeTab === 'EFX'
                    ? 'bg-yellow-400 text-black border-yellow-200 font-black'
                    : 'bg-[#151821] text-zinc-400 border-[#272d3b]'
                }`}
              >
                EFX SEND
              </button>
            </div>
          </div>

          {/* Center: Blue Graphic Parametric EQ Display */}
          <div className="col-span-4 relative bg-[#081230] rounded border border-[#1b2b58] p-1 flex flex-col justify-between overflow-hidden shadow-inner">
            <div className="flex justify-between items-center text-[7px] font-mono text-[#5b7fc4] border-b border-[#13275c] pb-0.5">
              <span>L{selectedLayerId} PARAMETRIC</span>
              <span>+/- 12dB</span>
            </div>

            <div className="relative flex-1 my-0.5">
              <svg className="w-full h-full" viewBox="0 0 200 50" preserveAspectRatio="none">
                <line x1="0" y1="25" x2="200" y2="25" stroke="#162c66" strokeWidth="0.8" strokeDasharray="3 3" />
                <path d={mainEqFillPath} fill="#f59e0b" opacity="0.25" />
                <path
                  d={mainEqCurvePath}
                  fill="none"
                  stroke="#ffeb3b"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div className="flex justify-between text-[6px] font-mono text-[#6c8ecf] pt-0.5 border-t border-[#13275c]">
              <span>80Hz</span>
              <span>400Hz</span>
              <span>1kHz</span>
              <span>10kHz</span>
            </div>
          </div>

          {/* Right: Bands or Send controls */}
          {activeTab === 'EQ' ? (
            <div className="col-span-5 grid grid-cols-4 gap-1 pl-1">
              {[
                { name: 'LOW', key: 'band80' as const, freq: '80Hz', val: layerEq.band80 },
                { name: 'LMID', key: 'band400' as const, freq: '400Hz', val: layerEq.band400 },
                { name: 'HMID', key: 'band1k' as const, freq: '1kHz', val: layerEq.band1k },
                { name: 'HIGH', key: 'band10k' as const, freq: '10kHz', val: layerEq.band10k },
              ].map((band) => (
                <div key={band.name} className="flex flex-col justify-between items-center text-center">
                  <span className="text-[6px] font-black text-amber-400">
                    {band.name}
                  </span>
                  <DraggableKnob
                    value={band.val}
                    min={-12}
                    max={12}
                    step={0.5}
                    onChange={(newVal) => handleUpdateCurrentLayerEq({ [band.key]: newVal })}
                    size={22}
                    title={`${band.name}: Seret ke atas/bawah`}
                  />
                  <span className="text-[7px] font-mono font-bold text-zinc-100">
                    {band.val > 0 ? `+${band.val.toFixed(1)}` : band.val.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="col-span-5 flex items-center justify-around p-0.5">
              <div className="flex flex-col items-center">
                <span className="text-[7px] font-mono font-bold text-amber-400 mb-0.5">REVERB</span>
                <DraggableKnob
                  value={layerEfx.reverbSend}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(val) => handleUpdateCurrentLayerEfx({ reverbSend: val })}
                  size={24}
                  unit=""
                  color="#38bdf8"
                />
                <span className="text-[7px] font-mono font-bold text-zinc-200 mt-0.5">
                  {Math.round(layerEfx.reverbSend * 100)}%
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[7px] font-mono font-bold text-amber-400 mb-0.5">DELAY</span>
                <DraggableKnob
                  value={layerEfx.delaySend}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(val) => handleUpdateCurrentLayerEfx({ delaySend: val })}
                  size={24}
                  unit=""
                  color="#a855f7"
                />
                <span className="text-[7px] font-mono font-bold text-zinc-200 mt-0.5">
                  {Math.round(layerEfx.delaySend * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. MAIN 4-LAYER CONSOLE SLOTS (L1 - L4) - ELEVATED TO FULL VIEWPORT SO NEVER CUT OFF IN MOBILE LANDSCAPE */}
      <div className="flex-1 grid grid-cols-4 gap-1 min-h-0 pt-0.5">
        {layers.map((layer) => {
          const isSelected = selectedLayerId === layer.id;
          const isEnabled = layer.enabled;
          const isMuted = layer.mute;
          const vol = layer.volume;
          const pan = layer.pan;
          const displayValue = Math.round(vol * 127);

          return (
            <div
              key={layer.id}
              onClick={() => setSelectedLayerId(layer.id)}
              className={`relative flex flex-col justify-between p-1 rounded-[5px] border transition-all overflow-hidden min-h-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_3px_6px_rgba(0,0,0,0.45)] ${
                isSelected
                  ? 'bg-gradient-to-b from-[#2b271b] via-[#201e16] to-[#161510] border-2 border-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.4)]'
                  : isEnabled && !isMuted
                  ? 'bg-gradient-to-b from-[#222530] via-[#1a1c24] to-[#14151b] border-[#313645]'
                  : 'bg-gradient-to-b from-[#181a20] to-[#101216] border-[#222630] opacity-75'
              }`}
            >
              {/* Slot Header: Label, Preset Name, Gain Display 0-127 */}
              <div className="flex items-center justify-between pb-0.5 border-b border-[#2b3040] text-[8px] sm:text-[9px] font-mono shrink-0">
                <div className="flex items-center gap-1 truncate mr-1">
                  <span className={`font-black ${isSelected ? 'text-yellow-300' : 'text-zinc-200'}`}>
                    L{layer.id}
                  </span>
                  <span className="text-[7px] text-zinc-400 truncate max-w-[55px] sm:max-w-[70px]">
                    {layer.presetName || 'Empty'}
                  </span>
                </div>
                <span className="font-mono font-black text-amber-400 shrink-0">
                  {displayValue}
                </span>
              </div>

              {/* Volume & Meter Section */}
              {faderStyle === 'rotary' ? (
                /* MODEL PUTAR (ROTARY KNOB) + HORIZONTAL PAN SLIDER DIRECTLY BENEATH */
                <div className="flex-1 flex flex-col justify-around py-0.5 min-h-0">
                  {/* Volume Rotary Knob + Side LED Peak Meter */}
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <div className="flex flex-col items-center">
                      <span className="text-[6px] font-mono text-zinc-400 font-bold mb-0.5">VOL</span>
                      <DraggableKnob
                        value={vol}
                        min={0}
                        max={1}
                        step={0.01}
                        onChange={(newVol) => onUpdateLayer(layer.id, { volume: newVol })}
                        size={26}
                        unit=""
                        color="#facc15"
                        title={`Layer ${layer.id} Volume: Seret atas/bawah (${displayValue} / 127)`}
                      />
                      <span className="text-[7px] font-mono font-black text-amber-400 mt-0.5">
                        {Math.round(vol * 100)}%
                      </span>
                    </div>

                    {/* Side LED Peak Meter */}
                    <div className="w-1 h-8 bg-[#090b10] rounded-[1px] border border-[#1a1f2c] relative overflow-hidden flex flex-col justify-end">
                      <div
                        className="w-full bg-gradient-to-t from-[#00e676] via-[#ffeb3b] to-[#ff1744] transition-all duration-75"
                        style={{ height: `${layerMeters[layer.id] || 0}%` }}
                      />
                      <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent,transparent_2px,#000_2px,#000_3px)] opacity-60 pointer-events-none" />
                    </div>
                  </div>

                  {/* KONTROL PAN: GESER KIRI-KANAN PERSIS DI BAWAH KNOP VOLUME */}
                  <div className="w-full flex flex-col items-center gap-0.5 mt-0.5 bg-[#0f1117] py-0.5 px-1 rounded border border-[#222736]">
                    <div className="w-full flex items-center justify-between text-[7px] font-mono font-bold">
                      <span className="text-zinc-400">PAN</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateLayer(layer.id, { pan: 0 });
                        }}
                        className="px-1 py-0.2 rounded bg-[#1c202a] hover:bg-[#282d3b] text-zinc-300 hover:text-yellow-300 border border-[#2f3546] text-[6px] sm:text-[7px] font-black"
                        title="Klik untuk center (C)"
                      >
                        {pan === 0 ? 'C' : pan < 0 ? `L${Math.round(-pan * 50)}` : `R${Math.round(pan * 50)}`}
                      </button>
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <span className="text-[7px] font-mono font-black text-sky-400">L</span>
                      <DraggableKnob value={pan} min={-1} max={1} step={0.05}
                        onChange={(newPan) => onUpdateLayer(layer.id, { pan: newPan })}
                        size={22} unit="" color="#38bdf8" title="Putar untuk stereo pan kiri / kanan" />
                      <span className="text-[7px] font-mono font-black text-sky-400">R</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* MODEL SLIDER (VERTICAL FADER) + HORIZONTAL PAN SLIDER */
                <div className="flex-1 flex flex-col justify-between py-0.5 min-h-0">
                  {/* Fader Track & Side LED */}
                  <div className="flex-1 flex items-center justify-center gap-1.5 relative overflow-hidden my-0.5">
                    <div className="w-1.5 h-full bg-[#090b10] rounded-[1px] border border-[#1a1f2c] relative overflow-hidden flex flex-col justify-end">
                      <div
                        className="w-full bg-gradient-to-t from-[#00e676] via-[#ffeb3b] to-[#ff1744] transition-all duration-75"
                        style={{ height: `${layerMeters[layer.id] || 0}%` }}
                      />
                      <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent,transparent_2px,#000_2px,#000_3px)] opacity-60 pointer-events-none" />
                    </div>

                    <div className="relative h-full flex items-center justify-center">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={vol}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onUpdateLayer(layer.id, { volume: parseFloat(e.target.value) })}
                        className="accent-transparent cursor-pointer h-2 bg-[#090b0f] rounded border border-[#2b303d] w-16 sm:w-20 -rotate-90 origin-center"
                      />
                      <div
                        className="absolute w-4 h-6 rounded-[2px] bg-gradient-to-r from-[#d1d5db] via-white to-[#9ca3af] border border-zinc-600 shadow-md pointer-events-none flex flex-col justify-around py-0.5 px-0.5"
                        style={{
                          transform: `translateY(${-((vol - 0.5) * 45)}px)`,
                        }}
                      >
                        <div className="w-full h-px bg-zinc-700" />
                        <div className="w-full h-0.5 bg-yellow-400" />
                        <div className="w-full h-px bg-zinc-700" />
                      </div>
                    </div>
                  </div>

                  {/* KONTROL PAN: GESER KIRI-KANAN PERSIS DI BAWAH FADER */}
                  <div className="w-full flex flex-col items-center gap-0.5 mt-0.5 bg-[#0f1117] py-0.5 px-1 rounded border border-[#222736]">
                    <div className="w-full flex items-center justify-between text-[7px] font-mono font-bold">
                      <span className="text-zinc-400">PAN</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateLayer(layer.id, { pan: 0 });
                        }}
                        className="px-1 py-0.2 rounded bg-[#1c202a] hover:bg-[#282d3b] text-zinc-300 hover:text-yellow-300 border border-[#2f3546] text-[6px] sm:text-[7px] font-black"
                        title="Klik untuk center (C)"
                      >
                        {pan === 0 ? 'C' : pan < 0 ? `L${Math.round(-pan * 50)}` : `R${Math.round(pan * 50)}`}
                      </button>
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <span className="text-[7px] font-mono font-black text-sky-400">L</span>
                      <DraggableKnob value={pan} min={-1} max={1} step={0.05}
                        onChange={(newPan) => onUpdateLayer(layer.id, { pan: newPan })}
                        size={22} unit="" color="#38bdf8" title="Putar untuk stereo pan kiri / kanan" />
                      <span className="text-[7px] font-mono font-black text-sky-400">R</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Channel Button: Layer Label & Glowing Power/Mute Toggle */}
              <div className="flex items-center justify-between pt-0.5 border-t border-[#2b3040] text-[8px] font-mono shrink-0">
                <span className={`font-bold text-[7px] sm:text-[8px] ${isSelected ? 'text-yellow-300' : 'text-zinc-400'}`}>
                  LAYER {layer.id}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!layer.enabled) {
                      onUpdateLayer(layer.id, { enabled: true, mute: false });
                    } else {
                      onUpdateLayer(layer.id, { mute: !layer.mute });
                    }
                  }}
                  className={`relative w-5 h-5 sm:w-6 sm:h-6 rounded-[5px] border flex items-center justify-center transition-all duration-150 active:translate-y-[1px] ${
                    isEnabled && !isMuted
                      ? 'bg-gradient-to-b from-[#59677a] to-[#1a2432] border-[#91a3b9] shadow-[inset_0_1px_2px_rgba(255,255,255,0.38),inset_0_-2px_3px_rgba(0,0,0,0.8),0_2px_4px_rgba(0,0,0,0.7)]'
                      : 'bg-gradient-to-b from-[#394252] to-[#111722] border-[#566174] shadow-[inset_0_1px_2px_rgba(255,255,255,0.16),inset_0_-2px_3px_rgba(0,0,0,0.8),0_2px_4px_rgba(0,0,0,0.7)]'
                  }`}
                  title={`Layer ${layer.id} illuminated push button (${isEnabled && !isMuted ? 'ON' : 'OFF'})`}
                >
                  <span className={`absolute inset-[4px] rounded-full border transition-all ${
                    isEnabled && !isMuted
                      ? 'bg-[radial-gradient(circle_at_35%_30%,#fff5bf_0%,#ffd34f_35%,#d88916_75%,#78410a_100%)] border-[#fff0a6] shadow-[0_0_5px_#ffc43d,0_0_10px_rgba(255,180,30,0.8),inset_0_1px_2px_rgba(255,255,255,0.85)]'
                      : 'bg-[radial-gradient(circle_at_35%_30%,#596272_0%,#303947_45%,#121923_100%)] border-[#6a7483] shadow-[inset_0_1px_2px_rgba(255,255,255,0.2),inset_0_-2px_2px_rgba(0,0,0,0.8)]'
                  }`} />
                  <Power size={8} className={`relative z-10 ${isEnabled && !isMuted ? 'text-[#241806] stroke-[3]' : 'text-[#aab3c0]'}`} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
