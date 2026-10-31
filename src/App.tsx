import React, { useCallback, useEffect, useState } from 'react';
import {
  ArabicScaleTuning,
  EfxSettings,
  EqualizerSettings,
  KeyboardSplitSettings,
  Mp3Track,
  SoundBank,
  SoundLayer,
  SoundPreset,
  ViewMenu,
} from './types/synth';
import { INITIAL_BANKS } from './audio/defaultBanks';
import { INITIAL_SF2_PRESETS } from './audio/builtInSounds';
import { ParsedSoundFont } from './audio/sf2Parser';
import { audioEngine } from './audio/audioEngine';
import { WorkstationFrame } from './components/WorkstationFrame';
import { ListView } from './components/views/ListView';
import { BankView } from './components/views/BankView';
import { ScaleView } from './components/views/ScaleView';
import { EfxView } from './components/views/EfxView';
import { MixerView } from './components/views/MixerView';
import { LoadView } from './components/views/LoadView';
import { Mp3View } from './components/views/Mp3View';
import { VirtualPiano } from './components/VirtualPiano';
import { BootScreen } from './components/BootScreen';
import { KeyboardSplitModal } from './components/KeyboardSplitModal';
import { extractMp3CoverArt } from './utils/id3CoverExtractor';

const STORAGE_KEY = 'sf2_workstation_banks_v3';

