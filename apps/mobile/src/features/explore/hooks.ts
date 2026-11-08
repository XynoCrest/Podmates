import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMe } from '@/ctx/session'
import { qk } from '@/lib/keys'
import { supabase } from '@/lib/supabase'
import { PERSON_FIELDS, type Person } from '../pods/hooks'

export type FeedMode = 'home' | 'popular'
export type FeedSort = 'hot' | 'new' | 'top'

export interface Community {
  id: string
  slug: string
  name: string
  description: string
  emoji: string
  color: string
  /** The habit this community is about (null = general). */
  habitId: string | null
  memberCount: number
  joined: boolean
}

export interface Post {
  id: string
  title: string
  body: string
  imageUrl: string | null
  score: number
  commentCount: number
  /** Thumbs-down votes. Thumbs-up = score + downCount (score is the net). */
  downCount: number
  /** People who have shared it (one each). */
  shareCount: number
  createdAt: string
  author: Person
  community: { id: string; slug: string; name: string; emoji: string; color: string }
  myVote: -1 | 0 | 1
}

const POST_FIELDS = `id, title, body, image_url, score, comment_count, down_count, share_count, created_at, author:profiles!posts_user_id_fkey(${PERSON_FIELDS}), community:communities(id, slug, name, emoji, color), post_votes(value, user_id)`

function toPost(p: any, me: string): Post {
  return {
    id: p.id,
    title: p.title,
    body: p.body,
    imageUrl: p.image_url,
    score: p.score,
    commentCount: p.comment_count,
    downCount: p.down_count,
    shareCount: p.share_count,
    createdAt: p.created_at,
    author: p.author,
    community: p.community,
    myVote: (p.post_votes as { value: number; user_id: string }[]).find((v) => v.user_id === me)?.value as Post['myVote'] ?? 0,
  }
}

/** Reddit-style "hot": score decays with age. */
export const hotness = (p: Pick<Post, 'score' | 'createdAt'>, now = Date.now()) =>
  p.score / Math.pow((now - Date.parse(p.createdAt)) / 3_600_000 + 2, 1.5)

function sortPosts(posts: Post[], sort: FeedSort) {
  if (sort === 'new') return posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  if (sort === 'top') return posts.sort((a, b) => b.score - a.score)
  const now = Date.now()
  return posts.sort((a, b) => hotness(b, now) - hotness(a, now))
}

export function useCommunities() {
  const me = useMe()
  return useQuery({
    queryKey: qk.communities,
    queryFn: async (): Promise<Community[]> => {
      const { data, error } = await supabase.from('communities').select('*, community_members(user_id)').order('member_count', { ascending: false })
      if (error) throw error
      return data.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description,
        emoji: c.emoji,
        color: c.color,
        habitId: c.habit_id,
        memberCount: c.member_count,
        // RLS lets everyone read memberships; we only need to know about our own row.
        joined: c.community_members.some((m) => m.user_id === me),
      }))
    },
  })
}

/** Home = communities I joined; Popular = everything. Sorted client-side over the newest 100. */
export function useFeed(mode: FeedMode, sort: FeedSort, communityId?: string) {
  const me = useMe()
  return useQuery({
    queryKey: [...qk.feed(mode, sort), communityId ?? 'all'],
    queryFn: async (): Promise<Post[]> => {
      let q = supabase.from('posts').select(POST_FIELDS).order('created_at', { ascending: false }).limit(100)
      if (communityId) q = q.eq('community_id', communityId)
      else if (mode === 'home') {
        const { data: mine, error } = await supabase.from('community_members').select('community_id').eq('user_id', me)
        if (error) throw error
        if (!mine.length) return []
        q = q.in('community_id', mine.map((m) => m.community_id))
      }
      const { data, error } = await q
      if (error) throw error
      return sortPosts(data.map((p) => toPost(p, me)), sort)
    },
  })
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
      const { data, error } = await supabase
        .from('comments')
        .select(`id, body, created_at, author:profiles(${PERSON_FIELDS})`)
        .eq('post_id', postId)
        .order('created_at')
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
      if (error) throw error
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: qk.comments(postId) })
      void queryClient.invalidateQueries({ queryKey: qk.post(postId) })
      void queryClient.invalidateQueries({ queryKey: ['feed'] })
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
      const { error } = next === 0
        ? await supabase.from('post_votes').delete().eq('post_id', post.id).eq('user_id', me)
        : await supabase.from('post_votes').upsert({ post_id: post.id, value: next }, { onConflict: 'post_id,user_id' })
      if (error) throw error
    },
    onMutate: ({ post, value }) => {
      const next = post.myVote === value ? 0 : value
      const patch = (p: Post) =>
        p.id === post.id
          ? { ...p, myVote: next as Post['myVote'], score: p.score - p.myVote + next, downCount: p.downCount - (p.myVote === -1 ? 1 : 0) + (next === -1 ? 1 : 0) }
          : p
      queryClient.setQueriesData<Post[]>({ queryKey: ['feed'] }, (old) => old?.map(patch))
      queryClient.setQueryData<Post>(qk.post(post.id), (old) => (old ? patch(old) : old))
    },
    onSettled: (_d, _e, { post }) => {
      void queryClient.invalidateQueries({ queryKey: qk.post(post.id) })
    },
  })
}

/** Records that I shared a post (counted once per person) and puts the new count in the cache. */
export function useSharePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (postId: string) => {
      const { data, error } = await supabase.rpc('share_post', { p_post: postId })
      if (error) throw error
      return data
    },
    onSuccess: (count, postId) => {
      const patch = (p: Post) => (p.id === postId ? { ...p, shareCount: count } : p)
      queryClient.setQueriesData<Post[]>({ queryKey: ['feed'] }, (old) => old?.map(patch))
      queryClient.setQueryData<Post>(qk.post(postId), (old) => (old ? patch(old) : old))
    },
  })
}

export function useToggleJoin() {
  const me = useMe()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (c: Community) => {
      const { error } = c.joined
        ? await supabase.from('community_members').delete().eq('community_id', c.id).eq('user_id', me)
        : await supabase.from('community_members').insert({ community_id: c.id })
      if (error) throw error
    },
    onMutate: (c) => {
      queryClient.setQueryData<Community[]>(qk.communities, (old) =>
        old?.map((x) => (x.id === c.id ? { ...x, joined: !c.joined, memberCount: x.memberCount + (c.joined ? -1 : 1) } : x)),
      )
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: qk.communities })
      void queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

export function useCreatePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { communityId: string; title: string; body: string }) => {
      const { data, error } = await supabase
        .from('posts')
        .insert({ community_id: input.communityId, title: input.title.trim(), body: input.body.trim() })
        .select('id')
        .single()
      if (error) throw new Error(error.code === '42501' ? 'Join the community to post' : error.message)
      return data.id
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  })
}
