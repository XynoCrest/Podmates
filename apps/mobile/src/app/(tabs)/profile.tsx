import { useMe } from '@/ctx/session'
import { ProfileView } from '@/features/profile/components/ProfileView'

export default function MyProfile() {
  return <ProfileView userId={useMe()} asTab />
}
