import React, { useRef, useState } from 'react';
import { SoundBank, KeyboardSplitSettings } from '../../types/synth';
import { Save, Check, Trash2, Split } from 'lucide-react';

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
  masterTranspose: number;
  onTransposeChange: (delta: number) => void;
}

export const BankView: React.FC<BankViewProps> = ({
  banks, activeBankId, onSelectBank, onSaveBank, onDeleteBank,
  splitSettings, onToggleSplit, onOpenSplitModal,
  masterOctave, onOctaveChange, masterTranspose, onTransposeChange,
}) => {
  const [holdingBankId, setHoldingBankId] = useState<number | null>(null);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [savedSuccessId, setSavedSuccessId] = useState<number | null>(null);
  const [deletedSuccessId, setDeletedSuccessId] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdStartTimeRef = useRef<number>(0);
  const HOLD_DURATION_MS = 700;

  const startHold = (bankId: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setHoldingBankId(bankId);
    holdStartTimeRef.current = Date.now();
    setHoldProgress(0);
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartTimeRef.current;
      setHoldProgress(Math.min(100, Math.round((elapsed / HOLD_DURATION_MS) * 100)));
    }, 30);
    timerRef.current = setTimeout(() => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      const bank = banks.find((item) => item.id === bankId);
      if (!bank) return;
      if (bank.isEmpty) {
        onSaveBank(bankId);
        setSavedSuccessId(bankId);
        setTimeout(() => setSavedSuccessId(null), 1800);
      } else if (window.confirm('Hapus isi bank ini? Pengaturan dan layer yang tersimpan akan dihapus.')) {
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
    if (triggeredClick && elapsed < 400) onSelectBank(bankId);
  };

  return (
    <div className="w-full h-full min-h-0 flex flex-col gap-1 p-1 bg-[#111a29] text-zinc-100 font-mono overflow-hidden">
      <div className="flex items-center justify-between pb-1 border-b border-[#2b2f3a] text-xs shrink-0">
        <div className="flex items-center gap-2"><Save size={13} className="text-amber-400" /><span className="text-zinc-200 font-bold tracking-wider">PRESET BANK</span></div>
        <span className="text-[9px] text-zinc-400">TAP: LOAD · HOLD: SAVE / DELETE</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 shrink-0 rounded border border-[#29364b] bg-[#0c1422] p-1">
        <button onClick={onToggleSplit} onContextMenu={(e) => e.preventDefault()} className={`min-h-9 rounded border px-2 text-[10px] font-bold ${splitSettings.enabled ? 'bg-amber-400 text-black border-yellow-200' : 'bg-[#1b2638] text-zinc-300 border-[#39465a]'}`}>SPLIT {splitSettings.enabled ? 'ON' : 'OFF'}</button>
        <button onClick={onOpenSplitModal} className="min-h-9 rounded border border-[#39465a] bg-[#1b2638] px-2 text-[10px] font-bold text-zinc-200">SPLIT SETUP</button>
        <div className="flex items-center justify-between rounded border border-[#39465a] bg-[#151d2b] px-1">
          <button onClick={() => onOctaveChange(-1)} className="min-w-8 min-h-9 rounded bg-[#293449] text-lg font-black text-white">−</button>
          <span className="px-1 text-[9px] font-bold text-zinc-200">OCT {masterOctave > 0 ? '+' : ''}{masterOctave}</span>
          <button onClick={() => onOctaveChange(1)} className="min-w-8 min-h-9 rounded bg-[#293449] text-lg font-black text-white">+</button>
        </div>
        <div className="flex items-center justify-between rounded border border-[#39465a] bg-[#151d2b] px-1">
          <button onClick={() => onTransposeChange(-1)} className="min-w-8 min-h-9 rounded bg-[#293449] text-lg font-black text-white">−</button>
          <span className="px-1 text-[9px] font-bold text-zinc-200">TRN {masterTranspose > 0 ? '+' : ''}{masterTranspose}</span>
          <button onClick={() => onTransposeChange(1)} className="min-w-8 min-h-9 rounded bg-[#293449] text-lg font-black text-white">+</button>
        </div>
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
              className={`relative flex items-center justify-between min-h-0 px-3 py-1 rounded-md border cursor-pointer select-none transition-all overflow-hidden ${isJustSaved ? 'bg-amber-400 text-black border-white font-black' : isJustDeleted ? 'bg-red-900/70 border-red-500 text-white' : isSelected ? 'bg-gradient-to-r from-white via-zinc-100 to-zinc-200 text-black border-white shadow-[0_0_12px_rgba(255,255,255,0.45)] font-black' : isEmpty ? 'border-[#2b2f38] bg-[#1d1f27]/80' : 'bg-gradient-to-r from-[#2f2b38] to-[#3a3545] border-[#4b4356]'}`}>
              {isHolding && <div className="absolute inset-y-0 left-0 bg-amber-500/35 pointer-events-none" style={{ width: `${holdProgress}%` }} />}
              <span className={`relative z-10 text-[10px] sm:text-xs font-bold ${isSelected || isJustSaved ? 'text-black' : 'text-zinc-100'}`}>{isJustSaved ? 'SAVED' : isJustDeleted ? 'DELETED' : isEmpty ? 'EMPTY BANK' : 'USER BANK'}</span>
              <span className="relative z-10 text-[9px] font-bold text-zinc-300">{isHolding ? (isEmpty ? 'SAVE...' : 'DELETE...') : isJustSaved ? <Check size={15}/> : isJustDeleted ? <Trash2 size={15}/> : isEmpty ? 'HOLD TO SAVE' : 'HOLD TO DELETE'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
