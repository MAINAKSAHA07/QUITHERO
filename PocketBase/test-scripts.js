#!/usr/bin/env node

/**
 * Test script to verify all PocketBase scripts can load configuration correctly
 * This doesn't connect to PocketBase, just verifies environment loading
 */

import { initPocketBase, loadEnv, getPocketBaseURL, getAdminEmail, getAdminPassword } from './utils.js'

console.log('🧪 Testing PocketBase Scripts Configuration...\n')

// Test 1: Load .env
console.log('Test 1: Loading .env file...')
const envLoaded = loadEnv()
if (envLoaded) {
  console.log('  ✓ .env file loaded successfully\n')
} else {
  console.log('  ⚠ .env file not found (using system environment variables)\n')
}

// Test 2: Get configuration
console.log('Test 2: Getting configuration...')
try {
  const config = initPocketBase()
  console.log(`  ✓ PocketBase URL: ${config.url}`)
  console.log(`  ✓ Admin Email: ${config.email}`)
  console.log(`  ✓ Admin Password: ${config.password ? '***' + config.password.slice(-4) : 'NOT SET'}\n`)
  
  if (!config.email || !config.password) {
    console.error('  ✗ Missing required credentials!')
    process.exit(1)
  }
} catch (error) {
  console.error(`  ✗ Configuration error: ${error.message}`)
  process.exit(1)
}

// Test 3: Individual functions
console.log('Test 3: Testing individual utility functions...')
const url = getPocketBaseURL()
const email = getAdminEmail()
const password = getAdminPassword()

console.log(`  ✓ URL: ${url}`)
console.log(`  ✓ Email: ${email || 'NOT SET'}`)
console.log(`  ✓ Password: ${password ? 'SET' : 'NOT SET'}\n`)

// Summary
console.log('='.repeat(60))
console.log('✅ All tests passed! Scripts are ready to use.')
console.log('='.repeat(60))
console.log('\nYou can now run any PocketBase script:')
console.log('  - npm run pb:complete-setup')
console.log('  - npm run pb:setup')
console.log('  - npm run pb:rules')
console.log('  - npm run pb:seed-program')
console.log('\nAll scripts will use AWS configuration from .env file.\n')
