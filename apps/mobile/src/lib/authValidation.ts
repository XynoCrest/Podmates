/**
 * Sign-in and sign-up checks, run before anything is sent. The limits match the server:
 * username = profiles.username check (^[a-z0-9_.]{3,24}$), name = display_name (1–40),
 * password = Supabase Auth's minimum_password_length (6) and bcrypt's 72-byte cap.
 */
export type AuthMode = 'signIn' | 'signUp'
export interface AuthFields {
  email: string
  password: string
  username: string
  name: string
}
export type AuthErrors = Partial<Record<keyof AuthFields, string>>

export const PASSWORD_MIN = 6
export const PASSWORD_MAX = 72
export const USERNAME_MIN = 3
export const USERNAME_MAX = 24
export const NAME_MAX = 40

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const USERNAME = /^[a-z0-9_.]+$/

/** What the username will be: lowercase, no spaces around it. */
export const normalizeUsername = (u: string) => u.trim().toLowerCase()
export const normalizeEmail = (e: string) => e.trim().toLowerCase()

export function validateAuth(mode: AuthMode, f: AuthFields): AuthErrors {
  const errors: AuthErrors = {}
  const email = normalizeEmail(f.email)
  if (!email) errors.email = 'Enter your email.'
  else if (email.length > 254 || !EMAIL.test(email)) errors.email = 'That doesn’t look like an email address.'

  if (!f.password) errors.password = mode === 'signIn' ? 'Enter your password.' : 'Choose a password.'
  else if (mode === 'signUp') {
    if (f.password.length < PASSWORD_MIN) errors.password = `Use at least ${PASSWORD_MIN} characters.`
    else if (new TextEncoder().encode(f.password).length > PASSWORD_MAX) errors.password = `Use at most ${PASSWORD_MAX} characters.`
  }

  if (mode === 'signUp') {
    const username = normalizeUsername(f.username)
    if (!username) errors.username = 'Choose a username.'
    else if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) errors.username = `Use ${USERNAME_MIN} to ${USERNAME_MAX} characters.`
    else if (!USERNAME.test(username)) errors.username = 'Use only letters, numbers, dots and underscores.'

    if (f.name.trim().length > NAME_MAX) errors.name = `Use at most ${NAME_MAX} characters.`
  }
  return errors
}

/** Supabase's sign-in/sign-up messages, said plainly. */
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Email or password is incorrect.'
  if (m.includes('already registered') || m.includes('already been registered')) return 'An account with this email already exists. Sign in instead.'
  if (m.includes('email not confirmed')) return 'Confirm your email first: check your inbox for the link.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many tries. Wait a minute and try again.'
  if (m.includes('network') || m.includes('fetch')) return 'Can’t reach the server. Check your connection.'
  return message
}
