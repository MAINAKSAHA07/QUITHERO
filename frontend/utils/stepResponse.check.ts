import { withStoredQuestion } from './stepResponse'
import type { Step } from '../types/models'

const step = {
  id: 's1',
  type: 'question_open',
  slug: 'day-01-reflection',
  step_title: 'Day 1 reflection',
  content_json: { question: '  Why did you start?  ' },
} as unknown as Step

const open = withStoredQuestion(step, { answer: 'stress' })
console.assert(open.question === 'Why did you start?', 'stores trimmed question')
console.assert(open.answer === 'stress', 'keeps answer')
console.assert(open.step_title === 'Day 1 reflection', 'stores step_title')

const mcqStep = {
  ...step,
  type: 'question_mcq',
  content_json: { question: 'Pick one', options: ['A', 'B', 'C'] },
} as unknown as Step
const mcq = withStoredQuestion(mcqStep, { selected_option: 1 })
console.assert(mcq.selected_label === 'B', 'stores MCQ label')
console.assert(mcq.question === 'Pick one', 'stores MCQ question')

const multi = withStoredQuestion(
  { ...mcqStep, content_json: { question: 'Pick many', options: ['A', 'B', 'C'], allow_multiple: true } } as unknown as Step,
  { selected_options: [0, 2] }
)
console.assert(
  Array.isArray(multi.selected_labels) &&
    multi.selected_labels.join(',') === 'A,C',
  'stores multi MCQ labels'
)

console.log('stepResponse.check.ts: ok')
