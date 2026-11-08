import type { Person } from '../pods/hooks'

/** One chat bubble (direct messages). */
export interface ChatMessage {
  id: string
  kind: 'text' | 'snap' | 'system'
  body: string
  createdAt: string
  author: Person | null
  snap: { id: string; image: string } | null
}
