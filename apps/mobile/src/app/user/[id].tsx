import { useLocalSearchParams } from 'expo-router'
import { ProfileView } from '@/features/profile/components/ProfileView'

export default function UserProfile() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <ProfileView userId={id} />
}
