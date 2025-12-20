#!/usr/bin/env node

/**
 * Fix and configure cravings collection
 * This script ensures the cravings collection is properly configured with correct schema and API rules
 */

import PocketBase from 'pocketbase'
import { initPocketBase } from './utils.js'

const { url: PB_URL, email: ADMIN_EMAIL, password: ADMIN_PASSWORD } = initPocketBase()

const pb = new PocketBase(PB_URL)

// Owner rule helper
function ownerRule(fieldName = 'user') {
  return `@request.auth.id != "" && @request.auth.id = ${fieldName}`
}

async function fixCravingsCollection() {
  console.log('🔧 Fixing cravings collection configuration...\n')
  console.log(`📍 Connecting to: ${PB_URL}\n`)

  try {
    // Authenticate as admin
    console.log('📝 Authenticating as admin...')
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
    console.log('✓ Admin authentication successful\n')

    // Get or create the cravings collection
    let collection
    try {
      collection = await pb.collections.getFirstListItem('name="cravings"')
      console.log('✓ Found cravings collection\n')
    } catch (error) {
      console.log('⚠ Cravings collection not found, creating it...\n')
      // Create the collection with proper schema
      collection = await pb.collections.create({
        name: 'cravings',
        type: 'base',
        schema: [
          {
            name: 'user',
            type: 'relation',
            required: true,
            options: {
              collectionId: '_pb_users_auth_',
              cascadeDelete: true,
              maxSelect: 1,
            },
          },
          {
            name: 'type',
            type: 'select',
            required: true,
            options: {
              values: ['craving', 'slip'],
            },
          },
          {
            name: 'intensity',
            type: 'number',
            required: false,
            options: {
              min: 1,
              max: 5,
            },
          },
          {
            name: 'trigger',
            type: 'select',
            required: false,
            options: {
              values: ['stress', 'boredom', 'social', 'habit', 'other'],
            },
          },
          {
            name: 'trigger_custom',
            type: 'text',
            required: false,
            options: {},
          },
          {
            name: 'notes',
            type: 'text',
            required: false,
            options: {},
          },
        ],
      })
      console.log('✓ Created cravings collection\n')
    }

    // Refresh collection to get latest schema
    collection = await pb.collections.getOne(collection.id)
    
    // Check and update schema using fix-schemas.js approach
    console.log('📋 Checking schema...')
    // PocketBase returns fields in 'schema' property
    const existingFields = collection.schema || []
    const existingFieldNames = existingFields.filter(f => !f.system).map(f => f.name)
    
    console.log(`  Current fields: ${existingFieldNames.join(', ') || 'none'}`)
    
    // Define required fields in fix-schemas format
    const requiredFields = [
      { name: 'user', type: 'relation', required: true, collection: '_pb_users_auth_', maxSelect: 1, cascadeDelete: true },
      { name: 'type', type: 'select', required: true, values: ['craving', 'slip'] },
      { name: 'intensity', type: 'number', min: 1, max: 5 },
      { name: 'trigger', type: 'select', values: ['stress', 'boredom', 'social', 'habit', 'other'] },
      { name: 'trigger_custom', type: 'text' },
      { name: 'notes', type: 'text' },
    ]

    // Helper function to convert field definition to PocketBase format (from fix-schemas.js)
    function toField(f) {
      const base = {
        name: f.name,
        type: f.type,
        required: !!f.required,
        system: false,
        hidden: false,
        presentable: false,
      }
      if (f.type === 'relation') {
        base.collectionId = f.collection
        base.maxSelect = f.maxSelect || 1
        base.cascadeDelete = !!f.cascadeDelete
      }
      if (f.type === 'select') {
        base.values = f.values || []
        base.maxSelect = f.maxSelect || 1
      }
      if (f.type === 'number') {
        base.min = f.min ?? null
        base.max = f.max ?? null
        base.onlyInt = false
      }
      if (f.type === 'text') {
        base.min = f.min || 0
        base.max = f.max || 0
        base.pattern = ''
        base.autogeneratePattern = ''
      }
      return base
    }

    // Build fields with ID field first
    function buildFieldsWithId(existing) {
      const idField = existing?.fields?.find(f => f.primaryKey) || existing?.schema?.find(f => f.primaryKey) || {
        name: 'id',
        type: 'text',
        required: true,
        system: true,
        primaryKey: true,
        hidden: false,
        presentable: false,
        autogeneratePattern: '[a-z0-9]{15}',
        min: 15,
        max: 15,
        pattern: '^[a-z0-9]+$'
      }
      return [idField]
    }

    // Check if fields need updating
    const missingFields = requiredFields.filter(
      reqField => !existingFieldNames.includes(reqField.name)
    )
    
    // Check if existing fields need value updates
    let needsValueUpdate = false
    const fieldValueIssues = []
    existingFields.forEach(field => {
      if (field.name === 'type' && field.type === 'select') {
        const values = field.values || field.options?.values || []
        if (values.length === 0 || !values.includes('craving') || !values.includes('slip')) {
          needsValueUpdate = true
          fieldValueIssues.push('type')
        }
      }
      if (field.name === 'trigger' && field.type === 'select') {
        const values = field.values || field.options?.values || []
        const expectedValues = ['stress', 'boredom', 'social', 'habit', 'other']
        if (values.length === 0 || !expectedValues.every(v => values.includes(v))) {
          needsValueUpdate = true
          fieldValueIssues.push('trigger')
        }
      }
    })
    
    // Always update to ensure values are set correctly (force update if values are empty)
    const hasEmptySelectValues = existingFields.some(f => 
      f.type === 'select' && (f.values?.length === 0 || f.options?.values?.length === 0)
    )
    
    if (missingFields.length > 0 || needsValueUpdate || fieldValueIssues.length > 0 || hasEmptySelectValues) {
      if (fieldValueIssues.length > 0) {
        console.log(`  ⚠ Fields with missing/incorrect values: ${fieldValueIssues.join(', ')}`)
      }
      console.log(`  ⚠ Updating schema (${missingFields.length} missing, ${fieldValueIssues.length} need value fixes)...`)
      
      // Build new fields array
      const newFields = buildFieldsWithId(collection)
      
      // Add all required fields (this will overwrite existing fields with correct values)
      requiredFields.forEach(f => {
        newFields.push(toField(f))
      })
      
      console.log(`  Updating with ${newFields.length} fields...`)
      try {
        await pb.collections.update(collection.id, {
          fields: newFields,
        })
        
        // Wait and refresh to verify
        await new Promise(resolve => setTimeout(resolve, 1000))
        const refreshed = await pb.collections.getOne(collection.id)
        const refreshedFields = refreshed.schema || refreshed.fields || []
        const userFields = refreshedFields.filter(f => !f.system && f.name !== 'id' && f.name !== 'created' && f.name !== 'updated')
        const fieldNames = userFields.map(f => f.name)
        
        // Check values
        const typeField = userFields.find(f => f.name === 'type')
        const triggerField = userFields.find(f => f.name === 'trigger')
        console.log(`  ✓ Schema updated (${userFields.length} user fields: ${fieldNames.join(', ')})`)
        if (typeField) {
          console.log(`    - type values: [${(typeField.values || []).join(', ')}]`)
        }
        if (triggerField) {
          console.log(`    - trigger values: [${(triggerField.values || []).join(', ')}]`)
        }
        console.log('')
      } catch (updateError) {
        console.error(`  ✗ Failed to update schema:`, updateError.message)
        if (updateError.response?.data) {
          console.error(`    Details:`, JSON.stringify(updateError.response.data, null, 2))
        }
        console.log('  ⚠ Continuing with API rules setup...\n')
      }
    } else {
      console.log('  ✓ Schema is correct\n')
    }

    // Set API rules
    console.log('🔐 Setting API rules...')
    const rules = {
      listRule: ownerRule('user'),
      viewRule: ownerRule('user'),
      createRule: ownerRule('user'),
      updateRule: ownerRule('user'),
      deleteRule: ownerRule('user'),
    }

    await pb.collections.update(collection.id, rules)
    console.log('  ✓ API rules set:')
    console.log('    - Users can only list/view/create/update/delete their own cravings\n')

    // Verify collection
    console.log('✅ Verification:')
    const verified = await pb.collections.getOne(collection.id)
    const verifiedFields = verified.schema || verified.fields || []
    const userFields = verifiedFields.filter(f => !f.system && f.name !== 'id' && f.name !== 'created' && f.name !== 'updated')
    
    console.log(`  Collection ID: ${verified.id}`)
    console.log(`  Collection Name: ${verified.name}`)
    console.log(`  User Fields: ${userFields.length}`)
    console.log(`  List Rule: ${verified.listRule || 'Not set'}`)
    console.log(`  View Rule: ${verified.viewRule || 'Not set'}`)
    console.log(`  Create Rule: ${verified.createRule || 'Not set'}`)
    console.log(`  Update Rule: ${verified.updateRule || 'Not set'}`)
    console.log(`  Delete Rule: ${verified.deleteRule || 'Not set'}\n`)
    
    // List all user-defined fields
    if (userFields.length > 0) {
      console.log('  Schema fields:')
      userFields.forEach(field => {
        let options = ''
        if (field.type === 'select') {
          const values = field.values || field.options?.values || []
          options = values.length > 0 ? ` [${values.join(', ')}]` : ' [values not set]'
        } else if (field.type === 'relation') {
          options = ` -> ${field.collectionId || field.options?.collectionId || 'unknown'}`
        } else if (field.type === 'number' && (field.min !== null || field.max !== null)) {
          options = ` [min: ${field.min ?? 'none'}, max: ${field.max ?? 'none'}]`
        }
        console.log(`    - ${field.name} (${field.type})${field.required ? ' [required]' : ''}${options}`)
      })
      console.log('')
    } else {
      console.log('  ⚠ No user-defined fields found in collection!\n')
      console.log('  💡 Try running: npm run pb:setup')
      console.log('     This will recreate the collection with proper schema.\n')
    }

    console.log('✅ Cravings collection configuration complete!')
  } catch (error) {
    console.error('\n✗ Error:', error.message)
    if (error.response) {
      console.error('  Response:', JSON.stringify(error.response, null, 2))
    }
    process.exit(1)
  }
}

// Run fix
fixCravingsCollection().catch(console.error)
