#!/usr/bin/env node

/**
 * Fix PocketBase permissions for support_tickets collection
 * Allows admin_users to list, view, update, and delete all support tickets
 * Regular users can still create and view their own tickets
 */

import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()

const pb = new PocketBase(PB_URL)

// Admin rule for admin_users collection
const adminRule = '@request.auth.collectionName = "admin_users"'

async function fixSupportTicketsPermissions() {
  try {
    console.log('🔐 Authenticating as PocketBase admin...')
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
    console.log('✅ Authenticated successfully')

    console.log('\n📋 Updating support_tickets collection permissions...')
    
    const collection = await pb.collections.getOne('support_tickets')
    
    // Set rules:
    // - listRule: admin_users can list all, users can list their own
    // - viewRule: admin_users can view all, users can view their own
    // - createRule: anyone authenticated can create (users create their own tickets)
    // - updateRule: admin_users can update all, users can update their own
    // - deleteRule: admin_users can delete all, users can delete their own
    
    const listRule = `(${adminRule}) || (user = @request.auth.id)`
    const viewRule = `(${adminRule}) || (user = @request.auth.id)`
    const createRule = `@request.auth.id != ""` // Any authenticated user
    const updateRule = `(${adminRule}) || (user = @request.auth.id)`
    const deleteRule = `(${adminRule}) || (user = @request.auth.id)`

    await pb.collections.update('support_tickets', {
      listRule,
      viewRule,
      createRule,
      updateRule,
      deleteRule,
    })

    console.log('✅ Successfully updated support_tickets permissions')
    console.log('\n📝 Permission rules set:')
    console.log(`   - listRule: ${listRule}`)
    console.log(`   - viewRule: ${viewRule}`)
    console.log(`   - createRule: ${createRule}`)
    console.log(`   - updateRule: ${updateRule}`)
    console.log(`   - deleteRule: ${deleteRule}`)
    console.log('\n✨ Done! Admin users can now manage all support tickets.')
  } catch (error) {
    console.error('❌ Error fixing permissions:', error)
    if (error?.response) {
      console.error('   Response:', error.response)
    }
    process.exit(1)
  }
}

fixSupportTicketsPermissions()
