# Native Clarinet Audio Prototype

This is an isolated first-stage Android native audio experiment for SF2-ENGINE.
The existing React/Web Audio engine remains unchanged.

## What is included

- Oboe low-latency output stream (48 kHz stereo float).
- A simplified single-reed / bore-delay clarinet research prototype.
- A Capacitor plugin bridge with start, stop, noteOn, noteOff and breath control.
- A TypeScript wrapper at `src/audio/nativeClarinet.ts`.

## Important model limitation

This first DSP is deliberately a prototype, not a finished SWAM-class instrument.
It has no measured bore geometry, tone-hole lattice, register vent, reed calibration,
or full pressure/embouchure controller model. It is intended to validate native audio
build/integration and establish a playable physical-model research path. Do not
describe its sound as equivalent to SWAM.

## Android integration

The Android project is generated during CI by Capacitor. The workflow must copy
this plugin into the generated app, configure CMake/NDK, and register the plugin
in MainActivity. Oboe is fetched from its official repository by CMake at build time.

The native bridge is not connected to the default instrument selection yet. This
keeps the existing SF2 playback path safe while the native prototype is tested.
