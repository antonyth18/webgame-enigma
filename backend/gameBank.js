// Static game bank (Option A):
// - Frontend renders the question text.
// - Backend validates only by round + team and awards points.
//
// IMPORTANT: keep the answers here (or in env) so the client can’t cheat.

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

// Round numbers start at 1
const BANK = {
  1: {
    A: { answer: "test", points: 100 },
    B: { answer: "test", points: 0 }, // Hawkins gives hint; no points
  },
  2: {
    A: { answer: "test", points: 150 },
    B: { answer: "test", points: 0 },
  },
  3: {
    A: { answer: "test", points: 200 },
    B: { answer: "test", points: 0 },
  },
};

function getRoundBank(roundNumber) {
  return BANK[Number(roundNumber)] ?? null;
}

function checkAnswer({ roundNumber, team, answer }) {
  const round = getRoundBank(roundNumber);
  if (!round) return { ok: false, points: 0 };
  const expected = round?.[team]?.answer;
  if (!expected) return { ok: false, points: 0 };
  const ok = normalize(expected) === normalize(answer);
  const points = ok ? Number(round?.[team]?.points ?? 0) : 0;
  return { ok, points };
}

module.exports = {
  BANK,
  getRoundBank,
  checkAnswer,
};


