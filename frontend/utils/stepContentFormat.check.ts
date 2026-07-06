import {
  splitExerciseInstructions,
  splitReflectionPrompts,
  detectWorksheetFormat,
} from './stepContentFormat'

const day4 = `Intro.\n\n• Step one.\n\nWatch what happens.\n\nMoment\n\nBefore\n\nRight after\n\n+10 min\n\nDid it touch the actual problem?\n\n1\n\n2`
const day3 = `Text.\n\nAnticipated (0–10)\n\nActual (0–10)\n\nWhat I really noticed\n\nCigarette 1\n\nCigarette 2\n\nCigarette 3`

const day6 = `Take the belief. Then answer, in writing:

• Where did I first learn this?

• What was I told smoking would give me?

• Did it ever actually deliver that`

const d6 = splitExerciseInstructions(day6)
console.assert(d6.worksheet?.kind === 'repeat', 'day6 repeat worksheet')

const day2 = `Keep smoking as normal today, but add one step to yesterday's Awareness Log. Each time a craving arrives (whether or not you smoke), write down two things:

• What did the craving say to you? Capture the actual thought: "I deserve a break."

• Relabel it. Rewrite the same moment in the monster's voice: "The little monster got hungry."

Do this for at least five cravings. By the end of the day you'll have a short catalogue.`

const d2 = splitExerciseInstructions(day2)
console.assert(d2.worksheet?.kind === 'repeat', 'day2 repeat worksheet')
console.assert(d2.worksheet?.kind === 'repeat' && d2.worksheet.rows === 5, 'day2 five rows')
console.assert(!d2.body.includes('What did the craving'), 'day2 body strips field bullets')

const d4 = splitExerciseInstructions(day4)
console.assert(d4.worksheet?.kind === 'stress', 'day4 stress worksheet')
console.assert(!d4.body.includes('Moment'), 'day4 body strips table')

const d3 = splitExerciseInstructions(day3)
console.assert(d3.worksheet?.kind === 'grid', 'day3 grid worksheet')

console.assert(splitReflectionPrompts('• A\n\n• B').length === 2, 'reflection bullets split')

const halt = detectWorksheetFormat(['State', 'My early sign', "What I'll actually do", 'Hungry', 'Angry', 'Lonely', 'Tired'])
console.assert(halt?.kind === 'grid', 'day24 HALT grid')