export default function App() {
  useEffect(() => {
    const guardBackNavigation = () => {
      window.history.pushState({ sf2EngineGuard: true }, '');
      const handleBack = () => {
        const shouldExit = window.confirm('Keluar dari Soundfont Engine?');
        if (shouldExit) {
          window.removeEventListener('popstate', handleBack);
          window.history.back();
        } else {
          window.history.pushState({ sf2EngineGuard: true }, '');
        }
      };
      window.addEventListener('popstate', handleBack);
    };
    guardBackNavigation();
    return () => window.removeEventListener('popstate', () => {});
  }, []);

  const [banks, setBanks] = useState<SoundBank[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 8) {
          return parsed;
        }
      }
    } catch {}
    return INITIAL_BANKS;
  });

  const [activeBankId, setActiveBankId] = useState<number>(1);
  const currentBank = banks.find((b) => b.id === activeBankId) || banks[0];

  const [layers, setLayers] = useState<SoundLayer[]>(currentBank.layers);
  const [efx, setEfx] = useState<EfxSettings>(() => currentBank.isEmpty
    ? { ...currentBank.efx, tercaEnabled: false, reverbEnabled: false, delayEnabled: false, acousticEngine: { ...currentBank.efx.acousticEngine, enabled: false } }
    : currentBank.efx);
  const [equalizer, setEqualizer] = useState<EqualizerSettings>(currentBank.equalizer);
  const [scaleTuning, setScaleTuning] = useState<ArabicScaleTuning>(currentBank.scale);

  // SoundFont Presets and Dynamic Pagination (Point 2)
  const [allPresets, setAllPresets] = useState<SoundPreset[]>(INITIAL_SF2_PRESETS);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = Math.max(1, Math.ceil(allPresets.length / 8));

  // Load the bundled GeneralUser GS bank offline from the APK assets.
  useEffect(() => {
    let mounted = true;
    audioEngine.loadBundledSoundFont('/assets/GeneralUser-GS.sf2').then((sf) => {
      if (!mounted) return;
      const featuredPrograms = new Set([40, 48, 65, 71]);
      const featured = audioEngine.customPresets.filter((preset) => {
        const source = sf.presets[preset.presetIndex ?? -1];
        return preset.category === sf.name && preset.bank === 0 && !!source && featuredPrograms.has(source.preset);
      });
      if (featured.length > 0) setAllPresets(featured);
    }).catch((error) => {
      console.warn('Built-in SoundFont unavailable; using fallback instrument:', error);
    });
    return () => { mounted = false; };
  }, []);

  // Default view is LIST
  const [currentView, setCurrentView] = useState<ViewMenu>('LIST');
  const [isPianoVisible, setIsPianoVisible] = useState<boolean>(false);
  const [isBooting, setIsBooting] = useState<boolean>(true);

  const [pitchBend, setPitchBend] = useState<number>(0);
  const [modWheel, setModWheel] = useState<number>(0);
  const [sustain, setSustain] = useState<boolean>(false);
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [midiActive, setMidiActive] = useState<boolean>(false);
  const [customTracks, setCustomTracks] = useState<Mp3Track[]>([]);
  const [masterOctave, setMasterOctave] = useState<number>(currentBank.masterOctave ?? 0); // -3 to +3 octaves
  const [masterTranspose, setMasterTranspose] = useState<number>(currentBank.masterTranspose ?? 0); // -12 to +12 semitones
  const [isTransposeActive, setIsTransposeActive] = useState<boolean>(false);

  // Keyboard Split Settings (Arranger Keyboard Style)
  const [splitSettings, setSplitSettings] = useState<KeyboardSplitSettings>(() => {
    return (
      currentBank.split || {
        enabled: false,
        splitPoint: 48, // C3
        lowerLayers: [1],
        upperLayers: [2, 3, 4],
        lowerOctave: 0,
        upperOctave: 0,
      }
    );
  });
  const [isSplitModalOpen, setIsSplitModalOpen] = useState<boolean>(false);

  const handleOctaveChange = (delta: number) => {
    // Release existing notes before shifting octave
    activeNotes.forEach((n) => {
      const prevShifted = Math.max(0, Math.min(127, n + masterOctave * 12 + masterTranspose));
      audioEngine.triggerNoteOff(prevShifted, layers, efx);
    });
    setActiveNotes(new Set());
    setMasterOctave((prev) => Math.max(-3, Math.min(3, prev + delta)));
  };

  const handleOctaveReset = () => {
    activeNotes.forEach((n) => {
      const prevShifted = Math.max(0, Math.min(127, n + masterOctave * 12 + masterTranspose));
      audioEngine.triggerNoteOff(prevShifted, layers, efx);
    });
    setActiveNotes(new Set());
    setMasterOctave(0);
  };

  const handleTransposeChange = (delta: number) => {
    // Release existing notes before shifting transpose
    activeNotes.forEach((n) => {
      const prevShifted = Math.max(0, Math.min(127, n + masterOctave * 12 + masterTranspose));
      audioEngine.triggerNoteOff(prevShifted, layers, efx);
    });
    setActiveNotes(new Set());
    setMasterTranspose((prev) => Math.max(-12, Math.min(12, prev + delta)));
  };

  const handleTransposeReset = () => {
    activeNotes.forEach((n) => {
      const prevShifted = Math.max(0, Math.min(127, n + masterOctave * 12 + masterTranspose));
      audioEngine.triggerNoteOff(prevShifted, layers, efx);
    });
    setActiveNotes(new Set());
    setMasterTranspose(0);
  };

  const handleToggleSplit = () => {
    setSplitSettings((prev) => ({
      ...prev,
      enabled: !prev.enabled,
    }));
  };

  const triggerMidiLed = useCallback(() => {
    setMidiActive(true);
    setTimeout(() => setMidiActive(false), 70);
  }, []);

  useEffect(() => {
    audioEngine.updateMixer(layers, equalizer, efx);
  }, [layers, equalizer, efx]);

  useEffect(() => {
    audioEngine.onMidiActivity = triggerMidiLed;
    return () => {
      audioEngine.onMidiActivity = null;
    };
  }, [triggerMidiLed]);

  // Load Bank Preset
  const handleSelectBank = (id: number) => {
    const target = banks.find((b) => b.id === id);
    if (!target) return;

    audioEngine.stopAllVoices(false);
    setActiveNotes(new Set());

    setActiveBankId(id);
    setLayers(target.layers);
    setEfx(target.isEmpty
      ? { ...target.efx, tercaEnabled: false, reverbEnabled: false, delayEnabled: false, acousticEngine: { ...target.efx.acousticEngine, enabled: false } }
      : target.efx);
    setEqualizer(target.equalizer);
    setScaleTuning(target.scale);
    setMasterOctave(target.masterOctave ?? 0);
    setMasterTranspose(target.masterTranspose ?? 0);
    if (target.split) {
      setSplitSettings(target.split);
    } else {
      setSplitSettings({
        enabled: false,
        splitPoint: 48,
        lowerLayers: [1],
        upperLayers: [2, 3, 4],
        lowerOctave: 0,
        upperOctave: 0,
      });
    }
  };

  // Save current layered sounds & effects to Bank slot (Clean USER 1 - 8 name)
  const handleSaveBank = (bankId: number) => {
    const updatedBanks = banks.map((b) => {
      if (b.id === bankId) {
        return {
          ...b,
          name: `USER ${bankId}`,
          isEmpty: false,
          savedPresetNames: [],
          layers: JSON.parse(JSON.stringify(layers)),
          efx: { ...efx },
          equalizer: { ...equalizer },
          scale: JSON.parse(JSON.stringify(scaleTuning)),
          split: JSON.parse(JSON.stringify(splitSettings)),
          masterOctave,
          masterTranspose,
        };
      }
      return b;
    });

    setBanks(updatedBanks);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBanks));
    } catch {}
  };


  const handleDeleteBank = (bankId: number) => {
    const emptyTemplate = INITIAL_BANKS.find((bank) => bank.id === bankId) || INITIAL_BANKS[0];
    const updatedBanks = banks.map((bank) => bank.id === bankId
      ? JSON.parse(JSON.stringify(emptyTemplate)) as SoundBank
      : bank);
    setBanks(updatedBanks);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBanks)); } catch {}
    if (activeBankId === bankId) {
      const empty = JSON.parse(JSON.stringify(emptyTemplate)) as SoundBank;
      audioEngine.stopAllVoices(false);
      setActiveNotes(new Set());
      setLayers(empty.layers);
      setEfx({ ...empty.efx });
      setEqualizer({ ...empty.equalizer });
      setScaleTuning({ ...empty.scale });
      setSplitSettings(empty.split || { enabled: false, splitPoint: 48, lowerLayers: [1], upperLayers: [2, 3, 4], lowerOctave: 0, upperOctave: 0 });
      setMasterOctave(0);
      setMasterTranspose(0);
      setIsTransposeActive(false);
    }
  };

  // Single Tap on a sound: Switch directly & smoothly (Point 3)
  const handleSelectSingleSound = (preset: SoundPreset) => {
    setLayers((prev) => [
      {
        ...prev[0],
        presetId: preset.id,
        presetName: preset.name,
        enabled: true,
        oscillatorMode: false,
      },
      ...prev.slice(1).map((l) => ({ ...l, enabled: false })),
    ]);
  };

  // Hold 1 second on a sound: Toggle layer ON or OFF
  const handleToggleLayerSound = (preset: SoundPreset) => {
    setLayers((prev) => {
      // If already active, toggle OFF
      const existingActiveIndex = prev.findIndex((l) => l.enabled && l.presetId === preset.id);
      if (existingActiveIndex !== -1) {
        return prev.map((l, idx) =>
          idx === existingActiveIndex
            ? { ...l, enabled: false }
            : l
        );
      }

      // If not active, toggle ON in first inactive layer
      const inactiveIndex = prev.findIndex((l) => !l.enabled);
      if (inactiveIndex !== -1) {
        return prev.map((l, idx) =>
          idx === inactiveIndex
            ? { ...l, presetId: preset.id, presetName: preset.name, enabled: true, oscillatorMode: false }
            : l
        );
      } else {
        // If all 4 are active, replace layer 4
        return prev.map((l, idx) =>
          idx === 3
            ? { ...l, presetId: preset.id, presetName: preset.name, enabled: true, oscillatorMode: false }
            : l
        );
      }
    });
  };

  const handleUpdateLayer = (layerId: number, updates: Partial<SoundLayer>) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, ...updates } : l))
    );
  };

  const handleNoteOn = useCallback(
    (note: number, velocity = 0.85) => {
      triggerMidiLed();
      setActiveNotes((prev) => new Set(prev).add(note));

      if (splitSettings.enabled) {
        const isLower = note < splitSettings.splitPoint;
        const targetLayerIds = isLower ? splitSettings.lowerLayers : splitSettings.upperLayers;
        const zoneOctave = isLower ? splitSettings.lowerOctave : splitSettings.upperOctave;
        const shiftedNote = Math.max(0, Math.min(127, note + (masterOctave + zoneOctave) * 12 + masterTranspose));

        // Create virtual layer set where only targetLayerIds are enabled
        const splitLayers = layers.map((l) => ({
          ...l,
          enabled: l.enabled && targetLayerIds.includes(l.id),
        }));

        audioEngine.triggerNoteOn(shiftedNote, velocity, splitLayers, efx, scaleTuning);
      } else {
        const shifted = Math.max(0, Math.min(127, note + masterOctave * 12 + masterTranspose));
        audioEngine.triggerNoteOn(shifted, velocity, layers, efx, scaleTuning);
      }
    },
    [layers, efx, scaleTuning, triggerMidiLed, masterOctave, masterTranspose, splitSettings]
  );

  const handleNoteOff = useCallback(
    (note: number) => {
      setActiveNotes((prev) => {
        const next = new Set(prev);
        next.delete(note);
        return next;
      });

      if (splitSettings.enabled) {
        const isLower = note < splitSettings.splitPoint;
        const zoneOctave = isLower ? splitSettings.lowerOctave : splitSettings.upperOctave;
        const shiftedNote = Math.max(0, Math.min(127, note + (masterOctave + zoneOctave) * 12 + masterTranspose));
        audioEngine.triggerNoteOff(shiftedNote, layers, efx);
      } else {
        const shifted = Math.max(0, Math.min(127, note + masterOctave * 12 + masterTranspose));
        audioEngine.triggerNoteOff(shifted, layers, efx);
      }
    },
    [layers, efx, masterOctave, masterTranspose, splitSettings]
  );

  const handlePitchBendChange = (val: number) => {
    setPitchBend(val);
    audioEngine.pitchBend = val;
    audioEngine.updateActiveVoicesPitch();
    triggerMidiLed();
  };

  const handleModWheelChange = (val: number) => {
    setModWheel(val);
    audioEngine.modWheel = val;
    audioEngine.updateActiveVoicesModulation();
    triggerMidiLed();
  };

  const handleSustainToggle = () => {
    const next = !sustain;
    setSustain(next);
    audioEngine.sustainPedal = next;
    triggerMidiLed();
    if (!next) {
      activeNotes.forEach((n) => handleNoteOff(n));
    }
  };

  useEffect(() => {
    const handleMidiNoteOn = (e: CustomEvent) => handleNoteOn(e.detail.note, e.detail.velocity || 0.85);
    const handleMidiNoteOff = (e: CustomEvent) => handleNoteOff(e.detail.note);
    const handleMidiPitchBend = (e: CustomEvent) => {
      setPitchBend(e.detail.value);
      triggerMidiLed();
    };
    const handleMidiModWheel = (e: CustomEvent) => {
      setModWheel(e.detail.value);
      triggerMidiLed();
    };
    const handleMidiSustain = (e: CustomEvent) => {
      setSustain(e.detail.value);
      triggerMidiLed();
    };
    const handleReleaseSustained = (e: CustomEvent) => handleNoteOff(e.detail.note);
    const handleMidiActivityCc = () => triggerMidiLed();

    window.addEventListener('sf2-midi-noteon', handleMidiNoteOn as EventListener);
    window.addEventListener('sf2-midi-noteoff', handleMidiNoteOff as EventListener);
    window.addEventListener('sf2-midi-pitchbend', handleMidiPitchBend as EventListener);
    window.addEventListener('sf2-midi-modwheel', handleMidiModWheel as EventListener);
    window.addEventListener('sf2-midi-sustain', handleMidiSustain as EventListener);
    window.addEventListener('sf2-midi-breath', handleMidiActivityCc as EventListener);
    window.addEventListener('sf2-midi-expression', handleMidiActivityCc as EventListener);
    window.addEventListener('sf2-midi-aftertouch', handleMidiActivityCc as EventListener);
    window.addEventListener('sf2-release-sustained-note', handleReleaseSustained as EventListener);

    return () => {
      window.removeEventListener('sf2-midi-noteon', handleMidiNoteOn as EventListener);
      window.removeEventListener('sf2-midi-noteoff', handleMidiNoteOff as EventListener);
      window.removeEventListener('sf2-midi-pitchbend', handleMidiPitchBend as EventListener);
      window.removeEventListener('sf2-midi-modwheel', handleMidiModWheel as EventListener);
      window.removeEventListener('sf2-midi-sustain', handleMidiSustain as EventListener);
      window.removeEventListener('sf2-midi-breath', handleMidiActivityCc as EventListener);
      window.removeEventListener('sf2-midi-expression', handleMidiActivityCc as EventListener);
      window.removeEventListener('sf2-midi-aftertouch', handleMidiActivityCc as EventListener);
      window.removeEventListener('sf2-release-sustained-note', handleReleaseSustained as EventListener);
    };
  }, [handleNoteOn, handleNoteOff, triggerMidiLed]);

  const handleSoundFontLoaded = (sf: ParsedSoundFont) => {
    const newPresets = sf.presets.map((p, idx) => ({
      id: `sf2_${sf.name}_${p.preset}_${idx}`,
      name: p.name,
      fileName: sf.name,
      category: sf.name,
      presetIndex: idx,
      bank: p.bank,
    }));

    setAllPresets((prev) => [...prev, ...newPresets]);
    setCurrentPage(1);

    if (newPresets.length > 0) {
      handleSelectSingleSound(newPresets[0]);
    }
  };

  const handleUploadCustomTrack = async (file: File) => {
    const url = URL.createObjectURL(file);
    const coverUrl = await extractMp3CoverArt(file);
    const newTrack: Mp3Track = {
      id: `custom_${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: 'Audio File',
      duration: 180,
      url,
      coverUrl,
      isCustom: true,
    };
    setCustomTracks((prev) => [newTrack, ...prev]);
  };

  const currentLayerNames = layers
    .filter((l) => l.enabled && l.presetName)
    .map((l) => l.presetName);

  const handleBootComplete = () => {
    audioEngine.initContext();
    setIsBooting(false);

    // Default to fullscreen & landscape on mobile devices
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      if (screen.orientation && 'lock' in screen.orientation) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (screen.orientation as any).lock('landscape').catch(() => {});
      }
    } catch {}
  };

  if (isBooting) {
    return <BootScreen onComplete={handleBootComplete} />;
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-black select-none">
      <WorkstationFrame
        currentView={currentView}
        onSelectView={setCurrentView}
        currentPage={currentPage}
        totalPages={totalPages}
        onSelectPage={setCurrentPage}
        isPianoVisible={isPianoVisible}
        onTogglePiano={() => setIsPianoVisible(!isPianoVisible)}
        midiActive={midiActive}
        masterOctave={masterOctave}
        masterTranspose={masterTranspose}
      >
        {/* VIEW 1: LIST (SoundFont Presets with 8 per page, single-tap switch & 1s hold layer, and [- 0 +] Octave/Transpose bar) */}
        {currentView === 'LIST' && (
          <ListView
            layers={layers}
            allPresets={allPresets}
            currentPage={currentPage}
            onSelectSingleSound={handleSelectSingleSound}
            onToggleLayerSound={handleToggleLayerSound}
            onToggleLayerSolo={(layerId) => handleUpdateLayer(layerId, { solo: !layers[layerId - 1].solo })}
            masterOctave={masterOctave}
            onOctaveChange={handleOctaveChange}
            onOctaveReset={handleOctaveReset}
            masterTranspose={masterTranspose}
            onTransposeChange={handleTransposeChange}
            onTransposeReset={handleTransposeReset}
            isTransposeActive={isTransposeActive}
            onToggleTransposeActive={() => setIsTransposeActive((prev) => !prev)}
            splitSettings={splitSettings}
            onToggleSplit={handleToggleSplit}
            onOpenSplitModal={() => setIsSplitModalOpen(true)}
          />
        )}

        {/* VIEW 2: BANK (8 Bank slots, tap load, hold 3s save) */}
        {currentView === 'BANK' && (
          <BankView
            banks={banks}
            activeBankId={activeBankId}
            onSelectBank={handleSelectBank}
            onSaveBank={handleSaveBank}
            onDeleteBank={handleDeleteBank}
            currentLayerNames={currentLayerNames}
            splitSettings={splitSettings}
            onToggleSplit={handleToggleSplit}
            onOpenSplitModal={() => setIsSplitModalOpen(true)}
            masterOctave={masterOctave}
            onOctaveChange={handleOctaveChange}
            masterTranspose={masterTranspose}
            onTransposeChange={handleTransposeChange}
            onOctaveReset={handleOctaveReset}
            onTransposeReset={handleTransposeReset}
            isTransposeActive={isTransposeActive}
            onToggleTransposeActive={() => setIsTransposeActive((prev) => !prev)}
          />
        )}

        {/* VIEW 3: SCALE (Visual 1-Octave Keyboard with direct cent figures, no scroll) */}
        {currentView === 'SCALE' && (
          <ScaleView
            scaleTuning={scaleTuning}
            onUpdateScale={setScaleTuning}
          />
        )}

        {/* VIEW 4: EFX (Legato speed/attack/release, Portamento, Mono, Acoustic Modeling) */}
        {currentView === 'EFX' && (
          <EfxView
            efx={efx}
            onUpdateEfx={(updates) => setEfx((prev) => ({ ...prev, ...updates }))}
          />
        )}

        {/* VIEW 5: MIXER (4-Layer faders L1-L4, per-layer EQ & EFX send, stereo PAN, and compact mode for KEY) */}
        {currentView === 'MIXER' && (
          <MixerView
            layers={layers}
            onUpdateLayer={handleUpdateLayer}
            equalizer={equalizer}
            onUpdateEqualizer={(updates) => setEqualizer((prev) => ({ ...prev, ...updates }))}
            efx={efx}
            onUpdateEfx={(updates) => setEfx((prev) => ({ ...prev, ...updates }))}
            isPianoVisible={isPianoVisible}
          />
        )}

        {/* VIEW 6: LOAD (SoundFont .sf2 importer) */}
        {currentView === 'LOAD' && (
          <LoadView
            onSoundFontLoaded={handleSoundFontLoaded}
            allPresetsCount={allPresets.length}
          />
        )}

        {/* VIEW 7: MP3 (Backing track audio player) */}
        {currentView === 'MP3' && (
          <Mp3View
            customTracks={customTracks}
            onUploadCustomTrack={handleUploadCustomTrack}
          />
        )}

        {/* Test Piano Overlay when user clicks PIANO */}
        {isPianoVisible && (
          <VirtualPiano
            onNoteOn={handleNoteOn}
            onNoteOff={handleNoteOff}
            scaleTuning={scaleTuning}
            pitchBend={pitchBend}
            onPitchBendChange={handlePitchBendChange}
            modWheel={modWheel}
            onModWheelChange={handleModWheelChange}
            sustain={sustain}
            onSustainToggle={handleSustainToggle}
            activeNotes={activeNotes}
            onClose={() => setIsPianoVisible(false)}
          />
        )}

        {/* Keyboard Split Settings Popup Modal (Arranger Mode) */}
        {isSplitModalOpen && (
          <KeyboardSplitModal
            splitSettings={splitSettings}
            onUpdateSplit={(updates) => setSplitSettings((prev) => ({ ...prev, ...updates }))}
            layers={layers}
            onUpdateLayer={handleUpdateLayer}
            onClose={() => setIsSplitModalOpen(false)}
          />
        )}
      </WorkstationFrame>
    </div>
  );
}
