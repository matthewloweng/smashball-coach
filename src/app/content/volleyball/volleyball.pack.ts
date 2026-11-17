// The volleyball template pack: the six games, practice plans and task cards from
// the EPHE 437 project. Plain data only, so it can be exported as JSON (Phase 2).
import { TemplatePack } from '../../core/models/template.models';

export const VOLLEYBALL_PACK: TemplatePack = {
  id: 'volleyball-smashball',
  schemaVersion: 1,
  name: 'Smashball to Tripleball',
  sport: 'Volleyball',
  description:
    "Six small-sided games built from Volleyball Canada's Smashball program for a grade 9-10 team, designed with the REAR framework.",
  author: 'Matthew Lowe-Ng (EPHE 437, UVic)',
  levels: [
    {
      id: 'level-a',
      code: 'A',
      name: '1v1 "Stop!!"',
      format: '1v1, 4.5 m x 4.5 m per side',
      contacts: 'Pass to self, set to self, attack',
      aid: 'Win twice: court extends to 6 m deep. Win again: must jump-attack.',
    },
    {
      id: 'level-b',
      code: 'B',
      name: '2v2 Monarch / Long-Thin',
      format: '2v2, 4.5 m or 3 m wide x 9 m per side',
      contacts: 'Pass, set, attack (catch-and-set only as an aid)',
      aid: 'See G1 and G2 adaptation tables',
    },
    {
      id: 'level-c',
      code: 'C',
      name: 'Tag Team 2(1) v 2(1)',
      format: 'Teams of 3, 2v2 on court',
      contacts: 'Pass, set, attack',
      aid: 'Winner scores only on serve, then back-row attacks only',
    },
    {
      id: 'level-d',
      code: 'D',
      name: 'Tripleball 3v3',
      format: '3v3, 9 m wide x 7 m or 4.5 m deep',
      contacts: 'Pass, set, attack + two coach free balls',
      aid: 'See G4 and G5 adaptation tables',
    },
    {
      id: 'level-e',
      code: 'E',
      name: 'Wash 4v4',
      format: '4v4, 7 m wide x 9 m per side',
      contacts: 'Full volleyball, big point + little point',
      aid: 'Down-ball instead of free ball for the leader',
    },
  ],
  games: [
    {
      id: 'g1',
      code: 'G1',
      name: 'Monarch 2v2: Going for 3',
      levelId: 'level-b',
      focus: ['Space', 'Risk'],
      fourRs: 'Read the server, Recover to base',
      format: '2v2 on half-width courts (4.5 m wide x 9 m deep per side)',
      players:
        '6 players per mini court: Monarch pair, challenger pair, waiting pair. Split one full court lengthwise to run two games (12 players). The waiting pair serves to targets on court 2 until it is their turn.',
      rear: {
        representation:
          'Serve, receive, set, attack in a 2v2 rally keeps the 6v6 sequence of pass to the net, set along the net, attack over the net.',
        exaggeration:
          'A rally only counts if it ends with a third-contact attack (smash or tip). No overpasses on contact 1 or 2.',
        adaptation:
          'Monarchs who turn back two challenger pairs must defend the full 9 m depth. Challengers who lose twice in a row may catch-and-set once on contact 2.',
        rotation:
          'Challengers who win three in a row become Monarchs. Losing challengers go to the back of the queue, so every pair plays every pair.',
      },
      rules: [
        'Challengers serve to the Monarch side. Monarchs start on a 6 m deep court (tape or cones at 6 m).',
        'Rally scoring from the challengers\' view: win a rally and keep serving. At 2 points call "Going for 3".',
        'Challengers who win the third rally become Monarchs. Challengers who lose any rally return to 0 and leave.',
        'Three contacts are compulsory. The rally must finish with a smash or tip from contact 3.',
        'Play for 8-10 minutes. Score one team point for each time a pair becomes Monarch.',
      ],
      scoring: {
        mode: 'monarch',
        winStreak: 3,
        challengerUnits: 3,
        unitLabel: 'Pair',
      },
      adaptations: [
        {
          id: 'g1-a2',
          kind: 'adaptation',
          trigger: {
            type: 'streak',
            outcome: 'win',
            unit: 'defence',
            count: 2,
            side: 'A',
          },
          when: 'Monarchs turn back two challenger pairs',
          effect: 'Monarchs defend the full 9 m depth.',
          cue: 'Monarchs defend the full 9 metres',
        },
        {
          id: 'g1-a3',
          kind: 'adaptation',
          trigger: {
            type: 'streak',
            outcome: 'loss',
            unit: 'attempt',
            count: 2,
            side: 'B',
          },
          when: 'Challengers lose twice in a row',
          effect: 'They may catch-and-set once on contact 2 in their next attempt.',
          cue: 'Challengers may catch and set once',
        },
      ],
      huddleQuestions: [
        {
          concept: 'Space',
          text: 'Where is the open space on a 4.5 m wide court when both defenders are back?',
        },
        {
          concept: 'Risk',
          text: 'When you are "Going for 3", do you swing hard or place the ball? Why?',
        },
        {
          concept: 'Time',
          text: 'How does a higher first pass help your partner set you?',
        },
      ],
      diagram: {
        active: [
          {
            u0: -9,
            u1: 9,
            v0: 0,
            v1: 4.5,
          },
        ],
        zones: [
          {
            u0: 6,
            u1: 9,
            v0: 0,
            v1: 4.5,
            kind: 'adapt',
            label: 'Opens after 2 defences',
          },
        ],
        lines: [
          {
            u: 6,
            v0: 0,
            v1: 4.5,
            label: '6 m',
          },
        ],
        A: [
          [2.5, 1.2, 'M'],
          [4.5, 3.2, 'M'],
        ],
        B: [
          [-9.6, 2.2, 'S'],
          [-1.2, 3.3, 'C'],
        ],
        arrows: [
          [-9.6, 2.2, 4.8, 3, 'serve'],
          [4.5, 3.2, 1, 2.4, 'pass'],
          [1, 2.4, 1.2, 0.9, 'set'],
          [1.2, 0.9, -4.5, 3.6, 'attack'],
        ],
        caption:
          'Half of one full court. M = Monarch pair, S = serving challenger, C = challenger partner, grey = waiting pair.',
        W: [
          [-10.2, 0.8],
          [-10.2, 1.8],
        ],
      },
    },
    {
      id: 'g2',
      code: 'G2',
      name: 'Long-Thin Court: Deep and Short',
      levelId: 'level-b',
      focus: ['Space', 'Force'],
      fourRs: "Read the hitter's approach, Respond early to short or deep",
      format: '2v2 on a 3 m wide x 9 m deep court per side',
      players:
        '4 players per lane. On each full court, tape two 3 m lanes along the sidelines and leave the middle 3 m empty as a buffer. With 12 players, use three lanes (one court plus one lane of the second). Winners move up a lane, losers move down. If a ball rolls into another lane, both lanes stop and replay the point.',
      rear: {
        representation: 'Full 2v2 rally with serve, three contacts and an attack.',
        exaggeration:
          'A long, thin court makes front and back space the only space. Attacks that land short (in front of the 3 m line) or deep (in the last 3 m) score 2.',
        adaptation:
          'A pair that leads by 3 loses the 2-point short zone. A pair that trails by 3 may serve from 3 m inside the end line.',
        rotation:
          'Games to 11. Winners move up one court, losers move down one court and play a new pair.',
      },
      rules: [
        'Serve from behind the end line into the 3 m lane.',
        'Three contacts, rally ends with an attack or an error.',
        'Short-zone kill (tip or roll shot in front of the 3 m line) = 2 points. Deep-zone kill (last 3 m) = 2 points. Any other kill or opponent error = 1 point.',
        'Play to 11, then rotate courts.',
      ],
      scoring: {
        mode: 'rally',
        target: 11,
        sideLabels: ['Pair A', 'Pair B'],
        actions: [
          {
            id: 'point',
            label: '+1',
            points: 1,
          },
          {
            id: 'short',
            label: 'Short +2',
            points: 2,
          },
          {
            id: 'deep',
            label: 'Deep +2',
            points: 2,
          },
        ],
      },
      adaptations: [
        {
          id: 'g2-a1',
          kind: 'adaptation',
          trigger: {
            type: 'lead',
            by: 3,
          },
          when: 'Lead by 3',
          effect: 'Your short zone no longer scores 2 for you.',
          cue: 'Short zone scores 1',
        },
        {
          id: 'g2-a2',
          kind: 'adaptation',
          trigger: {
            type: 'trail',
            by: 3,
          },
          when: 'Trail by 3',
          effect: 'Serve from 3 m inside the end line.',
          cue: 'Serve from 3 metres in',
        },
        {
          id: 'g2-a3',
          kind: 'adaptation',
          trigger: {
            type: 'streak',
            outcome: 'win',
            unit: 'game',
            count: 2,
          },
          when: 'Win two games in a row',
          effect: 'Your lane widens to 4 m (move the cones 1 m into the buffer).',
          cue: 'Lane widens to 4 metres',
        },
      ],
      huddleQuestions: [
        {
          concept: 'Space',
          text: 'Where should the back defender stand to cover both the short tip and the deep roll?',
        },
        {
          concept: 'Force',
          text: 'What changes in your arm swing between a deep roll shot and a hard down-line hit?',
        },
        {
          concept: 'Time',
          text: 'When the ball is set tight to the net, which shot buys you the most time to recover?',
        },
      ],
      diagram: {
        active: [
          {
            u0: -9,
            u1: 9,
            v0: 0,
            v1: 3,
          },
          {
            u0: -9,
            u1: 9,
            v0: 6,
            v1: 9,
          },
        ],
        zones: [
          {
            u0: 0,
            u1: 3,
            v0: 0,
            v1: 3,
            kind: 'score',
            label: 'Short 2 pts',
          },
          {
            u0: 6,
            u1: 9,
            v0: 0,
            v1: 3,
            kind: 'score',
            label: 'Deep 2 pts',
          },
          {
            u0: -3,
            u1: 0,
            v0: 0,
            v1: 3,
            kind: 'score',
            label: 'Short 2 pts',
          },
          {
            u0: -9,
            u1: -6,
            v0: 0,
            v1: 3,
            kind: 'score',
            label: 'Deep 2 pts',
          },
          {
            u0: -9,
            u1: 0,
            v0: 3,
            v1: 6,
            kind: 'adapt',
            label: 'Buffer (empty)',
          },
          {
            u0: 0,
            u1: 9,
            v0: 3,
            v1: 6,
            kind: 'adapt',
            label: 'Buffer (empty)',
          },
        ],
        lines: [
          {
            u: 3,
            v0: 0,
            v1: 3,
            label: '3 m',
          },
          {
            u: -3,
            v0: 0,
            v1: 3,
            label: '3 m',
          },
        ],
        A: [
          [1.6, 2.4, ''],
          [4.5, 2.2, ''],
          [1.4, 7.5, ''],
          [5.6, 7.2, ''],
        ],
        B: [
          [-1.5, 0.6, ''],
          [-4.5, 1.5, ''],
          [-1.4, 7, ''],
          [-5, 7.8, ''],
        ],
        arrows: [
          [-1.5, 0.6, 1.2, 0.9, 'attack'],
          [-1.5, 0.6, 7.8, 0.6, 'attack2'],
        ],
        caption:
          'Two 3 m lanes along the sidelines of one full court, with the middle 3 m left empty. Shaded zones score 2.',
      },
    },
    {
      id: 'g3',
      code: 'G3',
      name: 'Tag Team 2(1) v 2(1)',
      levelId: 'level-c',
      focus: ['Time', 'Space'],
      fourRs: 'Recover to base, Support the setter',
      format:
        'Teams of 3 playing 2v2 on a half-width court (4.5 m x 9 m per side), one player waiting off court',
      players: '6 players per mini court (two teams of 3). Run two mini courts per full court.',
      rear: {
        representation: '2v2 rallies with full serve, pass, set, attack.',
        exaggeration:
          "The third player waits off court and observes one teammate's off-the-ball movement, then tags in. Players must get back to base and support every attack.",
        adaptation:
          'The winning team only scores when serving in the next game. A team that wins twice in a row may only attack from behind the 3 m line.',
        rotation:
          'Team A rotates its third player in every 2 points, Team B every 3 points, so pairings keep changing.',
      },
      rules: [
        'First team to 7 points, rally scoring.',
        'Team A rotates its waiting player in after every 2 points. Team B rotates after every 3 points.',
        'The waiting player watches one teammate for those points and calls out one 4Rs cue at the tag (for example, "Base!" or "Cover your hitter!").',
        'Three contacts and the rally ends with an attack or an error.',
      ],
      scoring: {
        mode: 'rally',
        target: 7,
        sideLabels: ['Team A', 'Team B'],
        actions: [
          {
            id: 'point',
            label: '+1',
            points: 1,
          },
        ],
      },
      adaptations: [
        {
          id: 'g3-a1',
          kind: 'adaptation',
          trigger: {
            type: 'streak',
            outcome: 'win',
            unit: 'game',
            count: 1,
          },
          when: 'Win a game',
          effect: 'Next game, your team scores only on points you serve.',
          cue: 'Score only on serve',
        },
        {
          id: 'g3-a2',
          kind: 'adaptation',
          trigger: {
            type: 'streak',
            outcome: 'win',
            unit: 'game',
            count: 2,
          },
          when: 'Win two games in a row',
          effect: 'All your attacks must take off from behind the 3 m line.',
          cue: 'Back-row attacks only',
        },
        {
          id: 'g3-a3',
          kind: 'adaptation',
          trigger: {
            type: 'streak',
            outcome: 'loss',
            unit: 'game',
            count: 2,
          },
          when: 'Lose two games in a row',
          effect:
            'Your first serve-receive pass of each rally may be caught and tossed to the setter.',
          cue: 'First pass may be caught',
        },
        {
          id: 'g3-rot-a',
          kind: 'rotation',
          trigger: {
            type: 'everyPoints',
            side: 'A',
            points: 2,
          },
          when: 'Every 2 points (Team A)',
          effect: 'Team A tags in its waiting player.',
          cue: 'Team A, tag in',
        },
        {
          id: 'g3-rot-b',
          kind: 'rotation',
          trigger: {
            type: 'everyPoints',
            side: 'B',
            points: 3,
          },
          when: 'Every 3 points (Team B)',
          effect: 'Team B tags in its waiting player.',
          cue: 'Team B, tag in',
        },
      ],
      huddleQuestions: [
        {
          concept: 'Space',
          text: 'After you attack, where is your base?',
        },
        {
          concept: 'Time',
          text: 'How can your partner buy time when the pass is off the net?',
        },
        {
          concept: 'Risk',
          text: 'If you only score on serve, should you serve tough or safe?',
        },
      ],
      diagram: {
        active: [
          {
            u0: -9,
            u1: 9,
            v0: 0,
            v1: 4.5,
          },
        ],
        zones: [],
        lines: [
          {
            u: 3,
            v0: 0,
            v1: 4.5,
            label: '3 m',
          },
          {
            u: -3,
            v0: 0,
            v1: 4.5,
            label: '3 m',
          },
        ],
        A: [
          [1.5, 2.8, ''],
          [5, 1.6, ''],
        ],
        B: [
          [-1.2, 1.5, ''],
          [-5.5, 3, ''],
        ],
        arrows: [
          [1.5, 2.8, 3.8, 2.6, 'recover'],
          [5, 1.6, 2.3, 1.8, 'support'],
        ],
        caption:
          'Half of one full court. The third player on each team waits behind the end line and watches one teammate.',
        W: [
          [10.2, 2.2, 'A'],
          [-10.2, 2.2, 'B'],
        ],
      },
    },
    {
      id: 'g4',
      code: 'G4',
      name: 'Tripleball 3v3 with adaptation scoring',
      levelId: 'level-d',
      focus: ['Force', 'Risk'],
      fourRs: 'Read the set, Respond to the hitter',
      format: '3v3 on a full-width court shortened to 7 m deep per side',
      players:
        'Four teams of 3 across two courts (12 players). Each court needs a feeder: you on court 1, the head coach on court 2 (or the team that did not lose the rally tosses the free ball two-handed). Winners move up a court, losers move down.',
      rear: {
        representation:
          'Serve, pass to the net, set along the net, attack over the net. The coach adds two free balls after each serve rally so every "triple" has full three-contact play.',
        exaggeration:
          'Each serve rally is followed by a free ball to the team that lost it, then a free ball to the other team. Every ball is worth 1 point, so transition attacking is exaggerated.',
        adaptation:
          'The leading team loses options as it pulls ahead (see table). The trailing team gains one aid.',
        rotation:
          'Games to 15. Players rotate positions clockwise each time their team wins back the serve. Winners move up a court.',
      },
      rules: [
        'Serve from behind the end line. Rally scoring.',
        'After each serve rally, the coach tosses a free ball to the team that lost that rally, then one to the other team. Three balls = one "triple".',
        'Every ball is played out and worth 1 point.',
        'The team that won more of the three balls serves the next triple. Rotate clockwise when you win back the serve.',
      ],
      scoring: {
        mode: 'rally',
        target: 15,
        sideLabels: ['Team A', 'Team B'],
        actions: [
          {
            id: 'point',
            label: '+1',
            points: 1,
          },
        ],
      },
      adaptations: [
        {
          id: 'g4-a1',
          kind: 'adaptation',
          trigger: {
            type: 'lead',
            by: 2,
          },
          when: 'Lead by 2',
          effect: 'Your attacks must come from behind the 3 m line.',
          cue: 'Attack from behind 3 metres',
        },
        {
          id: 'g4-a2',
          kind: 'adaptation',
          trigger: {
            type: 'lead',
            by: 4,
          },
          when: 'Lead by 4',
          effect: 'No tips. You must swing (high risk).',
          cue: 'No tips',
        },
        {
          id: 'g4-a3',
          kind: 'adaptation',
          trigger: {
            type: 'trail',
            by: 4,
          },
          when: 'Trail by 4',
          effect: 'Your team gets one catch-and-set per triple.',
          cue: 'One catch and set per triple',
        },
        {
          id: 'g4-a4',
          kind: 'adaptation',
          trigger: {
            type: 'streak',
            outcome: 'win',
            unit: 'game',
            count: 1,
          },
          when: 'Win the game',
          effect: 'Next game starts 0-2 down.',
          cue: 'Start next game 0-2 down',
        },
      ],
      huddleQuestions: [
        {
          concept: 'Force',
          text: 'On a free ball, how high should the pass be so your setter has time?',
        },
        {
          concept: 'Risk',
          text: "You lead by 4 and can't tip. Where is the safest place to swing?",
        },
        {
          concept: 'Space',
          text: 'Where do the two back defenders stand when the setter is at the net?',
        },
      ],
      diagram: {
        active: [
          {
            u0: -7,
            u1: 7,
            v0: 0,
            v1: 9,
          },
        ],
        zones: [
          {
            u0: -3,
            u1: 0,
            v0: 0,
            v1: 9,
            kind: 'rule',
            label: 'No take-off',
          },
        ],
        lines: [
          {
            u: 3,
            v0: 0,
            v1: 9,
            label: '3 m',
          },
          {
            u: -3,
            v0: 0,
            v1: 9,
            label: '3 m',
          },
          {
            u: 7,
            v0: 0,
            v1: 9,
            label: '7 m',
          },
          {
            u: -7,
            v0: 0,
            v1: 9,
            label: '7 m',
          },
        ],
        A: [
          [0.8, 5.5, 'S'],
          [4.8, 2.2, ''],
          [4.8, 6.8, ''],
        ],
        B: [
          [-0.8, 3, ''],
          [-4.8, 2.5, ''],
          [-4.8, 6.5, ''],
        ],
        arrows: [
          [0, -1.1, -5, 3, 'free'],
          [4.8, 2.2, 1, 5.2, 'pass'],
          [1, 5.2, 1, 7.5, 'set'],
          [1, 7.5, -5.5, 6, 'attack'],
        ],
        caption:
          'One full court shortened to 7 m per side. The coach stands at the net post to feed free balls.',
        coach: [[0, -1.1]],
      },
    },
    {
      id: 'g5',
      code: 'G5',
      name: 'Wide-Short Court: Line or Angle',
      levelId: 'level-d',
      focus: ['Space', 'Risk'],
      fourRs: "Read the hitter's shoulder, Cover behind the hitter",
      format: '3v3 on a full-width court shortened to 4.5 m deep per side',
      players: 'Four teams of 3 across two courts (12 players). Rotate opponents every game.',
      rear: {
        representation:
          '3v3 with one front-row blocker and two defenders, the same read-block-dig problem as 6v6.',
        exaggeration:
          'A wide, shallow court exaggerates side-to-side space: line versus cross-court angle. A point won by a block scores 2. A kill into the 1.5 m sideline channel scores 2.',
        adaptation:
          'A team leading by 3 must announce its block before each serve ("line" or "angle"), and its blocker must take that side all rally, so the opponent knows where the open space is. A team trailing by 3 serves from 2 m inside the end line.',
        rotation: 'Games to 11, then rotate to play a different team.',
      },
      rules: [
        'Rally scoring to 11.',
        'Point won from a block = 2 points.',
        'Kill landing in the sideline channel (1.5 m wide, marked with cones) = 2 points.',
        'Every other point = 1.',
      ],
      scoring: {
        mode: 'rally',
        target: 11,
        sideLabels: ['Team A', 'Team B'],
        actions: [
          {
            id: 'point',
            label: '+1',
            points: 1,
          },
          {
            id: 'block',
            label: 'Block +2',
            points: 2,
          },
          {
            id: 'channel',
            label: 'Channel +2',
            points: 2,
          },
        ],
      },
      adaptations: [
        {
          id: 'g5-a1',
          kind: 'adaptation',
          trigger: {
            type: 'lead',
            by: 3,
          },
          when: 'Lead by 3',
          effect: 'Announce your block (line or angle) before each serve and keep it all rally.',
          cue: 'Announce your block',
        },
        {
          id: 'g5-a2',
          kind: 'adaptation',
          trigger: {
            type: 'trail',
            by: 3,
          },
          when: 'Trail by 3',
          effect: 'Serve from 2 m inside the end line.',
          cue: 'Serve from 2 metres in',
        },
        {
          id: 'g5-a3',
          kind: 'adaptation',
          trigger: {
            type: 'streak',
            outcome: 'win',
            unit: 'game',
            count: 1,
          },
          when: 'Win the game',
          effect: "Next game, your opponent's sideline channel widens to 2 m.",
          cue: 'Opponent channel widens',
        },
      ],
      huddleQuestions: [
        {
          concept: 'Space',
          text: 'Where is the open space when the blocker takes line?',
        },
        {
          concept: 'Time',
          text: 'When do you commit to a side as the blocker?',
        },
        {
          concept: 'Risk',
          text: "Hit line, hit angle, or tip? What does the hitter's approach tell you?",
        },
      ],
      diagram: {
        active: [
          {
            u0: -4.5,
            u1: 4.5,
            v0: 0,
            v1: 9,
          },
        ],
        zones: [
          {
            u0: 0,
            u1: 4.5,
            v0: 0,
            v1: 1.5,
            kind: 'score',
            label: 'Line 2 pts',
          },
          {
            u0: 0,
            u1: 4.5,
            v0: 7.5,
            v1: 9,
            kind: 'score',
            label: 'Line 2 pts',
          },
          {
            u0: -4.5,
            u1: 0,
            v0: 0,
            v1: 1.5,
            kind: 'score',
            label: 'Line 2 pts',
          },
          {
            u0: -4.5,
            u1: 0,
            v0: 7.5,
            v1: 9,
            kind: 'score',
            label: 'Line 2 pts',
          },
        ],
        lines: [
          {
            u: 4.5,
            v0: 0,
            v1: 9,
            label: '4.5 m',
          },
          {
            u: -4.5,
            v0: 0,
            v1: 9,
            label: '4.5 m',
          },
        ],
        A: [
          [0.6, 1.8, 'B'],
          [3.2, 3.5, ''],
          [3.2, 6.8, ''],
        ],
        B: [
          [-0.6, 7.6, 'H'],
          [-2, 4.5, ''],
          [-3.4, 2, ''],
        ],
        arrows: [
          [-0.6, 7.6, 3.8, 8.3, 'attack'],
          [-0.6, 7.6, 3.6, 1, 'attack2'],
        ],
        caption:
          'One full court shortened to 4.5 m per side. H = hitter, B = blocker. Sideline channels score 2.',
      },
    },
    {
      id: 'g6',
      code: 'G6',
      name: 'Wash 4v4: Bridge to 6v6',
      levelId: 'level-e',
      focus: ['Time', 'Space'],
      fourRs: 'Recover to base, Support in transition',
      format: '4v4 on a 7 m wide x 9 m deep court per side',
      players:
        'Three teams of 4 on court 1 (12 players): two play, one waits. On each wash, two waiting players observe with 4Rs cards and two serve to targets on court 2, then they swap. Court 2 hosts the 6v6 at the end.',
      rear: {
        representation:
          "4v4 with two front and two back players, the closest small-sided version of 6v6 positions (Volleyball Canada's bridge format).",
        exaggeration:
          '"Big point, little point": a team must win the serve rally AND the coach\'s follow-up free ball to score. This exaggerates the transition from defence to attack.',
        adaptation:
          'A team that wins two washes in a row receives the next coach ball as a hard down-ball instead of a free ball.',
        rotation:
          'The team that wins a wash stays on, for a maximum of three in a row. The waiting team observes with the 4Rs card and swaps in.',
      },
      rules: [
        'Serve rally (big point), then the coach immediately tosses a free ball to the team that lost it (little point).',
        'Win both = 1 point. Split = no point (a "wash").',
        'Games to 5 points. Teams rotate positions each point they score.',
        'Finish the session with 5 minutes of 6v6 on the second court to check transfer.',
      ],
      scoring: {
        mode: 'wash',
        target: 5,
        sideLabels: ['Team A', 'Team B'],
      },
      adaptations: [
        {
          id: 'g6-a1',
          kind: 'adaptation',
          trigger: {
            type: 'streak',
            outcome: 'win',
            unit: 'wash',
            count: 2,
          },
          when: 'Win two washes in a row',
          effect: 'Your next coach ball is a hard down-ball, not a free ball.',
          cue: 'Next coach ball is a down-ball',
        },
        {
          id: 'g6-a2',
          kind: 'rotation',
          trigger: {
            type: 'streak',
            outcome: 'win',
            unit: 'wash',
            count: 3,
          },
          when: 'Stay on court three times',
          effect: 'You rotate off and observe, even if you win.',
          cue: 'Rotate off and observe',
        },
        {
          id: 'g6-a3',
          kind: 'adaptation',
          trigger: {
            type: 'streak',
            outcome: 'loss',
            unit: 'wash',
            count: 3,
          },
          when: 'Lose three washes in a row',
          effect: "Your next coach ball is a high free ball to your setter's hands.",
          cue: 'High free ball to the setter',
        },
      ],
      huddleQuestions: [
        {
          concept: 'Time',
          text: 'After you dig, how do you buy time for the hitter to get off the net and approach?',
        },
        {
          concept: 'Space',
          text: 'In 4v4, who covers the tip when your blocker is up?',
        },
        {
          concept: 'Risk',
          text: 'In the free-ball rally, do you run a quick attack or a safe high set?',
        },
      ],
      diagram: {
        active: [
          {
            u0: -9,
            u1: 9,
            v0: 1,
            v1: 8,
          },
        ],
        zones: [],
        lines: [
          {
            u: 3,
            v0: 1,
            v1: 8,
            label: '3 m',
          },
          {
            u: -3,
            v0: 1,
            v1: 8,
            label: '3 m',
          },
        ],
        A: [
          [1, 2.5, ''],
          [1, 6.5, ''],
          [5.5, 2.8, ''],
          [5.5, 6.2, ''],
        ],
        B: [
          [-1, 2.5, ''],
          [-1, 6.5, ''],
          [-5.5, 2.8, ''],
          [-5.5, 6.2, ''],
        ],
        arrows: [
          [0, 9.6, -6, 4.5, 'free'],
          [5.5, 2.8, 1.5, 4.5, 'pass'],
        ],
        caption:
          'A 7 m wide court (cones 1 m in from each sideline). The waiting team observes from behind the end line.',
        W: [
          [10.2, 2.5],
          [10.2, 4],
          [10.2, 5.5],
          [10.2, 7],
        ],
        coach: [[0, 9.6]],
      },
    },
  ],
  taskCards: [
    {
      id: 'c1',
      skill: 'Overhand serve (float and topspin)',
      ican: 'I can start a point',
      phases: [
        {
          phase: 'Recovery',
          cue: 'Step into the court to your base before the receiver passes.',
          principle: 'I',
          why: 'Your body is already moving forward after contact. Using that inertia to step in gets you to base sooner.',
        },
        {
          phase: 'Set-up',
          cue: "Non-hitting foot forward, hips and shoulders turned. Toss in front of the hitting shoulder, about an arm's length high.",
          principle: 'B',
          why: 'A staggered stance gives a long base of support in the direction of the swing, so the weight shift stays balanced.',
        },
        {
          phase: 'Contact surface',
          cue: 'Float: firm, flat heel of the hand. Topspin: open, relaxed hand that wraps over the ball.',
          principle: 'S',
          why: 'A rigid flat hand gives a stable surface and no spin. A wrapping hand adds topspin.',
        },
        {
          phase: 'Impact point',
          cue: 'Contact in front of the hitting shoulder at full reach.',
          principle: 'C',
          why: 'Contact at full extension lets legs, hips, trunk, shoulder and arm add their speed in sequence (coordination chain).',
        },
        {
          phase: 'Hitting zone',
          cue: 'Float: short punch, stop the hand at the target. Topspin: snap the wrist over the top of the ball.',
          principle: 'M',
          why: 'A float has almost no spin, so small changes in airflow around the panels push it sideways or down late in flight (Hong et al., 2018). Topspin creates a downward Magnus force, so a hard serve still drops into the court (Martins et al., 2022).',
        },
      ],
      task: 'Serve 5 to a hoop target in serve-receive zone 1, 6 or 5. Hoop = 2, in court = 1. Score 8+: move back 1 m. Topspin bonus +1 per ball.',
      score: 'Best score from 5 serves (max 10, plus spin bonus).',
      video: {
        label:
          'Volleyball for EPHE 352 YouTube channel (serve clips); progression: Volleyball Canada underarm serve',
        url: 'https://www.youtube.com/@VolleyballforEPHE352',
      },
    },
    {
      id: 'c2',
      skill: 'Forearm pass (serve receive and free ball)',
      ican: 'I can rally',
      phases: [
        {
          phase: 'Recovery',
          cue: 'Back to your serve-receive base, low, weight on the balls of the feet, as the server tosses.',
          principle: 'B',
          why: 'A lower centre of mass over a wide base lets you move quickly in any direction.',
        },
        {
          phase: 'Set-up',
          cue: "Read the server's shoulder and toss. Move early and stop before contact, so the ball is in front of your midline.",
          principle: 'I',
          why: 'Stopping before contact removes your own unwanted momentum, so only the platform angle decides where the ball goes.',
        },
        {
          phase: 'Contact surface',
          cue: 'Thumbs together, elbows locked, flat platform from wrists to elbows.',
          principle: 'S',
          why: 'A flat, stable platform gives a predictable rebound.',
        },
        {
          phase: 'Impact point',
          cue: 'Contact on the forearms above the wrists, in front of the hips.',
          principle: 'O',
          why: 'The platform pushes back on the ball (opposite force), and the ball leaves roughly at right angles to the platform, so the tilt of the platform sets the direction.',
        },
        {
          phase: 'Hitting zone',
          cue: 'Angle the platform to the setter. Hard serve: absorb with the legs. Soft ball: small leg lift, no arm swing.',
          principle: 'M',
          why: 'Against a hard serve, letting the platform give slightly reduces how fast the ball rebounds. Against a soft ball, a small leg drive adds momentum only when the ball needs it.',
        },
      ],
      task: 'Partner serves 10. Pass to a target hoop at the setter spot (2 m off the net, 3 m from the right sideline). Hoop = 2, settable in front of the 3 m line = 1.',
      score: 'Points from 10 serves (max 20).',
      video: {
        label: 'Volleyball for EPHE 352 YouTube channel (skill clips from the UVic Smashball unit)',
        url: 'https://www.youtube.com/@VolleyballforEPHE352',
      },
    },
    {
      id: 'c3',
      skill: 'Overhead set (front and back)',
      ican: 'I can rally',
      phases: [
        {
          phase: 'Recovery',
          cue: 'Release to the target zone (right front) as soon as you read that the pass is coming to you.',
          principle: 'I',
          why: 'Getting there early lets you be stopped and balanced before the ball arrives, rather than still moving.',
        },
        {
          phase: 'Set-up',
          cue: 'Feet under the ball, right foot slightly forward, hips square to the target. Hands up early in a window above the forehead.',
          principle: 'B',
          why: 'A stable base under the ball lets the legs push straight up toward the target.',
        },
        {
          phase: 'Contact surface',
          cue: 'Finger pads, thumbs and index fingers forming a triangle, wrists bent back.',
          principle: 'E',
          why: 'Bent wrists and fingers load like springs (elastic energy) and give back that energy on release.',
        },
        {
          phase: 'Impact point',
          cue: 'Above the forehead, ball in front of the face.',
          principle: 'S',
          why: 'Contact in line with the eyes keeps both hands equal and stable, so the ball leaves without spin.',
        },
        {
          phase: 'Hitting zone',
          cue: 'Extend legs and arms together toward the target. Front set: palms finish to the target. Back set: arch the hips, thumbs push back.',
          principle: 'C',
          why: 'Legs then arms extend in sequence (coordination chain) to add force over a longer contact, giving height and control.',
        },
      ],
      task: 'Passer sends 10 balls. Setter sets 5 front and 5 back to a hoop at the antenna. Front hoop = 1, back hoop = 2.',
      score: 'Points from 10 sets (max 15).',
      video: {
        label: 'Volleyball for EPHE 352 YouTube channel (skill clips from the UVic Smashball unit)',
        url: 'https://www.youtube.com/@VolleyballforEPHE352',
      },
    },
    {
      id: 'c4',
      skill: 'Attack approach and arm swing',
      ican: 'I can play net',
      phases: [
        {
          phase: 'Recovery',
          cue: 'Land on two feet, knees bent, then back off the net to cover or to your next base.',
          principle: 'O',
          why: 'Landing on both feet with bent knees spreads the ground reaction force over more time and less load.',
        },
        {
          phase: 'Set-up',
          cue: 'Right-handers: left-right-left (3-step) or right-left-right-left (4-step). Slow to fast. Both arms swing back on the last two steps.',
          principle: 'M',
          why: 'The approach builds horizontal momentum. The quick last two steps plant and brake against the floor (opposite force), loading the legs so that momentum is redirected into height. Approach speed was strongly related to spike jump height (Wagner et al., 2009).',
        },
        {
          phase: 'Contact surface',
          cue: 'Firm, open hand. Wrap over the top of the ball.',
          principle: 'S',
          why: 'A stable hand passes force cleanly and adds topspin so the ball drops into the court.',
        },
        {
          phase: 'Impact point',
          cue: 'At the top of your reach, in front of the hitting shoulder.',
          principle: 'B',
          why: 'Contact in front lets you hit down into the court and keep both the ball and the block in view, while your body stays balanced behind the swing.',
        },
        {
          phase: 'Hitting zone',
          cue: 'Bow-and-arrow draw, high elbow, then shoulder, elbow and wrist whip through in sequence. Snap the wrist.',
          principle: 'C',
          why: 'The coordination chain moves from trunk rotation to shoulder, elbow and wrist, with each segment adding speed (Reeser et al., 2010).',
        },
      ],
      task: 'Setter sets 10 balls. Hit to back-third targets. Back third = 1, hoop in corner = 3. Goal: 7 of 10 in the back third.',
      score: 'Points from 10 attacks (max 30).',
      video: {
        label: 'Volleyball Canada: standing attack (as used in the UVic Smashball unit)',
        url: 'https://youtu.be/UBz2qbPS0HA',
      },
    },
    {
      id: 'c5',
      skill: 'Tip and roll shot',
      ican: 'I can play net',
      phases: [
        {
          phase: 'Recovery',
          cue: 'Same landing and cover as a full attack.',
          principle: 'O',
          why: 'A two-foot landing spreads ground reaction force.',
        },
        {
          phase: 'Set-up',
          cue: "Same approach and arm draw as a full swing so the defence can't read it.",
          principle: 'I',
          why: 'The defence reads your momentum and arm action. Keeping them the same removes the cue.',
        },
        {
          phase: 'Contact surface',
          cue: 'Tip: stiff fingertips. Roll shot: open hand under and behind the ball.',
          principle: 'S',
          why: 'Stiff fingers give a short, controlled contact. An open hand under the ball adds topspin to a slow ball.',
        },
        {
          phase: 'Impact point',
          cue: "High and in front, over the block's hands.",
          principle: 'B',
          why: 'Reaching high and in front keeps you balanced while you place the ball.',
        },
        {
          phase: 'Hitting zone',
          cue: 'Tip: push up and over to the short zone. Roll: slow arm, lift and roll to the deep corners.',
          principle: 'M',
          why: 'Less arm speed means less momentum on the ball. The roll shot had the lowest shoulder and elbow loads of the serve and spike types tested (Reeser et al., 2010), so it is a useful low-load option.',
        },
      ],
      task: '10 sets. Alternate tip and roll. Tip lands in front of the 3 m line on a hoop = 2. Roll lands in the back corner = 2. Any other in-court ball = 1. Blocked = 0.',
      score: 'Points from 10 shots (max 20).',
      video: {
        label: 'Volleyball for EPHE 352 YouTube channel (skill clips from the UVic Smashball unit)',
        url: 'https://www.youtube.com/@VolleyballforEPHE352',
      },
    },
    {
      id: 'c6',
      skill: 'Block',
      ican: 'I can play net',
      phases: [
        {
          phase: 'Recovery',
          cue: 'Land on two feet, turn toward the ball, and get off the net to approach or cover.',
          principle: 'O',
          why: 'Two-foot landings share the load.',
        },
        {
          phase: 'Set-up',
          cue: "An elbow's length from the net, hands up at shoulder height. Eyes: ball, setter, ball, hitter.",
          principle: 'B',
          why: 'A balanced, square stance lets you move either way.',
        },
        {
          phase: 'Contact surface',
          cue: 'Big, firm hands, fingers spread, thumbs up.',
          principle: 'S',
          why: 'Firm hands make a stable wall so the ball rebounds down into the court.',
        },
        {
          phase: 'Impact point',
          cue: "In front of the hitter's shoulder, over the net.",
          principle: 'I',
          why: "Jump straight up (no drift) so your momentum doesn't carry you into the net or off line.",
        },
        {
          phase: 'Hitting zone',
          cue: "Press the hands over the net and angle them toward the middle of the opponent's court.",
          principle: 'M',
          why: 'Pressing over adds a little forward momentum and sends the rebound down and in.',
        },
      ],
      task: 'Partner tosses 5, then hits 5 standing attacks. Block landing in front of the 3 m line = 1, on a hoop = 2. Goal: 7 of 10 touched.',
      score: 'Points from 10 attacks (max 20).',
      video: {
        label: 'Volleyball Canada: blocking',
        url: 'https://youtu.be/npE7oXTMlwE',
      },
    },
    {
      id: 'c7',
      skill: 'Dig and overhead save',
      ican: 'I can rally',
      phases: [
        {
          phase: 'Recovery',
          cue: "Back to the defensive base the moment your team's attack crosses the net.",
          principle: 'B',
          why: 'A low, wide base gives you a fast first step in any direction.',
        },
        {
          phase: 'Set-up',
          cue: "Eyes: hitter's arm, hitter's hand, ball. Stop and be still as the hitter contacts.",
          principle: 'I',
          why: 'Being still at contact means you can move in either direction instead of fighting your own momentum.',
        },
        {
          phase: 'Contact surface',
          cue: 'Platform below the waist, or hands together palms up for an overhead save.',
          principle: 'S',
          why: 'A stable surface controls the rebound.',
        },
        {
          phase: 'Impact point',
          cue: 'Ball in front of the body, between the knees where possible.',
          principle: 'O',
          why: 'In front of the body, the rebound goes up and forward, back into your court.',
        },
        {
          phase: 'Hitting zone',
          cue: 'Absorb: give with arms and legs to send the ball high to the middle.',
          principle: 'M',
          why: 'Letting the arms and body give slightly at contact takes speed off a hard spike so the dig stays playable.',
        },
      ],
      task: 'Partner attacks 10 (5 swings from behind the 3 m line, 5 tips). Dig stays up = 1, dug high to the middle = 2.',
      score: 'Points from 10 attacks (max 20).',
      video: {
        label: 'Volleyball for EPHE 352 YouTube channel (skill clips from the UVic Smashball unit)',
        url: 'https://www.youtube.com/@VolleyballforEPHE352',
      },
    },
  ],
  tallySheets: [
    {
      id: 'contact-count',
      name: 'Contact count',
      durationSec: 180,
      instructions:
        'Watch one side of one court and tap each time it happens. Do this in a 6v6 at the start of practice 1, in a small-sided game, and in a 6v6 at the end of practice 6.',
      counters: [
        {
          key: 'contacts',
          label: 'Ball contacts',
          input: 'tap',
        },
        {
          key: 'rallies',
          label: 'Rallies played',
          input: 'tap',
        },
        {
          key: 'threeContact',
          label: 'Pass, set and attack',
          input: 'tap',
        },
        {
          key: 'attacksFaced',
          label: 'Attacks faced',
          input: 'tap',
        },
        {
          key: 'attacksDug',
          label: 'Attacks dug',
          input: 'tap',
        },
        {
          key: 'longestRally',
          label: 'Longest rally (net crossings)',
          input: 'number',
        },
        {
          key: 'players',
          label: 'Players on this side',
          input: 'number',
        },
      ],
      derived: [
        {
          key: 'contactsPerPlayer',
          label: 'Contacts per player',
          numerator: 'contacts',
          denominator: 'players',
          format: 'ratio',
        },
        {
          key: 'threeContactShare',
          label: 'Rallies with pass, set, attack',
          numerator: 'threeContact',
          denominator: 'rallies',
          format: 'percent',
        },
        {
          key: 'digRate',
          label: 'Attacks dug',
          numerator: 'attacksDug',
          denominator: 'attacksFaced',
          format: 'percent',
        },
      ],
    },
  ],
  sessions: [
    {
      id: 'p1',
      number: 1,
      title: 'Baseline and Monarch 2v2',
      goal: 'Record a 6v6 baseline, then introduce small-sided play and the Monarch rules.',
      gameId: 'g1',
      cardId: 'c2',
      blocks: [
        {
          startMin: 0,
          endMin: 5,
          kind: 'baseline',
          text: 'Normal 6v6 scrimmage on court 1. Fill in the contact-count sheet for 3 minutes.',
          tallySheetId: 'contact-count',
        },
        {
          startMin: 5,
          endMin: 13,
          kind: 'play',
          text: 'G1 Monarch 2v2 on court 1 (two mini courts). Waiting pairs serve to targets on court 2 until their turn.',
          gameId: 'g1',
          adaptationsOn: false,
        },
        {
          startMin: 13,
          endMin: 15,
          kind: 'huddle',
          text: 'Ask: "Where is the open space when both defenders are back?" Take two answers.',
          question: 'Where is the open space when both defenders are back?',
        },
        {
          startMin: 15,
          endMin: 22,
          kind: 'practice',
          text: 'Forearm pass task card (serve receive to a target).',
          cardId: 'c2',
        },
        {
          startMin: 22,
          endMin: 30,
          kind: 'play',
          text: 'G1 again with the adaptation rules on. Contact-count sheet for 3 minutes on one mini court.',
          gameId: 'g1',
          adaptationsOn: true,
        },
      ],
      record: [
        'Contact counts and attacks dug: 6v6 baseline vs. 2v2',
        "How many times each mini court's Monarchs changed",
        'One thing that surprised you',
      ],
    },
    {
      id: 'p2',
      number: 2,
      title: 'Long-Thin Court: Deep and Short',
      goal: 'Exaggerate front and back space so tips and roll shots become real choices.',
      gameId: 'g2',
      cardId: 'c5',
      blocks: [
        {
          startMin: 0,
          endMin: 10,
          kind: 'play',
          text: 'G2 on four 3 m lanes across both courts. Up-and-down court rotation.',
          gameId: 'g2',
          adaptationsOn: false,
        },
        {
          startMin: 10,
          endMin: 12,
          kind: 'huddle',
          text: 'Ask: "Where should the back defender stand to cover the tip and the deep roll?"',
          question: 'Where should the back defender stand to cover the tip and the deep roll?',
        },
        {
          startMin: 12,
          endMin: 20,
          kind: 'practice',
          text: 'Tip and roll shot task card.',
          cardId: 'c5',
        },
        {
          startMin: 20,
          endMin: 30,
          kind: 'play',
          text: 'G2 with adaptation rules. Note which scoring zones get used.',
          gameId: 'g2',
          adaptationsOn: true,
        },
      ],
      record: [
        'Number of short-zone and deep-zone kills (tally)',
        'Did games get closer after the adaptation rules?',
        'Rally length on one lane for 3 minutes',
      ],
    },
    {
      id: 'p3',
      number: 3,
      title: 'Tag Team and the 4Rs',
      goal: 'Teach recovering to base and supporting the hitter, with players observing each other.',
      gameId: 'g3',
      cardId: 'c4',
      blocks: [
        {
          startMin: 0,
          endMin: 2,
          kind: 'intro',
          text: 'Show the 4Rs observation card (Base, Cover, Adjust, Support). Each waiting player watches one teammate.',
        },
        {
          startMin: 2,
          endMin: 11,
          kind: 'play',
          text: 'G3 Tag Team on two mini courts per full court.',
          gameId: 'g3',
          adaptationsOn: false,
        },
        {
          startMin: 11,
          endMin: 13,
          kind: 'huddle',
          text: 'Ask: "After you attack, where is your base?"',
          question: 'After you attack, where is your base?',
        },
        {
          startMin: 13,
          endMin: 20,
          kind: 'practice',
          text: 'Attack approach task card, ending with landing and covering.',
          cardId: 'c4',
        },
        {
          startMin: 20,
          endMin: 30,
          kind: 'play',
          text: 'G3 with adaptation rules.',
          gameId: 'g3',
          adaptationsOn: true,
        },
      ],
      record: [
        'Most common 4Rs cue called by observers',
        'Before/after: how often hitters were covered (tally for 3 minutes)',
        'Player comments (no names)',
      ],
    },
    {
      id: 'p4',
      number: 4,
      title: 'Tripleball 3v3',
      goal: 'Use coach free balls to multiply transition attacks and reward good setting.',
      gameId: 'g4',
      cardId: 'c3',
      blocks: [
        {
          startMin: 0,
          endMin: 10,
          kind: 'play',
          text: 'G4 Tripleball on both courts (four teams of 3).',
          gameId: 'g4',
          adaptationsOn: false,
        },
        {
          startMin: 10,
          endMin: 12,
          kind: 'huddle',
          text: 'Ask: "On a free ball, how high should the pass be so your setter has time?"',
          question: 'On a free ball, how high should the pass be so your setter has time?',
        },
        {
          startMin: 12,
          endMin: 20,
          kind: 'practice',
          text: 'Overhead set task card (front and back).',
          cardId: 'c3',
        },
        {
          startMin: 20,
          endMin: 30,
          kind: 'play',
          text: 'G4 with adaptation scoring. Winners up, losers down.',
          gameId: 'g4',
          adaptationsOn: true,
        },
      ],
      record: [
        'Contact counts on one court for 3 minutes',
        'Three-contact attacks out of 10 triples',
        'Final scores: did adaptation keep them close?',
      ],
    },
    {
      id: 'p5',
      number: 5,
      title: 'Line or Angle',
      goal: 'Read the hitter, block line or angle, and defend the space the block leaves.',
      gameId: 'g5',
      cardId: 'c6',
      blocks: [
        {
          startMin: 0,
          endMin: 10,
          kind: 'play',
          text: 'G5 on both courts.',
          gameId: 'g5',
          adaptationsOn: false,
        },
        {
          startMin: 10,
          endMin: 12,
          kind: 'huddle',
          text: 'Ask: "Where is the open space when the blocker takes line?"',
          question: 'Where is the open space when the blocker takes line?',
        },
        {
          startMin: 12,
          endMin: 20,
          kind: 'practice',
          text: 'Block task card, then the dig task card.',
          cardId: 'c6',
        },
        {
          startMin: 20,
          endMin: 30,
          kind: 'play',
          text: 'G5 with adaptation rules. Rotate opponents.',
          gameId: 'g5',
          adaptationsOn: true,
        },
      ],
      record: [
        'Points won from blocks (tally)',
        'Attacks faced vs. attacks dug and kept in play (3 minutes)',
        'One read you saw a player make well',
      ],
    },
    {
      id: 'p6',
      number: 6,
      title: 'Wash 4v4 to 6v6',
      goal: 'Bridge back to 6v6 and record the end-of-unit comparison.',
      gameId: 'g6',
      cardId: 'c7',
      blocks: [
        {
          startMin: 0,
          endMin: 10,
          kind: 'play',
          text: 'G6 Wash 4v4 on court 1. Waiting team: two observe with the 4Rs card, two serve to targets on court 2.',
          gameId: 'g6',
          adaptationsOn: false,
        },
        {
          startMin: 10,
          endMin: 12,
          kind: 'huddle',
          text: 'Ask: "After you dig, how do you buy time for the hitter?"',
          question: 'After you dig, how do you buy time for the hitter?',
        },
        {
          startMin: 12,
          endMin: 17,
          kind: 'practice',
          text: 'Dig and overhead save task card.',
          cardId: 'c7',
        },
        {
          startMin: 17,
          endMin: 22,
          kind: 'play',
          text: 'G6 again.',
          gameId: 'g6',
          adaptationsOn: true,
        },
        {
          startMin: 22,
          endMin: 30,
          kind: 'transfer',
          text: '6v6 scrimmage. Repeat the 3-minute contact-count sheet. Finish with the anonymous show-of-hands check-in.',
          tallySheetId: 'contact-count',
        },
      ],
      record: [
        'Contact counts and attacks dug: 6v6 end vs. 6v6 baseline',
        'Show-of-hands tallies (enjoyment, touches, confidence)',
        "What you'd keep or change",
      ],
    },
  ],
  glossary: [
    {
      key: 'B',
      name: 'Balance',
      text: 'Control of the centre of mass over the base of support. A lower centre of mass is more stable.',
    },
    {
      key: 'I',
      name: 'Inertia',
      text: "A body keeps doing what it's doing unless a force changes it. Stopping before contact, or using momentum to recover.",
    },
    {
      key: 'O',
      name: 'Opposite force',
      text: 'Every action has an equal and opposite reaction, often from the ground. Push into the floor to jump or pass.',
    },
    {
      key: 'M',
      name: 'Momentum',
      text: 'Mass x velocity. Linear from the approach and weight shift, angular from rotation.',
    },
    {
      key: 'E',
      name: 'Elastic energy',
      text: 'Energy stored in stretched muscles and tendons, given back on release (the wrist and finger load in the set).',
    },
    {
      key: 'C',
      name: 'Coordination chain',
      text: 'Sequenced motion from the ground through the trunk to the hand, each segment adding speed.',
    },
    {
      key: 'S',
      name: 'Stability',
      text: 'Resisting unwanted motion at contact: a firm hand, a flat platform.',
    },
  ],
};
