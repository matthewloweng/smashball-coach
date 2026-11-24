/** Prints a summary of the generated sample practices, for sanity checks. */
import { readFileSync } from 'node:fs';
import { VOLLEYBALL_PACK } from '../../src/app/content/volleyball/volleyball.pack';
import { summariseCourt } from '../../src/app/core/engine/metrics';
import { derivedValues, tallyRuns } from '../../src/app/core/engine/tally';
import { Session } from '../../src/app/core/models/session.models';

const { sessions } = JSON.parse(readFileSync('public/samples/sample-practices.json', 'utf8')) as {
  sessions: Session[];
};
const gameFor = (id: string) => VOLLEYBALL_PACK.games.find((g) => g.id === id)!;
for (const s of sessions) {
  const plan = VOLLEYBALL_PACK.sessions.find((p) => p.id === s.planId)!;
  console.log(
    `\n== ${s.planId} ${new Date(s.startedAt).toISOString().slice(0, 10)} courts=${s.courts.length}`,
  );
  for (const c of s.courts) {
    const sum = summariseCourt(s, c.id, gameFor, plan.blocks);
    console.log(
      `  ${c.label}${c.units ? ` (${c.units} pairs)` : ''}: games ${sum.games.map((g) => `${g.score.A}-${g.score.B}`).join(' ')} | rules on ${sum.adaptationsTriggered} | close ${sum.closeGameShare}`,
    );
  }
  for (const r of tallyRuns(s.events, VOLLEYBALL_PACK.tallySheets)) {
    const sheet = VOLLEYBALL_PACK.tallySheets.find((x) => x.id === r.sheetId);
    const d = sheet ? derivedValues(r, sheet) : [];
    console.log(
      `  count "${r.context}": ${JSON.stringify(r.values)} -> ${d.map((x) => `${x.label}: ${x.display}`).join(', ')}`,
    );
  }
  const att = s.events.filter((e) => e.type === 'levelup.attempt');
  const ok = att.filter((e) => e.type === 'levelup.attempt' && e.success).length;
  const ch = s.events
    .filter((e) => e.type === 'levelup.change')
    .map((e) => (e.type === 'levelup.change' ? e.direction : ''));
  const mon = s.events.filter((e) => e.type === 'monarch.rally').length;
  console.log(
    `  level attempts ${att.length}, attack after serve-receive ${Math.round((100 * ok) / Math.max(1, att.length))}%, changes ${ch.join(',')}${mon ? `, monarch rallies ${mon}` : ''}`,
  );
}
