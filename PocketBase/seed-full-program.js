import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

// 10-Day Program Content Structure
const programDays = [
  {
    day_number: 1,
    title: 'Day 1: Understanding Your Journey',
    subtitle: 'Welcome and Foundation',
    estimated_duration_min: 15,
    steps: [
      {
        order: 1,
        type: 'text',
        content_json: {
          text: 'Welcome to your 10-day transformation journey! Today marks the beginning of a new chapter in your life. You\'ve taken the courageous first step towards freedom from addiction.',
          image_url: '',
        },
      },
      {
        order: 2,
        type: 'question_open',
        content_json: {
          question: 'What motivated you to start this journey today?',
          placeholder: 'Share your thoughts...',
        },
      },
      {
        order: 3,
        type: 'text',
        content_json: {
          text: 'Remember: Every journey begins with a single step. You\'re not alone in this.',
          image_url: '',
        },
      },
    ],
  },
  {
    day_number: 2,
    title: 'Day 2: Building Awareness',
    subtitle: 'Understanding Triggers',
    estimated_duration_min: 20,
    steps: [
      {
        order: 1,
        type: 'text',
        content_json: {
          text: 'Today we\'ll explore what triggers your cravings. Understanding your triggers is the first step to overcoming them.',
          image_url: '',
        },
      },
      {
        order: 2,
        type: 'question_mcq',
        content_json: {
          question: 'What situations typically trigger your cravings?',
          options: ['Stress', 'Boredom', 'Social situations', 'After meals', 'All of the above'],
          correct_answer: 4,
        },
      },
      {
        order: 3,
        type: 'exercise',
        content_json: {
          text: 'Practice deep breathing: Inhale for 4 counts, hold for 4, exhale for 4. Repeat 5 times.',
        },
      },
    ],
  },
  {
    day_number: 3,
    title: 'Day 3: Developing Coping Strategies',
    subtitle: 'Tools for Success',
    estimated_duration_min: 25,
    steps: [
      {
        order: 1,
        type: 'text',
        content_json: {
          text: 'Today we\'ll learn practical coping strategies to handle cravings when they arise.',
          image_url: '',
        },
      },
      {
        order: 2,
        type: 'question_open',
        content_json: {
          question: 'What activities help you feel calm and centered?',
          placeholder: 'List your go-to activities...',
        },
      },
      {
        order: 3,
        type: 'exercise',
        content_json: {
          text: 'Try the 5-5-5 technique: Name 5 things you see, 4 things you hear, 3 things you feel, 2 things you smell, 1 thing you taste.',
        },
      },
    ],
  },
  {
    day_number: 4,
    title: 'Day 4: Building Healthy Habits',
    subtitle: 'Replacement Activities',
    estimated_duration_min: 20,
    steps: [
      {
        order: 1,
        type: 'text',
        content_json: {
          text: 'Replacing old habits with new, healthy ones is key to long-term success.',
          image_url: '',
        },
      },
      {
        order: 2,
        type: 'question_open',
        content_json: {
          question: 'What new healthy habit would you like to develop?',
          placeholder: 'Share your goal...',
        },
      },
      {
        order: 3,
        type: 'text',
        content_json: {
          text: 'Start small. Even 5 minutes of a new activity can make a difference.',
          image_url: '',
        },
      },
    ],
  },
  {
    day_number: 5,
    title: 'Day 5: Mid-Week Checkpoint',
    subtitle: 'Reflection and Progress',
    estimated_duration_min: 15,
    steps: [
      {
        order: 1,
        type: 'text',
        content_json: {
          text: 'Congratulations on reaching Day 5! You\'re halfway through your first week. Take a moment to acknowledge your progress.',
          image_url: '',
        },
      },
      {
        order: 2,
        type: 'question_open',
        content_json: {
          question: 'How are you feeling about your progress so far?',
          placeholder: 'Reflect on your journey...',
        },
      },
      {
        order: 3,
        type: 'text',
        content_json: {
          text: 'Every day you resist is a victory. Keep going!',
          image_url: '',
        },
      },
    ],
  },
  {
    day_number: 6,
    title: 'Day 6: Managing Stress',
    subtitle: 'Stress Relief Techniques',
    estimated_duration_min: 25,
    steps: [
      {
        order: 1,
        type: 'text',
        content_json: {
          text: 'Stress is a common trigger. Today we\'ll learn effective stress management techniques.',
          image_url: '',
        },
      },
      {
        order: 2,
        type: 'exercise',
        content_json: {
          text: 'Practice progressive muscle relaxation: Tense and release each muscle group from toes to head.',
        },
      },
      {
        order: 3,
        type: 'question_open',
        content_json: {
          question: 'What stress-relief techniques work best for you?',
          placeholder: 'Share your methods...',
        },
      },
    ],
  },
  {
    day_number: 7,
    title: 'Day 7: One Week Milestone',
    subtitle: 'Celebrating Your Achievement',
    estimated_duration_min: 20,
    steps: [
      {
        order: 1,
        type: 'text',
        content_json: {
          text: '🎉 You\'ve completed your first week! This is a significant milestone. Your body is already beginning to heal.',
          image_url: '',
        },
      },
      {
        order: 2,
        type: 'text',
        content_json: {
          text: 'Health improvements after 7 days:\n- Blood pressure and heart rate normalize\n- Carbon monoxide levels drop\n- Sense of taste and smell improve',
          image_url: '',
        },
      },
      {
        order: 3,
        type: 'question_open',
        content_json: {
          question: 'What positive changes have you noticed this week?',
          placeholder: 'Celebrate your wins...',
        },
      },
    ],
  },
  {
    day_number: 8,
    title: 'Day 8: Building Resilience',
    subtitle: 'Strengthening Your Willpower',
    estimated_duration_min: 20,
    steps: [
      {
        order: 1,
        type: 'text',
        content_json: {
          text: 'Resilience is built through practice. Each challenge you overcome makes you stronger.',
          image_url: '',
        },
      },
      {
        order: 2,
        type: 'question_mcq',
        content_json: {
          question: 'When facing a craving, what helps you most?',
          options: ['Deep breathing', 'Distraction', 'Talking to someone', 'All of the above'],
          correct_answer: 3,
        },
      },
      {
        order: 3,
        type: 'text',
        content_json: {
          text: 'Remember: Cravings are temporary. They will pass.',
          image_url: '',
        },
      },
    ],
  },
  {
    day_number: 9,
    title: 'Day 9: Planning for Long-Term Success',
    subtitle: 'Setting Future Goals',
    estimated_duration_min: 25,
    steps: [
      {
        order: 1,
        type: 'text',
        content_json: {
          text: 'As you approach the end of this program, it\'s time to plan for your continued success.',
          image_url: '',
        },
      },
      {
        order: 2,
        type: 'question_open',
        content_json: {
          question: 'What are your goals for the next 30 days?',
          placeholder: 'Set your intentions...',
        },
      },
      {
        order: 3,
        type: 'text',
        content_json: {
          text: 'You have the tools and knowledge to succeed. Trust the process.',
          image_url: '',
        },
      },
    ],
  },
  {
    day_number: 10,
    title: 'Day 10: Graduation and Beyond',
    subtitle: 'Your New Beginning',
    estimated_duration_min: 20,
    steps: [
      {
        order: 1,
        type: 'text',
        content_json: {
          text: '🎓 Congratulations! You\'ve completed the 10-day program! This is just the beginning of your transformation.',
          image_url: '',
        },
      },
      {
        order: 2,
        type: 'text',
        content_json: {
          text: 'You\'ve proven to yourself that you can do this. Continue using the tools and strategies you\'ve learned.',
          image_url: '',
        },
      },
      {
        order: 3,
        type: 'question_open',
        content_json: {
          question: 'How do you feel about completing this program?',
          placeholder: 'Share your thoughts...',
        },
      },
      {
        order: 4,
        type: 'text',
        content_json: {
          text: 'Remember: Every day is a new opportunity. Keep going, you\'ve got this! 💪',
          image_url: '',
        },
      },
    ],
  },
]

