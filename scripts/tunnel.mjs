#!/usr/bin/env node
/**
 * Shares the LOCAL stack over the internet so anyone with Expo Go can open the app:
 * Cloudflare quick tunnels to the API (:4100), Supabase (:55321) AND Metro (:8081),
 * then starts Expo with EXPO_PACKAGER_PROXY_URL set to the Metro tunnel, so the link and
 * QR code it prints (exps://<name>.trycloudflare.com) work from any network. No ngrok.
 *
 * Needs: cloudflared (`brew install cloudflared`), `npm run db:start`, `npm run dev:api`,
 *        `npm run env:local`. Stop any running `expo start` first.
 * Run:   npm run tunnel
 *
 * The API/Supabase tunnel URLs are written to apps/mobile/.env.development.local, which Expo
 * merges over .env.local in development. That file is deleted on exit; .env.local is never
 * touched. Ctrl+C stops everything.
 *
 * WARNING: this exposes your local Supabase to the public internet, and the local stack uses
 * Supabase's well-known default JWT secret and keys. Anyone who learns the URL can read and write
 * the database. Keep only test data in it and stop the tunnels when you are done.
 */
import { execSync, spawn } from 'node:child_process'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { Resolver } from 'node:dns/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const API_PORT = 4100
const SUPABASE_PORT = 55321
const METRO_PORT = 8081
const OVERRIDE_ENV = join(root, 'apps/mobile/.env.development.local')
const OVERRIDE_MARKER = '# Written by scripts/tunnel.mjs'

const children = []
let wroteOverride = false
function shutdown(code = 0) {
  for (const child of children) if (child.exitCode === null) child.kill('SIGTERM')
  process.exit(code)
}
process.on('exit', () => {
  if (wroteOverride) rmSync(OVERRIDE_ENV, { force: true })
})
process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

const fail = (msg) => {
  console.error(`✘ ${msg}`)
  shutdown(1)
}

try {
  execSync('cloudflared --version', { stdio: 'ignore' })
} catch {
  fail('cloudflared is not installed. Install it with: brew install cloudflared')
}

async function reachable(url) {
  try {
    await fetch(url, { signal: AbortSignal.timeout(3000) })
    return true
  } catch {
    return false
  }
}
if (!(await reachable(`http://127.0.0.1:${API_PORT}/health`))) fail(`API is not running on :${API_PORT}. Start it with: npm run dev:api`)
if (!(await reachable(`http://127.0.0.1:${SUPABASE_PORT}`))) fail(`Supabase is not running on :${SUPABASE_PORT}. Start it with: npm run db:start`)
// Another Metro on :8081 would serve a bundle with 127.0.0.1 URLs. Make that impossible to miss.
if (await reachable(`http://127.0.0.1:${METRO_PORT}/status`)) {
  fail(`Another Expo/Metro server is already running on :${METRO_PORT}. Stop it first (lsof -ti :${METRO_PORT} | xargs kill)`)
}
// A leftover from a killed run is ours to overwrite; anything else is the developer's.
if (existsSync(OVERRIDE_ENV) && !readFileSync(OVERRIDE_ENV, 'utf8').startsWith(OVERRIDE_MARKER)) {
  fail(`${OVERRIDE_ENV} exists and was not written by this script. Move it aside first.`)
}

/** Starts a quick tunnel and resolves with its public https URL. */
function openTunnel(name, port) {
  return new Promise((resolve, reject) => {
    // 127.0.0.1, not localhost: cloudflared tries IPv6 ::1 first, and the API only listens on IPv4.
    const child = spawn('cloudflared', ['tunnel', '--no-autoupdate', '--url', `http://127.0.0.1:${port}`], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    children.push(child)
    const timer = setTimeout(() => reject(new Error(`${name} tunnel did not report a URL within 30s`)), 30_000)
    const onData = (chunk) => {
      const match = chunk.toString().match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)
      if (match) {
        clearTimeout(timer)
        resolve(match[0])
      }
    }
    child.stdout.on('data', onData)
    child.stderr.on('data', onData) // cloudflared logs to stderr
    child.on('exit', (code) => {
      clearTimeout(timer)
      reject(new Error(`${name} tunnel exited with code ${code}`))
    })
  })
}

/**
 * New trycloudflare hostnames take a few seconds to resolve and route. DNS is polled via
 * 1.1.1.1 first: querying the system resolver too early caches NXDOMAIN on this machine.
 */
async function waitForDns(url, deadline) {
  const resolver = new Resolver()
  resolver.setServers(['1.1.1.1'])
  const { hostname } = new URL(url)
  while (Date.now() < deadline) {
    try {
      await resolver.resolve4(hostname)
      return
    } catch {
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
}

async function waitUntilLive(name, url, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs
  await waitForDns(url, deadline)
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
      if (res.status < 500) return // Cloudflare answers 502/530 until the origin is connected
    } catch {
      // DNS not propagated yet
    }
    await new Promise((r) => setTimeout(r, 2000))
  }
  throw new Error(`${name} tunnel at ${url} is not reachable after ${timeoutMs / 1000}s`)
}

console.log('Opening Cloudflare tunnels…')
let apiUrl, supabaseUrl, metroUrl
try {
  ;[apiUrl, supabaseUrl, metroUrl] = await Promise.all([
    openTunnel('API', API_PORT),
    openTunnel('Supabase', SUPABASE_PORT),
    openTunnel('Metro', METRO_PORT),
  ])
  // Metro isn't up yet, so only its DNS can be checked now.
  await Promise.all([
    waitUntilLive('API', `${apiUrl}/health`),
    waitUntilLive('Supabase', supabaseUrl),
    waitForDns(metroUrl, Date.now() + 60_000),
  ])
} catch (err) {
  fail(err.message)
}
console.log(`  ✔ API       ${apiUrl}`)
console.log(`  ✔ Supabase  ${supabaseUrl}`)
console.log(`  ✔ Metro     ${metroUrl}`)

writeFileSync(
  OVERRIDE_ENV,
  `${OVERRIDE_MARKER}. Deleted when it exits. Overrides .env.local in development.\n` +
    `EXPO_PUBLIC_API_URL=${apiUrl}\nEXPO_PUBLIC_SUPABASE_URL=${supabaseUrl}\n`,
)
wroteOverride = true

const expoGoLink = `${metroUrl.replace(/^https/, 'exps')}`
console.log('\nStarting Expo behind the Metro tunnel…\n')

// -c clears Metro's cache so no bundle built with the old URLs is reused.
// EXPO_PACKAGER_PROXY_URL makes Expo advertise the tunnel in its link, QR code and manifest.
const expo = spawn('npx', ['expo', 'start', '-c', '--port', String(METRO_PORT)], {
  cwd: join(root, 'apps/mobile'),
  stdio: 'inherit',
  env: { ...process.env, EXPO_PACKAGER_PROXY_URL: metroUrl },
})
children.push(expo)
expo.on('exit', (code) => shutdown(code ?? 0))

// Once Metro answers through the tunnel, print the link to share.
try {
  await waitUntilLive('Metro', `${metroUrl}/status`, 120_000)
  console.log(
    `\n──────────────────────────────────────────────────────────────\n` +
      `  Share this Expo Go link (works from any network):\n\n` +
      `    ${expoGoLink}\n\n` +
      `  On a phone with Expo Go: open the link, or scan the QR code above.\n` +
      `  The first load bundles the app through the tunnel and takes a while.\n` +
      `──────────────────────────────────────────────────────────────\n`,
  )
} catch (err) {
  console.error(`✘ ${err.message}`)
}
