import React, { useRef, useState } from 'react';
import { ParsedSoundFont } from '../../audio/sf2Parser';
import { audioEngine } from '../../audio/audioEngine';
import { Upload, FolderOpen, RefreshCw, CheckCircle2 } from 'lucide-react';

interface LoadViewProps {
  onSoundFontLoaded: (sf: ParsedSoundFont) => void;
  allPresetsCount: number;
}

export const LoadView: React.FC<LoadViewProps> = ({
  onSoundFontLoaded,
  allPresetsCount,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastLoadedCount, setLastLoadedCount] = useState<number | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const sf = await audioEngine.loadSoundFontFile(file);
      onSoundFontLoaded(sf);
      setLastLoadedCount(sf.presets.length);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Gagal memuat file .sf2');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 sm:p-4 bg-[#14161c] text-zinc-100 font-mono overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#2b303d] text-xs shrink-0">
        <div className="flex items-center gap-1.5">
          <FolderOpen size={14} className="text-amber-400" />
          <span className="text-zinc-200 font-bold text-xs tracking-wider">
            LOAD SOUNDFONT (.SF2)
          </span>
        </div>
        <span className="text-amber-400 font-extrabold text-xs bg-[#1f2430] px-2.5 py-0.5 rounded border border-[#343b4f]">
          TOTAL TERMUAT: {allPresetsCount} SUARA
        </span>
      </div>

      {/* Main Center Uploader */}
      <div className="flex-1 flex flex-col items-center justify-center py-2">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full max-w-lg border-2 border-dashed border-[#444c5f] hover:border-amber-400 bg-gradient-to-b from-[#21242d] to-[#15171d] rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer transition-all text-center shadow-[0_0_25px_rgba(0,0,0,0.8)] hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".sf2,.SF2"
            className="hidden"
          />

          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <RefreshCw size={36} className="animate-spin text-amber-400" />
              <span className="text-sm font-bold text-amber-300">
                Memproses file SoundFont2 (.sf2)...
              </span>
            </div>
          ) : (
            <>
              <Upload size={38} className="text-amber-400 mb-3" />
              <span className="text-base sm:text-lg font-bold text-zinc-100 tracking-wide">
                KLIK UNTUK MEMILIH FILE .SF2
              </span>
              <span className="text-xs text-zinc-400 mt-1">
                Drag &amp; drop SoundFont file (.sf2) ke area ini
              </span>

              {lastLoadedCount !== null && (
                <div className="mt-4 flex items-center gap-1.5 bg-[#1b2234] text-amber-300 border border-amber-500/80 px-3 py-1.5 rounded-lg text-xs font-bold shadow-[0_0_12px_rgba(245,158,11,0.4)]">
                  <CheckCircle2 size={16} className="text-amber-400" />
                  <span>BERHASIL MEMUAT {lastLoadedCount} SUARA</span>
                </div>
              )}
            </>
          )}

          {errorMsg && (
            <div className="mt-3 text-red-300 text-xs bg-red-950/80 px-3 py-1.5 rounded border border-red-700">
              {errorMsg}
            </div>
          )}
        </div>
      </div>

      <div className="text-[10px] text-zinc-500 text-center border-t border-[#222630] pt-1">
        Supports SoundFont 2.04 format (RIFF SF2) · 48 kHz / 32-bit Float Audio Engine
      </div>
    </div>
  );
};
