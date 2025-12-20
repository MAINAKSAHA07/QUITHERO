import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

const run = async () => {
  await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  let program = await pb.collection('programs').getFirstListItem('language = "en" && is_active = true').catch(() => null)
  if (!program) {
    program = await pb.collection('programs').create({
      title: 'Default 10-Day Program',
      description: 'Auto-seeded',
      is_active: true,
      language: 'en',
      duration_days: 10,
      order: 1,
    })
    console.log('Created program', program.id)
  } else {
    console.log('Program exists', program.id)
  }

  const days = await pb.collection('program_days').getFullList({ filter: `program = "${program.id}"` })
  if (days.length === 0) {
    const d1 = await pb.collection('program_days').create({
      program: program.id,
      day_number: 1,
      title: 'Day 1',
      subtitle: 'Start',
      estimated_duration_min: 10,
      is_locked: false,
    })
    await pb.collection('steps').create({
      program_day: d1.id,
      order: 1,
      type: 'text',
      content_json: { text: 'Welcome to day 1' },
    })
    console.log('Seeded day1/step')
  } else {
    console.log('Program days existing:', days.length)
  }
}

run().catch(err => { console.error(err); process.exit(1) })
