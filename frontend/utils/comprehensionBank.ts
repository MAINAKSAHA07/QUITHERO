import { ComprehensionCheckContent } from '../types/models'

type BankEntry = ComprehensionCheckContent

/** Day-specific comprehension checks — always used instead of generic AI output */
export const COMPREHENSION_BANK: Record<number, BankEntry> = {
  1: {
    question: 'What is the main purpose of understanding your smoking pattern?',
    options: [
      'To feel guilty about past choices',
      'To see how the habit works so you can change it sustainably',
      'To prove you have enough willpower',
      'To find excuses to keep smoking',
    ],
    correct_index: 1,
    thought_of_the_day: ['Awareness is not guilt—it is power.', 'The trap only works when you cannot see it clearly.'],
    reread_hint: 'Re-read the opening section—the core idea is about seeing the pattern, not blaming yourself.',
  },
  2: {
    question: 'In today\'s lesson, what is the "little monster"?',
    options: [
      'Your true personality when stressed',
      'The addiction\'s hunger—not your real need',
      'A lack of willpower you must fight',
      'Nicotine improving your natural calm',
    ],
    correct_index: 1,
    thought_of_the_day: ['The craving speaks in your voice—but it is not you.', 'Naming the monster steals its authority.'],
    reread_hint: 'Re-read Module 2 about the restless creature and cognitive defusion.',
  },
  3: {
    question: 'What did the conscious cigarette audit usually reveal?',
    options: [
      'Smoking tastes better than expected',
      'Anticipation is high but the actual experience disappoints',
      'Only the first cigarette of the day is unpleasant',
      'Pleasure comes entirely from the smoke itself',
    ],
    correct_index: 1,
    thought_of_the_day: ['The glamour lives in expectation, not the puff.', 'Honest noticing breaks the pleasure illusion.'],
    reread_hint: 'Re-read the exercise about rating anticipation vs. reality.',
  },
  4: {
    question: 'What does nicotine actually do to stress levels?',
    options: [
      'It permanently lowers cortisol and relaxes you',
      'It temporarily relieves withdrawal, then raises stress overall',
      'It has no effect on stress hormones',
      'It only affects stress when combined with coffee',
    ],
    correct_index: 1,
    thought_of_the_day: ['The cigarette did not calm you—it paused the alarm it created.', 'Real relief comes from breaking the loop, not feeding it.'],
    reread_hint: 'Look back at the section on the relaxation myth.',
  },
  5: {
    question: 'Why can one drug not both relax you and sharpen focus?',
    options: [
      'Because nicotine is too weak',
      'Because smoking only masks withdrawal—it cannot genuinely do both',
      'Because you need more cigarettes to balance effects',
      'Because concentration always improves with nicotine',
    ],
    correct_index: 1,
    thought_of_the_day: ['The myths contradict each other for a reason.', 'Withdrawal relief is not the same as real focus or calm.'],
    reread_hint: 'Re-read the modules on concentration, boredom, and confidence myths.',
  },
  6: {
    question: 'Where did most of your smoking beliefs actually come from?',
    options: [
      'Your own careful reasoning about life',
      'Culture, ads, and conditioning—not personal wisdom',
      'A unique addictive personality',
      'Biological needs you were born with',
    ],
    correct_index: 1,
    thought_of_the_day: ['You were targeted, not defective.', 'A belief traced to its source loses its grip.'],
    reread_hint: 'Re-read Module 4—you were never the problem.',
  },
  7: {
    question: 'Why does cutting down usually fail long-term?',
    options: [
      'It removes desire too quickly',
      'It keeps you negotiating with the drug instead of ending the loop',
      'It works if you have enough discipline',
      'It is easier than stopping completely',
    ],
    correct_index: 1,
    thought_of_the_day: ['Cutting down keeps the monster fed.', 'Freedom is not a smaller cage.'],
    reread_hint: 'Re-read why willpower and gradual reduction keep the trap intact.',
  },
  8: {
    question: 'What are you really giving up when you quit?',
    options: [
      'A loyal friend and comfort',
      'An illusion of pleasure and relief from a self-made discomfort',
      'Your ability to handle stress',
      'A necessary part of your identity forever',
    ],
    correct_index: 1,
    thought_of_the_day: ['You are not losing a friend—you are losing a con.', 'Nothing worth keeping leaves when nicotine does.'],
    reread_hint: 'Re-read the section on having nothing to give up.',
  },
  9: {
    question: 'What is the difference between a substitute and a tool?',
    options: [
      'There is no difference—both replace cigarettes',
      'A substitute keeps the belief you lost something; a tool helps you ride out a craving',
      'Tools must contain nicotine to work',
      'Substitutes are always healthier than tools',
    ],
    correct_index: 1,
    thought_of_the_day: ['You are not replacing a friend—you are learning to ride waves.', 'Pre-decided if–then plans beat improvisation.'],
    reread_hint: 'Re-read the substitute vs. tool distinction before your reset.',
  },
  10: {
    question: 'What makes the last cigarette different from past quit attempts?',
    options: [
      'You must use maximum willpower this time',
      'The desire is removed first—stopping becomes relief, not battle',
      'You should keep one emergency cigarette',
      'You must quit before understanding the trap',
    ],
    correct_index: 1,
    thought_of_the_day: ['The difficulty was never in stopping.', 'This is a celebration of understanding, not a white-knuckle test.'],
    reread_hint: 'Re-read why the reset moment is about liberation, not deprivation.',
  },
  11: {
    question: 'On your first free day, what is the empty feeling?',
    options: [
      'Proof you need nicotine forever',
      'Withdrawal passing—not a problem you must solve with smoke',
      'A sign you are failing',
      'The same as genuine hunger for food',
    ],
    correct_index: 1,
    thought_of_the_day: ['The wave rises and falls whether you smoke or not.', 'Novelty is not danger—it is proof of change.'],
    reread_hint: 'Re-read how to navigate the first day without panic.',
  },
  12: {
    question: 'What is a trigger in today\'s CBT framing?',
    options: [
      'A need you must satisfy with nicotine',
      'A learned association—not a command from your true self',
      'Proof that quitting was a mistake',
      'Something only willpower can overcome',
    ],
    correct_index: 1,
    thought_of_the_day: ['The trigger is a link, not a need.', 'Seeing the association weakens its pull.'],
    reread_hint: 'Re-read how triggers and associations of ideas work.',
  },
  13: {
    question: 'Did you ever truly enjoy the meal with a cigarette?',
    options: [
      'Yes—the cigarette completed every meal',
      'No—you rushed through the meal to get to the cigarette',
      'Only on special occasions',
      'Meals and cigarettes are unrelated',
    ],
    correct_index: 1,
    thought_of_the_day: ['The ritual stole attention from the food.', 'You can keep the meal and drop the link.'],
    reread_hint: 'Re-read the coffee, meals, and alcohol associations.',
  },
  14: {
    question: 'When you watch other smokers now, what is true?',
    options: [
      'You are missing out on their pleasure',
      'You are free—they are still paying the cost',
      'You should join them to be polite',
      'Social smoking has no pull once you quit',
    ],
    correct_index: 1,
    thought_of_the_day: ['Freedom looks quiet from the outside.', 'A simple "I don\'t smoke" is enough.'],
    reread_hint: 'Re-read the section on other smokers and social pressure.',
  },
  15: {
    question: 'Why is "just one" cigarette a myth?',
    options: [
      'Because one is harmless',
      'Because one reopens the chemical loop—you rarely stop at one',
      'Because only heavy smokers relapse',
      'Because one proves you never really quit',
    ],
    correct_index: 1,
    thought_of_the_day: ['There is no such thing as one.', 'The first puff is the whole trap knocking again.'],
    reread_hint: 'Re-read why one cigarette is never just one.',
  },
  16: {
    question: 'On a bad day, what should nicotine not become?',
    options: [
      'A forbidden thought',
      'The solution to emotions that cigarettes never actually fixed',
      'A reason to restart permanently',
      'Something to feel guilty about wanting',
    ],
    correct_index: 1,
    thought_of_the_day: ['A bad day is a bad day—not a verdict.', 'Feelings pass; the cigarette never fixed them.'],
    reread_hint: 'Re-read how to handle bad days without reaching for smoke.',
  },
  17: {
    question: 'What did smoking pretend to do for stress?',
    options: [
      'Remove the source of stress',
      'Manage stress while actually only pausing withdrawal',
      'Build long-term resilience',
      'Help you think more clearly under pressure',
    ],
    correct_index: 1,
    thought_of_the_day: ['Real tools ground your body—not feed the loop.', 'Breath and movement outlast a craving.'],
    reread_hint: 'Re-read the real stress toolkit section.',
  },
  18: {
    question: 'What did the cigarette actually do for boredom?',
    options: [
      'Filled time with meaningful activity',
      'Briefly interrupted boredom without solving it',
      'Made life more interesting long-term',
      'Only affected people with boring jobs',
    ],
    correct_index: 1,
    thought_of_the_day: ['Boredom is a signal, not a command.', 'Small actions beat an automatic reach.'],
    reread_hint: 'Re-read why restlessness is not a reason to smoke.',
  },
  19: {
    question: 'What lifts when the "black shadows" of smoking fade?',
    options: [
      'Only your lung function',
      'Mood, self-respect, and quiet shame you carried',
      'Nothing—you should expect to feel worse',
      'Only your wallet',
    ],
    correct_index: 1,
    thought_of_the_day: ['The shame was never a character flaw.', 'Compassion for past you speeds recovery.'],
    reread_hint: 'Re-read how mood and self-image recover after quitting.',
  },
  20: {
    question: 'What counts as a "real gain" from quitting?',
    options: [
      'Only avoiding disease decades later',
      'Health, money, time, and daily freedom you can notice now',
      'Proving others wrong',
      'Never having another craving',
    ],
    correct_index: 1,
    thought_of_the_day: ['Freedom is more than absence of smoke.', 'Count what you have already reclaimed.'],
    reread_hint: 'Re-read the section on counting real gains.',
  },
  21: {
    question: 'What often caused the lethargy you blamed on aging?',
    options: [
      'Quitting too fast',
      'Nicotine and smoke taxing your energy systems',
      'Lack of exercise only',
      'Normal life regardless of smoking',
    ],
    correct_index: 1,
    thought_of_the_day: ['Your body is recovering, not punishing you.', 'Energy returns in waves—notice the trend.'],
    reread_hint: 'Re-read how your body recovers after quitting.',
  },
  22: {
    question: 'What is the "moment of revelation"?',
    options: [
      'A single dramatic quit day',
      'When not smoking stops feeling like effort and becomes simply true',
      'When cravings disappear forever instantly',
      'When you prove willpower to others',
    ],
    correct_index: 1,
    thought_of_the_day: ['Identity shifts quietly before it feels permanent.', 'You are becoming a non-smoker, not performing one.'],
    reread_hint: 'Re-read the identity shift in today\'s lesson.',
  },
  23: {
    question: 'What is the main danger after several smoke-free weeks?',
    options: [
      'Cravings getting stronger forever',
      'Complacency—forgetting why you do not smoke',
      'Immediate physical relapse',
      'Losing all motivation instantly',
    ],
    correct_index: 1,
    thought_of_the_day: ['Success needs gentle guarding.', 'Staying clear-eyed is not paranoia—it is care.'],
    reread_hint: 'Re-read why complacency—not craving—is the risk now.',
  },
  24: {
    question: 'What does a high-risk situations plan give you?',
    options: [
      'Permission to smoke in hard moments',
      'Pre-decided responses when predictable triggers fire',
      'A guarantee you will never slip',
      'Reasons to avoid all social life',
    ],
    correct_index: 1,
    thought_of_the_day: ['You cannot predict every moment—but you can prepare.', 'If–then beats improvisation.'],
    reread_hint: 'Re-read your high-risk situations planning exercise.',
  },
  25: {
    question: 'If you slip, what is the compassionate response?',
    options: [
      'Decide you have failed permanently',
      'Treat it as data, learn, and return without shame spiral',
      'Hide it and smoke more to "get it over with"',
      'Punish yourself to prevent another slip',
    ],
    correct_index: 1,
    thought_of_the_day: ['One cigarette is a mistake—not a identity sentence.', 'Compassion returns you faster than shame.'],
    reread_hint: 'Re-read the slip protocol—respond, don\'t collapse.',
  },
  26: {
    question: 'What is the goal regarding eating after quitting?',
    options: [
      'Replace smoking with strict dieting',
      'Avoid swapping a smoking problem for a punishing eating problem',
      'Ignore all appetite changes',
      'Use food as a nicotine substitute forever',
    ],
    correct_index: 1,
    thought_of_the_day: ['Your body is recalibrating—kindness beats panic.', 'Health is balance, not substitution.'],
    reread_hint: 'Re-read the weight and eating worries section.',
  },
  27: {
    question: 'What do big emotions need instead of a cigarette?',
    options: [
      'To be suppressed immediately',
      'To be felt and moved through with real tools',
      'Proof you are too weak to quit',
      'A replacement addiction',
    ],
    correct_index: 1,
    thought_of_the_day: ['Feelings are weather—they pass.', 'You can hold a big emotion without feeding the monster.'],
    reread_hint: 'Re-read emotional trigger work from today.',
  },
  28: {
    question: 'Why rewrite old smoking associations?',
    options: [
      'To forget your past completely',
      'Because memory is a storyteller—you can edit the story',
      'To prove smoking was never enjoyable',
      'To avoid all places you used to smoke',
    ],
    correct_index: 1,
    thought_of_the_day: ['The old scene can get a new ending.', 'You are the author now.'],
    reread_hint: 'Re-read how to rewrite old associations.',
  },
  29: {
    question: 'What did you gain beyond stopping smoking?',
    options: [
      'Only cleaner lungs',
      'Alignment with values and the life you are building',
      'Obligation to preach to others',
      'Freedom from ever feeling stress',
    ],
    correct_index: 1,
    thought_of_the_day: ['You did not just stop—you started.', 'Values outlast cravings.'],
    reread_hint: 'Re-read today\'s values and life-building reflection.',
  },
  30: {
    question: 'What does "free for life" mean in this program?',
    options: [
      'Finishing a 30-day course and hoping',
      'Carrying a non-smoker identity with tools for whatever comes',
      'Never thinking about cigarettes again starting tomorrow',
      'Proving superiority over people who still smoke',
    ],
    correct_index: 1,
    thought_of_the_day: ['You are not finishing—you are continuing free.', 'The program ends; the identity stays.'],
    reread_hint: 'Re-read the closing message about lifelong non-smoker identity.',
  },
}

export function getDayComprehensionCheck(dayNumber: number, dayTitle?: string): ComprehensionCheckContent {
  const preset = COMPREHENSION_BANK[dayNumber]
  if (preset) return { ...preset }

  const label = dayTitle || `Day ${dayNumber}`
  return {
    question: `What is the main takeaway from ${label}?`,
    options: [
      'Willpower alone is the best way to quit',
      'Understanding the trap makes lasting change possible',
      'Cutting down gradually is always enough',
      'Cravings mean you are failing',
    ],
    correct_index: 1,
    thought_of_the_day: [
      'Every lesson builds your clarity.',
      'Re-read the core module if the answer is unclear.',
    ],
    reread_hint: 'Scroll back to the main lesson before continuing.',
  }
}
