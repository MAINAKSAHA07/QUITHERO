/**
 * Day 1 — Seeing the Trap
 * Source: Day_01_Seeing_the_Trap.docx (Smono Reset Method)
 *
 * Module map (for RAG + app steps):
 *   intro → welcome + CBT focus
 *   module_1 → why previous attempts failed
 *   module_2 → what the trap is (nicotine illusion)
 *   module_3 → denial statements + self-check
 *   module_4 → keep smoking instruction
 *   exercise_awareness_log → functional analysis (A→B→C)
 *   tool_five_second_pause → craving tool
 *   reflection → evening journal prompts
 *   preview → tomorrow teaser
 */

export const dayMeta = {
  day_number: 1,
  slug: 'day-01-seeing-the-trap',
  title: 'Day 1 — Seeing the Trap',
  subtitle: 'Psychoeducation & functional analysis',
  day_theme: 'Make the invisible trap visible before trying to quit',
  cbt_technique: 'Psychoeducation & functional analysis',
  estimated_duration_min: 25,
}

export const steps = [
  {
    order: 1,
    type: 'text',
    module_key: 'day01_intro',
    step_title: 'Welcome — You were never weak',
    slug: 'day-01-intro-welcome',
    content_role: 'intro',
    content_json: {
      title: 'You were never weak. You were fighting something you could not see.',
      text: `Welcome to Day 1. Today has one job: to help you see clearly the trap you've been living inside.

Not to lecture you, not to scare you — you already know the health facts, and they've never been enough. We're going to do something different. We're going to make the invisible visible.

CBT focus today: Psychoeducation and functional analysis — before we change a behaviour, we map exactly what it is and what keeps it running.`,
    },
  },
  {
    order: 2,
    type: 'text',
    module_key: 'day01_module_1',
    step_title: 'Module 1 — Why every previous attempt failed',
    slug: 'day-01-module-1-previous-attempts',
    content_role: 'lesson',
    content_json: {
      title: 'Module 1 — Why every previous attempt failed',
      text: `Be honest with yourself for a moment. You've probably tried to stop before. Maybe through sheer willpower. Maybe with patches, gum, or a vape. Maybe you lasted three days, three weeks, even three months — and then you were smoking again, often without quite knowing how.

If part of you has started to believe you're simply "someone who can't quit," set that down. It isn't true, and by the end of these ten days you'll understand precisely why your past attempts had nothing to do with weakness.

Here is the core problem. Every conventional method asks you to give up something you still secretly believe is valuable, while leaving that belief untouched. You white-knuckle through the craving, but the part of your mind that whispers "a cigarette would help right now" is still fully intact. Sooner or later, in a weak moment, that belief wins.

You can't permanently walk away from something you still want. So we're not going to remove the cigarette first. We're going to remove the wanting.`,
    },
  },
  {
    order: 3,
    type: 'text',
    module_key: 'day01_module_2',
    step_title: 'Module 2 — What the trap actually is',
    slug: 'day-01-module-2-the-trap',
    content_role: 'lesson',
    content_json: {
      title: 'Module 2 — What the trap actually is',
      text: `This is the single most important idea in the whole method, so read it slowly:

Smoking does not give you anything. It takes something away, then briefly hands a small piece of it back — and you feel grateful for the return.

A non-smoker doesn't walk around all day with a low, nagging emptiness that a cigarette relieves. They simply don't have the emptiness at all. Nicotine creates a small, restless discomfort as it leaves your body, and the next cigarette partially relieves the discomfort the previous cigarette caused. You feel that flicker of relief and call it pleasure or relaxation. But all that's happened is you've been returned, for a few minutes, to where the non-smoker lives permanently and for free.

It's like wearing shoes a size too small all day just for the relief of taking them off. The relief is real — but you manufactured the discomfort in the first place.

Once you truly see this, everything shifts. You stop feeling like you're sacrificing a pleasure, and start feeling like you're walking out of a con.`,
    },
  },
  {
    order: 4,
    type: 'text',
    module_key: 'day01_module_3',
    step_title: 'Module 3 — The denial that keeps the trap shut',
    slug: 'day-01-module-3-denial',
    content_role: 'lesson',
    content_json: {
      title: 'Module 3 — The denial that keeps the trap shut',
      text: `Addiction protects itself by manufacturing denial — it convinces you that you're still in control of the very thing controlling you.

You don't need to argue with any of this today. Just read the four statements below and notice, quietly, which ones still have a grip on you:

1. "Smoking hasn't really harmed me."
2. "I don't smoke that much — it's under control."
3. "It genuinely helps me relax, focus, and be social."
4. "I could stop any time I really wanted to."

Don't try to talk yourself out of them today. Just mark which ones feel true. Over the coming days we'll take each one apart, and you'll watch it fall on its own.`,
    },
  },
  {
    order: 5,
    type: 'question_open',
    module_key: 'day01_module_3_checkin',
    step_title: 'Denial self-check',
    slug: 'day-01-denial-self-check',
    content_role: 'reflection',
    content_json: {
      question:
        'Which of the four denial statements still feel true to you? List the numbers (1–4) and a sentence about why each one still has a grip.',
      placeholder: 'e.g. 3 — I still feel calmer after a cigarette…',
    },
  },
  {
    order: 6,
    type: 'text',
    module_key: 'day01_module_4',
    step_title: 'Module 4 — Your first instruction',
    slug: 'day-01-module-4-keep-smoking',
    content_role: 'lesson',
    content_json: {
      title: 'Module 4 — Your first instruction (it will surprise you)',
      text: `Keep smoking today. Do not try to quit.

This is a genuine instruction, not a figure of speech. For the next nine days you smoke or vape exactly as you normally would. Quitting today, on willpower, before you've seen the trap, is precisely the fight you've already lost before.

We remove the desire first. When the desire is gone, putting the cigarette down isn't a battle — it's a relief.`,
    },
  },
  {
    order: 7,
    type: 'exercise',
    module_key: 'day01_exercise_awareness_log',
    step_title: "Today's Exercise — The Awareness Log",
    slug: 'day-01-exercise-awareness-log',
    content_role: 'exercise',
    content_json: {
      title: "Today's Exercise — The Awareness Log",
      instructions: `For the rest of today, don't change anything about your smoking. Just observe it.

Each time you reach for a cigarette or vape, pause five seconds before you light it and note three quick things (in your phone, the Smono app, or a notebook):

• Time: when was it?
• Trigger: what came just before? (coffee, phone, stress, boredom, a drink, a feeling, another person?)
• Choice or reflex?: was this a real, conscious decision, or an automatic reach your hand made on its own?

This is functional analysis in CBT: A (trigger) → B (behaviour) → C (what you got from it).

You're not judging yourself. You're becoming a scientist studying your own pattern. Most people are stunned to discover how few cigarettes were ever a real choice.`,
    },
  },
  {
    order: 8,
    type: 'exercise',
    module_key: 'day01_tool_five_second_pause',
    step_title: 'Craving Tool — The Five-Second Pause',
    slug: 'day-01-tool-five-second-pause',
    content_role: 'tool',
    content_json: {
      title: 'Craving Tool — The Five-Second Pause',
      instructions: `Every time today, before you light up, just pause and breathe once.

You're still allowed to smoke. But that single pause breaks the automatic loop and hands the decision back to you.

You're training a tiny gap between trigger and reaction — and that gap is where all your freedom will eventually live.`,
    },
  },
  {
    order: 9,
    type: 'question_open',
    module_key: 'day01_reflection',
    step_title: 'Reflection',
    slug: 'day-01-reflection',
    content_role: 'reflection',
    content_json: {
      question: `Write a few sentences tonight:

1. When did I have my very first cigarette or vape — and did I ever decide to do this every day for years?
2. Which of the four denial statements still feels true to me, and why?
3. How did it feel to pause for five seconds before smoking?`,
      placeholder: 'Take your time. There are no wrong answers.',
    },
  },
  {
    order: 10,
    type: 'text',
    module_key: 'day01_preview',
    step_title: 'Tomorrow',
    slug: 'day-01-preview-tomorrow',
    content_role: 'preview',
    content_json: {
      title: 'Tomorrow',
      text: `We open up the brain. You'll see exactly how nicotine creates the "little monster" — and why the relief it gives is the cleverest illusion in the trap.`,
    },
  },
]
