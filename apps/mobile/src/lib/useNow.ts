import { useEffect, useState } from 'react'

/** Current time, re-rendering every `everyMs` — for snap-window countdowns. */
export function useNow(everyMs = 30_000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), everyMs)
    return () => clearInterval(id)
  }, [everyMs])
  return now
}
