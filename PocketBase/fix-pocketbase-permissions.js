#!/usr/bin/env node

/**
 * Script to fix PocketBase collection permissions for the `users` collection.
 *
 * Goal:
 * - Allow `admin_users` (backoffice admins) to list/search/view/update/delete users.
 * - Allow each authenticated user to view and update ONLY their own user record.
 * - Keep user creation open (handled via auth endpoints / registration).
 *
 * This script is safe to run multiple times.
 *
 * Required env vars (set in your shell or .env when running via npm script):
 * - PB_ADMIN_EMAIL
 * - PB_ADMIN_PASSWORD
 * - (optional) VITE_POCKETBASE_URL  – defaults to http://localhost:8096
 */

import PocketBase from 'pocketbase'

const PB_URL = process.env.VITE_POCKETBASE_URL || 'http://localhost:8096'
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD must be set to run fix-pocketbase-permissions.js')
  process.exit(1)
}

const pb = new PocketBase(PB_URL)

const adminRule = '@request.auth.collectionName = "admin_users"'
const ownerRule = '@request.auth.id = id'
const adminOrOwnerRule = `${adminRule} || ${ownerRule}`

async function fixPermissions() {
  console.log('🔧 Fixing PocketBase `users` collection permissions...\n')

  try {
    console.log('1️⃣  Authenticating as PocketBase admin...')
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
    console.log('✅ Authenticated successfully\n')

    console.log('2️⃣  Fetching `users` collection...')
    const usersCol = await pb.collections.getOne('users')

    const payload = {
      // Only backoffice admins can list/search all users
      listRule: adminRule,
      // Admins can view any user; a logged-in user can view their own record
      viewRule: adminOrOwnerRule,
      // User creation handled via auth endpoints – leave create rule open
      createRule: '',
      // Admins can update any user; a user can update their own record
      updateRule: adminOrOwnerRule,
      // Only backoffice admins can delete users
      deleteRule: adminRule,
    }

    console.log('3️⃣  Updating `users` collection rules...')
    await pb.collections.update(usersCol.id, payload)
    console.log('✅ `users` collection permissions updated successfully.\n')

    console.log('Rules now in effect:')
    console.log(`  • listRule   : ${payload.listRule}`)
    console.log(`  • viewRule   : ${payload.viewRule}`)
    console.log(`  • createRule : ${payload.createRule === '' ? '(no rule – open for registration)' : payload.createRule}`)
    console.log(`  • updateRule : ${payload.updateRule}`)
    console.log(`  • deleteRule : ${payload.deleteRule}\n`)

    console.log('You can verify in PocketBase Admin UI:')
    console.log(`  1. Open: ${PB_URL}/_/`)
    console.log('  2. Go to: Collections → users → API Rules')
    console.log('  3. Confirm the rules match the ones above.\n')
  } catch (error) {
    console.error('❌ Error while updating permissions:', error?.response || error?.message || error)
    console.log('\nIf this keeps failing, you can still adjust rules manually in PocketBase Admin UI.')
    console.log(`URL: ${PB_URL}/_/`)
    process.exit(1)
  }
}

fixPermissions()
