# STK Wind-Model Integration Audit

Date: 2026-10-31
Target branch: `native-audio-prototype`

## Decision

Use the upstream Synthesis ToolKit in C++ (STK) as the next native wind-instrument DSP foundation. Keep the existing Oboe output stream and Capacitor bridge architecture. Do not replace or modify the Web Audio / SF2 engine.

Upstream project: https://github.com/thestk/stk

## What is already implemented upstream

### Clarinet

- Class: `stk::Clarinet`
- Source: `src/Clarinet.cpp`, `include/Clarinet.h`
- Model: nonlinear reed table + digital waveguide / delay line.
- Useful controls: `noteOn(frequency, amplitude)`, `noteOff(amplitude)`, `setFrequency(frequency)`, `controlChange(number, value)`.
- Control changes documented in the class: reed stiffness (CC2), noise level (CC4), vibrato frequency (CC11), vibrato amount (CC1), and breath pressure (CC128).
- The implementation computes samples with `tick()`; it does not require a per-note sample library.

### Saxophone-like model

- Class: `stk::Saxofony`
- Source: `src/Saxofony.cpp`, `include/Saxofony.h`
- Important qualification: upstream describes this as a *faux conical bore*, *hybrid digital waveguide* / *blowed string* model. It can produce saxophone-like tones, but it is not a geometrically complete saxophone model.
- Useful controls: note on/off, frequency, reed stiffness (CC2), noise (CC4), vibrato amount (CC1), blow position (CC11), vibrato frequency (CC29), reed aperture (CC26), and breath pressure (CC128).

Both classes are monophonic DSP objects. A single instance is appropriate for a monophonic wind part. True polyphony would require a pool of independent instrument instances and a voice mixer.

## Why STK fits the current Android project

The project already has:
- Android NDK + CMake integration.
- Google Oboe for native low-latency output.
- A JNI / Capacitor plugin bridge.
- A separate native mode, while SF2 remains the default mode.

STK is portable C++ and its core instrument DSP can be called one sample at a time. The Android integration should therefore be a small DSP-layer addition, not a rewrite of the Android audio backend.

The Clarinet and Saxofony implementations use delay lines, filters, an envelope, reed nonlinearity, noise, and vibrato. These two classes do not appear to require STK's rawwave sample assets. The upstream class comments still contain a general rawwave-path warning, so this must be confirmed by the Android build rather than assumed.

## Proposed minimal source integration

Do not add the entire STK desktop/realtime application build. It enables platform audio/MIDI backends that are not needed because Oboe already owns Android audio I/O.

Start by compiling only the STK core files needed by these two classes, subject to CI verification:

- `src/Stk.cpp`
- `src/DelayL.cpp`
- `src/OneZero.cpp`
- `src/Envelope.cpp`
- `src/Noise.cpp`
- `src/SineWave.cpp`
- `src/Clarinet.cpp`
- `src/Saxofony.cpp`

Use the upstream `include/` directory and include the upstream `LICENSE` in the distributed application/source tree. The STK license is MIT-style with an additional non-binding request to send modifications upstream. Preserve the copyright and license text.

## Real-time integration requirements

1. Set STK's global sample rate to the actual Oboe stream sample rate before constructing STK instruments.
2. Construct and allocate instrument objects before the audio callback starts. Never construct, destroy, allocate, or resize DSP objects inside `onAudioReady()`.
3. JNI/UI note events must be transferred to the Oboe callback through a bounded lock-free event queue (or equivalent safe command handoff). Do not call non-atomic STK methods concurrently from the UI/JNI thread and audio callback.
4. Convert MIDI note to frequency with `440 * 2^((note - 69) / 12)`.
5. Perform noteOn/noteOff and frequency changes on the audio thread, preserving the existing held-key / legato policy.
6. Keep the audio callback allocation-free and avoid locks.
7. Test rapid repeated notes, note transitions, key release, pitch bend, breath, and vibrato on a physical Android device.

## Risks and limitations to resolve

- STK's `Noise::tick()` uses the C library `rand()` generator. It is called from the sample path even when noise gain is zero. This is not ideal for a real-time audio callback and may use shared global state. Before production, replace it with a small per-instance deterministic PRNG or otherwise remove the global RNG from the callback.
- STK maintains a global sample rate and a global sample-rate-alert list. Set the sample rate once before instrument construction; do not mutate it while audio is running.
- The Clarinet and Saxofony waveguide approaches are research/educational models, not a claim of SWAM-equivalent sound. STK's own source comments flag that digital-waveguide techniques may be subject to patents. A separate patent/legal review is needed before commercial distribution.
- The saxophone class is explicitly a simplified hybrid model. Listen tests are required before deciding whether it is good enough for the target sound.
- STK uses `double` for `StkFloat`; benchmark CPU load and conversion cost on target Android devices.

## Alternative: Faust physical-model DSP

The official Faust source tree also contains:
- `examples/physicalModeling/faust-stk/clarinet.dsp`
- `examples/physicalModeling/faust-stk/blowHole.dsp`
- `examples/physicalModeling/faust-stk/saxophony.dsp`

The clarinet model describes a nonlinear waveguide and exposes more DSP controls, including envelope, vibrato, pressure, and nonlinearity modulation. The blow-hole variant is worth evaluating for a more developed clarinet model.

Faust is a promising second-stage option, but integrating it requires choosing a code-generation/runtime path and validating its generated C++/Android toolchain. STK is the lower-risk first integration because the project is already C++/CMake/Oboe.

## Next implementation sequence

1. Add STK as an isolated native DSP dependency on this branch only.
2. Compile the Clarinet and Saxofony classes with Android NDK while retaining the current Oboe stream.
3. Add a native instrument selector in the plugin layer (not in the SF2 engine).
4. Route events through a bounded queue to the audio callback.
5. Preserve the current SF2 path unchanged and default.
6. Build the APK and verify the CI result before asking for device listening tests.
7. Compare STK against the current prototype; keep the old DSP available until the new path is confirmed.

## References

- STK repository and overview: https://github.com/thestk/stk
- STK Clarinet source: https://github.com/thestk/stk/blob/master/src/Clarinet.cpp
- STK Saxofony source: https://github.com/thestk/stk/blob/master/src/Saxofony.cpp
- STK license: https://github.com/thestk/stk/blob/master/LICENSE
- Faust physical-model examples: https://github.com/grame-cncm/faust/tree/master-dev/examples/physicalModeling/faust-stk
- Android Oboe overview: https://github.com/google/oboe
