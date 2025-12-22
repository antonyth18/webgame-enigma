// Frontend question text bank (Option A).
// Backend validates answers/points; frontend displays story + prompts.

export const QUESTION_BANK = {
  1: {
    A: {
      title: 'String Reversal in the Void',
      questionText:
        'Write a function that reverses a string. The darkness consumes all forward motion - only backwards can you escape.',
    },
    B: {
      title: 'Access Code Decryption',
      questionText:
        'Decrypt the security access code to unlock the first containment chamber. Time is running out.',
    },
  },
  2: {
    A: {
      title: 'Array Manipulation Through Darkness',
      questionText:
        'Find the maximum value in an array corrupted by the Upside Down. Numbers shift and change - locate the strongest.',
    },
    B: {
      title: 'Specimen Database Query',
      questionText:
        'Query the corrupted specimen database. Find the pattern in the chaos before the system purges.',
    },
  },
  3: {
    A: {
      title: 'Loop Through the Upside Down',
      questionText:
        'Create a loop that traverses a nested structure. Each layer is darker than the last. Navigate wisely.',
    },
    B: {
      title: 'Power Grid Restoration',
      questionText:
        'Restore power to the emergency containment systems. Calculate the correct circuit configuration.',
    },
  },
};

export function getQuestionFor(roundNumber, team) {
  const round = QUESTION_BANK?.[Number(roundNumber)];
  return round?.[team] ?? null;
}


