
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
            "colleges": {
                  Row: {
                    "id": string,"name": string,"sort": number
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"name": string,"sort": number
                  }
                  Update: {
                    "id"?: string,"name"?: string,"sort"?: number
                  }
                  Relationships: [
                    
                  ]
                },"profile_private": {
                  Row: {
                    "notify_new_message": boolean,"notify_ride_reminder": boolean,"notify_ride_updated": boolean,"notify_rider_joined": boolean,"phone_e164": string | null,"share_phone": boolean,"theme_pref": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "notify_new_message"?: boolean,"notify_ride_reminder"?: boolean,"notify_ride_updated"?: boolean,"notify_rider_joined"?: boolean,"phone_e164"?: string | null,"share_phone"?: boolean,"theme_pref"?: string,"user_id": string
                  }
                  Update: {
                    "notify_new_message"?: boolean,"notify_ride_reminder"?: boolean,"notify_ride_updated"?: boolean,"notify_rider_joined"?: boolean,"phone_e164"?: string | null,"share_phone"?: boolean,"theme_pref"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_private_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_path": string | null,"college_id": string | null,"created_at": string,"display_name": string,"home_label": string | null,"id": string,"intent": Database["public"]['Enums']["rider_intent"] | null,"onboarded_at": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_path"?: string | null,"college_id"?: string | null,"created_at"?: string,"display_name": string,"home_label"?: string | null,"id": string,"intent"?: Database["public"]['Enums']["rider_intent"] | null,"onboarded_at"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "avatar_path"?: string | null,"college_id"?: string | null,"created_at"?: string,"display_name"?: string,"home_label"?: string | null,"id"?: string,"intent"?: Database["public"]['Enums']["rider_intent"] | null,"onboarded_at"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_college_id_fkey"
      columns: ["college_id"]
isOneToOne: false
      referencedRelation: "colleges"
      referencedColumns: ["id"]
    }
                  ]
                },"ride_members": {
                  Row: {
                    "intent": Database["public"]['Enums']["rider_intent"] | null,"joined_at": string,"left_at": string | null,"ride_id": string,"role": Database["public"]['Enums']["member_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "intent"?: Database["public"]['Enums']["rider_intent"] | null,"joined_at"?: string,"left_at"?: string | null,"ride_id": string,"role"?: Database["public"]['Enums']["member_role"],"user_id": string
                  }
                  Update: {
                    "intent"?: Database["public"]['Enums']["rider_intent"] | null,"joined_at"?: string,"left_at"?: string | null,"ride_id"?: string,"role"?: Database["public"]['Enums']["member_role"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ride_members_ride_id_fkey"
      columns: ["ride_id"]
isOneToOne: false
      referencedRelation: "ride_cards"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ride_members_ride_id_fkey"
      columns: ["ride_id"]
isOneToOne: false
      referencedRelation: "rides"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ride_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"rides": {
                  Row: {
                    "airport_code": string,"client_request_id": string | null,"created_at": string,"created_by": string,"depart_at": string,"direction": Database["public"]['Enums']["ride_direction"],"est_total_cost_cents": number | null,"id": string,"meet_spot": string | null,"notes": string | null,"seats_max": number,"status": Database["public"]['Enums']["ride_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "airport_code"?: string,"client_request_id"?: string | null,"created_at"?: string,"created_by": string,"depart_at": string,"direction": Database["public"]['Enums']["ride_direction"],"est_total_cost_cents"?: number | null,"id"?: string,"meet_spot"?: string | null,"notes"?: string | null,"seats_max"?: number,"status"?: Database["public"]['Enums']["ride_status"],"updated_at"?: string
                  }
                  Update: {
                    "airport_code"?: string,"client_request_id"?: string | null,"created_at"?: string,"created_by"?: string,"depart_at"?: string,"direction"?: Database["public"]['Enums']["ride_direction"],"est_total_cost_cents"?: number | null,"id"?: string,"meet_spot"?: string | null,"notes"?: string | null,"seats_max"?: number,"status"?: Database["public"]['Enums']["ride_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "rides_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "ride_cards": {
                  Row: {
                    "depart_at": string,"direction": Database["public"]['Enums']["ride_direction"],"est_total_cost_cents": number | null,"host_home": string | null,"host_id": string | null,"host_name": string | null,"id": string,"is_host": boolean | null,"is_member": boolean | null,"meet_spot": string | null,"notes": string | null,"rider_names": (string)[] | null,"seats_max": number,"seats_taken": number | null,"status": Database["public"]['Enums']["ride_status"]
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "ride_members_user_id_fkey"
      columns: ["host_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "create_ride":
{ Args: { "p_client_request_id"?: string,"p_depart_at": string,"p_direction": Database["public"]['Enums']["ride_direction"],"p_est_total_cost_cents"?: number,"p_meet_spot"?: string,"p_notes"?: string,"p_seats_max"?: number }; Returns: string
                           },
"hook_restrict_signup_to_ucsd":
{ Args: { "event": Json }; Returns: Json
                           },
"list_rides":
{ Args: { "p_after_depart_at"?: string,"p_after_id"?: string,"p_direction": Database["public"]['Enums']["ride_direction"],"p_page_size"?: number }; Returns: {
              "depart_at": string,
"direction": Database["public"]['Enums']["ride_direction"],
"est_total_cost_cents": number | null,
"host_home": string | null,
"host_id": string | null,
"host_name": string | null,
"id": string,
"is_host": boolean | null,
"is_member": boolean | null,
"meet_spot": string | null,
"notes": string | null,
"rider_names": (string)[] | null,
"seats_max": number,
"seats_taken": number | null,
"status": Database["public"]['Enums']["ride_status"]
            }[]
                          SetofOptions: {
        from: "*"
        to: "ride_cards"
        isOneToOne: false
        isSetofReturn: true
      } },
"nearby_rides":
{ Args: { "p_depart_at": string,"p_direction": Database["public"]['Enums']["ride_direction"],"p_window_minutes"?: number }; Returns: {
              "depart_at": string,
"direction": Database["public"]['Enums']["ride_direction"],
"est_total_cost_cents": number | null,
"host_home": string | null,
"host_id": string | null,
"host_name": string | null,
"id": string,
"is_host": boolean | null,
"is_member": boolean | null,
"meet_spot": string | null,
"notes": string | null,
"rider_names": (string)[] | null,
"seats_max": number,
"seats_taken": number | null,
"status": Database["public"]['Enums']["ride_status"]
            }[]
                          SetofOptions: {
        from: "*"
        to: "ride_cards"
        isOneToOne: false
        isSetofReturn: true
      } },
"ride_past_cutoff":
{ Args: Record<PropertyKey, never>; Returns: string
                           }
          }
          Enums: {
            "member_role": "host"|"rider","ride_direction": "to_airport"|"to_campus","ride_status": "active"|"cancelled","rider_intent": "networking"|"flypal"
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
            "member_role": ["host", "rider"],"ride_direction": ["to_airport", "to_campus"],"ride_status": ["active", "cancelled"],"rider_intent": ["networking", "flypal"]
          }
        }
} as const
