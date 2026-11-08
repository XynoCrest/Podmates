import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { colors } from '@podmates/ui-tokens'
import { Image } from 'expo-image'
import { FlatList, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, EmptyState, Header, Text } from '@/components/ui'
import { api } from '@/lib/api'
import { haptics } from '@/lib/haptics'
import { imageUri } from '@/lib/images'
import { qk } from '@/lib/keys'

/**
 * Podmates team: snaps hidden after 5 flags. Approve puts a snap back; reject removes
 * that day's credit and the owner's streak is recalculated by the server.
 */
export default function FlaggedSnaps() {
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const flagged = useQuery({ queryKey: qk.flagged, queryFn: () => api.flagged() })
  const review = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) => api.review(id, approve),
    onSuccess: () => haptics.success(),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: qk.flagged })
      void queryClient.invalidateQueries({ queryKey: ['podFeed'] })
    },
  })

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header title="Flagged snaps" subtitle="Podmates team review" />
      <FlatList
        data={flagged.data?.snaps ?? []}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 24 }}
        renderItem={({ item }) => (
          <View style={{ borderRadius: 16, backgroundColor: colors.surface, overflow: 'hidden' }}>
            <Image source={{ uri: imageUri(item.image) }} style={{ width: '100%', aspectRatio: 3 / 4, backgroundColor: colors.raised }} contentFit="cover" />
            <View style={{ padding: 12, gap: 10 }}>
              <Text variant="subhead">
                {item.habitId} · {item.day} · {item.flagCount} flags{item.caption ? ` · “${item.caption}”` : ''}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button label="Approve" variant="secondary" flex loading={review.isPending && review.variables?.id === item.id && review.variables.approve} onPress={() => review.mutate({ id: item.id, approve: true })} />
                <Button label="Reject" variant="danger" flex loading={review.isPending && review.variables?.id === item.id && !review.variables.approve} onPress={() => review.mutate({ id: item.id, approve: false })} />
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          flagged.error ? (
            <Text variant="subhead" center style={{ padding: 32, color: colors.danger.DEFAULT }}>
              {flagged.error.message}
            </Text>
          ) : flagged.isLoading ? undefined : (
            <EmptyState icon="checkCircle" title="Nothing to review" body="Snaps hidden by 5 flags show up here." />
          )
        }
      />
    </View>
  )
}
