import { describe, expect, it } from 'vitest'
import { friendlyAuthError, validateAuth } from './authValidation'

const ok = { email: 'maya@podmates.dev', password: 'podmates123', username: 'maya.reads', name: 'Maya' }

describe('validateAuth', () => {
  it('accepts good sign-in and sign-up details', () => {
    expect(validateAuth('signIn', ok)).toEqual({})
    expect(validateAuth('signUp', ok)).toEqual({})
    expect(validateAuth('signUp', { ...ok, email: '  Maya@Podmates.DEV ', username: ' Maya_Reads ', name: '' })).toEqual({})
  })

  it('checks the email', () => {
    expect(validateAuth('signIn', { ...ok, email: '' }).email).toBe('Enter your email.')
    for (const email of ['maya', 'maya@', 'maya@podmates', 'ma ya@podmates.dev', '@podmates.dev']) {
      expect(validateAuth('signIn', { ...ok, email }).email).toBeDefined()
    }
  })

  it('only needs a password to sign in, but a long enough one to sign up', () => {
    expect(validateAuth('signIn', { ...ok, password: '' }).password).toBe('Enter your password.')
    expect(validateAuth('signIn', { ...ok, password: 'abc' }).password).toBeUndefined()
    expect(validateAuth('signUp', { ...ok, password: 'abc' }).password).toBe('Use at least 6 characters.')
    expect(validateAuth('signUp', { ...ok, password: 'x'.repeat(73) }).password).toBe('Use at most 72 characters.')
  })

  it('checks the username like the database does', () => {
    expect(validateAuth('signUp', { ...ok, username: '' }).username).toBe('Choose a username.')
    expect(validateAuth('signUp', { ...ok, username: 'ab' }).username).toBe('Use 3 to 24 characters.')
    expect(validateAuth('signUp', { ...ok, username: 'x'.repeat(25) }).username).toBe('Use 3 to 24 characters.')
    expect(validateAuth('signUp', { ...ok, username: 'maya reads' }).username).toBe('Use only letters, numbers, dots and underscores.')
    expect(validateAuth('signUp', { ...ok, username: 'maya-reads' }).username).toBeDefined()
    expect(validateAuth('signIn', { ...ok, username: '' }).username).toBeUndefined()
  })

  it('caps the name at 40 characters', () => {
    expect(validateAuth('signUp', { ...ok, name: 'x'.repeat(41) }).name).toBe('Use at most 40 characters.')
  })
})

describe('friendlyAuthError', () => {
  it('rewords Supabase messages', () => {
    expect(friendlyAuthError('Invalid login credentials')).toBe('Email or password is incorrect.')
    expect(friendlyAuthError('User already registered')).toContain('already exists')
    expect(friendlyAuthError('Something odd')).toBe('Something odd')
  })
})
