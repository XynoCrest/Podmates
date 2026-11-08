# Invariants: things that look odd but must not be "cleaned up"

1. **`snaps.pod_date` has `default current_date`.** That default is a placeholder so generated types
   don't make clients send it. The trigger always overwrites it with the pod-local date.
2. **`snaps.habit_id` is denormalized from the pod.** Profile grids show other people's snaps from pods
   you can't read, so the habit must live on the snap.
3. **The seed disables `snaps_before_insert`** to backdate history, then re-enables it. Trees start
   fresh and the API *replays* the seeded days through the tree engine. Don't seed tree numbers.
4. **`apply_day_settlement` guards on `last_settled_date = p_expected_last`.** This is what makes
   settlement safe to run from several processes. Don't drop the guard.
5. **`revoke update … grant update (cols)`** on `profiles` and `snaps` is how users edit only
   presentation fields. A broad `grant update` would let anyone set their own energy.
6. **FK hints on `profiles` embeds** (`profiles!snaps_user_id_fkey`, `profiles!posts_user_id_fkey`)
   are required. Without them PostgREST errors on the ambiguous relationship.
7. **Formsheet screens use a `ScrollView` as their root.** A ScrollView nested inside a View
   renders blank in react-native-screens' formSheet.
8. **Snap windows never cross midnight** (check constraint `window_within_day`). The on-time rule and
   pod-day maths rely on it.
