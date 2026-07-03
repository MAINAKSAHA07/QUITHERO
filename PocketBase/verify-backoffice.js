#!/usr/bin/env node

/**
 * Verification script to test if backoffice can access users
 * Run this AFTER updating PocketBase permissions
 */

import { initPocketBase, getPocketBaseURL, loadEnv } from './utils.js'

// Load .env file
loadEnv()

const PB_URL = getPocketBaseURL()
const BACKOFFICE_ADMIN_EMAIL = process.env.BACKOFFICE_ADMIN_EMAIL || 'admin@backoffice.com'
const BACKOFFICE_ADMIN_PASSWORD = process.env.BACKOFFICE_ADMIN_PASSWORD || 'Admin123!'

async function verifyAccess() {
  console.log('🔍 Verifying Backoffice Access to PocketBase...\n');

  try {
    // Test 1: Authenticate as backoffice admin
    console.log('Test 1: Backoffice Admin Authentication');
    console.log('━'.repeat(50));
    const authResponse = await fetch(`${PB_URL}/api/collections/admin_users/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity: BACKOFFICE_ADMIN_EMAIL,
        password: BACKOFFICE_ADMIN_PASSWORD,
      }),
    });

    if (!authResponse.ok) {
      console.log('❌ Authentication failed');
      console.log(`   Status: ${authResponse.status}`);
      return;
    }

    const authData = await authResponse.json();
    const adminToken = authData.token;
    console.log('✅ Admin authenticated successfully');
    console.log(`   Admin: ${authData.record.name} (${authData.record.email})`);
    console.log(`   Role: ${authData.record.role}\n`);

    // Test 2: Access users collection
    console.log('Test 2: Access Users Collection');
    console.log('━'.repeat(50));
    const usersResponse = await fetch(`${PB_URL}/api/collections/users/records`, {
      headers: { 'Authorization': adminToken },
    });

    if (!usersResponse.ok) {
      console.log('❌ Cannot access users collection');
      console.log(`   Status: ${usersResponse.status}`);
      console.log('   This means permissions are not set correctly yet.\n');
      console.log('📝 Please follow the instructions in SETUP_INSTRUCTIONS.md\n');
      return;
    }

    const usersData = await usersResponse.json();
    console.log('✅ Successfully accessed users collection');
    console.log(`   Total Users: ${usersData.totalItems}`);

    if (usersData.totalItems > 0) {
      console.log('   Users found:');
      usersData.items.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (ID: ${user.id.substring(0, 8)}...)`);
      });
    }
    console.log();

    // Test 3: Access other collections
    console.log('Test 3: Access Other Collections');
    console.log('━'.repeat(50));

    const collections = [
      { name: 'programs', label: 'Programs' },
      { name: 'program_days', label: 'Program Days' },
      { name: 'steps', label: 'Steps' },
      { name: 'user_sessions', label: 'User Sessions' },
    ];

    for (const collection of collections) {
      const response = await fetch(`${PB_URL}/api/collections/${collection.name}/records?perPage=1`, {
        headers: { 'Authorization': adminToken },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${collection.label}: ${data.totalItems} items`);
      } else {
        console.log(`❌ ${collection.label}: Cannot access`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('🎉 SUCCESS! Backoffice is properly configured!');
    console.log('='.repeat(70));
    console.log('\nNext steps:');
    console.log('1. Make sure backoffice is running: cd backoffice && npm run dev');
    console.log('2. Open: http://localhost:5176');
    console.log('3. Login with: admin@backoffice.com / Admin123!')
    console.log('4. You should see all the data in the dashboard!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nPlease check:');
    console.log('1. PocketBase is running on port 8096');
    console.log('2. You updated the API rules in PocketBase Admin UI');
    console.log('3. Network connection is working\n');
  }
}

// Run the verification
verifyAccess();
