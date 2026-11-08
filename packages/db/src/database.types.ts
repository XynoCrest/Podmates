
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "cheers": {
                  Row: {
                    "created_at": string,"snap_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"snap_id": string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"snap_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "cheers_snap_id_fkey"
      columns: ["snap_id"]
isOneToOne: false
      referencedRelation: "snaps"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cheers_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"comments": {
                  Row: {
                    "body": string,"created_at": string,"id": string,"post_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"id"?: string,"post_id": string,"user_id"?: string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"id"?: string,"post_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "comments_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comments_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"direct_messages": {
                  Row: {
                    "body": string,"created_at": string,"id": string,"read_at": string | null,"recipient_id": string,"sender_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"id"?: string,"read_at"?: string | null,"recipient_id": string,"sender_id"?: string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"id"?: string,"read_at"?: string | null,"recipient_id"?: string,"sender_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "direct_messages_recipient_id_fkey"
      columns: ["recipient_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "direct_messages_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"follows": {
                  Row: {
                    "created_at": string,"followee_id": string,"follower_id": string,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"followee_id": string,"follower_id"?: string,"status"?: string
                  }
                  Update: {
                    "created_at"?: string,"followee_id"?: string,"follower_id"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "follows_followee_id_fkey"
      columns: ["followee_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "follows_follower_id_fkey"
      columns: ["follower_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"habit_days": {
                  Row: {
                    "created_at": string,"day": string,"pod_id": string,"snap_id": string | null,"status": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"day": string,"pod_id": string,"snap_id"?: string | null,"status": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"day"?: string,"pod_id"?: string,"snap_id"?: string | null,"status"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "habit_days_pod_id_fkey"
      columns: ["pod_id"]
isOneToOne: false
      referencedRelation: "pods"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "habit_days_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"habits": {
                  Row: {
                    "emoji": string,"id": string,"name": string,"sf_symbol": string,"sort": number
                  }
                  ComputedFields: never
                  Insert: {
                    "emoji": string,"id": string,"name": string,"sf_symbol": string,"sort"?: number
                  }
                  Update: {
                    "emoji"?: string,"id"?: string,"name"?: string,"sf_symbol"?: string,"sort"?: number
                  }
                  Relationships: [
                    
                  ]
                },"pods": {
                  Row: {
                    "color": string,"created_at": string,"description": string,"habit_id": string,"id": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "color"?: string,"created_at"?: string,"description"?: string,"habit_id": string,"id"?: string,"name": string
                  }
                  Update: {
                    "color"?: string,"created_at"?: string,"description"?: string,"habit_id"?: string,"id"?: string,"name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "pods_habit_id_fkey"
      columns: ["habit_id"]
isOneToOne: true
      referencedRelation: "habits"
      referencedColumns: ["id"]
    }
                  ]
                },"post_votes": {
                  Row: {
                    "post_id": string,"user_id": string,"value": number
                  }
                  ComputedFields: never
                  Insert: {
                    "post_id": string,"user_id"?: string,"value": number
                  }
                  Update: {
                    "post_id"?: string,"user_id"?: string,"value"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "post_votes_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "post_votes_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"posts": {
                  Row: {
                    "body": string,"comment_count": number,"created_at": string,"id": string,"image_url": string | null,"pod_id": string,"score": number,"title": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string,"comment_count"?: number,"created_at"?: string,"id"?: string,"image_url"?: string | null,"pod_id": string,"score"?: number,"title": string,"user_id"?: string
                  }
                  Update: {
                    "body"?: string,"comment_count"?: number,"created_at"?: string,"id"?: string,"image_url"?: string | null,"pod_id"?: string,"score"?: number,"title"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "posts_pod_id_fkey"
      columns: ["pod_id"]
isOneToOne: false
      referencedRelation: "pods"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "posts_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_color": string,"avatar_url": string | null,"bio": string,"created_at": string,"display_name": string,"id": string,"is_admin": boolean,"is_private": boolean,"timezone": string,"username": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_color"?: string,"avatar_url"?: string | null,"bio"?: string,"created_at"?: string,"display_name": string,"id": string,"is_admin"?: boolean,"is_private"?: boolean,"timezone"?: string,"username": string
                  }
                  Update: {
                    "avatar_color"?: string,"avatar_url"?: string | null,"bio"?: string,"created_at"?: string,"display_name"?: string,"id"?: string,"is_admin"?: boolean,"is_private"?: boolean,"timezone"?: string,"username"?: string
                  }
                  Relationships: [
                    
                  ]
                },"snap_flags": {
                  Row: {
                    "created_at": string,"snap_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"snap_id": string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"snap_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "snap_flags_snap_id_fkey"
      columns: ["snap_id"]
isOneToOne: false
      referencedRelation: "snaps"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "snap_flags_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"snap_views": {
                  Row: {
                    "snap_id": string,"user_id": string,"viewed_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "snap_id": string,"user_id"?: string,"viewed_at"?: string
                  }
                  Update: {
                    "snap_id"?: string,"user_id"?: string,"viewed_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "snap_views_snap_id_fkey"
      columns: ["snap_id"]
isOneToOne: false
      referencedRelation: "snaps"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "snap_views_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"snaps": {
                  Row: {
                    "caption": string,"day": string,"flag_count": number,"habit_id": string,"hidden": boolean,"id": string,"image": string,"on_profile": boolean,"pod_id": string,"review_status": string,"taken_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "caption"?: string,"day"?: string,"flag_count"?: number,"habit_id": string,"hidden"?: boolean,"id"?: string,"image": string,"on_profile"?: boolean,"pod_id": string,"review_status"?: string,"taken_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "caption"?: string,"day"?: string,"flag_count"?: number,"habit_id"?: string,"hidden"?: boolean,"id"?: string,"image"?: string,"on_profile"?: boolean,"pod_id"?: string,"review_status"?: string,"taken_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "snaps_habit_id_fkey"
      columns: ["habit_id"]
isOneToOne: false
      referencedRelation: "habits"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "snaps_pod_id_fkey"
      columns: ["pod_id"]
isOneToOne: false
      referencedRelation: "pods"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "snaps_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"tree_days": {
                  Row: {
                    "active": number,"counted": number,"day": string,"health": number,"pod_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active": number,"counted": number,"day": string,"health": number,"pod_id": string
                  }
                  Update: {
                    "active"?: number,"counted"?: number,"day"?: string,"health"?: number,"pod_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tree_days_pod_id_fkey"
      columns: ["pod_id"]
isOneToOne: false
      referencedRelation: "pods"
      referencedColumns: ["id"]
    }
                  ]
                },"trees": {
                  Row: {
                    "active": number,"counted": number,"health": number,"pod_id": string,"total_snaps": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: number,"counted"?: number,"health"?: number,"pod_id": string,"total_snaps"?: number,"updated_at"?: string
                  }
                  Update: {
                    "active"?: number,"counted"?: number,"health"?: number,"pod_id"?: string,"total_snaps"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "trees_pod_id_fkey"
      columns: ["pod_id"]
isOneToOne: true
      referencedRelation: "pods"
      referencedColumns: ["id"]
    }
                  ]
                },"user_habits": {
                  Row: {
                    "best_streak": number,"current_streak": number,"joined_at": string,"pod_id": string,"reminder_time": string | null,"settled_through": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "best_streak"?: number,"current_streak"?: number,"joined_at"?: string,"pod_id": string,"reminder_time"?: string | null,"settled_through"?: string | null,"user_id": string
                  }
                  Update: {
                    "best_streak"?: number,"current_streak"?: number,"joined_at"?: string,"pod_id"?: string,"reminder_time"?: string | null,"settled_through"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_habits_pod_id_fkey"
      columns: ["pod_id"]
isOneToOne: false
      referencedRelation: "pods"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "user_habits_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "add_habit":
{ Args: { "p_habit_id": string }; Returns: string
                           },
"answer_follow":
{ Args: { "p_accept": boolean,"p_follower": string }; Returns: undefined
                           },
"apply_streaks":
{ Args: { "p_rows": Json }; Returns: number
                           },
"apply_tree_health":
{ Args: { "p_day": string,"p_rows": Json }; Returns: number
                           },
"can_view_profile":
{ Args: { "p_user": string }; Returns: boolean
                           },
"declare_rest":
{ Args: { "p_pod_id": string }; Returns: number
                           },
"is_mutual_follow":
{ Args: { "p_other": string }; Returns: boolean
                           },
"is_pod_member":
{ Args: { "p_pod_id": string }; Returns: boolean
                           },
"mark_dm_read":
{ Args: { "p_other": string }; Returns: number
                           },
"remove_habit":
{ Args: { "p_habit_id": string }; Returns: undefined
                           },
"request_follow":
{ Args: { "p_user": string }; Returns: string
                           },
"review_snap":
{ Args: { "p_approve": boolean,"p_snap_id": string }; Returns: undefined
                           },
"user_today":
{ Args: { "p_user": string }; Returns: string
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
