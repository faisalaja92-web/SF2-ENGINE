import React, { useEffect, useRef, useState } from 'react';
import { Mp3Track } from '../../types/synth';
import { audioEngine } from '../../audio/audioEngine';
import {
  Play,
  Pause,
  Square,
  Repeat,
  Music,
  Upload,
  Disc3,
  Volume2,
} from 'lucide-react';

interface Mp3ViewProps {
  customTracks: Mp3Track[];
  onUploadCustomTrack: (file: File) => void;
}

export const Mp3View: React.FC<Mp3ViewProps> = ({ customTracks, onUploadCustomTrack }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isLooping, setIsLooping] = useState(true);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const tracks: Mp3Track[] = customTracks;
  const activeTrack = tracks[currentTrackIndex] || null;

  useEffect(() => {
    const audio = audioEngine.getOrCreateMp3Player();
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
    };

    const onEnded = () => {
      if (!isLooping) setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [isLooping]);

  const togglePlay = () => {
    if (!activeTrack) return;
    audioEngine.initContext();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (audio.src !== activeTrack.url) {
        audio.src = activeTrack.url;
      }
      audio.volume = volume;
      audio.playbackRate = playbackRate;
      audio.loop = isLooping;
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const stopAudio = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSelectTrack = (idx: number) => {
    setCurrentTrackIndex(idx);
    stopAudio();
    const tr = tracks[idx];
    if (tr && audioRef.current) {
      audioRef.current.src = tr.url;
    }
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-1 sm:p-2 bg-[#14161c] text-zinc-100 font-mono select-none overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-1 border-b border-[#2b303d] text-xs shrink-0 px-0.5">
        <div className="flex items-center gap-1.5">
          <Music size={13} className="text-amber-400" />
          <span className="text-zinc-200 font-bold text-[11px] sm:text-xs tracking-wider">
            MP3 PLAYER &amp; BACKING TRACK
          </span>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 px-2 py-0.5 text-[10px] sm:text-xs bg-gradient-to-b from-[#2a2e3a] to-[#181a22] hover:from-[#353a49] hover:to-[#20232e] text-zinc-200 border border-[#3b4356] rounded shadow-sm active:scale-95 transition-all font-bold"
        >
          <Upload size={11} className="text-amber-400" />
          <span>LOAD MP3</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUploadCustomTrack(f);
            e.target.value = '';
          }}
          accept=".mp3,audio/*"
          className="hidden"
        />
      </div>

      {/* Main Responsive Grid: Player on left (7 cols), Tracklist on right (5 cols) */}
      <div className="grid grid-cols-12 gap-1.5 flex-1 py-1 min-h-0 overflow-hidden">
        
        {/* Left: Player Display & Transport Controls */}
        <div className="col-span-7 sm:col-span-8 flex flex-col justify-between p-1.5 sm:p-2 bg-gradient-to-b from-[#1b1e27] to-[#13151b] border border-[#2c3242] rounded-lg shadow-inner overflow-hidden">
          
          {/* 1. TOP TRANSPORT BAR (PLAY, STOP, LOOP, SPEED, VOL) - COMPACT & NEVER CUT OFF */}
          <div className="flex items-center justify-between gap-1 pb-1 border-b border-[#292f3f] shrink-0">
            {/* Main Action Buttons: Stop, Play/Pause, Loop */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={stopAudio}
                disabled={!activeTrack}
                className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center bg-[#20242e] hover:bg-[#2b303d] disabled:opacity-30 text-zinc-300 border border-[#343b4c] rounded active:scale-95 shadow-sm"
                title="Stop"
              >
                <Square size={11} />
              </button>

              <button
                onClick={togglePlay}
                disabled={!activeTrack}
                className="h-6 sm:h-7 px-2 sm:px-2.5 bg-gradient-to-b from-amber-400 to-yellow-500 hover:brightness-110 disabled:opacity-30 disabled:shadow-none text-black font-black rounded-md shadow-[0_0_10px_rgba(245,158,11,0.5)] active:scale-95 transition-all flex items-center justify-center gap-1"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <>
                    <Pause size={12} />
                    <span className="text-[9px] sm:text-[10px] font-mono font-black">PAUSE</span>
                  </>
                ) : (
                  <>
                    <Play size={12} className="fill-black" />
                    <span className="text-[9px] sm:text-[10px] font-mono font-black">PLAY</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setIsLooping(!isLooping)}
                disabled={!activeTrack}
                className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded border disabled:opacity-30 transition-all ${
                  isLooping
                    ? 'bg-amber-400/25 text-amber-300 border-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]'
                    : 'bg-[#20242e] text-zinc-500 border-[#343b4c]'
                }`}
                title={`Loop: ${isLooping ? 'ON' : 'OFF'}`}
              >
                <Repeat size={11} />
              </button>
            </div>

            {/* Tempo / Playback Rate & Volume Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Playback speed */}
              <div className="hidden sm:flex items-center gap-0.5">
                {[0.8, 1.0, 1.2].map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setPlaybackRate(r);
                      if (audioRef.current) audioRef.current.playbackRate = r;
                    }}
                    className={`px-1 py-0.2 rounded border text-[7px] sm:text-[8px] font-bold ${
                      playbackRate === r
                        ? 'bg-amber-400 text-black border-yellow-300 font-black'
                        : 'bg-[#1b1e26] text-zinc-400 border-[#2b303d]'
                    }`}
                  >
                    {r}x
                  </button>
                ))}
              </div>

              {/* Volume Slider: Compact & Guaranteed to fit */}
              <div className="flex items-center gap-1 bg-[#101217] px-1 py-0.5 rounded border border-[#272d3c]">
                <Volume2 size={11} className="text-amber-400 shrink-0" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    if (audioRef.current) audioRef.current.volume = v;
                  }}
                  className="w-10 sm:w-14 accent-amber-400 h-1 bg-zinc-900 rounded cursor-pointer"
                  title={`Volume: ${Math.round(volume * 100)}%`}
                />
                <span className="text-[7px] font-mono text-zinc-400 hidden sm:inline">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* 2. COVER ART THUMBNAIL & TRACK TITLE */}
          <div className="flex items-center gap-2 my-1">
            {/* Embedded Cover Art or Vinyl Graphic */}
            <div className="relative w-9 h-9 sm:w-11 sm:h-11 shrink-0 rounded overflow-hidden bg-[#0a0c10] border border-[#313747] flex items-center justify-center shadow-md">
              {activeTrack?.coverUrl ? (
                <img
                  src={activeTrack.coverUrl}
                  alt={activeTrack.title}
                  className={`w-full h-full object-cover transition-all ${
                    isPlaying ? 'brightness-105' : 'brightness-90'
                  }`}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-zinc-500">
                  <Disc3
                    size={18}
                    className={`text-amber-400/80 ${isPlaying ? 'animate-spin' : ''}`}
                    style={{ animationDuration: '4s' }}
                  />
                  <span className="text-[5px] text-zinc-400">AUDIO</span>
                </div>
              )}

              {/* Status pulse dot */}
              <div
                className={`absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full border border-black ${
                  isPlaying ? 'bg-amber-400 animate-ping' : 'bg-zinc-600'
                }`}
              />
            </div>

            {/* Track Title and Metadata */}
            <div className="flex-1 truncate">
              <div className="flex items-center justify-between text-[7px] sm:text-[8px] text-zinc-400 mb-0.5">
                <span>{activeTrack ? `TRACK #${currentTrackIndex + 1}` : 'NO TRACK LOADED'}</span>
                <span className={`font-bold px-1 py-0.2 rounded text-[6px] sm:text-[7px] ${
                  isPlaying ? 'bg-amber-400/20 text-yellow-300 border border-amber-500/50' : 'text-zinc-500'
                }`}>
                  {isPlaying ? 'PLAYING' : 'STOPPED'}
                </span>
              </div>
              <div className="text-[11px] sm:text-xs font-bold text-zinc-100 tracking-wide truncate">
                {activeTrack ? activeTrack.title : 'Muat lagu via tombol LOAD MP3'}
              </div>
              <div className="text-[7px] text-zinc-500 truncate">
                {activeTrack ? (activeTrack.coverUrl ? 'Cover Art: Embedded ID3' : 'Audio Track') : '.mp3 / audio files'}
              </div>
            </div>
          </div>

          {/* 3. TIMELINE & SCRUBBER */}
          <div className="mt-auto pt-0.5 border-t border-[#252a38]">
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              disabled={!activeTrack}
              onChange={(e) => {
                const t = parseFloat(e.target.value);
                setCurrentTime(t);
                if (audioRef.current) audioRef.current.currentTime = t;
              }}
              className="w-full accent-amber-400 h-1 bg-[#090b0f] rounded cursor-pointer disabled:opacity-40"
            />
            <div className="flex justify-between text-[8px] text-amber-400 font-bold">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* Right: Compact Tracklist (Daftar MP3) */}
        <div className="col-span-5 sm:col-span-4 p-1.5 bg-[#12141a] border border-[#272c3a] rounded-lg flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between text-[9px] text-zinc-400 font-bold uppercase pb-0.5 border-b border-[#222734] shrink-0">
            <span>DAFTAR MP3 ({tracks.length})</span>
          </div>

          <div className="space-y-1 overflow-y-auto flex-1 my-1 pr-0.5">
            {tracks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-[9px] text-zinc-500 py-2">
                <Disc3 size={16} className="text-zinc-600 mb-0.5" />
                <span>BELUM ADA LAGU</span>
                <span className="text-[8px] text-zinc-600">Klik LOAD MP3</span>
              </div>
            ) : (
              tracks.map((t, idx) => (
                <div
                  key={t.id}
                  onClick={() => handleSelectTrack(idx)}
                  className={`flex items-center gap-1 p-1 rounded border text-[10px] cursor-pointer truncate transition-all ${
                    currentTrackIndex === idx
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-500 border-yellow-300 text-black font-bold shadow-sm'
                      : 'bg-[#181a22] border-[#2a2f3d] text-zinc-300 hover:text-white'
                  }`}
                >
                  <span className="text-[8px] font-mono opacity-70 shrink-0">
                    {idx + 1}.
                  </span>
                  <span className="truncate flex-1 font-sans text-[10px]">
                    {t.title}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
