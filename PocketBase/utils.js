/**
 * Shared utilities for PocketBase scripts
 * Handles .env file loading and AWS configuration
 */

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

/**
 * Load environment variables from .env file
 */
export function loadEnv() {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const envPath = join(__dirname, '..', '.env')

  try {
    const envFile = readFileSync(envPath, 'utf-8')
    envFile.split('\n').forEach(line => {
      // Skip comments and empty lines
      const trimmedLine = line.trim()
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        return
      }
      
      // Handle export statements: export KEY=value or export KEY="value"
      let match = trimmedLine.match(/^export\s+([^=]+?)\s*=\s*(.*?)\s*$/)
      if (!match) {
        // Handle regular KEY=value format
        match = trimmedLine.match(/^\s*([^#][^=]*?)\s*=\s*(.*?)\s*$/)
      }
      
      if (match) {
        const key = match[1].trim()
        let value = match[2].trim()
        
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1)
        }
        
        // Only set if not already in process.env (environment variables take precedence)
        if (!process.env[key] && value) {
          process.env[key] = value
        }
      }
    })
    return true
  } catch (error) {
    console.warn(`⚠️  Warning: Could not load .env file from ${envPath}`)
    console.warn(`   Error: ${error.message}`)
    console.warn(`   Continuing with system environment variables...\n`)
    return false
  }
}

/**
 * Get PocketBase URL from environment variables
 * Prioritizes AWS_POCKETBASE_URL, falls back to VITE_POCKETBASE_URL, then default
 */
export function getPocketBaseURL() {
  let url = process.env.AWS_POCKETBASE_URL || process.env.VITE_POCKETBASE_URL || 'http://localhost:8096'
  
  // Remove /_/ suffix if present (PocketBase client needs base URL)
  url = url.replace(/\/_\//g, '').replace(/\/$/, '')
  
  return url
}

/**
 * Get admin email from environment variables
 * Prioritizes AWS_PB_ADMIN_EMAIL, falls back to PB_ADMIN_EMAIL
 */
export function getAdminEmail() {
  return process.env.AWS_PB_ADMIN_EMAIL || process.env.PB_ADMIN_EMAIL
}

/**
 * Get admin password from environment variables
 * Prioritizes AWS_PB_ADMIN_PASSWORD, falls back to PB_ADMIN_PASSWORD
 */
export function getAdminPassword() {
  return process.env.AWS_PB_ADMIN_PASSWORD || process.env.PB_ADMIN_PASSWORD
}

/**
 * Validate that required credentials are set
 */
export function validateCredentials() {
  const email = getAdminEmail()
  const password = getAdminPassword()
  
  if (!email || !password) {
    console.error('❌ Error: Admin credentials are not configured!')
    console.error('   Please set AWS_PB_ADMIN_EMAIL and AWS_PB_ADMIN_PASSWORD in .env file')
    console.error('   Or set PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD as fallback')
    process.exit(1)
  }
  
  return { email, password }
}

/**
 * Initialize PocketBase connection with proper configuration
 */
export function initPocketBase() {
  // Load .env file
  loadEnv()
  
  // Get configuration
  const url = getPocketBaseURL()
  const { email, password } = validateCredentials()
  
  return {
    url,
    email,
    password,
  }
}
