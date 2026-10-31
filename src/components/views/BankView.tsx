import React, { useRef, useState } from 'react';
import { SoundBank, KeyboardSplitSettings } from '../../types/synth';
import { Save, Check, Trash2 } from 'lucide-react';

interface BankViewProps {
  banks: SoundBank[];
  activeBankId: number;
  onSelectBank: (id: number) => void;
  onSaveBank: (bankId: number) => void;
  onDeleteBank: (bankId: number) => void;
  currentLayerNames: string[];
  splitSettings: KeyboardSplitSettings;
  onToggleSplit: () => void;
  onOpenSplitModal: () => void;
  masterOctave: number;
  onOctaveChange: (delta: number) => void;
  onOctaveReset: () => void;
  masterTranspose: number;
  onTransposeChange: (delta: number) => void;
  onTransposeReset: () => void;
  isTransposeActive: boolean;
  onToggleTransposeActive: () => void;
}

export const BankView: React.FC<BankViewProps> = ({
  banks, activeBankId, onSelectBank, onSaveBank, onDeleteBank,
  splitSettings, onToggleSplit, onOpenSplitModal,
  masterOctave, onOctaveChange, onOctaveReset,
  masterTranspose, onTransposeChange, onTransposeReset,
  isTransposeActive, onToggleTransposeActive,
}) => {
  const [holdingBankId, setHoldingBankId] = useState<number | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [savedSuccessId, setSavedSuccessId] = useState<number | null>(null);
  const [deletedSuccessId, setDeletedSuccessId] = useState<number | null>(null);
  const [activeOctaveAction, setActiveOctaveAction] = useState<'minus' | 'plus' | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdStartTimeRef = useRef(0);
  const splitHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didTriggerSplitLongPress = useRef(false);
  const [isHoldingSplit, setIsHoldingSplit] = useState(false);
  const HOLD_DURATION_MS = 700;

  const startHold = (bankId: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setHoldingBankId(bankId);
    holdStartTimeRef.current = Date.now();
    setHoldProgress(0);
    progressIntervalRef.current = setInterval(() => {
      setHoldProgress(Math.min(100, Math.round(((Date.now() - holdStartTimeRef.current) / HOLD_DURATION_MS) * 100)));
    }, 30);
    timerRef.current = setTimeout(() => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      const bank = banks.find((item) => item.id === bankId);
      if (bank?.isEmpty) {
        onSaveBank(bankId);
        setSavedSuccessId(bankId);
        setTimeout(() => setSavedSuccessId(null), 1800);
      } else if (bank && window.confirm('Hapus isi bank ini? Pengaturan dan layer yang tersimpan akan dihapus.')) {
        onDeleteBank(bankId);
        setDeletedSuccessId(bankId);
        setTimeout(() => setDeletedSuccessId(null), 1800);
      }
      setHoldingBankId(null);
      setHoldProgress(0);
      timerRef.current = null;
    }, HOLD_DURATION_MS);
  };

  const cancelHold = (bankId: number, triggeredClick = false) => {
    const elapsed = Date.now() - holdStartTimeRef.current;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    timerRef.current = null;
    progressIntervalRef.current = null;
    setHoldingBankId(null);
    setHoldProgress(0);
    if (triggeredClick && elapsed < HOLD_DURATION_MS) onSelectBank(bankId);
  };

  const handleSplitPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    didTriggerSplitLongPress.current = false;
    setIsHoldingSplit(true);
    splitHoldTimerRef.current = setTimeout(() => {
      didTriggerSplitLongPress.current = true;
      setIsHoldingSplit(false);
      onOpenSplitModal();
    }, 450);
  };
  const handleSplitPointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    if (splitHoldTimerRef.current) clearTimeout(splitHoldTimerRef.current);
    splitHoldTimerRef.current = null;
    setIsHoldingSplit(false);
    if (!didTriggerSplitLongPress.current) onToggleSplit();
    didTriggerSplitLongPress.current = false;
  };
  const handleSplitCancel = () => {
    if (splitHoldTimerRef.current) clearTimeout(splitHoldTimerRef.current);
    splitHoldTimerRef.current = null;
    setIsHoldingSplit(false);
    didTriggerSplitLongPress.current = false;
  };

  return (
    <div className="w-full h-full min-h-0 flex flex-col gap-1 p-1 bg-[#101b18] text-zinc-100 font-mono overflow-hidden">
      <div className="flex items-center justify-between pb-1 border-b border-[#34483d] text-xs shrink-0 px-0.5">
        <div className="flex items-center gap-2"><Save size={13} className="text-[#8fbf75]" /><span className="text-[#d2dfd0] font-bold tracking-wider">PRESET BANK</span></div>
        <span className="text-[9px] text-[#9eae9f]">TAP: LOAD · HOLD: SAVE / DELETE</span>
      </div>

      <div className="grid grid-cols-2 grid-rows-4 gap-1 flex-1 min-h-0 py-1 overflow-hidden">
        {banks.map((bank) => {
          const isSelected = activeBankId === bank.id;
          const isHolding = holdingBankId === bank.id;
          const isJustSaved = savedSuccessId === bank.id;
          const isJustDeleted = deletedSuccessId === bank.id;
          const isEmpty = bank.isEmpty;
          return (
            <div key={bank.id} onPointerDown={() => startHold(bank.id)} onPointerUp={() => cancelHold(bank.id, true)} onPointerLeave={() => cancelHold(bank.id, false)} onPointerCancel={() => cancelHold(bank.id, false)} onContextMenu={(e) => e.preventDefault()}
              className={`relative flex items-center justify-between min-h-0 px-3 py-1 border cursor-pointer select-none overflow-hidden rounded-sm ${isJustSaved ? 'bg-[#9fc47a] text-[#10180e] border-[#c4e2a5] font-black' : isJustDeleted ? 'bg-[#632c25] border-[#a34d3d] text-white' : isSelected ? 'bg-[#426a43] text-white border-[#a0c58b] font-black' : isEmpty ? 'border-[#35473b] bg-[#17231d]' : 'bg-[#263b2d] border-[#4c654e] text-[#e0eadc]'}`}>
              {isHolding && <div className="absolute inset-y-0 left-0 bg-[#9fc47a]/35 pointer-events-none" style={{ width: `${holdProgress}%` }} />}
              <span className="relative z-10 text-[10px] sm:text-xs font-bold">{isJustSaved ? 'SAVED' : isJustDeleted ? 'DELETED' : isEmpty ? 'EMPTY BANK' : 'USER BANK'}</span>
              <span className="relative z-10 text-[9px] font-bold text-[#c0d0bf]">{isHolding ? (isEmpty ? 'SAVE...' : 'DELETE...') : isJustSaved ? <Check size={14}/> : isJustDeleted ? <Trash2 size={14}/> : isEmpty ? 'HOLD TO SAVE' : 'HOLD TO DELETE'}</span>
            </div>
          );
        })}
      </div>

      {/* Bottom Hardware Control Bar: Split (Tap ON/OFF, Hold Setup), Transpose Button, [- 0 +] Semitone/Octave Bar, Engine Info */}
      <div className="flex items-center justify-between pt-1 border-t border-[#34483d] text-xs shrink-0 px-0.5 sm:px-1 gap-1 bg-[#101b18]">
        {/* Left Side: Split Button & Transpose Button side by side */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Split Button: Tap to Toggle ON/OFF, Hold for Settings Modal */}
          <button
            onPointerDown={handleSplitPointerDown}
            onPointerUp={handleSplitPointerUp}
            onPointerLeave={handleSplitCancel}
            onPointerCancel={handleSplitCancel}
            onContextMenu={(e) => e.preventDefault()}
            className={`relative flex items-center gap-1 sm:gap-1.5 px-1.5 py-0.5 rounded border transition-all active:scale-95 shadow select-none ${
              splitSettings?.enabled
                ? 'bg-[#789b4f] text-[#10180e] border-[#b4d28e] font-black'
                : 'bg-[#1a2a20] text-[#c7d5c5] border-[#49634d]'
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
                ? 'bg-[#789b4f] text-[#10180e] border-[#b4d28e] font-black'
                : 'bg-[#1a2a20] text-[#c7d5c5] border-[#49634d]'
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
        <div className="flex items-center gap-0.5 sm:gap-1 bg-[#0b130e] p-0.5 rounded-sm border border-[#3c5140] shadow-inner shrink-0">
          {/* Minus Button */}
          <button
            onClick={() => {
              setActiveOctaveAction('minus');
              if (isTransposeActive) {
                onTransposeChange?.(-1);
              } else {
                onOctaveChange?.(-1);
              }
            }}
            className={`min-w-11 h-10 px-3 rounded border font-black text-lg flex items-center justify-center shadow transition-all select-none active:scale-95 ${activeOctaveAction === 'minus' ? 'bg-[#a0c66f] text-[#132014] border-[#d0e6a9]' : 'bg-[#263b2d] text-[#e0eadc] border-[#526c53]'}`}
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
              setActiveOctaveAction(null);
            }}
            className="min-w-12 h-9 px-1.5 rounded font-mono font-bold text-[10px] sm:text-xs flex items-center justify-center border border-[#2b303c] bg-[#17251b] text-[#dce8d9] select-none"
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
              setActiveOctaveAction('plus');
              if (isTransposeActive) {
                onTransposeChange?.(1);
              } else {
                onOctaveChange?.(1);
              }
            }}
            className={`min-w-11 h-10 px-3 rounded border font-black text-lg flex items-center justify-center shadow transition-all select-none active:scale-95 ${activeOctaveAction === 'plus' ? 'bg-[#a0c66f] text-[#132014] border-[#d0e6a9]' : 'bg-[#263b2d] text-[#e0eadc] border-[#526c53]'}`}
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
