import React, { useState } from 'react';
import { SoundBank } from '../types/synth';
import { Save, Check, Download, Upload, X } from 'lucide-react';

interface BankManagerModalProps {
  banks: SoundBank[];
  activeBankId: number;
  onSaveBank: (bankId: number, bankName: string) => void;
  onSelectBank: (bankId: number) => void;
  onClose: () => void;
  onImportBanks: (imported: SoundBank[]) => void;
}

export const BankManagerModal: React.FC<BankManagerModalProps> = ({
  banks,
  activeBankId,
  onSaveBank,
  onSelectBank,
  onClose,
  onImportBanks,
}) => {
  const [targetBankId, setTargetBankId] = useState<number>(activeBankId);
  const currentTargetBank = banks.find((b) => b.id === targetBankId) || banks[0];
  const [bankName, setBankName] = useState<string>(currentTargetBank.name);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    onSaveBank(targetBankId, bankName.trim() || `Bank 0${targetBankId}`);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const exportBanksJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(banks, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', 'sf2_workstation_8_banks.json');
    dlAnchorElem.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onImportBanks(parsed);
          onClose();
        }
      } catch {
        alert('Invalid banks backup file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 font-mono">
      <div className="bg-zinc-950 border-2 border-emerald-500 rounded-lg max-w-xl w-full p-5 shadow-[0_0_35px_rgba(0,255,102,0.3)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-900 mb-4">
          <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm tracking-wider">
            <Save size={16} />
            <span>SOUND BANK SAVE &amp; PRESET MANAGER (1 - 8)</span>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-500 hover:text-emerald-300 p-1 rounded hover:bg-zinc-900 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Bank Selection 1 to 8 */}
        <div className="mb-4">
          <div className="text-xs text-emerald-500/80 mb-2 font-bold uppercase">
            SELECT BANK SLOT TO SAVE / RECALL (MAX 8 SETTINGAN):
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
            {banks.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setTargetBankId(b.id);
                  setBankName(b.name);
                }}
                className={`py-2 px-1 rounded border font-bold text-xs flex flex-col items-center justify-center transition-all ${
                  targetBankId === b.id
                    ? 'bg-emerald-500 text-black border-emerald-400 font-extrabold shadow-[0_0_8px_#00ff66]'
                    : activeBankId === b.id
                    ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-emerald-800'
                }`}
              >
                <span>{b.id}</span>
                <span className="text-[9px] mt-0.5 truncate max-w-full px-0.5 opacity-80">
                  {b.name.slice(0, 4)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Bank Name Input */}
        <div className="mb-4 bg-black/60 p-3 rounded border border-emerald-900">
          <label className="block text-xs text-emerald-400 mb-1 font-semibold">
            BANK {targetBankId} PRESET NAME:
          </label>
          <input
            type="text"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="w-full bg-zinc-900 border border-emerald-700/80 rounded px-3 py-2 text-sm text-emerald-200 focus:outline-none focus:border-emerald-400"
            placeholder="e.g. Arabic Lead Solo Bayati"
          />
          <div className="text-[10px] text-emerald-600 mt-1">
            Saves all 4 sound layers, volumes, transpose, oscillator parameters, scale tuning, and effects.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-950">
          <div className="flex items-center gap-2">
            <button
              onClick={exportBanksJson}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-900 rounded"
              title="Backup 8 banks to JSON file"
            >
              <Download size={13} />
              <span>BACKUP</span>
            </button>
            <label className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-900 rounded cursor-pointer">
              <Upload size={13} />
              <span>RESTORE</span>
              <input type="file" onChange={handleImportFile} accept=".json" className="hidden" />
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onSelectBank(targetBankId);
                onClose();
              }}
              className="px-3 py-1.5 text-xs bg-zinc-900 hover:bg-zinc-800 text-emerald-300 border border-emerald-700 rounded font-semibold"
            >
              LOAD BANK {targetBankId}
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded border border-emerald-400 shadow-[0_0_12px_#00ff66] transition-all"
            >
              {saveSuccess ? (
                <>
                  <Check size={14} />
                  <span>SAVED!</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>SAVE CURRENT SETTING</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
