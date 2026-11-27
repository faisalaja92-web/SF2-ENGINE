export type HarmonyMode = 'SCALE' | 'CHORD';
export type HarmonyScale = 'MAJOR' | 'MINOR';

const SCALE_STEPS: Record<HarmonyScale, number[]> = {
  MAJOR: [0, 2, 4, 5, 7, 9, 11],
  MINOR: [0, 2, 3, 5, 7, 8, 10],
};

/**
 * Returns diatonic harmony notes for a played MIDI note.
 * Notes outside the selected scale are harmonized from the nearest lower scale degree.
 */
export function getTerciaHarmonyNotes(
  note: number,
  mode: HarmonyMode,
  root: number,
  scale: HarmonyScale
): number[] {
  const steps = SCALE_STEPS[scale];
  const relativePitch = ((note - root) % 12 + 12) % 12;
  let degree = 0;
  for (let i = 0; i < steps.length; i++) {
    if (steps[i] <= relativePitch) degree = i;
    else break;
  }
  const octave = Math.floor((note - root) / 12);
  const absoluteDegree = octave * 7 + degree;
  const degreeToMidi = (targetDegree: number) => {
    const octaveOffset = Math.floor(targetDegree / 7);
    const scaleDegree = ((targetDegree % 7) + 7) % 7;
    return root + (octave + octaveOffset) * 12 + steps[scaleDegree];
  };
  const third = degreeToMidi(absoluteDegree + 2);
  if (mode === 'SCALE') return third <= 127 && third >= 0 ? [third] : [];
  const fifth = degreeToMidi(absoluteDegree + 4);
  return [third, fifth].filter((n) => n >= 0 && n <= 127);
}
