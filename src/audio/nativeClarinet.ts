import { registerPlugin } from '@capacitor/core';

type NativeClarinetPlugin = {
  start(): Promise<void>;
  stop(): Promise<void>;
  noteOn(options: { note: number; velocity: number }): Promise<void>;
  noteOff(): Promise<void>;
  setBreath(options: { value: number }): Promise<void>;
};

const NativeClarinet = registerPlugin<NativeClarinetPlugin>('NativeClarinet');

export const nativeClarinet = {
  start: () => NativeClarinet.start(),
  stop: () => NativeClarinet.stop(),
  noteOn: (note: number, velocity = 0.8) =>
    NativeClarinet.noteOn({ note, velocity }),
  noteOff: () => NativeClarinet.noteOff(),
  setBreath: (value: number) => NativeClarinet.setBreath({ value }),
};
