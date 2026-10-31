import React, { useRef, useState } from 'react';
import { SoundBank } from '../../types/synth';
import { Save, Check } from 'lucide-react';

interface BankViewProps {
  banks: SoundBank[];
  activeBankId: number;
  onSelectBank: (id: number) => void;
  onSaveBank: (bankId: number) => void;
  currentLayerNames: string[];
}

export const BankView: React.FC<BankViewProps> = ({
  banks,
  activeBankId,
  onSelectBank,
  onSaveBank,
}) => {
  const [holdingBankId, setHoldingBankId] = useState<number | null>(null);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [savedSuccessId, setSavedSuccessId] = useState<number | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const holdStartTimeRef = useRef<number>(0);

  const HOLD_DURATION_MS = 700; // Short deliberate hold to save

  const startHold = (bankId: number) => {
    setHoldingBankId(bankId);
    holdStartTimeRef.current = Date.now();
    setHoldProgress(0);

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartTimeRef.current;
      const pct = Math.min(100, Math.round((elapsed / HOLD_DURATION_MS) * 100));
      setHoldProgress(pct);
    }, 40);

    timerRef.current = setTimeout(() => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setHoldProgress(100);

      onSaveBank(bankId);
      setSavedSuccessId(bankId);
      setHoldingBankId(null);
      setHoldProgress(0);

      setTimeout(() => setSavedSuccessId(null), 2000);
    }, HOLD_DURATION_MS);
  };

  const cancelHold = (bankId: number, triggeredClick = false) => {
    const elapsed = Date.now() - holdStartTimeRef.current;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    setHoldingBankId(null);
    setHoldProgress(0);

    // Quick tap loads bank
    if (triggeredClick && elapsed < 400) {
      onSelectBank(bankId);
    }
  };

  return (
    <div className="w-full h-full min-h-0 flex flex-col gap-1 p-1 bg-[#111a29] text-zinc-100 font-mono overflow-hidden">
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#2b2f3a] text-xs shrink-0">
        <div className="flex items-center gap-2">
          <Save size={13} className="text-amber-400" />
          <span className="text-zinc-200 font-bold text-xs tracking-wider">
            PRESET BANK
          </span>
        </div>
        <div className="text-[10px] text-zinc-400 font-bold bg-[#1d212b] px-2 py-0.5 rounded border border-[#2f3545]">
          BANK
        </div>
      </div>

      {/* Main 8 Bank Buttons Grid (2 columns x 4 rows) */}
      <div className="grid grid-cols-2 grid-rows-4 gap-1 flex-1 min-h-0 py-1 overflow-hidden">
        {banks.map((bank) => {
          const isSelected = activeBankId === bank.id;
          const isHolding = holdingBankId === bank.id;
          const isJustSaved = savedSuccessId === bank.id;
          const isEmpty = bank.isEmpty;

          return (
            <div
              key={bank.id}
              onPointerDown={() => startHold(bank.id)}
              onPointerUp={() => cancelHold(bank.id, true)}
              onPointerLeave={() => cancelHold(bank.id, false)}
              onContextMenu={(e) => e.preventDefault()}
              className={`relative flex items-center justify-between min-h-0 px-2 py-1 rounded-md border cursor-pointer select-none transition-all overflow-hidden ${
                isJustSaved
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black border-white font-black shadow-[0_0_20px_#f59e0b]'
                  : isSelected
                  ? 'bg-gradient-to-r from-white via-zinc-100 to-zinc-200 text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.7)] font-black'
                  : isEmpty
                  ? 'border-[#2b2f38] bg-[#1d1f27]/80 hover:border-[#424856]'
                  : 'bg-gradient-to-r from-[#2f2b38] to-[#3a3545] border-[#4b4356] hover:border-[#6f6380]'
              }`}
            >
              {/* Hold Progress Fill Bar */}
              {isHolding && (
                <div
                  className="absolute inset-0 bg-amber-500/35 transition-all pointer-events-none"
                  style={{ width: `${holdProgress}%` }}
                />
              )}

              {/* Bank title without numeric slot labels */}
              <div className="flex items-center gap-2.5 truncate z-10 mr-1">

                <div className="truncate">
                  <div
                    className={`font-mono text-[10px] sm:text-xs font-semibold tracking-normal truncate ${
                      isJustSaved
                        ? 'text-black font-black'
                        : isSelected
                        ? 'text-black font-extrabold'
                        : isEmpty
                        ? 'text-zinc-500'
                        : 'text-zinc-100'
                    }`}
                  >
                    {isJustSaved
                      ? 'SAVED'
                      : 'USER BANK'}
                  </div>
                </div>
              </div>

              {/* Status / Hold prompt */}
              <div className="shrink-0 text-right z-10">
                {isHolding ? (
                  <span className="text-[10px] text-amber-300 font-extrabold animate-pulse">
                    HOLD...
                  </span>
                ) : isJustSaved ? (
                  <Check size={16} className="text-black" />
                ) : (
                  <span className="text-[9px] text-zinc-400 bg-[#12141a] px-1.5 py-0.5 rounded border border-[#2b2f3a]">
                    {isEmpty ? 'EMPTY' : isSelected ? 'ACTIVE' : 'READY'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
