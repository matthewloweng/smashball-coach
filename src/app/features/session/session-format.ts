import { BlockKind } from '../../core/models/template.models';

export const BLOCK_LABELS: Record<BlockKind, string> = {
  intro: 'Intro',
  baseline: 'Baseline 6v6',
  play: 'Play',
  huddle: 'Huddle',
  practice: 'Practice',
  transfer: 'Transfer 6v6',
};

/** 75 -> "1:15", -12 -> "+0:12". */
export function formatClock(seconds: number): string {
  const over = seconds < 0;
  const s = Math.abs(seconds);
  const text = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  return over ? `+${text}` : text;
}
