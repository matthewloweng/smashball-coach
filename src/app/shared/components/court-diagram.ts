/**
 * Court diagram renderer (ported from the project site). Returns an SVG string.
 * All text from templates is escaped, because imported packs (Phase 2) are
 * untrusted input.
 */
import { CourtDiagram, DiagramPoint } from '../../core/models/template.models';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function drawCourt(d: CourtDiagram, scale = 24): string {
  const s = scale;
  const umin = -11.2;
  const umax = 11.2;
  const vmin = -1.7;
  const vmax = 10.2;
  const W = (umax - umin) * s;
  const H = (vmax - vmin) * s;
  const X = (u: number) => ((u - umin) * s).toFixed(1);
  const Y = (v: number) => ((v - vmin) * s).toFixed(1);
  const uid = 'c' + Math.random().toString(36).slice(2, 8);

  let o = `<svg class="court" viewBox="0 0 ${W.toFixed(0)} ${H.toFixed(0)}" role="img" aria-label="${esc(d.caption)}">`;
  o += `<defs>
    <pattern id="${uid}h" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" class="hatch-bg"/><line x1="0" y1="0" x2="0" y2="8" class="hatch-line"/></pattern>
    <marker id="${uid}m" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="arrowhead"/></marker>
    <marker id="${uid}ma" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="arrowhead-atk"/></marker>
  </defs>`;
  o += `<rect x="${X(-9)}" y="${Y(0)}" width="${18 * s}" height="${9 * s}" class="floor"/>`;
  const rect = (r: { u0: number; u1: number; v0: number; v1: number }, cls: string, extra = '') =>
    `<rect x="${X(r.u0)}" y="${Y(r.v0)}" width="${((r.u1 - r.u0) * s).toFixed(1)}" height="${((r.v1 - r.v0) * s).toFixed(1)}" class="${cls}" ${extra}/>`;
  d.active.forEach((a) => (o += rect(a, 'active')));
  d.zones.forEach(
    (z) =>
      (o += z.kind === 'adapt' ? rect(z, '', `fill="url(#${uid}h)"`) : rect(z, 'zone-' + z.kind)),
  );
  d.active.forEach((a) => (o += rect(a, 'active-line')));
  d.zones.forEach((z) => {
    if (!z.label) return;
    o += `<text x="${X((z.u0 + z.u1) / 2)}" y="${Y((z.v0 + z.v1) / 2)}" class="zone-label" text-anchor="middle" dominant-baseline="middle">${esc(z.label)}</text>`;
  });
  d.lines.forEach((l) => {
    o += `<line x1="${X(l.u)}" y1="${Y(l.v0)}" x2="${X(l.u)}" y2="${Y(l.v1)}" class="mark"/>`;
    o += `<text x="${X(l.u)}" y="${Y(-0.35)}" class="dim" text-anchor="middle">${esc(l.label)}</text>`;
  });
  o += `<line x1="${X(0)}" y1="${Y(-0.5)}" x2="${X(0)}" y2="${Y(9.5)}" class="net"/>`;
  o += `<text x="${X(0)}" y="${Y(9.95)}" class="dim" text-anchor="middle">NET</text>`;
  d.arrows.forEach(([u1, v1, u2, v2, kind]) => {
    const x1 = +X(u1);
    const y1 = +Y(v1);
    const x2 = +X(u2);
    const y2 = +Y(v2);
    const bend = ['set', 'pass', 'free', 'serve'].includes(kind) ? 0.18 : 0.06;
    const cx = (x1 + x2) / 2 - (y2 - y1) * bend;
    const cy = (y1 + y2) / 2 + (x2 - x1) * bend - (kind === 'set' ? 10 : 0);
    const atk = kind === 'attack' || kind === 'attack2';
    o += `<path d="M${x1},${y1} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x2},${y2}" class="arr arr-${kind}" marker-end="url(#${uid}${atk ? 'ma' : 'm'})"/>`;
  });
  const dot = ([u, v, label]: DiagramPoint, cls: string) => {
    let t = `<circle cx="${X(u)}" cy="${Y(v)}" r="${(0.42 * s).toFixed(1)}" class="${cls}"/>`;
    if (label)
      t += `<text x="${X(u)}" y="${Y(v)}" class="dot-label" text-anchor="middle" dominant-baseline="central">${esc(label)}</text>`;
    return t;
  };
  d.A.forEach((p) => (o += dot(p, 'pA')));
  d.B.forEach((p) => (o += dot(p, 'pB')));
  (d.W ?? []).forEach((p) => (o += dot(p, 'pW')));
  (d.coach ?? []).forEach(([u, v]) => {
    const r = 0.42 * s;
    o += `<rect x="${(+X(u) - r).toFixed(1)}" y="${(+Y(v) - r).toFixed(1)}" width="${(2 * r).toFixed(1)}" height="${(2 * r).toFixed(1)}" rx="3" class="pC"/><text x="${X(u)}" y="${Y(v)}" class="dot-label" text-anchor="middle" dominant-baseline="central">C</text>`;
  });
  return o + '</svg>';
}
