/**
 * ponytail: preflight before Xcode Archive → TestFlight.
 * Usage: npm run testflight:prep
 */
import assert from 'assert'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { spawnSync } from 'child_process'

const root = process.cwd()
const iosApp = join(root, 'ios/App/App')
const teamId = 'J9L2PD2Z4G'
const bundleId = 'app.smono.quit'

function must(path, label = path) {
  assert.ok(existsSync(path), `missing ${label}`)
}

must(join(iosApp, 'Info.plist'))
must(join(iosApp, 'App.entitlements'))
must(join(iosApp, 'PrivacyInfo.xcprivacy'))
must(join(iosApp, 'Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png'))
must(join(root, 'ios/ExportOptions.plist'))
must(join(root, 'ios/App/App.xcworkspace'))
must(join(root, 'public/.well-known/apple-app-site-association'))

const info = readFileSync(join(iosApp, 'Info.plist'), 'utf8')
assert.ok(info.includes('ITSAppUsesNonExemptEncryption'), 'export compliance key missing')
assert.ok(info.includes('NSPhotoLibraryUsageDescription'), 'photo privacy string missing')
assert.ok(info.includes('NSCameraUsageDescription'), 'camera privacy string missing')
assert.ok(info.includes('<string>smono</string>'), 'URL scheme smono missing')

const aasa = JSON.parse(readFileSync(join(root, 'public/.well-known/apple-app-site-association'), 'utf8'))
assert.equal(aasa.applinks.details[0].appID, `${teamId}.${bundleId}`)
assert.ok(!JSON.stringify(aasa).includes('TEAMID'), 'AASA still has TEAMID placeholder')

const pbx = readFileSync(join(root, 'ios/App/App.xcodeproj/project.pbxproj'), 'utf8')
assert.ok(pbx.includes(`PRODUCT_BUNDLE_IDENTIFIER = ${bundleId}`))
assert.ok(pbx.includes(`DEVELOPMENT_TEAM = ${teamId}`))
assert.ok(pbx.includes('MARKETING_VERSION = 1.0.0'))
assert.ok(!pbx.includes('CODE_SIGN_ALLOW_ENTITLEMENTS_MODIFICATION'), 'remove ALLOW_ENTITLEMENTS_MODIFICATION for App Store')

const ent = readFileSync(join(iosApp, 'App.entitlements'), 'utf8')
assert.ok(!/<key>aps-environment<\/key>/.test(ent), 'push entitlement key must stay off until App ID capability is ready')
assert.ok(!/<key>com\.apple\.developer\.associated-domains<\/key>/.test(ent), 'associated domains entitlement must stay off until portal ready')

console.log('testflight preflight OK')
console.log('Building web + syncing iOS…')

const build = spawnSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit', shell: true })
assert.equal(build.status, 0, 'npm run build failed')

const sync = spawnSync('npx', ['cap', 'sync', 'ios'], { cwd: root, stdio: 'inherit', shell: true })
assert.equal(sync.status, 0, 'cap sync ios failed')

console.log(`
Next (in Xcode):
1. Open ios/App/App.xcworkspace
2. Target App → Signing & Capabilities → Team ${teamId}, Automatically manage signing
3. Do NOT add Push / Associated Domains yet (entitlements intentionally empty)
4. Product → Scheme → Any iOS Device (or Archive)
5. Product → Archive → Distribute App → App Store Connect → Upload
   (or: xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Release archive)

App Store Connect:
- Accept Paid Apps / Free Apps agreements if prompted
- Create app record bundle id ${bundleId} if missing
- After processing, add Testers under TestFlight

Bump CURRENT_PROJECT_VERSION in Xcode before each new upload.
`)
