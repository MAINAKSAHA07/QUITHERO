import {
  splitExerciseInstructions,
  splitReflectionPrompts,
  detectWorksheetFormat,
} from './stepContentFormat'

const day4 = `Intro.\n\n• Step one.\n\nWatch what happens.\n\nMoment\n\nBefore\n\nRight after\n\n+10 min\n\nDid it touch the actual problem?\n\n1\n\n2`
const day3 = `Text.\n\nAnticipated (0–10)\n\nActual (0–10)\n\nWhat I really noticed\n\nCigarette 1\n\nCigarette 2\n\nCigarette 3`

const d4 = splitExerciseInstructions(day4)
console.assert(d4.worksheet?.kind === 'stress', 'day4 stress worksheet')
console.assert(!d4.body.includes('Moment'), 'day4 body strips table')

const d3 = splitExerciseInstructions(day3)
console.assert(d3.worksheet?.kind === 'grid', 'day3 grid worksheet')

console.assert(splitReflectionPrompts('• A\n\n• B').length === 2, 'reflection bullets split')

const halt = detectWorksheetFormat(['State', 'My early sign', "What I'll actually do", 'Hungry', 'Angry', 'Lonely', 'Tired'])
console.assert(halt?.kind === 'grid', 'day24 HALT grid')
