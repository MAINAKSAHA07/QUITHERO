#!/usr/bin/env node

/**
 * Script to fix PocketBase permissions for programs collection
 * Ensures admin_users can delete programs
 *
 * Required env vars:
 * - PB_ADMIN_EMAIL
 * - PB_ADMIN_PASSWORD
 * - (optional) VITE_POCKETBASE_URL - defaults to http://localhost:8096
 */

import PocketBase from 'pocketbase'

const PB_URL = process.env.VITE_POCKETBASE_URL || 'http://localhost:8096'
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD must be set to run fix-program-permissions.js')
  process.exit(1)
}

const pb = new PocketBase(PB_URL)

const adminRule = '@request.auth.collectionName = "admin_users"'

async function fixProgramPermissions() {
  console.log('🔧 Fixing PocketBase `programs` collection permissions...\n')

  try {
    console.log('1️⃣  Authenticating as PocketBase admin...')
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
    console.log('✅ Authenticated successfully\n')

    console.log('2️⃣  Fetching `programs` collection...')
    const programsCol = await pb.collections.getOne('programs')

    const payload = {
      // Public can list/view programs (for frontend)
      listRule: '',
      viewRule: '',
      // Only admin_users can create/update/delete
      createRule: adminRule,
      updateRule: adminRule,
      deleteRule: adminRule,
    }

    console.log('3️⃣  Updating `programs` collection rules...')
    await pb.collections.update(programsCol.id, payload)
    console.log('✅ `programs` collection permissions updated successfully.\n')

    console.log('Rules now in effect:')
    console.log(`  • listRule   : ${payload.listRule === '' ? '(no rule – public)' : payload.listRule}`)
    console.log(`  • viewRule   : ${payload.viewRule === '' ? '(no rule – public)' : payload.viewRule}`)
    console.log(`  • createRule : ${payload.createRule}`)
    console.log(`  • updateRule : ${payload.updateRule}`)
    console.log(`  • deleteRule : ${payload.deleteRule}\n`)

    console.log('You can verify in PocketBase Admin UI:')
    console.log(`  1. Open: ${PB_URL}/_/`)
    console.log('  2. Go to: Collections → programs → API Rules')
    console.log('  3. Confirm the deleteRule is: @request.auth.collectionName = "admin_users"\n')
  } catch (error) {
    console.error('❌ Error while updating permissions:', error?.response || error?.message || error)
    console.log('\nIf this keeps failing, you can still adjust rules manually in PocketBase Admin UI.')
    console.log(`URL: ${PB_URL}/_/`)
    process.exit(1)
  }
}

fixProgramPermissions()
