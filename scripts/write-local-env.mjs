#!/usr/bin/env node
/**
 * Writes apps/api/.env.local and apps/mobile/.env.local from the running LOCAL
 * Supabase stack (`supabase status`). Local keys only — never production.
 *
 *   npm run env:local                 # iOS simulator / web (uses 127.0.0.1)
 *   npm run env:local -- --lan        # physical phone on the same Wi-Fi (uses this machine's LAN IP)
 *   npm run env:local -- --host 10.0.2.2   # Android emulator
 *
 * Existing values for keys this script does not manage are preserved.
 */
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { networkInterfaces } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)

// Virtual adapters (WSL, Hyper-V, Docker, VMs, VPNs) are not reachable from a phone on the Wi-Fi.
const VIRTUAL_ADAPTER = /vEthernet|WSL|Hyper-V|VirtualBox|VMware|docker|bridge|utun|Loopback/i

function lanIp() {
  const candidates = Object.entries(networkInterfaces())
    .filter(([name]) => !VIRTUAL_ADAPTER.test(name))
    .flatMap(([, addrs]) => addrs ?? [])
  for (const a of candidates) if (a.family === 'IPv4' && !a.internal) return a.address
  throw new Error('No LAN IPv4 address found')
}

const hostArg = args.indexOf('--host')
const host = hostArg >= 0 ? args[hostArg + 1] : args.includes('--lan') ? lanIp() : '127.0.0.1'

let status
try {
  status = JSON.parse(execSync('npx supabase status -o json', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString())
} catch {
  console.error('Could not read `supabase status`. Is the local stack running? Start it with: npm run db:start')
  process.exit(1)
}

const apiUrl = new URL(status.API_URL)
const supabaseForApi = status.API_URL // the API runs on this machine, so 127.0.0.1 is right for it
apiUrl.hostname = host
const supabaseForMobile = apiUrl.toString().replace(/\/$/, '')

function upsertEnv(file, exampleFile, values) {
  const base = existsSync(file) ? readFileSync(file, 'utf8') : existsSync(exampleFile) ? readFileSync(exampleFile, 'utf8') : ''
  let out = base
  for (const [key, value] of Object.entries(values)) {
    const line = `${key}=${value}`
    const re = new RegExp(`^${key}=.*$`, 'm')
    out = re.test(out) ? out.replace(re, line) : `${out.replace(/\n?$/, '\n')}${line}\n`
  }
  writeFileSync(file, out)
  console.log(`✔ wrote ${relative(root, file)}`)
}

upsertEnv(join(root, 'apps/api/.env.local'), join(root, 'apps/api/.env.example'), {
  APP_ENV: 'local',
  SUPABASE_URL: supabaseForApi,
  SUPABASE_SECRET_KEY: status.SECRET_KEY ?? status.SERVICE_ROLE_KEY,
})

upsertEnv(join(root, 'apps/mobile/.env.local'), join(root, 'apps/mobile/.env.example'), {
  EXPO_PUBLIC_APP_ENV: 'local',
  EXPO_PUBLIC_SUPABASE_URL: supabaseForMobile,
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY ?? status.ANON_KEY,
  EXPO_PUBLIC_API_URL: `http://${host}:4100`,
})

console.log(`\nMobile will reach Supabase at ${supabaseForMobile} and the API at http://${host}:4100`)
if (host === '127.0.0.1') console.log('(For a physical phone, re-run with: npm run env:local -- --lan)')