async function seedFullProgram() {
  try {
    // Authenticate as admin
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
    console.log('✓ Authenticated as admin')

    // Check if program exists, create if not
    let program
    try {
      program = await pb.collection('programs').getFirstListItem(
        'language = "en" && is_active = true',
        { sort: 'order' }
      )
      console.log('✓ Found existing program:', program.id)
    } catch (e) {
      // Create new program
      program = await pb.collection('programs').create({
        title: '10-Day Quit Hero Program',
        description: 'A comprehensive 10-day program designed to help you quit smoking and build lasting habits for a smoke-free life.',
        is_active: true,
        language: 'en',
        duration_days: 10,
        order: 1,
      })
      console.log('✓ Created new program:', program.id)
    }

    // Check existing days
    const existingDays = await pb.collection('program_days').getFullList({
      filter: `program = "${program.id}"`,
      sort: 'day_number',
    })
    console.log(`✓ Found ${existingDays.length} existing program days`)

    // Create or update program days
    for (const dayData of programDays) {
      let day
      const existingDay = existingDays.find((d) => d.day_number === dayData.day_number)

      if (existingDay) {
        // Update existing day
        day = await pb.collection('program_days').update(existingDay.id, {
          title: dayData.title,
          subtitle: dayData.subtitle,
          estimated_duration_min: dayData.estimated_duration_min,
          is_locked: false,
        })
        console.log(`✓ Updated Day ${dayData.day_number}: ${dayData.title}`)
      } else {
        // Create new day
        day = await pb.collection('program_days').create({
          program: program.id,
          day_number: dayData.day_number,
          title: dayData.title,
          subtitle: dayData.subtitle,
          estimated_duration_min: dayData.estimated_duration_min,
          is_locked: false,
        })
        console.log(`✓ Created Day ${dayData.day_number}: ${dayData.title}`)
      }

      // Get existing steps for this day
      const existingSteps = await pb.collection('steps').getFullList({
        filter: `program_day = "${day.id}"`,
        sort: 'order',
      })

      // Create or update steps
      for (const stepData of dayData.steps) {
        const existingStep = existingSteps.find((s) => s.order === stepData.order)

        if (existingStep) {
          // Update existing step
          await pb.collection('steps').update(existingStep.id, {
            type: stepData.type,
            content_json: stepData.content_json,
          })
          console.log(`  ✓ Updated Step ${stepData.order} (${stepData.type})`)
        } else {
          // Create new step
          await pb.collection('steps').create({
            program_day: day.id,
            order: stepData.order,
            type: stepData.type,
            content_json: stepData.content_json,
          })
          console.log(`  ✓ Created Step ${stepData.order} (${stepData.type})`)
        }
      }
    }

    // Clean up any extra steps that shouldn't exist
    for (const existingDay of existingDays) {
      const dayData = programDays.find((d) => d.day_number === existingDay.day_number)
      if (dayData) {
        const existingSteps = await pb.collection('steps').getFullList({
          filter: `program_day = "${existingDay.id}"`,
          sort: 'order',
        })
        const expectedStepCount = dayData.steps.length
        if (existingSteps.length > expectedStepCount) {
          // Remove extra steps
          const stepsToRemove = existingSteps.slice(expectedStepCount)
          for (const step of stepsToRemove) {
            await pb.collection('steps').delete(step.id)
            console.log(`  ✓ Removed extra step ${step.order}`)
          }
        }
      }
    }

    console.log('\n✅ Full 10-day program seeded successfully!')
    console.log(`   Program ID: ${program.id}`)
    console.log(`   Total Days: ${programDays.length}`)
    const totalSteps = programDays.reduce((sum, day) => sum + day.steps.length, 0)
    console.log(`   Total Steps: ${totalSteps}`)
  } catch (error) {
    console.error('✗ Error seeding program:', error)
    console.error('Details:', error.response || error.message || error)
    process.exit(1)
  }
}

seedFullProgram()
