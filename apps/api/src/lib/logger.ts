type Level = 'debug' | 'info' | 'warn' | 'error'
const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 }

export type Logger = Record<Level, (msg: string, fields?: Record<string, unknown>) => void>

/** Tiny structured logger. Swap for pino when we need log shipping. */
export function createLogger(min: Level = 'info', json = false): Logger {
  const log = (level: Level) => (msg: string, fields?: Record<string, unknown>) => {
    if (ORDER[level] < ORDER[min]) return
    const out = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
    if (json) out(JSON.stringify({ level, msg, time: new Date().toISOString(), ...fields }))
    else out(`[${level}] ${msg}${fields ? ' ' + JSON.stringify(fields) : ''}`)
  }
  return { debug: log('debug'), info: log('info'), warn: log('warn'), error: log('error') }
}

export const silentLogger: Logger = { debug() {}, info() {}, warn() {}, error() {} }
