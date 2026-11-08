/**
 * Session: email + password via Supabase Auth. Local builds offer one-tap demo
 * accounts on the sign-in screen (seeded in supabase/seed.sql).
 */
import type { Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { queryClient } from '@/lib/queryClient'
import { supabase } from '@/lib/supabase'

type SessionState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'ready'; session: Session; userId: string }

const SessionContext = createContext<SessionState | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: 'loading' })
  const lastUser = useRef<string | null>(null)

  useEffect(() => {
    const apply = (session: Session | null) => {
      const userId = session?.user.id ?? null
      // A different person is now using the app: drop everything cached for the last one.
      if (lastUser.current && lastUser.current !== userId) queryClient.clear()
      lastUser.current = userId
      setState(session && userId ? { status: 'ready', session, userId } : { status: 'signedOut' })
    }

    supabase.auth
      .getSession()
      .then(({ data }) => apply(data.session))
      .catch(() => apply(null))

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => apply(session))
    return () => sub.subscription.unsubscribe()
  }, [])

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>')
  return ctx
}

/** The signed-in user's id. Only call below the session gate. */
export function useMe(): string {
  const s = useSession()
  if (s.status !== 'ready') throw new Error('useMe called while signed out')
  return s.userId
}

export const auth = {
  signIn: (email: string, password: string) => supabase.auth.signInWithPassword({ email, password }),
  signUp: (email: string, password: string, username: string, displayName: string) =>
    supabase.auth.signUp({ email, password, options: { data: { username, display_name: displayName } } }),
  signOut: () => supabase.auth.signOut(),
}
