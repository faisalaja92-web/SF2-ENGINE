import React, { useEffect, useRef, useState } from 'react';
import { ArabicScaleTuning } from '../types/synth';
import { NOTE_IS_BLACK, NOTE_NAMES } from '../audio/scalePresets';
import { X } from 'lucide-react';

interface VirtualPianoProps {
  onNoteOn: (note: number, velocity: number) => void;
  onNoteOff: (note: number) => void;
  scaleTuning: ArabicScaleTuning;
  pitchBend: number;
  onPitchBendChange: (val: number) => void;
  modWheel: number;
  onModWheelChange: (val: number) => void;
  sustain: boolean;
  onSustainToggle: () => void;
  activeNotes: Set<number>;
  onClose: () => void;
}

export const VirtualPiano: React.FC<VirtualPianoProps> = ({
  onNoteOn,
  onNoteOff,
  scaleTuning,
  pitchBend,
  onPitchBendChange,
  modWheel,
  onModWheelChange,
  sustain,
  onSustainToggle,
  activeNotes,
  onClose,
}) => {
  const [baseOctave, setBaseOctave] = useState<number>(4);
  const isPointerDownRef = useRef(false);
  const currentHoveredNoteRef = useRef<number | null>(null);
  const pitchBendPointerId = useRef<number | null>(null);
  const keyboardContainerRef = useRef<HTMLDivElement>(null);

  const startMidi = (baseOctave - 1) * 12 + 12; // C4 = 60
  const totalNotes = 25; // 2 octaves + 1 high C

  const getNoteFromPoint = (clientX: number, clientY: number): number | null => {
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return null;
    const noteEl = el.closest('[data-note]');
    if (noteEl) {
      const noteVal = noteEl.getAttribute('data-note');
      if (noteVal) return parseInt(noteVal, 10);
    }
    return null;
  };

  const handleKeyPointerDown = (note: number, e: React.PointerEvent) => {
    e.preventDefault();
    isPointerDownRef.current = true;
    currentHoveredNoteRef.current = note;
    onNoteOn(note, 0.9);
  };

  const handleContainerPointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;
    const note = getNoteFromPoint(e.clientX, e.clientY);
    if (note !== null && note !== currentHoveredNoteRef.current) {
      if (currentHoveredNoteRef.current !== null) {
        onNoteOff(currentHoveredNoteRef.current);
      }
      currentHoveredNoteRef.current = note;
      onNoteOn(note, 0.9);
    }
  };

  const handleGlobalPointerUp = () => {
    if (isPointerDownRef.current) {
      if (currentHoveredNoteRef.current !== null) {
        onNoteOff(currentHoveredNoteRef.current);
        currentHoveredNoteRef.current = null;
      }
      isPointerDownRef.current = false;
    }
  };

  useEffect(() => {
    const onUp = () => handleGlobalPointerUp();
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, []);

  const handlePitchBendPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pitchBendPointerId.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePitchBendPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pitchBendPointerId.current === e.pointerId) {
      const rect = e.currentTarget.getBoundingClientRect();
      const relativeY = (e.clientY - rect.top) / rect.height;
      const bend = Math.max(-1, Math.min(1, (0.5 - relativeY) * 2));
      onPitchBendChange(bend);
    }
  };

  const handlePitchBendPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pitchBendPointerId.current === e.pointerId) {
      pitchBendPointerId.current = null;
      onPitchBendChange(0);
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-40 bg-[#0e1015]/98 border-t border-amber-500/70 shadow-[0_-6px_20px_rgba(0,0,0,0.8)] p-1 select-none font-mono">
      {/* Controls Bar */}
      <div className="flex items-center justify-between pb-1 px-1 text-xs">
        {/* Octave Shift */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-zinc-400 font-bold">OCT:</span>
          <button
            onClick={() => setBaseOctave((o) => Math.max(1, o - 1))}
            className="w-5 h-5 rounded bg-[#1e222a] hover:bg-[#2b303b] text-zinc-200 border border-[#343946] font-bold text-xs active:scale-95 transition-transform"
          >
            -
          </button>
          <span className="text-amber-400 font-bold text-xs px-1">C{baseOctave}</span>
          <button
            onClick={() => setBaseOctave((o) => Math.min(6, o + 1))}
            className="w-5 h-5 rounded bg-[#1e222a] hover:bg-[#2b303b] text-zinc-200 border border-[#343946] font-bold text-xs active:scale-95 transition-transform"
          >
            +
          </button>
        </div>

        {/* Sustain & Close */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSustainToggle}
            className={`px-2.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
              sustain
                ? 'bg-gradient-to-b from-amber-400 to-yellow-500 text-black border-yellow-200 font-black shadow-[0_0_8px_#f59e0b]'
                : 'bg-[#1e222a] text-zinc-400 border-[#343946]'
            }`}
          >
            SUSTAIN
          </button>

          <button
            onClick={onClose}
            className="p-1 rounded bg-[#1e222a] hover:bg-[#2b303b] text-zinc-300 border border-[#343946] active:scale-95"
            title="Tutup Keyboard"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Controller Wheels & Playable Keys */}
      <div className="flex items-center justify-center gap-2 pt-0.5">
        {/* Pitch Bend Wheel (Spring return to center) */}
        <div className="flex flex-col items-center shrink-0">
          <span className="text-[8px] text-zinc-400 font-bold mb-0.5">PITCH</span>
          <div
            onPointerDown={handlePitchBendPointerDown}
            onPointerMove={handlePitchBendPointerMove}
            onPointerUp={handlePitchBendPointerUp}
            onPointerCancel={handlePitchBendPointerUp}
            className="w-6 h-14 sm:h-16 bg-[#161820] border border-[#353a47] rounded relative cursor-ns-resize flex items-center justify-center shadow-inner"
            title="Pitch Bend Wheel"
          >
            <div className="absolute w-full h-[1px] bg-amber-600/70 top-1/2 pointer-events-none" />
            <div
              className="w-6 h-2 bg-gradient-to-r from-amber-500 to-yellow-400 rounded transition-transform duration-75 shadow-[0_0_8px_#f59e0b] pointer-events-none"
              style={{ transform: `translateY(${-pitchBend * 18}px)` }}
            />
          </div>
        </div>

        {/* Modulation Wheel (CC1 Vibrato depth) */}
        <div className="flex flex-col items-center shrink-0">
          <span className="text-[8px] text-zinc-400 font-bold mb-0.5">MOD</span>
          <div className="w-7 h-18 sm:h-20 bg-[#161820] border border-[#353a47] rounded relative flex items-center justify-center p-0.5 shadow-inner">
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={modWheel}
              onChange={(e) => onModWheelChange(parseFloat(e.target.value))}
              className="w-14 sm:w-16 accent-amber-400 cursor-pointer h-1.5 bg-zinc-800 rounded -rotate-90"
              title="Modulation Wheel (CC1)"
            />
          </div>
        </div>

        {/* Keyboard keys container with touch/pointer glissando */}
        <div
          ref={keyboardContainerRef}
          onPointerMove={handleContainerPointerMove}
          className="relative flex h-16 sm:h-20 bg-[#0a0c10] p-1 rounded border-2 border-[#2b303d] overflow-x-auto touch-none"
        >
          {Array.from({ length: totalNotes }).map((_, i) => {
            const note = startMidi + i;
            const pitchClass = ((note % 12) + 12) % 12;
            const isBlack = NOTE_IS_BLACK[pitchClass];
            const isPressed = activeNotes.has(note);
            const noteName = NOTE_NAMES[pitchClass];
            const cents = scaleTuning.offsets[pitchClass] ?? 0;

            if (isBlack) return null;

            const nextNote = note + 1;
            const nextPitchClass = ((nextNote % 12) + 12) % 12;
            const hasBlackKey = NOTE_IS_BLACK[nextPitchClass] && i + 1 < totalNotes;
            const isBlackPressed = activeNotes.has(nextNote);
            const blackCents = hasBlackKey ? (scaleTuning.offsets[nextPitchClass] ?? 0) : 0;

            return (
              <div key={note} className="relative flex flex-col justify-end w-7 sm:w-8 select-none">
                {/* White Key */}
                <div
                  data-note={note}
                  onPointerDown={(e) => handleKeyPointerDown(note, e)}
                  className={`w-full h-14 sm:h-18 rounded-b border border-zinc-500 cursor-pointer flex flex-col justify-end items-center pb-1 transition-all ${
                    isPressed
                      ? 'bg-gradient-to-b from-yellow-200 to-amber-400 text-black font-black shadow-[0_0_12px_#f59e0b]'
                      : 'bg-gradient-to-b from-white to-zinc-200 hover:bg-zinc-100 text-black'
                  }`}
                >
                  <span className="text-[9px] font-black pointer-events-none">{noteName}</span>
                  {cents !== 0 && (
                    <span className="text-[7px] bg-black text-amber-400 px-0.5 rounded font-black pointer-events-none">
                      {cents > 0 ? `+${cents}` : cents}
                    </span>
                  )}
                </div>

                {/* Black Key */}
                {hasBlackKey && (
                  <div
                    data-note={nextNote}
                    onPointerDown={(e) => handleKeyPointerDown(nextNote, e)}
                    className={`absolute top-0 -right-2.5 sm:-right-3 w-5 sm:w-5.5 h-9 sm:h-12 z-20 rounded-b cursor-pointer flex flex-col justify-end items-center pb-0.5 transition-all border border-black ${
                      isBlackPressed
                        ? 'bg-gradient-to-b from-yellow-300 to-amber-500 text-black font-black shadow-[0_0_12px_#f59e0b]'
                        : 'bg-gradient-to-b from-[#2b2d34] via-[#1a1c22] to-black hover:bg-zinc-800 text-white'
                    }`}
                  >
                    <span className="text-[8px] font-bold pointer-events-none">{NOTE_NAMES[nextPitchClass]}</span>
                    {blackCents !== 0 && (
                      <span className="text-[6px] bg-black text-amber-400 px-0.5 rounded font-bold pointer-events-none">
                        {blackCents > 0 ? `+${blackCents}` : blackCents}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
