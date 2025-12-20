#!/usr/bin/env node

/**
 * Migration Script: Add New Personalization Fields to user_profiles Collection
 *
 * This script updates the existing user_profiles collection with new fields:
 * - smoking_triggers (json)
 * - emotional_states (json)
 * - fear_index (number, 0-10)
 * - quit_reason (text)
 * - quit_archetype (select: escapist, stress_reactor, social_mirror, auto_pilot)
 *
 * Run: node PocketBase/migrate-user-profiles.js
 */

import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()
const pb = new PocketBase(PB_URL)

async function migrateUserProfiles() {
  console.log('🔄 Starting migration: Adding personalization fields to user_profiles...\n')

  try {
    // Authenticate as admin
    console.log('🔐 Authenticating...')
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
    console.log('✓ Authenticated successfully\n')

    // Get the user_profiles collection
    console.log('📦 Fetching user_profiles collection...')
    const collections = await pb.collections.getFullList()
    const userProfilesCollection = collections.find((c) => c.name === 'user_profiles')

    if (!userProfilesCollection) {
      throw new Error('user_profiles collection not found!')
    }

    console.log('✓ Found user_profiles collection\n')

    // Define new fields to add
    const newFields = [
      {
        name: 'smoking_triggers',
        type: 'json',
        options: {},
        system: false,
        required: false,
      },
      {
        name: 'emotional_states',
        type: 'json',
        options: {},
        system: false,
        required: false,
      },
      {
        name: 'fear_index',
        type: 'number',
        options: { min: 0, max: 10 },
        system: false,
        required: false,
      },
      {
        name: 'quit_reason',
        type: 'text',
        options: {},
        system: false,
        required: false,
      },
      {
        name: 'quit_archetype',
        type: 'select',
        options: {
          values: ['escapist', 'stress_reactor', 'social_mirror', 'auto_pilot'],
        },
        system: false,
        required: false,
      },
    ]

    // Get existing schema
    const existingSchema = userProfilesCollection.schema || []
    const existingFieldNames = existingSchema.map((f) => f.name)

    // Filter out fields that already exist
    const fieldsToAdd = newFields.filter((f) => !existingFieldNames.includes(f.name))

    if (fieldsToAdd.length === 0) {
      console.log('✓ All new fields already exist. No migration needed.\n')
      return
    }

    console.log(`📝 Adding ${fieldsToAdd.length} new field(s):`)
    fieldsToAdd.forEach((f) => {
      console.log(`   - ${f.name} (${f.type})`)
    })
    console.log('')

    // Merge with existing schema
    const updatedSchema = [...existingSchema, ...fieldsToAdd]

    // Update the collection
    console.log('🔧 Updating collection schema...')
    await pb.collections.update(userProfilesCollection.id, {
      schema: updatedSchema,
    })

    console.log('✓ Migration completed successfully!\n')
    console.log('📊 Summary:')
    console.log(`   - Fields added: ${fieldsToAdd.length}`)
    console.log(`   - Total fields: ${updatedSchema.length}`)
    console.log('')
    console.log('✅ user_profiles collection is now ready for personalization features!')
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    if (error.response) {
      console.error('Response data:', error.response.data)
    }
    process.exit(1)
  }
}

// Run migration
migrateUserProfiles()
