/**
 * Posts and the pod feeds. Posts live inside habit pods; a pod's page mixes its
 * snaps and posts in one Reddit-like feed. Explore shows trending posts from all pods.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMe } from '@/ctx/session'
import { qk } from '@/lib/keys'
import { useRealtimeInvalidate } from '@/lib/realtime'
import { supabase } from '@/lib/supabase'
import { PERSON_FIELDS, type Person } from '../pods/hooks'
import { SNAP_FIELDS, toSnap, type Snap } from '../snaps/hooks'

export type FeedSort = 'hot' | 'new' | 'top'

export interface Post {
  id: string
  title: string
  body: string
  imageUrl: string | null
  score: number
  commentCount: number
  createdAt: string
  author: Person
  pod: { id: string; habitId: string; name: string; color: string }
  myVote: -1 | 0 | 1
}

export type FeedItem = { kind: 'post'; post: Post; at: string } | { kind: 'snap'; snap: Snap; at: string }

const POST_FIELDS = `id, title, body, image_url, score, comment_count, created_at, author:profiles!posts_user_id_fkey(${PERSON_FIELDS}), pod:pods(id, habit_id, name, color), post_votes(value, user_id)`

function toPost(p: any, me: string): Post {
  return {
    id: p.id,
    title: p.title,
    body: p.body,
    imageUrl: p.image_url,
    score: p.score,
    commentCount: p.comment_count,
    createdAt: p.created_at,
    author: p.author,
    pod: { id: p.pod.id, habitId: p.pod.habit_id, name: p.pod.name, color: p.pod.color },
    myVote: ((p.post_votes as { value: number; user_id: string }[]).find((v) => v.user_id === me)?.value ?? 0) as Post['myVote'],
  }
}

/** Reddit-style "hot": score decays with age. */
export const hotness = (score: number, createdAt: string, now = Date.now()) => score / Math.pow((now - Date.parse(createdAt)) / 3_600_000 + 2, 1.5)

function sortPosts(posts: Post[], sort: FeedSort) {
  if (sort === 'new') return posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  if (sort === 'top') return posts.sort((a, b) => b.score - a.score)
  const now = Date.now()
  return posts.sort((a, b) => hotness(b.score, b.createdAt, now) - hotness(a.score, a.createdAt, now))
}

/** Explore: posts from every pod. Sorted client-side over the newest 100. */
export function useFeed(sort: FeedSort) {
  const me = useMe()
  return useQuery({
    queryKey: qk.feed(sort),
    queryFn: async (): Promise<Post[]> => {
      const { data, error } = await supabase.from('posts').select(POST_FIELDS).order('created_at', { ascending: false }).limit(100)
      if (error) throw error
      return sortPosts(data.map((p) => toPost(p, me)), sort)
    },
  })
}

/**
 * A pod's page: its posts and snaps in one feed. "New" interleaves by time; "Hot" and "Top"
 * rank posts by votes and snaps by cheers, so both kinds can rise.
 */
export function usePodFeed(podId: string, sort: FeedSort) {
  const me = useMe()
  const query = useQuery({
    queryKey: qk.podFeed(podId, sort),
    queryFn: async (): Promise<FeedItem[]> => {
      const [posts, snaps] = await Promise.all([
        supabase.from('posts').select(POST_FIELDS).eq('pod_id', podId).order('created_at', { ascending: false }).limit(60),
        supabase.from('snaps').select(SNAP_FIELDS).eq('pod_id', podId).order('taken_at', { ascending: false }).limit(60),
      ])
      if (posts.error) throw posts.error
      if (snaps.error) throw snaps.error
      const items: (FeedItem & { score: number })[] = [
        ...posts.data.map((p) => {
          const post = toPost(p, me)
          return { kind: 'post' as const, post, at: post.createdAt, score: post.score }
        }),
        ...snaps.data.map((s) => {
          const snap = toSnap(s, me)
          return { kind: 'snap' as const, snap, at: snap.takenAt, score: snap.cheers }
        }),
      ]
      const now = Date.now()
      if (sort === 'new') items.sort((a, b) => b.at.localeCompare(a.at))
      else if (sort === 'top') items.sort((a, b) => b.score - a.score)
      else items.sort((a, b) => hotness(b.score + 1, b.at, now) - hotness(a.score + 1, a.at, now))
      return items
    },
  })
  useRealtimeInvalidate('snaps', `pod_id=eq.${podId}`, [['podFeed', podId]])
  return query
}

export function usePost(postId: string) {
  const me = useMe()
  return useQuery({
    queryKey: qk.post(postId),
    queryFn: async () => {
      const { data, error } = await supabase.from('posts').select(POST_FIELDS).eq('id', postId).single()
      if (error) throw error
      return toPost(data, me)
    },
  })
}

export interface Comment {
  id: string
  body: string
  createdAt: string
  author: Person
}

export function useComments(postId: string) {
  return useQuery({
    queryKey: qk.comments(postId),
    queryFn: async (): Promise<Comment[]> => {
      const { data, error } = await supabase.from('comments').select(`id, body, created_at, author:profiles(${PERSON_FIELDS})`).eq('post_id', postId).order('created_at')
      if (error) throw error
      return data.map((c) => ({ id: c.id, body: c.body, createdAt: c.created_at, author: c.author as Person }))
    },
  })
}

export function useAddComment(postId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase.from('comments').insert({ post_id: postId, body })
      if (error) throw new Error(error.code === '42501' ? 'Add this habit to comment in its pod' : error.message)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: qk.comments(postId) })
      void queryClient.invalidateQueries({ queryKey: qk.post(postId) })
      void queryClient.invalidateQueries({ queryKey: ['feed'] })
      void queryClient.invalidateQueries({ queryKey: ['podFeed'] })
    },
  })
}

/** Optimistic vote: tapping the active arrow again clears it. */
export function useVote() {
  const me = useMe()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ post, value }: { post: Post; value: -1 | 1 }) => {
      const next = post.myVote === value ? 0 : value
      const { error } =
        next === 0
          ? await supabase.from('post_votes').delete().eq('post_id', post.id).eq('user_id', me)
          : await supabase.from('post_votes').upsert({ post_id: post.id, value: next }, { onConflict: 'post_id,user_id' })
      if (error) throw error
    },
    onMutate: ({ post, value }) => {
      const next = post.myVote === value ? 0 : value
      const patch = (p: Post) => (p.id === post.id ? { ...p, myVote: next as Post['myVote'], score: p.score - p.myVote + next } : p)
      queryClient.setQueriesData<Post[]>({ queryKey: ['feed'] }, (old) => old?.map(patch))
      queryClient.setQueriesData<FeedItem[]>({ queryKey: ['podFeed', post.pod.id] }, (old) => old?.map((i) => (i.kind === 'post' ? { ...i, post: patch(i.post) } : i)))
      queryClient.setQueryData<Post>(qk.post(post.id), (old) => (old ? patch(old) : old))
    },
    onSettled: (_d, _e, { post }) => {
      void queryClient.invalidateQueries({ queryKey: qk.post(post.id) })
    },
  })
}

export function useCreatePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { podId: string; title: string; body: string }) => {
      const { data, error } = await supabase.from('posts').insert({ pod_id: input.podId, title: input.title.trim(), body: input.body.trim() }).select('id').single()
      if (error) throw new Error(error.code === '42501' ? 'Add this habit to post in its pod' : error.message)
      return data.id
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['feed'] })
      void queryClient.invalidateQueries({ queryKey: ['podFeed'] })
    },
  })
}
