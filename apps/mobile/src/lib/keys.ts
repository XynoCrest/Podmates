/** Every TanStack Query key in one place, so invalidation can't drift from the queries. */
export const qk = {
  habits: ['habits'] as const,
  pods: ['pods'] as const,
  members: (podId: string) => ['members', podId] as const,
  messages: (podId: string) => ['messages', podId] as const,
  stories: (habitId: string) => ['stories', habitId] as const,
  tree: (podId: string) => ['tree', podId] as const,
  profile: (userId: string) => ['profile', userId] as const,
  profileHabits: (userId: string) => ['profileHabits', userId] as const,
  profileSnaps: (userId: string, habitId: string) => ['profileSnaps', userId, habitId] as const,
  mySnaps: (habitId: string) => ['mySnaps', habitId] as const,
  feed: (mode: string, sort: string) => ['feed', mode, sort] as const,
  communities: ['communities'] as const,
  community: (slug: string) => ['community', slug] as const,
  post: (id: string) => ['post', id] as const,
  comments: (postId: string) => ['comments', postId] as const,
}
