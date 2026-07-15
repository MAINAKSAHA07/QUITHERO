import {
  splitExerciseInstructions,
  splitReflectionPrompts,
  detectWorksheetFormat,
  formatInstructionBullets,
} from './stepContentFormat'

const day4 = `Intro.\n\n• Step one.\n\nWatch what happens.\n\nMoment\n\nBefore\n\nRight after\n\n+10 min\n\nDid it touch the actual problem?\n\n1\n\n2`
const day3 = `Text.\n\nAnticipated (0–10)\n\nActual (0–10)\n\nWhat I really noticed\n\nCigarette 1\n\nCigarette 2\n\nCigarette 3`

const day6 = `Take the belief. Then answer, in writing:

• Where did you first learn this?

• What were you told smoking would give you?

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

const day1Reflection = `Write a few sentences tonight:

1. When did you have your very first cigarette or vape, and did you ever decide to do this every day for years?
2. Which of the four denial statements still feels true to you, and why?
3. How did it feel to pause for five seconds before smoking?`
const d1prompts = splitReflectionPrompts(day1Reflection)
console.assert(d1prompts.length === 3, `day1 numbered split got ${d1prompts.length}`)
console.assert(!d1prompts.some((p) => /Write a few|^1\./.test(p)), 'day1 drops intro + numbering')
console.assert(d1prompts[0].includes('first cigarette'), 'day1 q1')
console.assert(/\byou\b/.test(d1prompts[0]), 'day1 q1 is second-person')
console.assert(!/\bI\b/.test(d1prompts[0]), 'day1 q1 must not ask as I')
console.assert(d1prompts[2].includes('five seconds'), 'day1 q3')

const numberedTight = `1. First?\n2. Second?\n3. Third?`
console.assert(splitReflectionPrompts(numberedTight).length === 3, 'numbered without blank lines')

const halt = detectWorksheetFormat(['State', 'My early sign', "What I'll actually do", 'Hungry', 'Angry', 'Lonely', 'Tired'])
console.assert(halt?.kind === 'grid', 'day24 HALT grid')

const day8 = `Build two columns. Be specific and personal — generic answers won't move you.

What smoking actually takes from me (money, health, time, freedom, self-respect, moments with people, the things I avoid because I'm out of breath…)

What I get back when I'm free (write each as something you'll gain, in your own life, not as a vague benefit)

Then do the money maths plainly:

• Cost per day: £/$ _____

• × 365 = per year: _____

• × 10 = per decade: _____

• One concrete thing that money could become instead: _____

Finish with a single sentence connecting quitting to your deepest value: "I'm becoming free because, more than anything, I want..." Keep this ledger. You'll return to it on hard days in the Stay-Free weeks.`

const d8 = splitExerciseInstructions(day8)
console.assert(d8.worksheet?.kind === 'fields', 'day8 fields worksheet')
console.assert(d8.worksheet?.kind === 'fields' && d8.worksheet.fields.length >= 6, 'day8 six+ fields')
console.assert(!formatInstructionBullets(d8.body).some((b) => /_{2,}/.test(b)), 'day8 body has no static blanks')

const day20 = `Build a simple running tally you can keep updating through the Stay-Free weeks and beyond.

Time free: ___ days (and counting)

Money reclaimed:

• Per day saved: _____

• × days free so far: _____

• Projected in 1 year: _____

• My freedom fund goal (something real you'll buy/do with it): _____

Health wins I've actually noticed (be specific — list at least three):

1.

2.

3.

Freedom wins (no more cold doorways, no more planning around cigarettes, no more panic when running low, no more apology…): list two or three that matter to you.

Then savour one, right now: pick the single gain you're most glad about, close your eyes, and spend thirty seconds genuinely appreciating it. That deliberate savouring is the reinforcement that makes it stick.`

const d20 = splitExerciseInstructions(day20)
console.assert(d20.worksheet?.kind === 'fields', 'day20 fields worksheet')
console.assert(d20.worksheet?.kind === 'fields' && d20.worksheet.fields.length >= 8, 'day20 eight+ fields')

const day21 = `Two parts:

1. Audit what's already returning. Note honestly:

• My energy three weeks ago vs. now (0–10): _____ → _____

• One physical thing that's noticeably easier (breath, stairs, sleep, a walk): _____

• One activity I avoided as a smoker because of low energy or breath: _____

2. Make one active promise. Choose a single, realistic, enjoyable movement to do today or tomorrow — a 15-minute walk, stairs instead of the lift, a bit of a sport you like. Schedule it (when, where). Then, ideally, do it today and notice how you feel afterward. You're proving to yourself that the energy is real and that using it feels good.`

const d21 = splitExerciseInstructions(day21)
console.assert(d21.worksheet?.kind === 'fields', 'day21 fields worksheet')
console.assert(d21.worksheet?.kind === 'fields' && d21.worksheet.fields.length >= 3, 'day21 three+ fields')
