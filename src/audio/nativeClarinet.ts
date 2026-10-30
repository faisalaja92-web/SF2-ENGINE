import { registerPlugin } from '@capacitor/core';

type NativeClarinetPlugin = {
  start(): Promise<void>;
  stop(): Promise<void>;
  noteOn(options: { note: number; velocity: number }): Promise<void>;
  noteOff(): Promise<void>;
  setBreath(options: { value: number }): Promise<void>;
};

const NativeClarinet = registerPlugin<NativeClarinetPlugin>('NativeClarinet');

let started = false;
let startTask: Promise<void> | null = null;

async function ensureStarted() {
  if (started) return;
  if (!startTask) {
    startTask = NativeClarinet.start()
      .then(() => { started = true; })
      .finally(() => { startTask = null; });
  }
  await startTask;
}

export const nativeClarinet = {
  start: ensureStarted,
  stop: async () => {
    if (!started) return;
    await NativeClarinet.stop();
    started = false;
  },
  noteOn: async (note: number, velocity = 0.8) => {
    await ensureStarted();
    await NativeClarinet.noteOn({ note, velocity });
  },
  noteOff: () => started ? NativeClarinet.noteOff() : Promise.resolve(),
  setBreath: (value: number) => NativeClarinet.setBreath({ value }),
};
