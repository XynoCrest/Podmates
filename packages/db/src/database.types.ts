
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
            "comments": {
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
                },"communities": {
                  Row: {
                    "color": string,"created_at": string,"description": string,"emoji": string,"habit_id": string | null,"id": string,"member_count": number,"name": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "color"?: string,"created_at"?: string,"description"?: string,"emoji": string,"habit_id"?: string | null,"id"?: string,"member_count"?: number,"name": string,"slug": string
                  }
                  Update: {
                    "color"?: string,"created_at"?: string,"description"?: string,"emoji"?: string,"habit_id"?: string | null,"id"?: string,"member_count"?: number,"name"?: string,"slug"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "communities_habit_id_fkey"
      columns: ["habit_id"]
isOneToOne: false
      referencedRelation: "habits"
      referencedColumns: ["id"]
    }
                  ]
                },"community_members": {
                  Row: {
                    "community_id": string,"joined_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "community_id": string,"joined_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "community_id"?: string,"joined_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "community_members_community_id_fkey"
      columns: ["community_id"]
isOneToOne: false
      referencedRelation: "communities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "community_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"contributions": {
                  Row: {
                    "created_at": string,"pod_date": string,"pod_id": string,"snap_id": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"pod_date": string,"pod_id": string,"snap_id"?: string | null,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"pod_date"?: string,"pod_id"?: string,"snap_id"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "contributions_pod_id_fkey"
      columns: ["pod_id"]
isOneToOne: false
      referencedRelation: "pod_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contributions_pod_id_fkey"
      columns: ["pod_id"]
isOneToOne: false
      referencedRelation: "pods"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contributions_snap_id_fkey"
      columns: ["snap_id"]
isOneToOne: false
      referencedRelation: "snaps"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contributions_user_id_fkey"
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
                },"messages": {
                  Row: {
                    "body": string,"created_at": string,"id": string,"kind": string,"pod_id": string,"snap_id": string | null,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string,"created_at"?: string,"id"?: string,"kind"?: string,"pod_id": string,"snap_id"?: string | null,"user_id"?: string | null
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"id"?: string,"kind"?: string,"pod_id"?: string,"snap_id"?: string | null,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "messages_pod_id_fkey"
      columns: ["pod_id"]
isOneToOne: false
      referencedRelation: "pod_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_pod_id_fkey"
      columns: ["pod_id"]
isOneToOne: false
      referencedRelation: "pods"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_snap_id_fkey"
      columns: ["snap_id"]
isOneToOne: false
      referencedRelation: "snaps"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"pod_days": {
                  Row: {
                    "contributors": number,"hp_after": number,"hp_delta": number,"members": number,"outcome": string,"pod_date": string,"pod_id": string,"settled_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "contributors": number,"hp_after": number,"hp_delta": number,"members": number,"outcome": string,"pod_date": string,"pod_id": string,"settled_at"?: string
                  }
                  Update: {
                    "contributors"?: number,"hp_after"?: number,"hp_delta"?: number,"members"?: number,"outcome"?: string,"pod_date"?: string,"pod_id"?: string,"settled_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "pod_days_pod_id_fkey"
      columns: ["pod_id"]
isOneToOne: false
      referencedRelation: "pod_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pod_days_pod_id_fkey"
      columns: ["pod_id"]
isOneToOne: false
      referencedRelation: "pods"
      referencedColumns: ["id"]
    }
                  ]
                },"pod_members": {
                  Row: {
                    "energy": number,"joined_at": string,"pod_id": string,"role": string,"stars": number,"streak": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "energy"?: number,"joined_at"?: string,"pod_id": string,"role"?: string,"stars"?: number,"streak"?: number,"user_id": string
                  }
                  Update: {
                    "energy"?: number,"joined_at"?: string,"pod_id"?: string,"role"?: string,"stars"?: number,"streak"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "pod_members_pod_id_fkey"
      columns: ["pod_id"]
isOneToOne: false
      referencedRelation: "pod_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pod_members_pod_id_fkey"
      columns: ["pod_id"]
isOneToOne: false
      referencedRelation: "pods"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pod_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"pods": {
                  Row: {
                    "created_at": string,"created_by": string | null,"goal": string,"habit_id": string,"id": string,"invite_code": string,"name": string,"snap_time": string,"timezone": string,"window_minutes": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"goal"?: string,"habit_id": string,"id"?: string,"invite_code"?: string,"name": string,"snap_time": string,"timezone"?: string,"window_minutes"?: number
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"goal"?: string,"habit_id"?: string,"id"?: string,"invite_code"?: string,"name"?: string,"snap_time"?: string,"timezone"?: string,"window_minutes"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "pods_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pods_habit_id_fkey"
      columns: ["habit_id"]
isOneToOne: false
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
                    "body": string,"comment_count": number,"community_id": string,"created_at": string,"id": string,"image_url": string | null,"score": number,"title": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string,"comment_count"?: number,"community_id": string,"created_at"?: string,"id"?: string,"image_url"?: string | null,"score"?: number,"title": string,"user_id"?: string
                  }
                  Update: {
                    "body"?: string,"comment_count"?: number,"community_id"?: string,"created_at"?: string,"id"?: string,"image_url"?: string | null,"score"?: number,"title"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "posts_community_id_fkey"
      columns: ["community_id"]
isOneToOne: false
      referencedRelation: "communities"
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
                    "avatar_color": string,"avatar_url": string | null,"bio": string,"created_at": string,"display_name": string,"energy": number,"id": string,"stars": number,"streak": number,"username": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_color"?: string,"avatar_url"?: string | null,"bio"?: string,"created_at"?: string,"display_name": string,"energy"?: number,"id": string,"stars"?: number,"streak"?: number,"username": string
                  }
                  Update: {
                    "avatar_color"?: string,"avatar_url"?: string | null,"bio"?: string,"created_at"?: string,"display_name"?: string,"energy"?: number,"id"?: string,"stars"?: number,"streak"?: number,"username"?: string
                  }
                  Relationships: [
                    
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
                    "caption": string,"habit_id": string,"id": string,"image": string,"on_profile": boolean,"on_time": boolean,"pod_date": string,"pod_id": string,"taken_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "caption"?: string,"habit_id": string,"id"?: string,"image": string,"on_profile"?: boolean,"on_time"?: boolean,"pod_date"?: string,"pod_id": string,"taken_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "caption"?: string,"habit_id"?: string,"id"?: string,"image"?: string,"on_profile"?: boolean,"on_time"?: boolean,"pod_date"?: string,"pod_id"?: string,"taken_at"?: string,"user_id"?: string
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
      referencedRelation: "pod_overview"
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
                },"trees": {
                  Row: {
                    "growth": number,"hp": number,"last_settled_date": string,"max_hp": number,"planted_at": string,"pod_id": string,"status": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "growth"?: number,"hp"?: number,"last_settled_date": string,"max_hp"?: number,"planted_at"?: string,"pod_id": string,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "growth"?: number,"hp"?: number,"last_settled_date"?: string,"max_hp"?: number,"planted_at"?: string,"pod_id"?: string,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "trees_pod_id_fkey"
      columns: ["pod_id"]
isOneToOne: true
      referencedRelation: "pod_overview"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "trees_pod_id_fkey"
      columns: ["pod_id"]
isOneToOne: true
      referencedRelation: "pods"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "pod_overview": {
                  Row: {
                    "contributed_today": number | null,"goal": string | null,"growth": number | null,"habit_id": string | null,"hp": number | null,"id": string | null,"invite_code": string | null,"last_activity_at": string | null,"last_message_author": string | null,"last_message_body": string | null,"last_message_kind": string | null,"max_hp": number | null,"me_contributed_today": boolean | null,"member_count": number | null,"my_streak": number | null,"name": string | null,"snap_time": string | null,"timezone": string | null,"tree_status": string | null,"window_minutes": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "pods_habit_id_fkey"
      columns: ["habit_id"]
isOneToOne: false
      referencedRelation: "habits"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "apply_day_settlement":
{ Args: { "p_day": Json,"p_expected_last": string,"p_members": Json,"p_message": string,"p_message_at": string,"p_pod_date": string,"p_pod_id": string,"p_tree": Json }; Returns: boolean
                           },
"create_pod":
{ Args: { "p_goal": string,"p_habit_id": string,"p_name": string,"p_snap_time": string,"p_timezone": string,"p_window_minutes"?: number }; Returns: string
                           },
"is_pod_member":
{ Args: { "p_pod_id": string }; Returns: boolean
                           },
"join_pod":
{ Args: { "p_invite_code": string }; Returns: string
                           },
"refresh_profile_stats":
{ Args: { "p_user_ids": (string)[] }; Returns: undefined
                           },
"shares_pod_with":
{ Args: { "p_user_id": string }; Returns: boolean
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
